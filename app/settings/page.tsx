'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { loadStats, touchStats } from '@/lib/stats'
import { loadSRS } from '@/lib/srs'
import { pushToCloud, resetCloudData, pullFromCloud, forcePushToCloud } from '@/lib/cloud'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  // Removed legacy Sheets state vars
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>('auto')
  const [syncActionStatus, setSyncActionStatus] = useState<string>('')

  // Legacy CSV functions removed


  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  useEffect(() => {
    const savedTheme = localStorage.getItem('kotoba_theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(isDark ? 'dark' : 'light')
    }

    const savedSync = localStorage.getItem('kotoba_sync_mode') as 'auto' | 'manual' | null
    if (savedSync) setSyncMode(savedSync)

    // Legacy URL config removed
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') setNotifStatus('granted')
      else if (Notification.permission === 'denied') setNotifStatus('denied')
    }
  }, [])

  function toggleSyncMode(mode: 'auto' | 'manual') {
    setSyncMode(mode)
    localStorage.setItem('kotoba_sync_mode', mode)
  }

  async function handleManualPull() {
    setSyncActionStatus('pulling')
    const result = await pullFromCloud()
    setSyncActionStatus(result ? 'Pull Berhasil ✓' : 'Pull Gagal ✗')
    setTimeout(() => setSyncActionStatus(''), 3000)
  }

  async function handleManualPush() {
    setSyncActionStatus('pushing')
    const ok = await forcePushToCloud()
    setSyncActionStatus(ok ? 'Push Berhasil ✓' : 'Push Gagal ✗')
    setTimeout(() => setSyncActionStatus(''), 3000)
  }

  function toggleTheme(newTheme: 'light' | 'dark') {
    setTheme(newTheme)
    localStorage.setItem('kotoba_theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    touchStats() // Update timestamp for sync
  }

  // Removed legacy update handlers

  async function enableNotif() {
    const perm = await Notification.requestPermission()
    setNotifStatus(perm === 'granted' ? 'granted' : 'denied')
  }

  async function handleResetAccount() {
    setResetting(true)
    const ok = await resetCloudData()
    if (ok) {
      router.push('/')
      window.location.reload()
    } else {
      alert('Gagal hapus data di cloud. Cek koneksi lo.')
      setResetting(false)
      setShowResetConfirm(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto px-4 pt-12 pb-28">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 anim-up">
          <button onClick={() => router.push('/')}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ←
          </button>
          <h1 className="font-extrabold text-xl" style={{ color: 'var(--color-text-1)' }}>Pengaturan</h1>
        </div>

        <div className="space-y-6">
          {/* Theme Section */}
          <div className="rounded-3xl p-6 anim-up d1" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-3)' }}>Tampilan</p>
            <div className="flex gap-2">
              {[
                { key: 'light', label: 'Terang', icon: '☀️' },
                { key: 'dark',  label: 'Gelap',  icon: '🌙' },
              ].map(t => (
                <button key={t.key} onClick={() => toggleTheme(t.key as any)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: theme === t.key ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: theme === t.key ? '#fff' : 'var(--color-text-2)',
                    boxShadow: theme === t.key ? '0 4px 12px rgba(91,94,244,0.25)' : 'none',
                  }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sync Section */}
          <div className="rounded-3xl p-6 anim-up d1" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-3)' }}>Sinkronisasi</p>
            
            <div className="flex gap-2 mb-5">
              {[
                { key: 'auto',   label: 'Otomatis', icon: '⚡' },
                { key: 'manual', label: 'Manual',   icon: '🔘' },
              ].map(m => (
                <button key={m.key} onClick={() => toggleSyncMode(m.key as any)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all active:scale-95"
                  style={{
                    background: syncMode === m.key ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: syncMode === m.key ? '#fff' : 'var(--color-text-2)',
                    boxShadow: syncMode === m.key ? '0 4px 12px rgba(91,94,244,0.25)' : 'none',
                  }}>
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <button onClick={handleManualPull} disabled={!!syncActionStatus}
                  className="flex-1 rounded-2xl py-3 text-xs font-bold active:scale-95 transition-all"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', border: '1.5px solid var(--color-border)' }}>
                  {syncActionStatus === 'pulling' ? '⏳ Pulling...' : '📥 Tarik Data (Pull)'}
                </button>
                <button onClick={handleManualPush} disabled={!!syncActionStatus}
                  className="flex-1 rounded-2xl py-3 text-xs font-bold active:scale-95 transition-all"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', border: '1.5px solid var(--color-border)' }}>
                  {syncActionStatus === 'pushing' ? '⏳ Pushing...' : '📤 Kirim Data (Push)'}
                </button>
              </div>
              
              {syncActionStatus && !['pulling', 'pushing'].includes(syncActionStatus) && (
                <p className="text-center text-[10px] font-bold text-[var(--color-accent)] animate-fade-in">
                  {syncActionStatus}
                </p>
              )}
            </div>
            
            <p className="text-[10px] text-center mt-3 font-semibold" style={{ color: 'var(--color-text-3)' }}>
              {syncMode === 'auto' 
                ? 'Sync jalan otomatis pas buka app & abis kuis.' 
                : 'Pake tombol di atas buat sinkron manual.'}
            </p>
          </div>

          {/* Vocab Database Section */}
          <div className="rounded-3xl p-6 anim-up d1" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-3)' }}>Database Kosakata</p>
            <p className="text-xs font-semibold leading-relaxed mb-4" style={{ color: 'var(--color-text-2)' }}>
              Kelola daftar kosakata kustom kamu secara langsung di aplikasi. Data kamu tersimpan di cloud Firebase secara otomatis.
            </p>
            
            <Link href="/vocab" className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold no-underline active:scale-95 transition-transform"
              style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(91,94,244,0.2)' }}>
              ⚙️ Kelola Kosakata
            </Link>
          </div>

          {/* Notifications Section */}
          <div className="rounded-3xl p-6 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-3)' }}>Notifikasi</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: notifStatus === 'granted' ? 'var(--color-green-light)' : 'var(--color-amber-light)' }}>
                  <span className="text-lg">🔔</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-1)' }}>Pengingat Harian</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-3)' }}>
                    {notifStatus === 'granted' ? 'Sudah aktif!' : 'Agar tidak lupa berlatih'}
                  </p>
                </div>
              </div>
              {notifStatus === 'idle' && (
                <button onClick={enableNotif} className="rounded-xl px-4 py-2 text-sm font-bold active:scale-95"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                  Aktifkan
                </button>
              )}
              {notifStatus === 'granted' && <span className="text-green-500 font-bold text-sm">✓</span>}
              {notifStatus === 'denied' && <span className="text-red-500 font-bold text-sm">Off</span>}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-3xl p-6 anim-up d3" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-red)' }}>Zona Bahaya</p>
            <button onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-transform"
              style={{ background: 'var(--color-red-light)', color: 'var(--color-red)' }}>
              <span>⚠️</span> Reset Semua Data Akun
            </button>
            <p className="text-[10px] text-center mt-3 font-semibold" style={{ color: 'var(--color-text-3)' }}>
              Data lokal dan cloud akan dihapus secara permanen.
            </p>
          </div>
        </div>
      </div>

      {/* ── Reset Data Modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !resetting && setShowResetConfirm(false)} />
          <div className="bg-white rounded-[32px] p-8 w-full max-w-xs relative anim-pop shadow-2xl text-center">
            <div className="text-5xl mb-4">🧨</div>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text-1)' }}>Hapus Semua?</h3>
            <p className="text-sm font-semibold mb-8 leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
              Aksi ini akan menghapus riwayat berlatih kamu secara permanen, baik di <span className="text-red-500">lokal</span> maupun di <span className="text-red-500">Firebase Cloud</span>.
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
      
      {/* Sticky Bottom Nav */}
      <BottomNav />
    </div>
  )
}
