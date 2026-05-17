'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { loadStats, type GameStats } from '@/lib/stats'
import { loadSRS, saveSRS, getSRSSummary, type SRSStore } from '@/lib/srs'
import { DEFAULT_VOCAB, parseCSVToVocab, type VocabItem } from '@/lib/vocab'
import { fetchVocabCSV, pullFromCloud, pushToCloud } from '@/lib/cloud'

export default function Home() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [savedUrl, setSavedUrl] = useState('')
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')

  useEffect(() => {
    setStats(loadStats())
    const store = loadSRS()
    setSrsStore(store)
    const url = localStorage.getItem('kotoba_sheets_url') || ''
    setSavedUrl(url); setSheetsUrl(url)
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setNotifStatus('granted')
      else if (Notification.permission === 'denied') setNotifStatus('denied')
    }
    loadVocabData(url)
  }, [])

  // Auto-pull dari cloud saat login
  useEffect(() => {
    if (session?.accessToken) {
      handleCloudPull()
    }
  }, [session?.accessToken])

  async function loadVocabData(url: string) {
    if (url) {
      // Pakai server-side proxy biar bypass CORS
      const csv = await fetchVocabCSV(url)
      if (csv) {
        const parsed = parseCSVToVocab(csv)
        if (parsed.length >= 4) { setVocab(parsed); return }
      }
    }
    setVocab(DEFAULT_VOCAB)
  }

  async function handleCloudPull() {
    setSyncStatus('syncing')
    const merged = await pullFromCloud()
    if (merged) {
      setSrsStore(merged)
      setSyncStatus('ok')
    } else {
      setSyncStatus('error')
    }
    setTimeout(() => setSyncStatus('idle'), 2500)
  }

  async function handleCloudPush() {
    setSyncStatus('syncing')
    const store = loadSRS()
    const ok = await pushToCloud(store)
    setSyncStatus(ok ? 'ok' : 'error')
    setTimeout(() => setSyncStatus('idle'), 2500)
  }

  async function saveUrl() {
    setSaving(true)
    localStorage.setItem('kotoba_sheets_url', sheetsUrl)
    setSavedUrl(sheetsUrl)
    await loadVocabData(sheetsUrl)
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

  const syncLabel = syncStatus === 'syncing' ? '⏳ Syncing...'
    : syncStatus === 'ok' ? '✓ Tersinkron'
    : syncStatus === 'error' ? '✗ Gagal sync'
    : '☁ Sync sekarang'
  const syncColor = syncStatus === 'ok' ? 'var(--color-green)'
    : syncStatus === 'error' ? 'var(--color-red)'
    : 'var(--color-accent)'

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto px-4 pt-12 pb-10">

        {/* ── Header ── */}
        <div className="anim-up mb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
                {session ? `おかえり、${session.user?.name?.split(' ')[0]} 👋` : 'おはようございます 👋'}
              </p>
              <h1 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--color-text-1)' }}>
                Siap latihan hari ini?
              </h1>
            </div>
            {/* Avatar / Login button */}
            {status === 'loading' ? (
              <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-subtle)' }} />
            ) : session ? (
              <button onClick={() => signOut()} title="Logout"
                className="relative w-10 h-10 rounded-full overflow-hidden border-2 active:scale-95 transition-transform"
                style={{ borderColor: 'var(--color-accent)' }}>
                {session.user?.image
                  ? <img src={session.user.image} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-bold text-white"
                      style={{ background: 'var(--color-accent)' }}>
                      {session.user?.name?.[0]}
                    </div>
                }
              </button>
            ) : (
              <button onClick={() => signIn('google')}
                className="flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold active:scale-95 transition-transform"
                style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-1)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <GoogleIcon />
                Masuk
              </button>
            )}
          </div>
        </div>

        {/* ── Cloud sync banner (kalau login) ── */}
        {session && (
          <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between anim-up"
            style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-1)' }}>☁ Cloud Sync Aktif</p>
              <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>Progress tersimpan di akun Google lo</p>
            </div>
            <button onClick={handleCloudPush} disabled={syncStatus === 'syncing'}
              className="text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-all"
              style={{ background: 'var(--color-accent-light)', color: syncColor, opacity: syncStatus === 'syncing' ? 0.7 : 1 }}>
              {syncLabel}
            </button>
          </div>
        )}

        {/* ── Login prompt (kalau belum login) ── */}
        {!session && status !== 'loading' && (
          <button onClick={() => signIn('google')}
            className="w-full rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 anim-up active:scale-[0.98] transition-transform"
            style={{ background: 'var(--color-white)', border: '1.5px dashed var(--color-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <GoogleIcon size={20} />
            <div className="text-left flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--color-text-1)' }}>Masuk dengan Google</p>
              <p className="text-xs" style={{ color: 'var(--color-text-2)' }}>Biar progress bisa pindah device</p>
            </div>
            <span style={{ color: 'var(--color-text-3)' }}>›</span>
          </button>
        )}

        {/* ── CTA card ── */}
        <div className="anim-up d1 mb-4">
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
              <p className="text-sm font-semibold relative" style={{ color: 'rgba(255,255,255,0.72)' }}>Mulai latihan sekarang →</p>
            </div>
          </Link>
        </div>

        {/* ── Stats row ── */}
        {stats && (
          <div className="grid grid-cols-3 gap-2.5 mb-4 anim-up d2">
            {[
              { icon: '⚡', label: 'Total XP', value: String(stats.totalXP), color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
              { icon: '🔥', label: 'Streak', value: `${stats.currentStreak}h`, color: 'var(--color-red)', bg: 'var(--color-red-light)' },
              { icon: '🎯', label: 'Akurasi', value: `${accuracy}%`, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
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
        {srs && (
          <div className="rounded-3xl overflow-hidden mb-4 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <p className="font-bold" style={{ color: 'var(--color-text-1)' }}>Status Vocab</p>
              <Link href="/progress" className="text-xs font-semibold no-underline" style={{ color: 'var(--color-accent)' }}>
                Lihat semua →
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 pb-4">
              {[
                { label: 'Review', val: srs.dueCount, color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
                { label: 'Baru', val: srs.newCount, color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
                { label: 'Proses', val: srs.learningCount, color: '#a855f7', bg: '#faf0ff' },
                { label: 'Hafal', val: srs.masteredCount, color: 'var(--color-green)', bg: 'var(--color-green-light)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl py-3 text-center" style={{ background: s.bg }}>
                  <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Settings ── */}
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
              <input type="url" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                placeholder="Paste link CSV Sheets lo..."
                className="w-full rounded-2xl px-4 py-3 text-sm mb-3 outline-none"
                style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-1)', fontFamily: 'inherit' }} />
              <div className="flex gap-2 mb-2">
                <button onClick={saveUrl} disabled={saving}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'var(--color-accent)', color: '#fff', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(91,94,244,0.3)' }}>
                  {saving ? 'Nyimpen...' : 'Simpan URL'}
                </button>
                {savedUrl && (
                  <button onClick={() => { setSheetsUrl(''); setSavedUrl(''); localStorage.removeItem('kotoba_sheets_url'); setVocab(DEFAULT_VOCAB) }}
                    className="rounded-2xl px-4 py-3 text-sm font-bold active:scale-95 transition-transform"
                    style={{ background: 'var(--color-red-light)', color: 'var(--color-red)' }}>
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-xs font-semibold mb-4" style={{ color: savedUrl ? 'var(--color-green)' : 'var(--color-text-3)' }}>
                {savedUrl ? '✓ Tersambung ke Google Sheets' : 'Belum tersambung — pakai data bawaan'}
              </p>
              <details>
                <summary className="text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--color-text-2)' }}>Cara setup Sheets ▾</summary>
                <div className="mt-2 text-xs space-y-1 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                  <p>1. Kolom: <span className="font-bold" style={{ color: 'var(--color-accent)' }}>kategori, hiragana, kanji, arti</span></p>
                  <p>2. File → Share → Publish to web → CSV</p>
                  <p>3. Copy link → paste di atas</p>
                </div>
              </details>
              <div className="my-4" style={{ height: 1, background: 'var(--color-border)' }} />
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
                  <button onClick={enableNotif} className="rounded-xl px-4 py-2 text-sm font-bold active:scale-95 transition-transform"
                    style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                    Aktifkan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
