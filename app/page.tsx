'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { loadStats, type GameStats } from '@/lib/stats'
import { loadSRS, type SRSStore, getSRSSummary, getKanaSummary } from '@/lib/srs'
import { parseCSVToVocab, type VocabItem } from '@/lib/vocab'
import { fetchVocabCSV, pushToCloud, syncToCloud, resetCloudData } from '@/lib/cloud'
import { KANA } from '@/lib/kana'
import { checkNotificationNeeds, showLocalNotification } from '@/lib/notifications'

type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

const PULL_THRESHOLD = 80 // px tarik ke bawah sebelum trigger

export default function Home() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [savedUrl, setSavedUrl] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [vocabError, setVocabError] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notificationNeed, setNotificationNeed] = useState<{ type: string; message: string } | null>(null)

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadVocabData = useCallback(async (url: string, force = false): Promise<VocabItem[]> => {
    setVocabError('')
    if (url.includes('/edit') || !url.includes('output=csv')) {
      setVocabError('Link salah! Pake link "Publish to web" format CSV ya.')
      setVocab([]); return []
    }
    const csv = await fetchVocabCSV(url, force)
    if (!csv) {
      setVocabError('Gagal ambil data.')
      setVocab([]); return []
    }
    const parsed = parseCSVToVocab(csv)
    setVocab(parsed)
    return parsed
  }, [])

  useEffect(() => {
    const s = loadStats(); setStats(s)
    const store = loadSRS(); setSrsStore(store)
    const url = localStorage.getItem('kotoba_sheets_url') || ''
    setSavedUrl(url)
    if (url) loadVocabData(url)

    // Check notifications
    const need = checkNotificationNeeds()
    if (need) {
      setNotificationNeed(need)
      showLocalNotification('言葉カード', need.message)
    }
  }, [loadVocabData])

  // Account Isolation
  useEffect(() => {
    if (session?.user?.email) {
      const lastUser = localStorage.getItem('kotoba_last_user')
      if (lastUser && lastUser !== session.user.email) {
        localStorage.removeItem('kotoba_srs'); localStorage.removeItem('kotoba_stats')
        localStorage.removeItem('kotoba_sheets_url')
        localStorage.setItem('kotoba_last_user', session.user.email)
        window.location.reload()
      } else if (!lastUser) {
        localStorage.setItem('kotoba_last_user', session.user.email)
      }
    }
  }, [session])

  async function handleSignOut() {
    localStorage.removeItem('kotoba_srs'); localStorage.removeItem('kotoba_stats')
    localStorage.removeItem('kotoba_sheets_url'); localStorage.removeItem('kotoba_last_user')
    await signOut()
  }

  const doSync = useCallback(async () => {
    if (!session?.accessToken) return
    setSyncStatus('syncing')
    const ok = await syncToCloud()
    if (ok) {
      setSrsStore(loadSRS()); setStats(loadStats())
      const cloudUrl = localStorage.getItem('kotoba_sheets_url')
      if (cloudUrl) {
        setSavedUrl(cloudUrl); await loadVocabData(cloudUrl, true)
      }
      setSyncStatus('ok')
    } else {
      setSyncStatus('error')
    }
    setTimeout(() => setSyncStatus('idle'), 2500)
  }, [session?.accessToken, loadVocabData])

  useEffect(() => {
    const isAuto = localStorage.getItem('kotoba_sync_mode') !== 'manual'
    if (session?.accessToken && isAuto) doSync()
  }, [session?.accessToken, doSync])

  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current
    if (el && el.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY; setIsPulling(true)
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 0) setPullY(Math.min(dy * 0.5, PULL_THRESHOLD + 20))
  }
  const onTouchEnd = async () => {
    setIsPulling(false)
    if (pullY >= PULL_THRESHOLD) {
      setPullY(40); setIsRefreshing(true)
      if (session?.accessToken) await doSync()
      if (savedUrl) await loadVocabData(savedUrl, true)
      setIsRefreshing(false); window.location.reload()
    }
    setPullY(0)
  }

  const accuracy = stats && stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0
  const srs = vocab.length > 0 ? getSRSSummary(vocab.map(v => v.id), srsStore) : null
  const kanaSrs = getKanaSummary(KANA, srsStore)
  const noVocab = vocab.length === 0
  const kanjiVocab = vocab.filter(v => v.kanji && v.kanji !== v.hiragana)
  const kanjiSrs = kanjiVocab.length > 0 ? getSRSSummary(kanjiVocab.map(v => v.id), srsStore) : null

  const todayStr = new Date().toISOString().split('T')[0]
  const isStreakActive = stats?.lastPlayedDate === todayStr

  const chapters = useMemo(() => {
    const map = new Map<string, string[]>()
    vocab.forEach(v => {
      if (v.chapter) {
        if (!map.has(v.chapter)) map.set(v.chapter, [])
        map.get(v.chapter)!.push(v.id)
      }
    })
    
    // Calculate progress based on actual SRS levels (0-6) instead of just Mastered count
    const MAX_LEVEL = 6 // Matches lib/srs
    return Array.from(map.entries()).map(([name, ids]) => {
      const summary = getSRSSummary(ids, srsStore)
      
      // Calculate total potential levels vs achieved levels
      let totalLevelsAchieved = 0
      ids.forEach(id => {
        const level = srsStore[id]?.level || 0
        totalLevelsAchieved += Math.min(level, MAX_LEVEL)
      })
      
      const maxPossibleLevels = ids.length * MAX_LEVEL
      const pct = maxPossibleLevels > 0 ? Math.round((totalLevelsAchieved / maxPossibleLevels) * 100) : 0

      return { name, summary, pct }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [vocab, srsStore])

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      {/* Pull indicator */}
      {(pullY > 0 || isRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 transition-all"
          style={{ transform: `translateY(${Math.min(pullY, 44)}px)`, opacity: Math.min(pullY / PULL_THRESHOLD, 1) }}>
          <div className="rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-bold"
            style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', color: 'var(--color-accent)' }}>
            <span>{isRefreshing ? '⏳ Sinkronisasi...' : pullY >= PULL_THRESHOLD ? '↑ Lepas untuk sinkron' : '↓ Tarik untuk sinkron'}</span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="max-w-sm mx-auto px-4 pt-12 pb-10 overflow-y-auto"
        style={{ minHeight: '100dvh', transform: pullY > 0 ? `translateY(${pullY}px)` : 'none', transition: isPulling ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {/* Header */}
        <div className="anim-up mb-5 relative z-[100]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>{session ? `おかえり、${session.user?.name?.split(' ')[0]} 👋` : 'おはようございます 👋'}</p>
              <h1 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--color-text-1)' }}>{session ? 'Siap latihan hari ini?' : 'Kuasai Kosakata Jepang'}</h1>
            </div>
            {status === 'loading' ? <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-subtle)' }} /> : session ? (
              <div className="relative">
                <button onClick={() => setShowProfileMenu(s => !s)} className="w-10 h-10 rounded-full overflow-hidden border-2 active:scale-95 transition-transform" style={{ borderColor: 'var(--color-accent)' }}>
                  {session.user?.image ? <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-white" style={{ background: 'var(--color-accent)' }}>{session.user?.name?.[0]}</div>}
                </button>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl z-[70] border border-[var(--color-border)] overflow-hidden anim-pop">
                      <div className="px-4 py-3 border-b border-[var(--color-border)]">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-1)' }}>{session.user?.name}</p>
                        <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text-3)' }}>{session.user?.email}</p>
                      </div>
                      <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg)] transition-colors no-underline">
                        <span className="text-sm">⚙️</span><span className="text-sm font-bold" style={{ color: 'var(--color-text-1)' }}>Pengaturan</span>
                      </Link>
                      <button onClick={() => { setShowProfileMenu(false); setShowLogoutConfirm(true) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left">
                        <span className="text-sm">🚪</span><span className="text-sm font-bold" style={{ color: 'var(--color-red)' }}>Keluar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Notification Banner (Passive Aggressive Duolingo style) */}
        {session && notificationNeed && (
          <div className="anim-up mb-6">
            <div className="rounded-3xl p-4 flex items-center gap-4 border-2" 
              style={{ 
                background: notificationNeed.type === 'streak_at_risk' ? 'var(--color-amber-light)' : 'var(--color-red-light)',
                borderColor: notificationNeed.type === 'streak_at_risk' ? 'var(--color-amber)' : 'var(--color-red)'
              }}>
              <div className="text-3xl shrink-0">
                {notificationNeed.type === 'streak_at_risk' ? '🔥' : notificationNeed.type === 'streak_lost' ? '🕯️' : '👋'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text-1)' }}>
                  {notificationNeed.message}
                </p>
              </div>
              <button onClick={() => setNotificationNeed(null)} className="p-1 text-xs opacity-50 font-black">✕</button>
            </div>
          </div>
        )}

        {!session && status !== 'loading' ? (
          <div className="anim-up d1">
            <div className="rounded-3xl p-8 mb-6 text-center" style={{ background: 'var(--color-white)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div className="text-6xl mb-6">🎌</div>
              <h2 className="text-xl font-extrabold mb-3" style={{ color: 'var(--color-text-1)' }}>Selamat Datang</h2>
              <p className="text-sm font-semibold mb-8 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>Simpan progress kosakata & kana lo di cloud. Masuk biar bisa lanjut di mana aja!</p>
              <button onClick={() => signIn('google')} className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform" style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 8px 20px rgba(91,94,244,0.28)' }}>
                <GoogleIcon size={20} color="white" /> Masuk dengan Google
              </button>
            </div>
          </div>
        ) : session && (
          <>
            {/* Sync Status - Only show when syncing, ok (briefly), or error */}
            {syncStatus !== 'idle' && (
              <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between anim-up" style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)' }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text-1)' }}>☁ Status Cloud</p>
                  <p className="text-[10px] font-semibold" style={{ color: syncStatus === 'error' ? 'var(--color-red)' : 'var(--color-text-2)' }}>
                    {syncStatus === 'syncing' ? 'Sedang mensinkronisasi...' : syncStatus === 'ok' ? 'Data terbaru sudah aman ✓' : 'Gagal sinkron. Cek koneksi le.'}
                  </p>
                </div>
                {syncStatus === 'syncing' && <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />}
              </div>
            )}

            {noVocab && (
              <div className="rounded-3xl p-6 mb-5 anim-up text-center" style={{ background: 'var(--color-white)', border: '2px solid var(--color-accent)' }}>
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-extrabold text-base mb-2">Kamus lo belum diset!</h3>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--color-text-2)' }}>Buka Menu Profil (klik foto lo) &gt; Pengaturan untuk menghubungkan Google Sheets lo le.</p>
              </div>
            )}

            {/* CTA card */}
            <div className="anim-up d1 mb-6">
              {!noVocab ? (
                <Link href="/quiz" className="block no-underline">
                  <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5b5ef4 0%, #7c7ff7 100%)', boxShadow: '0 8px 24px rgba(91,94,244,0.32)' }}>
                    {srs && srs.dueCount > 0 && <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 relative" style={{ background: 'rgba(255,255,255,0.18)' }}><span className="text-xs font-bold text-white">🔥 {srs.dueCount} kata siap direview</span></div>}
                    <p className="jp-serif text-white relative mb-1" style={{ fontSize: '1.9rem', fontWeight: 700 }}>練習する</p>
                    <p className="text-sm font-semibold relative" style={{ color: 'rgba(255,255,255,0.72)' }}>{vocab.length} kata · Mulai latihan →</p>
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)', opacity: 0.6 }}>
                  <p className="jp-serif text-white mb-1" style={{ fontSize: '1.9rem', fontWeight: 700 }}>練習する</p>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>Setup Sheets dulu le ↑</p>
                </div>
              )}
            </div>

            {/* Chapters section */}
            {!noVocab && chapters.length > 0 && (
              <div className="mb-6 anim-up d1">
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--color-text-1)' }}>Latihan Per Bab</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-subtle)', color: 'var(--color-text-3)' }}>{chapters.length} Bab</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {chapters.map(ch => {
                    const pct = Math.round((ch.summary.masteredCount / ch.summary.total) * 100)
                    return (
                      <Link key={ch.name} href={`/quiz?chapter=${encodeURIComponent(ch.name)}`} className="block no-underline shrink-0">
                        <div className="rounded-2xl p-4 w-32 flex flex-col items-center justify-center text-center transition-all active:scale-95" 
                          style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                          <div className="text-2xl mb-2">📖</div>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-3)' }}>BAB</p>
                          <p className="text-xs font-bold truncate w-full mb-2" style={{ color: 'var(--color-text-1)' }}>{ch.name}</p>
                          
                          {/* Progress indicator */}
                          <div className="w-full mb-3">
                            <div className="flex justify-between items-center mb-1 px-0.5">
                              <span className="text-[8px] font-bold" style={{ color: 'var(--color-text-3)' }}>Progress</span>
                              <span className="text-[8px] font-bold" style={{ color: pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{pct}%</span>
                            </div>
                            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-subtle)' }}>
                              <div className="h-full rounded-full transition-all duration-500" 
                                style={{ 
                                  width: `${pct}%`, 
                                  background: pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' 
                                }} 
                              />
                            </div>
                          </div>

                          <div className="w-full py-1.5 rounded-xl text-[10px] font-bold" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                            Mulai
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Kanji card */}
            {!noVocab && kanjiVocab.length > 0 && (
              <div className="anim-up d1 mb-4">
                <Link href="/quiz?mode=kanji" className="block no-underline">
                  <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid var(--color-border)' }}>
                    <div className="jp-serif text-4xl leading-none text-[var(--color-accent)]">漢</div>
                    <div className="flex-1">
                      <p className="font-extrabold text-base">Latihan Kanji</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{kanjiVocab.length} kata pakai kanji · Fokus baca kanji</p>
                    </div>
                    <span style={{ color: 'var(--color-text-3)', fontSize: 20 }}>›</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Kana card */}
            <div className="anim-up d1 mb-4">
              <Link href="/kana" className="block no-underline">
                <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid var(--color-border)' }}>
                  <div className="jp-serif text-4xl leading-none">あア</div>
                  <div className="flex-1"><p className="font-extrabold text-base">Hiragana & Katakana</p><p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{KANA.length} karakter · Belajar kana</p></div>
                  <span style={{ color: 'var(--color-text-3)', fontSize: 20 }}>›</span>
                </div>
              </Link>
            </div>

            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5 mb-4 anim-up d2">
                {[
                  { icon: '📅', label: 'Sessions', value: String(stats.totalSessions), color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                  { 
                    icon: isStreakActive ? '🔥' : '🕯️', 
                    label: 'Streak', 
                    value: String(stats.currentStreak), 
                    color: isStreakActive ? 'var(--color-red)' : 'var(--color-text-3)', 
                    bg: isStreakActive ? 'var(--color-red-light)' : 'var(--color-subtle)',
                    opacity: isStreakActive ? 1 : 0.7
                  },
                  { icon: '🎯', label: 'Akurasi', value: `${accuracy}%`, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl py-4 text-center transition-all" 
                    style={{ background: s.bg, opacity: (s as any).opacity ?? 1 }}>
                    <p className="text-xl mb-1">{s.icon}</p>
                    <p className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Vocab status */}
            {srs && !noVocab && (
              <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Status Vocab</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-subtle)' }}>
                        <div className="h-full transition-all duration-700" style={{ width: `${srs.pct}%`, background: srs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }} />
                      </div>
                      <span className="text-[10px] font-black" style={{ color: srs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{srs.pct}%</span>
                    </div>
                  </div>
                  <Link href="/progress" className="text-xs font-semibold no-underline" style={{ color: 'var(--color-accent)' }}>Lihat semua →</Link>
                </div>
                <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                  {[
                    { label: 'Review', val: srs.dueCount, color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                    { label: 'Baru',   val: srs.newCount, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                    { label: 'Proses', val: srs.learningCount, color: '#a855f7', bg: '#faf0ff' },
                    { label: 'Hafal', val: srs.masteredCount, color: 'var(--color-green)', bg: 'var(--color-green-light)' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}><p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p><p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p></div>
                  ))}
                </div>
              </div>
            )}

            {/* Kanji status */}
            {kanjiSrs && (
              <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Status Kanji</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-subtle)' }}>
                        <div className="h-full transition-all duration-700" style={{ width: `${kanjiSrs.pct}%`, background: kanjiSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }} />
                      </div>
                      <span className="text-[10px] font-black" style={{ color: kanjiSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{kanjiSrs.pct}%</span>
                    </div>
                  </div>
                  <Link href="/quiz?mode=kanji" className="text-xs font-semibold no-underline" style={{ color: 'var(--color-accent)' }}>Latih kanji →</Link>
                </div>
                <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                  {[
                    { label: 'Review', val: kanjiSrs.dueCount, color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                    { label: 'Baru',   val: kanjiSrs.newCount, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                    { label: 'Proses', val: kanjiSrs.learningCount, color: '#a855f7', bg: '#faf0ff' },
                    { label: 'Hafal', val: kanjiSrs.masteredCount, color: 'var(--color-green)', bg: 'var(--color-green-light)' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}><p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p><p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p></div>
                  ))}
                </div>
              </div>
            )}


            {/* Kana status */}
            <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <p className="font-bold">Status Kana</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-subtle)' }}>
                      <div className="h-full transition-all duration-700" style={{ width: `${kanaSrs.pct}%`, background: kanaSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }} />
                    </div>
                    <span className="text-[10px] font-black" style={{ color: kanaSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{kanaSrs.pct}%</span>
                  </div>
                </div>
                <Link href="/kana" className="text-xs font-semibold no-underline" style={{ color: 'var(--color-accent)' }}>Lanjut belajar →</Link>
              </div>
              <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                {[
                  { label: 'Review', val: kanaSrs.dueCount, color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                  { label: 'Baru', val: kanaSrs.newCount, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                  { label: 'Proses', val: kanaSrs.learningCount, color: '#a855f7', bg: '#faf0ff' },
                  { label: 'Hafal', val: kanaSrs.masteredCount, color: 'var(--color-green)', bg: 'var(--color-green-light)' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}><p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p><p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p></div>
                ))}
              </div>
            </div>
          </>
        )}

    {session && <p className="text-center text-xs mt-8 mb-4" style={{ color: 'var(--color-text-3)' }}>↓ Tarik ke bawah untuk sinkronisasi</p>}
  </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs relative anim-pop shadow-2xl text-center">
            <div className="text-5xl mb-4">🚪</div>
            <h3 className="text-xl font-extrabold mb-2">Mau Logout?</h3>
            <p className="text-sm font-semibold mb-8 leading-relaxed">Data lokal di browser ini bakal diapus, tapi tenang aja progress lo aman di cloud.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={handleSignOut} className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform" style={{ background: 'var(--color-red)', color: '#fff' }}>Ya, Logout 👋</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform" style={{ background: 'var(--color-bg)', color: 'var(--color-text-2)' }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function GoogleIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={color || "#4285F4"}/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={color || "#34A853"}/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={color || "#FBBC05"}/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={color || "#EA4335"}/>
    </svg>
  )
}
