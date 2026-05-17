'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { loadStats, type GameStats } from '@/lib/stats'
import { loadSRS, type SRSStore, getSRSSummary, getKanaSummary } from '@/lib/srs'
import { parseCSVToVocab, type VocabItem } from '@/lib/vocab'
import { fetchVocabCSV, pushToCloud, syncToCloud, resetCloudData } from '@/lib/cloud'
import { KANA } from '@/lib/kana'

type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error'

const PULL_THRESHOLD = 80 // px tarik ke bawah sebelum trigger

export default function Home() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [savedUrl, setSavedUrl] = useState('')
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [showSettings, setShowSettings] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [vocabError, setVocabError] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Pull-to-refresh
  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function handleResetAccount() {
    setResetting(true)
    const ok = await resetCloudData()
    if (ok) {
      window.location.reload()
    } else {
      alert('Gagal hapus data di cloud. Cek koneksi lo.')
      setResetting(false)
      setShowResetConfirm(false)
    }
  }

  const loadVocabData = useCallback(async (url: string, force = false): Promise<VocabItem[]> => {
    setVocabError('')
    
    // Validasi format URL
    if (url.includes('/edit') || !url.includes('output=csv')) {
      setVocabError('Link salah! Pake link "Publish to web" format CSV ya (cek cara setup di bawah).')
      setVocab([]); return []
    }

    const csv = await fetchVocabCSV(url, force)
    if (!csv) {
      setVocabError('Gagal ambil data. Cek koneksi atau status "Publish" di Sheets.')
      setVocab([]); return []
    }
    const parsed = parseCSVToVocab(csv)
    if (parsed.length === 0) {
      setVocabError('Data kosong! Pastiin kolom kategori, hiragana, kanji, arti udah bener.')
      setVocab([]); return []
    }
    setVocab(parsed)
    return parsed
  }, [])

  useEffect(() => {
    const s = loadStats(); setStats(s)
    const store = loadSRS(); setSrsStore(store)
    const url = localStorage.getItem('kotoba_sheets_url') || ''
    setSavedUrl(url); setUrlInput(url)
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setNotifStatus('granted')
      else if (Notification.permission === 'denied') setNotifStatus('denied')
    }
    if (url) loadVocabData(url)
  }, [loadVocabData])

  // Account Isolation: Clear data if user changed
  useEffect(() => {
    if (session?.user?.email) {
      const lastUser = localStorage.getItem('kotoba_last_user')
      if (lastUser && lastUser !== session.user.email) {
        // Different account! Clear everything to prevent leakage
        localStorage.removeItem('kotoba_srs')
        localStorage.removeItem('kotoba_stats')
        localStorage.removeItem('kotoba_sheets_url')
        localStorage.setItem('kotoba_last_user', session.user.email)
        window.location.reload() // Hard refresh to reset state
      } else if (!lastUser) {
        localStorage.setItem('kotoba_last_user', session.user.email)
      }
    }
  }, [session])

  async function handleSignOut() {
    localStorage.removeItem('kotoba_srs')
    localStorage.removeItem('kotoba_stats')
    localStorage.removeItem('kotoba_sheets_url')
    localStorage.removeItem('kotoba_last_user')
    await signOut()
  }

  const doSync = useCallback(async (direction: 'push' | 'pull' = 'push') => {
    if (!session?.accessToken) return
    setSyncStatus('syncing')
    
    // Gunakan syncToCloud yang baru (pull -> merge -> push)
    const ok = await syncToCloud()
    if (ok) {
      setSrsStore(loadSRS())
      setStats(loadStats())
      const cloudUrl = localStorage.getItem('kotoba_sheets_url')
      if (cloudUrl) {
        setSavedUrl(cloudUrl); setUrlInput(cloudUrl)
        await loadVocabData(cloudUrl, true) // Force refresh CSV dari cloud
      }
      setSyncStatus('ok')
    } else {
      setSyncStatus('error')
    }
    setTimeout(() => setSyncStatus('idle'), 2500)
  }, [session?.accessToken, loadVocabData])

  // Auto-pull saat login
  useEffect(() => {
    if (session?.accessToken) doSync('pull')
  }, [session?.accessToken, doSync])

  // Pull-to-refresh handlers
  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current
    if (el && el.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY
      setIsPulling(true)
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
      setPullY(40)
      setIsRefreshing(true)
      // Refresh: pull cloud + reload vocab + hard refresh
      if (session?.accessToken) await doSync('pull')
      if (savedUrl) await loadVocabData(savedUrl, true)
      setIsRefreshing(false)
      window.location.reload() // Hard refresh
    }
    setPullY(0)
  }

  async function handleSaveUrl() {
    if (!urlInput.trim()) {
      setVocabError('URL tidak boleh kosong!')
      return
    }
    if (!urlInput.includes('docs.google.com')) {
      setVocabError('Harus URL Google Sheets yang valid.')
      return
    }
    setSaving(true)
    localStorage.setItem('kotoba_sheets_url', urlInput)
    setSavedUrl(urlInput)
    const v = await loadVocabData(urlInput)
    if (v.length > 0 && session?.accessToken) {
      await pushToCloud() // push sheetsUrl ke cloud juga
    }
    setSaving(false)
  }

  async function enableNotif() {
    const perm = await Notification.requestPermission()
    setNotifStatus(perm === 'granted' ? 'granted' : 'denied')
    if (perm === 'granted') new Notification('言葉カード', { body: 'Siap! Gua ingetin lo latihan tiap hari 🎌' })
  }

  const accuracy = stats && stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0
  const srs = vocab.length > 0 ? getSRSSummary(vocab.map(v => v.id), srsStore) : null
  const kanaSrs = getKanaSummary(KANA, srsStore)

  const syncLabel = syncStatus === 'syncing' ? '⏳ Syncing...'
    : syncStatus === 'ok' ? '✓ Tersinkron!' : syncStatus === 'error' ? '✗ Gagal' : '☁ Sync'
  const syncColor = syncStatus === 'ok' ? 'var(--color-green)'
    : syncStatus === 'error' ? 'var(--color-red)' : 'var(--color-accent)'

  const noVocab = vocab.length === 0

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>

      {/* Pull indicator */}
      {(pullY > 0 || isRefreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 transition-all"
          style={{ transform: `translateY(${Math.min(pullY, 44)}px)`, opacity: Math.min(pullY / PULL_THRESHOLD, 1) }}>
          <div className="rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-bold"
            style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', color: 'var(--color-accent)' }}>
            <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>
              {isRefreshing ? '⏳' : pullY >= PULL_THRESHOLD ? '↑ Lepas untuk refresh' : '↓ Tarik untuk refresh'}
            </span>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="max-w-sm mx-auto px-4 pt-12 pb-10 overflow-y-auto"
        style={{ minHeight: '100dvh', transform: pullY > 0 ? `translateY(${pullY}px)` : 'none', transition: isPulling ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Header ── */}
        <div className="anim-up mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
                {session ? `おかえり、${session.user?.name?.split(' ')[0]} 👋` : 'おはようございます 👋'}
              </p>
              <h1 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--color-text-1)' }}>
                {session ? 'Siap latihan hari ini?' : 'Kuasai Kosakata Jepang'}
              </h1>
            </div>
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-subtle)' }} />
            ) : session ? (
              <button onClick={() => setShowLogoutConfirm(true)} title="Logout"
                className="w-10 h-10 rounded-full overflow-hidden border-2 active:scale-95 transition-transform"
                style={{ borderColor: 'var(--color-accent)' }}>
                {session.user?.image
                  ? <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-bold text-white"
                      style={{ background: 'var(--color-accent)' }}>{session.user?.name?.[0]}</div>}
              </button>
            ) : null}
          </div>
        </div>

        {!session && status !== 'loading' ? (
          <div className="anim-up d1">
            <div className="rounded-3xl p-8 mb-6 text-center"
              style={{ background: 'var(--color-white)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <div className="text-6xl mb-6">🎌</div>
              <h2 className="text-xl font-extrabold mb-3" style={{ color: 'var(--color-text-1)' }}>
                Selamat Datang di Kotoba Quiz
              </h2>
              <p className="text-sm font-semibold mb-8 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                Simpan progress latihan kosakata dan kana lo di cloud. Masuk biar bisa lanjut di mana aja!
              </p>
              <button onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
                style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 8px 20px rgba(91,94,244,0.28)' }}>
                <GoogleIcon size={20} color="white" /> Masuk dengan Google
              </button>
            </div>
            <p className="text-center text-xs font-bold" style={{ color: 'var(--color-text-3)' }}>
              Aplikasi pendamping belajar Bahasa Jepang 🎌
            </p>
          </div>
        ) : session && (
          <>
            {/* ── Cloud sync banner ── */}
            <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between anim-up"
              style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-1)' }}>☁ Cloud Sync Aktif</p>
                <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>Progress lo tersinkron lintas device</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => doSync('pull')} disabled={syncStatus === 'syncing'}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)', opacity: syncStatus === 'syncing' ? 0.6 : 1 }}>
                  ↓ Pull
                </button>
                <button onClick={() => doSync('push')} disabled={syncStatus === 'syncing'}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                  style={{ background: syncStatus !== 'idle' ? (syncStatus === 'ok' ? 'var(--color-green-light)' : syncStatus === 'error' ? 'var(--color-red-light)' : 'var(--color-accent-light)') : 'var(--color-accent-light)', color: syncColor, opacity: syncStatus === 'syncing' ? 0.6 : 1 }}>
                  {syncLabel}
                </button>
              </div>
            </div>

            {/* ── Wajib Sheets — shown if no vocab ── */}
            {noVocab && (
              <div className="rounded-3xl p-5 mb-5 anim-up"
                style={{ background: 'var(--color-white)', boxShadow: '0 4px 20px rgba(91,94,244,0.1)', border: '2px solid var(--color-accent)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-extrabold text-base" style={{ color: 'var(--color-text-1)' }}>
                      Setup kamus lo dulu!
                    </p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
                      App butuh Google Sheets sebagai sumber kata
                    </p>
                  </div>
                </div>
                <input
                  type="url" value={urlInput} onChange={e => { setUrlInput(e.target.value); setVocabError('') }}
                  placeholder="Paste link CSV Google Sheets lo..."
                  className="w-full rounded-2xl px-4 py-3 text-sm mb-2 outline-none"
                  style={{ background: 'var(--color-bg)', border: `1.5px solid ${vocabError ? 'var(--color-red)' : 'var(--color-border)'}`, color: 'var(--color-text-1)', fontFamily: 'inherit' }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveUrl()}
                />
                {vocabError && (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-2"
                    style={{ background: 'var(--color-red-light)' }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    <p className="text-xs font-bold" style={{ color: 'var(--color-red-dark)' }}>{vocabError}</p>
                  </div>
                )}
                <button onClick={handleSaveUrl} disabled={saving}
                  className="w-full rounded-2xl py-3 text-sm font-extrabold active:scale-95 transition-transform"
                  style={{ background: 'var(--color-accent)', color: '#fff', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(91,94,244,0.3)' }}>
                  {saving ? '⏳ Mengambil data...' : 'Hubungkan Sheets →'}
                </button>
                <details className="mt-3">
                  <summary className="text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--color-text-2)' }}>
                    Cara setup Sheets ▾
                  </summary>
                  <div className="mt-2 text-xs space-y-1 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                    <p>1. Kolom: <span className="font-bold" style={{ color: 'var(--color-accent)' }}>kategori, hiragana, kanji, arti</span></p>
                    <p>2. File → Share → Publish to web → CSV</p>
                    <p>3. Copy link → paste di atas</p>
                  </div>
                </details>
              </div>
            )}

            {/* ── CTA card (disabled jika belum ada vocab) ── */}
            <div className="anim-up d1 mb-4">
              {!noVocab ? (
                <Link href="/quiz" className="block no-underline">
                  <div className="rounded-3xl p-6 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #5b5ef4 0%, #7c7ff7 100%)', boxShadow: '0 8px 24px rgba(91,94,244,0.32)' }}>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.16) 0%, transparent 55%)' }} />
                    {srs && srs.dueCount > 0 && (
                      <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 relative" style={{ background: 'rgba(255,255,255,0.18)' }}>
                        <span style={{ fontSize: 11 }}>🔥</span>
                        <span className="text-xs font-bold text-white">{srs.dueCount} kata siap direview</span>
                      </div>
                    )}
                    <p className="jp-serif text-white relative mb-1" style={{ fontSize: '1.9rem', fontWeight: 700 }}>練習する</p>
                    <p className="text-sm font-semibold relative" style={{ color: 'rgba(255,255,255,0.72)' }}>
                      {vocab.length} kata · Mulai latihan →
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl p-6 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #9ca3af 0%, #d1d5db 100%)', opacity: 0.6 }}>
                  <p className="jp-serif text-white mb-1" style={{ fontSize: '1.9rem', fontWeight: 700 }}>練習する</p>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>Setup Sheets dulu di atas ↑</p>
                </div>
              )}
            </div>

            {/* ── Kana card ── */}
            <div className="anim-up d1 mb-4">
              <Link href="/kana" className="block no-underline">
                <div className="rounded-3xl p-5 flex items-center gap-4"
                  style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid var(--color-border)' }}>
                  <div className="jp-serif text-4xl leading-none">あア</div>
                  <div className="flex-1">
                    <p className="font-extrabold text-base" style={{ color: 'var(--color-text-1)' }}>Hiragana & Katakana</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>
                      {KANA.length} karakter · Latihan baca tulis kana
                    </p>
                  </div>
                  <span style={{ color: 'var(--color-text-3)', fontSize: 20, fontWeight: 700 }}>›</span>
                </div>
              </Link>
            </div>

            {/* ── Stats row ── */}
            {stats && (
              <div className="grid grid-cols-3 gap-2.5 mb-4 anim-up d2">
                {[
                  { icon: '⚡', label: 'Total XP', value: String(stats.totalXP), color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                  { icon: '🔥', label: 'Streak',   value: `${stats.currentStreak}h`, color: 'var(--color-red)',   bg: 'var(--color-red-light)' },
                  { icon: '🎯', label: 'Akurasi',  value: `${accuracy}%`,  color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl py-4 text-center" style={{ background: s.bg }}>
                    <p className="text-xl mb-1">{s.icon}</p>
                    <p className="text-base font-extrabold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Vocab status ── */}
            {srs && !noVocab && (
              <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <p className="font-bold" style={{ color: 'var(--color-text-1)' }}>Status Vocab</p>
                  <Link href="/progress" className="text-xs font-semibold no-underline" style={{ color: 'var(--color-accent)' }}>
                    Lihat semua →
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                  {[
                    { label: 'Review', val: srs.dueCount,     color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
                    { label: 'Baru',   val: srs.newCount,     color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                    { label: 'Proses', val: srs.learningCount,color: '#a855f7',             bg: '#faf0ff' },
                    { label: 'Hafal',  val: srs.masteredCount,color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}>
                      <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Kana status ── */}
            <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <p className="font-bold" style={{ color: 'var(--color-text-1)' }}>Status Kana</p>
                <Link href="/kana" className="text-xs font-semibold no-underline" style={{ color: 'var(--color-accent)' }}>
                  Lanjut belajar →
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2 px-3 pb-4">
                {[
                  { label: 'Review', val: kanaSrs.dueCount,     color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
                  { label: 'Baru',   val: kanaSrs.newCount,     color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                  { label: 'Proses', val: kanaSrs.learningCount,color: '#a855f7',             bg: '#faf0ff' },
                  { label: 'Hafal',  val: kanaSrs.masteredCount,color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}>
                    <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Settings ── */}
            {!noVocab && (
              <div className="anim-up d3">
                <button onClick={() => setShowSettings(s => !s)}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
                  style={{ background: 'var(--color-white)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-light)' }}>
                      <span style={{ fontSize: 15 }}>⚙️</span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--color-text-1)' }}>Pengaturan</span>
                  </div>
                  <span style={{ color: 'var(--color-text-3)', fontSize: 18, fontWeight: 700, transform: showSettings ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
                </button>

                {showSettings && (
                  <div className="mt-2 rounded-3xl p-5 anim-down" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-3)' }}>Google Sheets</p>
                    {savedUrl && <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-green)' }}>✓ {vocab.length} kata aktif dari Sheets</p>}
                    <input type="url" value={urlInput} onChange={e => { setUrlInput(e.target.value); setVocabError('') }}
                      placeholder="Paste link CSV Sheets lo..."
                      className="w-full rounded-2xl px-4 py-3 text-sm mb-2 outline-none"
                      style={{ background: 'var(--color-bg)', border: `1.5px solid ${vocabError ? 'var(--color-red)' : 'var(--color-border)'}`, color: 'var(--color-text-1)', fontFamily: 'inherit' }} />
                    {vocabError && (
                      <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-2"
                        style={{ background: 'var(--color-red-light)' }}>
                        <span style={{ fontSize: 13 }}>⚠️</span>
                        <p className="text-xs font-bold" style={{ color: 'var(--color-red-dark)' }}>{vocabError}</p>
                      </div>
                    )}
                    <button onClick={handleSaveUrl} disabled={saving}
                      className="w-full rounded-2xl py-3 text-sm font-bold active:scale-95 transition-transform mb-3"
                      style={{ background: 'var(--color-accent)', color: '#fff', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(91,94,244,0.3)' }}>
                      {saving ? 'Mengambil data...' : 'Update URL'}
                    </button>

                    <div className="my-3" style={{ height: 1, background: 'var(--color-border)' }} />
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-3)' }}>Pengingat Harian</p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: notifStatus === 'granted' ? 'var(--color-green-light)' : 'var(--color-amber-light)' }}>
                        <span style={{ fontSize: 14 }}>🔔</span>
                      </div>
                      <div className="flex-1">
                        {notifStatus === 'granted' ? <p className="text-sm font-bold" style={{ color: 'var(--color-green)' }}>Pengingat aktif!</p>
                          : notifStatus === 'denied' ? <p className="text-sm font-bold" style={{ color: 'var(--color-red)' }}>Ditolak — aktifkan di browser</p>
                          : <p className="text-sm font-semibold" style={{ color: 'var(--color-text-1)' }}>Belum diaktifkan</p>}
                      </div>
                      {notifStatus === 'idle' && (
                        <button onClick={enableNotif} className="rounded-xl px-4 py-2 text-sm font-bold active:scale-95"
                          style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                          Aktifkan
                        </button>
                        )}
                        </div>

                        <div className="my-4" style={{ height: 1, background: 'var(--color-border)' }} />
                        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-red)' }}>Zona Bahaya</p>
                        <button onClick={() => setShowResetConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold active:scale-95 transition-transform"
                        style={{ background: 'var(--color-red-light)', color: 'var(--color-red)' }}>
                        <span>⚠️</span> Reset Semua Data Akun
                        </button>
                        </div>
                        )}
                        </div>
                        )}

          </>
        )}

        {/* Pull hint */}
        {session && (
          <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-3)' }}>
            ↓ Tarik ke bawah untuk refresh
          </p>
        )}
      </div>

      {/* ── Logout Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs relative anim-pop shadow-2xl text-center">
            <div className="text-5xl mb-4">🚪</div>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-1)' }}>Mau Logout?</h3>
            <p className="text-sm font-semibold mb-8 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
              Data lokal di browser ini bakal diapus, tapi tenang aja progress lo aman di cloud.
            </p>
            <div className="flex flex-col gap-2.5">
              <button onClick={handleSignOut}
                className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
                style={{ background: 'var(--color-red)', color: '#fff', boxShadow: '0 8px 20px rgba(239,68,68,0.25)' }}>
                Ya, Logout 👋
              </button>
              <button onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text-2)' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Data Modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !resetting && setShowResetConfirm(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs relative anim-pop shadow-2xl text-center">
            <div className="text-5xl mb-4">🧨</div>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-1)' }}>Hapus Semua?</h3>
            <p className="text-sm font-semibold mb-8 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
              Aksi ini bakal hapus data latihan lo secara permanen baik di <span className="text-red-500">lokal</span> maupun di <span className="text-red-500">Google Drive</span>.
            </p>
            <div className="flex flex-col gap-2.5">
              <button onClick={handleResetAccount} disabled={resetting}
                className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
                style={{ background: 'var(--color-red)', color: '#fff', opacity: resetting ? 0.7 : 1, boxShadow: '0 8px 20px rgba(239,68,68,0.25)' }}>
                {resetting ? '⏳ Menghapus...' : 'Ya, Hapus Permanen 🧨'}
              </button>
              <button onClick={() => setShowResetConfirm(false)} disabled={resetting}
                className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text-2)', opacity: resetting ? 0.5 : 1 }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
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
