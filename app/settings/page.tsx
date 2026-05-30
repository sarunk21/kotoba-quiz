'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { loadStats, touchStats } from '@/lib/stats'
import { loadSRS } from '@/lib/srs'
import { pushToCloud, resetCloudData, pullFromCloud, forcePushToCloud, importFromDrive } from '@/lib/cloud'
import BottomNav from '@/components/BottomNav'
import { isCapacitor } from '@/lib/platform'
import { getApiUrl } from '@/lib/api'


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

  // Sync token states
  const [syncEmail, setSyncEmail] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [inputToken, setInputToken] = useState('')
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')
  const [copysuccess, setCopysuccess] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [connectSuccess, setConnectSuccess] = useState('')
  const [customApiBase, setCustomApiBase] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated' && !isCapacitor()) router.push('/')
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

    setIsMobile(isCapacitor())
    setSyncEmail(localStorage.getItem('kotoba_sync_email'))
    setCustomApiBase(localStorage.getItem('kotoba_api_base') || process.env.NEXT_PUBLIC_API_BASE || '')
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

  async function handleImportGoogleDrive() {
    setSyncActionStatus('importing_drive')
    const result = await importFromDrive()
    if (result.success) {
      setSyncActionStatus('Migrasi Berhasil ✓')
      setTimeout(() => {
        setSyncActionStatus('')
        window.location.reload()
      }, 3000)
    } else {
      if (result.error === 'auth_required') {
        const confirmGrant = window.confirm(
          'Izin Google Drive diperlukan untuk memuat file backup kotoba_data.json Anda.\n\nKlik OK untuk masuk kembali dan memberikan izin akses Google Drive.'
        )
        if (confirmGrant) {
          await signOut({ redirect: false })
          signIn('google', {
            authorizationParams: {
              scope: 'openid email profile https://www.googleapis.com/auth/drive.appdata',
              prompt: 'consent',
              access_type: 'offline'
            }
          })
        } else {
          setSyncActionStatus('')
        }
      } else if (result.error === 'backup_not_found') {
        setSyncActionStatus('Backup tidak ditemukan di Drive ✗')
        setTimeout(() => setSyncActionStatus(''), 4000)
      } else {
        setSyncActionStatus(`Migrasi Gagal: ${result.error} ✗`)
        setTimeout(() => setSyncActionStatus(''), 4000)
      }
    }
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

          {/* Web View: Token Generator */}
          {!isMobile && session && (
            <div className="rounded-3xl p-6 anim-up d1 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-3)' }}>Token Sinkronisasi HP</p>
              <p className="text-xs font-semibold leading-relaxed mb-4" style={{ color: 'var(--color-text-2)' }}>
                Gunakan token ini untuk menghubungkan aplikasi Android dengan akun web ini agar progress kuis Anda tersinkronisasi.
              </p>
              
              {generatedToken ? (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      readOnly
                      value={generatedToken}
                      className="w-full text-[11px] font-mono p-3 pr-10 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-2xl resize-none h-20 break-all select-all focus:outline-none dark:text-white dark:bg-zinc-800"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedToken)
                        setCopysuccess(true)
                        setTimeout(() => setCopysuccess(false), 2000)
                      }}
                      className="absolute right-2 top-2 p-1.5 rounded-xl bg-white dark:bg-zinc-700 border border-[var(--color-border)] text-xs active:scale-95 transition-all"
                      title="Salin Token"
                    >
                      {copysuccess ? '✓' : '📋'}
                    </button>
                  </div>
                  {copysuccess && (
                    <p className="text-xs text-green-500 font-bold text-center">Token tersalin ke clipboard!</p>
                  )}
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-normal">
                    ⚠️ Token ini bersifat rahasia dan berisi informasi akun Anda. Jangan dibagikan kepada siapa pun.
                  </p>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setGenerateLoading(true)
                    try {
                      const res = await fetch('/api/sync/generate-token', { method: 'POST' })
                      if (res.ok) {
                        const data = await res.json()
                        setGeneratedToken(data.token)
                      } else {
                        alert('Gagal menghasilkan token. Coba lagi.')
                      }
                    } catch (e) {
                      console.error(e)
                      alert('Gagal menghubungi server.')
                    } finally {
                      setGenerateLoading(false)
                    }
                  }}
                  disabled={generateLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(91,94,244,0.2)' }}
                >
                  {generateLoading ? '⏳ Menghasilkan...' : '🔑 Buat Token Sinkronisasi'}
                </button>
              )}
            </div>
          )}

          {/* Mobile View: Account Connection */}
          {isMobile && (
            <div className="rounded-3xl p-6 anim-up d1 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-3)' }}>Sinkronisasi Akun</p>
              
              {syncEmail ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 flex items-center gap-3">
                    <span className="text-2xl">🔗</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-green-800 dark:text-green-300">Tautan Aktif</p>
                      <p className="text-sm font-extrabold text-green-900 dark:text-green-200 truncate">{syncEmail}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setSyncActionStatus('syncing')
                        const ok = await pullFromCloud()
                        if (ok) {
                          setSyncActionStatus('Sinkronisasi Berhasil ✓')
                          setTimeout(() => {
                            setSyncActionStatus('')
                            window.location.reload()
                          }, 1500)
                        } else {
                          setSyncActionStatus('Gagal Sinkronisasi ✗')
                          setTimeout(() => setSyncActionStatus(''), 3000)
                        }
                      }}
                      disabled={!!syncActionStatus}
                      className="flex-1 rounded-2xl py-3 text-xs font-bold active:scale-95 transition-all text-white bg-[var(--color-accent)]"
                    >
                      {syncActionStatus === 'syncing' ? '⏳ Sinkronisasi...' : '🔄 Sinkron Sekarang'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Apakah Anda yakin ingin memutuskan tautan akun? Progress lokal saat ini akan dibersihkan untuk isolasi akun.')) {
                          localStorage.removeItem('kotoba_srs')
                          localStorage.removeItem('kotoba_stats')
                          localStorage.removeItem('kotoba_vocab')
                          localStorage.removeItem('kotoba_vocab_updated_at')
                          localStorage.removeItem('kotoba_last_user')
                          localStorage.removeItem('kotoba_sync_token')
                          localStorage.removeItem('kotoba_sync_email')
                          window.location.reload()
                        }
                      }}
                      className="rounded-2xl px-4 py-3 text-xs font-bold active:scale-95 transition-all border border-red-200 text-red-600 bg-red-50 dark:bg-red-950/20 dark:border-red-900/30"
                    >
                      Putuskan Tautan
                    </button>
                  </div>
                  {syncActionStatus && (
                    <p className="text-center text-[10px] font-bold text-[var(--color-accent)]">{syncActionStatus}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] block mb-1">
                      Alamat Web / URL Server
                    </label>
                    <input
                      type="text"
                      placeholder="https://kotoba-quiz-gilt.vercel.app"
                      value={customApiBase}
                      onChange={(e) => {
                        const val = e.target.value
                        setCustomApiBase(val)
                        localStorage.setItem('kotoba_api_base', val.trim())
                      }}
                      className="w-full text-xs p-3 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-2xl focus:outline-none focus:border-[var(--color-accent)] dark:text-white dark:bg-zinc-800"
                    />
                    <p className="text-[9px] font-semibold text-[var(--color-text-3)] mt-1">
                      *Masukkan alamat domain web Anda (misal: localhost:3000 untuk pengujian lokal, atau alamat Vercel).
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const targetUrl = customApiBase.trim() || 'https://kotoba-quiz-gilt.vercel.app'
                      const cleanBase = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl
                      window.open(`${cleanBase}/settings`, '_blank')
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold active:scale-95 transition-transform border border-[var(--color-border)] text-[var(--color-text-2)] bg-[var(--color-bg)] hover:bg-[var(--color-subtle)]"
                  >
                    🌐 Buka Pengaturan Web untuk Salin Token
                  </button>

                  <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                    Masukkan token sinkronisasi dari versi web untuk memuat dan menyinkronkan progress kosakata Anda.
                  </p>

                  <div className="space-y-2">
                    <textarea
                      placeholder="Tempel token di sini..."
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      className="w-full text-[11px] font-mono p-3 border border-[var(--color-border)] bg-[var(--color-bg)] rounded-2xl resize-none h-20 focus:outline-none focus:border-[var(--color-accent)] dark:text-white dark:bg-zinc-800"
                    />
                    {connectError && (
                      <p className="text-xs text-red-500 font-bold">{connectError}</p>
                    )}
                    {connectSuccess && (
                      <p className="text-xs text-green-500 font-bold">{connectSuccess}</p>
                    )}
                    <button
                      onClick={async () => {
                        if (!inputToken.trim()) {
                          setConnectError('Token tidak boleh kosong')
                          return
                        }
                        setConnectError('')
                        setConnectSuccess('')
                        setSyncActionStatus('connecting')
                        try {
                          const res = await fetch(getApiUrl('/api/sync/verify-token'), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: inputToken.trim() }),
                          })
                          if (res.ok) {
                            const data = await res.json()
                            localStorage.setItem('kotoba_sync_token', inputToken.trim())
                            localStorage.setItem('kotoba_sync_email', data.email)
                            setSyncEmail(data.email)
                            setConnectSuccess(`Berhasil terhubung ke ${data.email}! Menyinkronkan data...`)
                            
                            // Jalankan sync pertama kali
                            const ok = await pullFromCloud()
                            if (ok) {
                              setConnectSuccess(`Berhasil terhubung ke ${data.email}! Data tersinkronisasi.`)
                            }
                            
                            setTimeout(() => {
                              window.location.reload()
                            }, 1500)
                          } else {
                            const data = await res.json()
                            setConnectError(data.error || 'Token tidak valid')
                          }
                        } catch (e) {
                          console.error(e)
                          setConnectError('Gagal menghubungkan ke server. Periksa koneksi internet Anda.')
                        } finally {
                          setSyncActionStatus('')
                        }
                      }}
                      disabled={syncActionStatus === 'connecting'}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-transform"
                      style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(91,94,244,0.2)' }}
                    >
                      {syncActionStatus === 'connecting' ? '⏳ Menghubungkan...' : '🔗 Hubungkan Akun'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
