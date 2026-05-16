'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadStats, type GameStats } from '@/lib/stats'
import { loadSRS, getSRSSummary, type SRSStore } from '@/lib/srs'
import { DEFAULT_VOCAB, parseCSVToVocab, type VocabItem } from '@/lib/vocab'

export default function Home() {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [savedUrl, setSavedUrl] = useState('')
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setStats(loadStats())
    setSrsStore(loadSRS())
    const url = localStorage.getItem('kotoba_sheets_url') || ''
    setSavedUrl(url); setSheetsUrl(url)
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setNotifStatus('granted')
      else if (Notification.permission === 'denied') setNotifStatus('denied')
    }
    loadVocabData(url)
  }, [])

  async function loadVocabData(url: string) {
    if (url) {
      try {
        const parsed = parseCSVToVocab(await (await fetch(url)).text())
        setVocab(parsed.length >= 4 ? parsed : DEFAULT_VOCAB); return
      } catch { }
    }
    setVocab(DEFAULT_VOCAB)
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

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto px-4 pt-14 pb-10">

        {/* ── Header ── */}
        <div className="anim-up mb-7">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-2)' }}>
            おはようございます 👋
          </p>
          <h1 className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--color-text-1)' }}>
            Siap latihan hari ini?
          </h1>
        </div>

        {/* ── CTA card ── */}
        <div className="anim-up d1 mb-4">
          <Link href="/quiz" className="block no-underline">
            <div className="rounded-3xl p-6 relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, #5b5ef4 0%, #7c7ff7 100%)',
              boxShadow: '0 8px 24px rgba(91,94,244,0.32)',
            }}>
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.16) 0%, transparent 55%)',
              }} />
              {srs && srs.dueCount > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 relative"
                  style={{ background: 'rgba(255,255,255,0.18)' }}>
                  <span style={{ fontSize: 11 }}>🔥</span>
                  <span className="text-xs font-bold text-white">{srs.dueCount} kata siap direview</span>
                </div>
              )}
              <p className="jp-serif text-white relative mb-1" style={{ fontSize: '1.9rem', fontWeight: 700 }}>
                練習する
              </p>
              <p className="text-sm font-semibold relative" style={{ color: 'rgba(255,255,255,0.72)' }}>
                Mulai latihan sekarang →
              </p>
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
        {srs && (
          <div className="rounded-3xl overflow-hidden mb-4 anim-up d2 shadow-card" style={{ background: 'var(--color-white)' }}>
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

        {/* ── Settings toggle ── */}
        <div className="anim-up d3">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-4 shadow-card active:scale-[0.98] transition-transform"
            style={{ background: 'var(--color-white)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-light)' }}>
                <span style={{ fontSize: 15 }}>⚙️</span>
              </div>
              <span className="font-bold" style={{ color: 'var(--color-text-1)' }}>Pengaturan</span>
            </div>
            <span style={{
              color: 'var(--color-text-3)', fontSize: 18, fontWeight: 700,
              transform: showSettings ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>›</span>
          </button>

          {showSettings && (
            <div className="mt-2 rounded-3xl p-5 anim-down shadow-card" style={{ background: 'var(--color-white)' }}>
              {/* Sheets */}
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-3)' }}>
                Google Sheets
              </p>
              <input
                type="url" value={sheetsUrl} onChange={e => setSheetsUrl(e.target.value)}
                placeholder="Paste link CSV Sheets lo..."
                className="w-full rounded-2xl px-4 py-3 text-sm mb-3 outline-none transition-colors"
                style={{
                  background: 'var(--color-bg)',
                  border: '1.5px solid var(--color-border)',
                  color: 'var(--color-text-1)', fontFamily: 'inherit',
                }}
              />
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
                <summary className="text-xs font-semibold cursor-pointer select-none" style={{ color: 'var(--color-text-2)' }}>
                  Cara setup Sheets ▾
                </summary>
                <div className="mt-2 text-xs space-y-1 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                  <p>1. Kolom: <span className="font-bold" style={{ color: 'var(--color-accent)' }}>kategori, hiragana, kanji, arti</span></p>
                  <p>2. File → Share → Publish to web → CSV</p>
                  <p>3. Copy link → paste di atas</p>
                </div>
              </details>

              <div className="my-4" style={{ height: 1, background: 'var(--color-border)' }} />

              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-3)' }}>
                Pengingat Harian
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: notifStatus === 'granted' ? 'var(--color-green-light)' : 'var(--color-amber-light)' }}>
                  <span style={{ fontSize: 14 }}>🔔</span>
                </div>
                <div className="flex-1">
                  {notifStatus === 'granted'
                    ? <p className="text-sm font-bold" style={{ color: 'var(--color-green)' }}>Pengingat aktif!</p>
                    : notifStatus === 'denied'
                    ? <p className="text-sm font-bold" style={{ color: 'var(--color-red)' }}>Ditolak — aktifkan di browser</p>
                    : <p className="text-sm font-semibold" style={{ color: 'var(--color-text-1)' }}>Belum diaktifkan</p>
                  }
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
