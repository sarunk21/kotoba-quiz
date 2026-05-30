'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { loadStats, type GameStats } from '@/lib/stats'
import { loadSRS, type SRSStore, getSRSSummary, getKanaSummary } from '@/lib/srs'
import { getLocalDateString, parseLocalDateString } from '@/lib/dateUtils'
import { parseCSVToVocab, type VocabItem, setGlobalVocab, loadLocalVocab } from '@/lib/vocab'
import { pushToCloud, syncToCloud, resetCloudData } from '@/lib/cloud'
import { KANA } from '@/lib/kana'
import { checkNotificationNeeds, showLocalNotification } from '@/lib/notifications'
import BottomNav from '@/components/BottomNav'
import { speakJapanese } from '@/lib/sounds'
import { isCapacitor } from '@/lib/platform'


type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

const FALLBACK_WORDS = [
  { kanji: '木漏れ日', hiragana: 'こもれび', arti: 'Cahaya matahari yang menyaring melalui celah dedaunan.', category: 'Ungkapan', chapter: 'Keindahan Alam' },
  { kanji: '生きがい', hiragana: 'いきがい', arti: 'Alasan untuk hidup; makna atau tujuan hidup yang membuat bersemangat bangun pagi.', category: 'Filsafat', chapter: 'Gaya Hidup' },
  { kanji: '侘寂', hiragana: 'わびさび', arti: 'Menemukan keindahan dalam ketidaksempurnaan dan kesederhanaan.', category: 'Filsafat', chapter: 'Seni' },
  { kanji: '森林浴', hiragana: 'しんりんよく', arti: 'Menghirup udara hutan untuk ketenangan jiwa (secara harfiah "mandi hutan").', category: 'Ungkapan', chapter: 'Kesehatan' },
  { kanji: '一期一会', hiragana: 'いちごいちえ', arti: 'Pertemuan sekali seumur hidup; menghargai setiap momen karena tidak akan terulang.', category: 'Yojijukugo', chapter: 'Kebijaksanaan' }
]

const WEEKDAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const PULL_THRESHOLD = 80 // px tarik ke bawah sebelum trigger

export default function Home() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notificationNeed, setNotificationNeed] = useState<{ type: string; message: string } | null>(null)
  const [activeStatusTab, setActiveStatusTab] = useState<'vocab' | 'kanji' | 'kana'>('vocab')
  const [wordOfTheDay, setWordOfTheDay] = useState<{ kanji: string; hiragana: string; arti: string; category: string; chapter?: string } | null>(null)
  const [isWotdFlipped, setIsWotdFlipped] = useState(false)
  const [syncEmail, setSyncEmail] = useState<string | null>(null)

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = loadStats(); setStats(s)
    const store = loadSRS(); setSrsStore(store)
    
    // Load local vocabulary
    const localVocab = loadLocalVocab()
    setVocab(localVocab)

    // Check notifications
    const need = checkNotificationNeeds()
    if (need) {
      setNotificationNeed(need)
      showLocalNotification('言葉カード', need.message)
    }

    // Set sync email from localStorage if exists
    setSyncEmail(localStorage.getItem('kotoba_sync_email'))
  }, [])

  // Account Isolation
  useEffect(() => {
    const currentUserEmail = session?.user?.email || syncEmail
    if (currentUserEmail) {
      const lastUser = localStorage.getItem('kotoba_last_user')
      if (lastUser && lastUser !== currentUserEmail) {
        localStorage.removeItem('kotoba_srs')
        localStorage.removeItem('kotoba_stats')
        localStorage.removeItem('kotoba_vocab')
        localStorage.removeItem('kotoba_vocab_updated_at')
        localStorage.setItem('kotoba_last_user', currentUserEmail)
        window.location.reload()
      } else if (!lastUser) {
        localStorage.setItem('kotoba_last_user', currentUserEmail)
      }
    }
  }, [session, syncEmail])

  async function handleSignOut() {
    localStorage.removeItem('kotoba_srs')
    localStorage.removeItem('kotoba_stats')
    localStorage.removeItem('kotoba_vocab')
    localStorage.removeItem('kotoba_vocab_updated_at')
    localStorage.removeItem('kotoba_last_user')
    localStorage.removeItem('kotoba_sync_token')
    localStorage.removeItem('kotoba_sync_email')
    if (session) {
      await signOut()
    } else {
      window.location.reload()
    }
  }

  const doSync = useCallback(async () => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('kotoba_sync_token')
    if (!session?.user?.email && !hasToken) return
    setSyncStatus('syncing')
    const ok = await syncToCloud()
    if (ok) {
      setSrsStore(loadSRS())
      setStats(loadStats())
      setVocab(loadLocalVocab())
      setSyncStatus('ok')
    } else {
      setSyncStatus('error')
    }
    setTimeout(() => setSyncStatus('idle'), 2500)
  }, [session?.user?.email])

  useEffect(() => {
    const isAuto = localStorage.getItem('kotoba_sync_mode') !== 'manual'
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('kotoba_sync_token')
    if ((session?.user?.email || hasToken) && isAuto) doSync()
  }, [session?.user?.email, doSync])

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
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('kotoba_sync_token')
      if (session?.user?.email || hasToken) await doSync()
      setIsRefreshing(false)
    }
    setPullY(0)
  }

  const accuracy = stats && stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0
  const srs = vocab.length > 0 ? getSRSSummary(vocab.map(v => v.id), srsStore) : null
  const kanaSrs = getKanaSummary(KANA, srsStore)
  const noVocab = vocab.length === 0
  const kanjiVocab = vocab.filter(v => v.kanji && v.kanji !== v.hiragana)
  const kanjiSrs = kanjiVocab.length > 0 ? getSRSSummary(kanjiVocab.map(v => v.id), srsStore) : null

  const todayStr = getLocalDateString()
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

  const weeklyStreak = useMemo(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const mondayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1

    const streakActiveDays = new Array(7).fill(false)

    if (stats && stats.currentStreak > 0 && stats.lastPlayedDate) {
      const todayDateStr = getLocalDateString(today)
      const yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      const yesterdayDateStr = getLocalDateString(yesterday)

      const isStreakValid = stats.lastPlayedDate === todayDateStr || stats.lastPlayedDate === yesterdayDateStr
      if (isStreakValid) {
        const lastPlayed = parseLocalDateString(stats.lastPlayedDate)
        
        for (let i = 0; i < stats.currentStreak; i++) {
          const d = new Date(lastPlayed)
          d.setDate(lastPlayed.getDate() - i)
          const dayOfWeek = d.getDay()
          const monIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - mondayIndex)
          startOfWeek.setHours(0, 0, 0, 0)
          
          if (d >= startOfWeek) {
            streakActiveDays[monIdx] = true
          }
        }
      }
    }
    return WEEKDAY_NAMES.map((label, idx) => ({
      label,
      active: streakActiveDays[idx],
      isToday: idx === mondayIndex
    }))
  }, [stats])

  useEffect(() => {
    if (vocab.length > 0) {
      const dateNum = new Date().getDate()
      const word = vocab[dateNum % vocab.length]
      setWordOfTheDay({
        kanji: word.kanji || '',
        hiragana: word.hiragana || '',
        arti: word.arti || '',
        category: word.category || 'Kata',
        chapter: word.chapter || ''
      })
    } else {
      const dateNum = new Date().getDate()
      const word = FALLBACK_WORDS[dateNum % FALLBACK_WORDS.length]
      setWordOfTheDay(word)
    }
    setIsWotdFlipped(false)
  }, [vocab])

  const userGreetingName = session?.user?.name?.split(' ')[0] || (syncEmail ? syncEmail.split('@')[0] : null)
  const isLoggedIn = !!session || !!syncEmail
  const isCap = isCapacitor()

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

      <div ref={scrollRef} className="max-w-sm mx-auto px-4 pt-12 pb-28 overflow-y-auto"
        style={{ minHeight: '100dvh', transform: pullY > 0 ? `translateY(${pullY}px)` : 'none', transition: isPulling ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {/* Header */}
        <div className="anim-up mb-5 relative z-[100]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
                {userGreetingName ? `おかえり、${userGreetingName} 👋` : 'おはようございます 👋'}
              </p>
              <h1 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--color-text-1)' }}>
                {isLoggedIn ? 'Siap berlatih hari ini?' : 'Kuasai Kosakata Jepang'}
              </h1>
            </div>
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-subtle)' }} />
            ) : isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setShowProfileMenu(s => !s)} className="w-10 h-10 rounded-full overflow-hidden border-2 active:scale-95 transition-transform" style={{ borderColor: 'var(--color-accent)' }}>
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white bg-[var(--color-accent)]">
                      {(session?.user?.name || syncEmail)?.[0].toUpperCase()}
                    </div>
                  )}
                </button>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl z-[70] border border-[var(--color-border)] overflow-hidden anim-pop">
                      <div className="px-4 py-3 border-b border-[var(--color-border)]">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-1)' }}>
                          {session?.user?.name || syncEmail?.split('@')[0]}
                        </p>
                        <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--color-text-3)' }}>
                          {session?.user?.email || syncEmail}
                        </p>
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
        {isLoggedIn && notificationNeed && (
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

        {!isLoggedIn && !isCap && status !== 'loading' ? (
          <div className="anim-up d1">
            <div className="rounded-3xl p-8 mb-6 text-center" style={{ background: 'var(--color-white)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div className="text-6xl mb-6">🎌</div>
              <h2 className="text-xl font-extrabold mb-3" style={{ color: 'var(--color-text-1)' }}>Selamat Datang</h2>
              <p className="text-sm font-semibold mb-8 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>Simpan progress kosakata & kana kamu di cloud. Masuk agar dapat melanjutkan di mana saja!</p>
              <button onClick={() => signIn('google')} className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform" style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 8px 20px rgba(91,94,244,0.28)' }}>
                <GoogleIcon size={20} color="white" /> Masuk dengan Google
              </button>
            </div>
          </div>
        ) : (isLoggedIn || isCap) && (
          <>
            {!isLoggedIn && isCap && (
              <div className="rounded-3xl p-5 mb-4 anim-up text-center border-2 border-dashed border-[var(--color-accent)] bg-white dark:bg-[#1a1d24]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="text-3xl mb-2">🔄</div>
                <h3 className="font-extrabold text-sm mb-1 text-[var(--color-text-1)]">Hubungkan Akun</h3>
                <p className="text-[11px] font-semibold leading-relaxed mb-4 text-[var(--color-text-2)]">
                  Google memblokir login langsung di aplikasi HP. Silakan login di browser HP Anda untuk menyalin Token Sinkronisasi.
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'https://kotoba-quiz.vercel.app'
                      window.open(`${baseUrl}/settings`, '_blank')
                    }}
                    className="w-full rounded-xl py-2.5 text-xs font-black text-white bg-[var(--color-accent)] active:scale-95 transition-transform"
                  >
                    🌐 Buka Web & Login Google
                  </button>
                  <Link 
                    href="/settings"
                    className="w-full rounded-xl py-2.5 text-xs font-bold text-[var(--color-text-2)] bg-[var(--color-bg)] no-underline active:scale-95 transition-transform"
                  >
                    🔑 Tempel Token di Sini
                  </Link>
                </div>
              </div>
            )}



            {noVocab && (
              <div className="rounded-3xl p-6 mb-5 anim-up text-center" style={{ background: 'var(--color-white)', border: '2px solid var(--color-accent)' }}>
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-extrabold text-base mb-2">Belum ada kosakata!</h3>
                <p className="text-xs font-semibold leading-relaxed mb-3" style={{ color: 'var(--color-text-2)' }}>Tambahkan kosakata baru atau impor dari CSV di halaman Kelola Kosakata.</p>
                <Link 
                  href="/vocab"
                  className="inline-block rounded-xl px-4 py-2.5 text-xs font-extrabold text-white no-underline bg-[var(--color-accent)] active:scale-95 transition-transform"
                >
                  Kelola Kosakata ⚙️
                </Link>
              </div>
            )}

            {/* Stats row */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5 mb-4 anim-up d1">
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

            {/* Weekly Streak Tracker */}
            {stats && (
              <div className="rounded-3xl p-5 mb-4 anim-up d1 border border-[var(--color-border)] bg-white dark:bg-[#1a1d24]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-3.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Rencana Streak Mingguan</p>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[var(--color-red-light)] text-[var(--color-red)]">
                    🔥 {stats.currentStreak} Hari
                  </span>
                </div>
                <div className="flex justify-between items-center px-1">
                  {weeklyStreak.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all relative ${
                          day.active 
                            ? 'bg-gradient-to-tr from-[var(--color-red)] to-[#ff8c42] text-white shadow-[0_3px_10px_rgba(239,68,68,0.25)]' 
                            : day.isToday 
                              ? 'border-2 border-dashed border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-light)]' 
                              : 'bg-[var(--color-bg)] text-[var(--color-text-3)]'
                        }`}
                      >
                        {day.active ? '🔥' : day.label[0]}
                        {day.isToday && !day.active && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent)]"></span>
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase text-[var(--color-text-3)]" style={{ color: day.isToday ? 'var(--color-accent)' : 'var(--color-text-3)' }}>
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Word of the Day (Kata Hari Ini) */}
            {wordOfTheDay && (
              <div className="perspective-container h-48 w-full mb-4 anim-up d2 relative">
                <div className={`flip-card-inner h-full w-full transition-transform duration-500 style-3d ${isWotdFlipped ? 'flip-card-flipped' : ''}`}>
                  
                  {/* Front Side */}
                  <div className="flip-card-front h-full w-full rounded-3xl p-5 flex flex-col justify-between border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1d24]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] flex items-center gap-1.5">
                        <span className="text-base">✨</span> KATA HARI INI
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)]">
                        {wordOfTheDay.category}
                      </span>
                    </div>

                    <div className="text-center my-auto flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-black text-[var(--color-text-1)] jp-serif tracking-wide leading-none">
                          {wordOfTheDay.kanji || wordOfTheDay.hiragana}
                        </h2>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            speakJapanese(wordOfTheDay.hiragana || wordOfTheDay.kanji)
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-90 transition-all text-[var(--color-text-2)] border border-[var(--color-border)] shrink-0"
                          title="Putar Suara"
                        >
                          <VolumeIcon size={14} />
                        </button>
                      </div>
                      {wordOfTheDay.kanji && wordOfTheDay.kanji !== wordOfTheDay.hiragana && (
                        <p className="text-xs text-[var(--color-text-3)] mt-1.5 font-bold tracking-widest jp">{wordOfTheDay.hiragana}</p>
                      )}
                    </div>

                    <div className="flex justify-center mt-1">
                      <button 
                        onClick={() => setIsWotdFlipped(true)}
                        className="rounded-xl px-4 py-2 text-xs font-extrabold text-white bg-[var(--color-accent)] active:scale-95 transition-transform"
                      >
                        Lihat Arti 🔍
                      </button>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="flip-card-back h-full w-full rounded-3xl p-5 flex flex-col justify-between border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white dark:bg-[#1a1d24]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)] flex items-center gap-1.5">
                        <span className="text-base">💡</span> ARTI KATA
                      </span>
                      {wordOfTheDay.chapter && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)]">
                          📖 {wordOfTheDay.chapter}
                        </span>
                      )}
                    </div>

                    <div className="text-center my-auto px-2">
                      <p className="text-base font-extrabold text-[var(--color-text-1)] leading-relaxed">
                        {wordOfTheDay.arti}
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <button 
                        onClick={() => setIsWotdFlipped(false)}
                        className="rounded-xl px-4 py-2 text-xs font-bold text-[var(--color-text-2)] bg-[var(--color-bg)] active:scale-95 transition-transform"
                      >
                        Balik ↩
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Materi & Tata Bahasa Quick Access */}
            <div className="rounded-3xl p-4 mb-4 anim-up d2 border border-[var(--color-border)] bg-white dark:bg-[#1a1d24]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-3">Materi & Tata Bahasa</p>
              <div className="grid grid-cols-4 gap-2">
                <Link href="/particles" className="no-underline flex flex-col items-center justify-center p-2.5 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] transition-all active:scale-95">
                  <span className="text-xl mb-1 text-amber-500 jp font-extrabold leading-none flex items-center justify-center h-6">助</span>
                  <span className="text-[8px] font-black text-[var(--color-text-1)] leading-tight">Latihan<br/>Partikel</span>
                </Link>
                <Link href="/sentences" className="no-underline flex flex-col items-center justify-center p-2.5 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] transition-all active:scale-95">
                  <span className="text-xl mb-1 text-green-500 jp font-extrabold leading-none flex items-center justify-center h-6">文</span>
                  <span className="text-[8px] font-black text-[var(--color-text-1)] leading-tight">Susun<br/>Kalimat</span>
                </Link>
                <Link href="/particles/guide" className="no-underline flex flex-col items-center justify-center p-2.5 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] transition-all active:scale-95">
                  <span className="text-xl mb-1 leading-none flex items-center justify-center h-6">📖</span>
                  <span className="text-[8px] font-black text-[var(--color-text-1)] leading-tight">Panduan<br/>Partikel</span>
                </Link>
                <Link href="/quiz/custom" className="no-underline flex flex-col items-center justify-center p-2.5 text-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] transition-all active:scale-95">
                  <span className="text-xl mb-1 text-purple-500 leading-none flex items-center justify-center h-6">📋</span>
                  <span className="text-[8px] font-black text-[var(--color-text-1)] leading-tight">Kuis<br/>G Form</span>
                </Link>
              </div>
            </div>

            {/* Consolidated Study Status Tracker */}
            {srs && (
              <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {/* Custom status tabs */}
                <div className="flex border-b border-[var(--color-border)] p-1 bg-[var(--color-bg)]/40">
                  {[
                    { key: 'vocab', label: 'Kosakata', available: !noVocab },
                    { key: 'kanji', label: 'Kanji', available: !!kanjiSrs },
                    { key: 'kana', label: 'Kana', available: true }
                  ].map(tab => {
                    const isTabActive = activeStatusTab === tab.key
                    if (!tab.available) return null
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveStatusTab(tab.key as any)}
                        className={`flex-1 text-center py-2.5 text-xs font-black rounded-2xl transition-all ${isTabActive ? 'shadow-sm bg-[var(--color-white)]' : 'opacity-60'}`}
                        style={{
                          color: isTabActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                        }}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                {/* Tab content */}
                {(() => {
                  let currentSrs = srs
                  let linkUrl = '/progress'
                  let linkText = 'Lihat semua →'
                  let title = 'Status Kosakata'

                  if (activeStatusTab === 'kanji' && kanjiSrs) {
                    currentSrs = kanjiSrs
                    linkUrl = '/quiz?mode=kanji'
                    linkText = 'Berlatih kanji →'
                    title = 'Status Kanji'
                  } else if (activeStatusTab === 'kana') {
                    currentSrs = kanaSrs
                    linkUrl = '/kana'
                    linkText = 'Berlatih kana →'
                    title = 'Status Kana'
                  }

                  return (
                    <div className="anim-fade-in">
                      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-sm" style={{ color: 'var(--color-text-1)' }}>{title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-subtle)' }}>
                              <div className="h-full transition-all duration-700" style={{ width: `${currentSrs.pct}%`, background: currentSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }} />
                            </div>
                            <span className="text-[10px] font-black" style={{ color: currentSrs.pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{currentSrs.pct}%</span>
                          </div>
                        </div>
                        <Link href={linkUrl} className="text-xs font-bold no-underline" style={{ color: 'var(--color-accent)' }}>{linkText}</Link>
                      </div>

                      <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                        {[
                          { label: 'Review', val: currentSrs.dueCount, color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                          { label: 'Baru',   val: currentSrs.newCount, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                          { label: 'Proses', val: currentSrs.learningCount, color: '#a855f7', bg: '#faf0ff' },
                          { label: 'Hafal',  val: currentSrs.masteredCount, color: 'var(--color-green)', bg: 'var(--color-green-light)' },
                        ].map(s => (
                          <div key={s.label} className="rounded-2xl py-3 text-center transition-all duration-200" style={{ background: s.bg }}>
                            <p className="text-base font-extrabold" style={{ color: s.color }}>{s.val}</p>
                            <p className="text-[10px] font-bold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}

    {isLoggedIn && <p className="text-center text-xs mt-8 mb-4" style={{ color: 'var(--color-text-3)' }}>↓ Tarik ke bawah untuk sinkronisasi</p>}
  </div>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs relative anim-pop shadow-2xl text-center">
            <div className="text-5xl mb-4">🚪</div>
            <h3 className="text-xl font-extrabold mb-2">Mau Logout?</h3>
            <p className="text-sm font-semibold mb-8 leading-relaxed">Data lokal di browser ini akan dihapus, namun progress kamu tetap aman di cloud.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={handleSignOut} className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform" style={{ background: 'var(--color-red)', color: '#fff' }}>Ya, Logout 👋</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform" style={{ background: 'var(--color-bg)', color: 'var(--color-text-2)' }}>Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Nav */}
      <BottomNav />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .perspective-container { perspective: 1000px; }
        .flip-card-inner {
          position: relative;
          width: 100%;
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transform-style: preserve-3d;
        }
        .flip-card-flipped { transform: rotateY(180deg); }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          top: 0;
          left: 0;
        }
        .flip-card-back { transform: rotateY(180deg); }
        .style-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  )
}

function VolumeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
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
