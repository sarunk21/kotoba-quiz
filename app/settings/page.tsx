'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { loadStats, touchStats } from '@/lib/stats'
import { loadSRS } from '@/lib/srs'
import { syncToCloud, pushToCloud, resetCloudData, pullFromCloud, forcePushToCloud, importFromDrive } from '@/lib/cloud'
import { parseCSVToVocab, loadLocalVocab, saveLocalVocab } from '@/lib/vocab'
import { fetchStories } from '@/lib/stories'
import { getGroqApiKey, saveGroqApiKey, generateStoryForChapter } from '@/lib/gemini'
import { startBackgroundGenerate, isGenerating, subscribeProgress } from '@/lib/backgroundGenerate'
import { type ChapterStory } from '@/lib/stories'
import BottomNav from '@/components/BottomNav'
import { 
  checkNotificationPermission, 
  requestNotificationPermission, 
  scheduleDailyReminder, 
  cancelDailyReminder 
} from '@/lib/notifications'

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  // Sheets state vars
  const [sheetsUrl, setSheetsUrl] = useState<string>('')
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('')
  const [loadingSync, setLoadingSync] = useState<boolean>(false)
  
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true)
  const [reminderTime, setReminderTime] = useState<string>('20:00')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [syncMode, setSyncMode] = useState<'auto' | 'manual'>('auto')
  const [syncActionStatus, setSyncActionStatus] = useState<string>('')
  const [geminiKey, setGeminiKey] = useState<string>('')
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [geminiStatus, setGeminiStatus] = useState<string>('')
  const [generatingStories, setGeneratingStories] = useState(isGenerating())

  // Sync Sheets manually
  async function handleSyncSheets() {
    if (!sheetsUrl) return
    setLoadingSync(true)
    setSyncStatusMsg('Menyinkronkan Sheet...')
    try {
      const t = Date.now()
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetsUrl.trim())}&t=${t}`)
      if (!res.ok) {
        throw new Error(`Error status: ${res.status}`)
      }
      const csvText = await res.text()
      const parsed = parseCSVToVocab(csvText)
      if (parsed.length === 0) {
        alert('Gagal mengambil data: Format Google Sheets salah.')
        setSyncStatusMsg('Format Salah ✗')
        setTimeout(() => setSyncStatusMsg(''), 3000)
        return
      }

      const localVocab = loadLocalVocab()
      const existingIds = new Set(localVocab.map(v => v.id))
      const newItems = parsed.filter(item => !existingIds.has(item.id))

      // Update chapter info for existing items if they changed in the sheet
      let hasChanges = false
      const updatedLocalVocab = localVocab.map(localItem => {
        const parsedItem = parsed.find(p => p.id === localItem.id)
        if (parsedItem && parsedItem.chapter !== localItem.chapter) {
          hasChanges = true
          return { ...localItem, chapter: parsedItem.chapter }
        }
        return localItem
      })

      if (newItems.length === 0 && !hasChanges) {
        setSyncStatusMsg('Sheet Sudah Sinkron ✓')
        setTimeout(() => setSyncStatusMsg(''), 3000)
        return
      }

      // ponytail: fetch stories
      try {
        const storiesList = await fetchStories(sheetsUrl)
        if (storiesList.length > 0) {
          localStorage.setItem('kotoba_stories', JSON.stringify(storiesList))
        }
      } catch (se) {
        console.error('[Stories Sync Error]', se)
      }

      const updatedList = [...newItems, ...updatedLocalVocab]
      saveLocalVocab(updatedList)
      localStorage.setItem('kotoba_vocab_updated_at', new Date().toISOString())

      // Sync to Firebase Cloud if logged in
      if (session?.user?.email) {
        setSyncStatusMsg('Menyinkronkan ke Cloud...')
        const ok = await syncToCloud()
        if (ok) {
          setSyncStatusMsg('Tersinkronisasi ke Cloud ✓')
        } else {
          setSyncStatusMsg('Gagal Sinkronisasi Cloud ✗')
        }
      } else {
        const msg = newItems.length > 0 
          ? `Berhasil Impor ${newItems.length} Kata Baru ✓` 
          : 'Bab Kosakata Terupdate ✓'
        setSyncStatusMsg(msg)
      }
      setTimeout(() => setSyncStatusMsg(''), 3000)
    } catch (e: any) {
      console.error(e)
      setSyncStatusMsg('Gagal Sinkron Sheet ✗')
      setTimeout(() => setSyncStatusMsg(''), 3000)
    } finally {
      setLoadingSync(false)
    }
  }

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

    const DEFAULT_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9UYAD3iOYHLFUeMh-uHUi9cbk6ejo7oUcrKEMtNgg2AZL37fSxvNOxjItQtunRb3DyjsKTct8hfvW/pub?gid=1283721307&single=true&output=csv'
    const savedUrl = localStorage.getItem('kotoba_sheets_url') || DEFAULT_SHEETS_URL
    setSheetsUrl(savedUrl)

    async function initNotifications() {
      const status = await checkNotificationPermission()
      if (status === 'default' || status === 'prompt') {
        setNotifStatus('idle')
      } else {
        setNotifStatus(status)
      }
      const enabled = localStorage.getItem('kotoba_reminder_enabled') !== 'false'
      setReminderEnabled(enabled)
      const time = localStorage.getItem('kotoba_reminder_time') || '20:00'
      setReminderTime(time)
    }
    initNotifications()

    // Load Groq API key
    setGeminiKey(getGroqApiKey())
    setGeneratingStories(isGenerating())

    // Sync generating state from background module
    const unsub = subscribeProgress(p => setGeneratingStories(p.isRunning))
    return unsub
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

  async function handleToggleReminder() {
    const status = await checkNotificationPermission()
    const savedTime = localStorage.getItem('kotoba_reminder_time') || '20:00'
    const [h, m] = savedTime.split(':').map(Number)
    
    if (status !== 'granted') {
      const granted = await requestNotificationPermission()
      if (granted) {
        setNotifStatus('granted')
        setReminderEnabled(true)
        localStorage.setItem('kotoba_reminder_enabled', 'true')
        await scheduleDailyReminder(h, m)
      } else {
        setNotifStatus('denied')
        alert('Izin notifikasi ditolak. Harap izinkan notifikasi untuk Kotoba Quiz di pengaturan sistem perangkat Anda.')
      }
      return
    }

    const nextState = !reminderEnabled
    setReminderEnabled(nextState)
    localStorage.setItem('kotoba_reminder_enabled', String(nextState))
    
    if (nextState) {
      await scheduleDailyReminder(h, m)
    } else {
      await cancelDailyReminder()
    }
  }

  async function handleTimeChange(newTime: string) {
    setReminderTime(newTime)
    localStorage.setItem('kotoba_reminder_time', newTime)
    
    if (notifStatus === 'granted' && reminderEnabled) {
      const [h, m] = newTime.split(':').map(Number)
      await scheduleDailyReminder(h, m)
    }
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

  function handleSaveGeminiKey() {
    saveGroqApiKey(geminiKey)
    setGeminiStatus('API Key tersimpan ✓')
    setTimeout(() => setGeminiStatus(''), 2500)
  }

  async function handleGenerateAllStories() {
    const key = geminiKey.trim()
    if (!key) {
      setGeminiStatus('Isi API Key Groq dulu!')
      setTimeout(() => setGeminiStatus(''), 3000)
      return
    }
    saveGroqApiKey(key)

    const vocab = loadLocalVocab()
    if (vocab.length === 0) {
      setGeminiStatus('Belum ada vocab — sync Google Sheets dulu.')
      setTimeout(() => setGeminiStatus(''), 3000)
      return
    }

    // Build chapters map
    const chaptersMap = new Map<string, { kanji: string; hiragana: string; arti: string }[]>()
    for (const v of vocab) {
      const ch = v.chapter || 'Tanpa Bab'
      if (!chaptersMap.has(ch)) chaptersMap.set(ch, [])
      chaptersMap.get(ch)!.push({ kanji: v.kanji, hiragana: v.hiragana, arti: v.arti })
    }

    // Skip chapters that already have stories
    let existingStories: ChapterStory[] = []
    try {
      const stored = localStorage.getItem('kotoba_stories')
      if (stored) existingStories = JSON.parse(stored)
    } catch { /* ignore */ }
    const alreadyHas = new Set(existingStories.map(s => s.chapter))

    // Fire and forget — user can navigate away
    startBackgroundGenerate(chaptersMap, alreadyHas)
    setGeminiStatus('Generate dimulai! Bisa pindah halaman, cerita tetap diproses.')
    setTimeout(() => setGeminiStatus(''), 4000)
  }

  if (status === 'loading') return null

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm md:max-w-2xl mx-auto px-4 pt-12 pb-28">
        
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

          {/* Sync Section di-hide karena sinkronisasi berjalan otomatis di latar belakang. Hapus komentar untuk memunculkannya kembali. */}
          {/*
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
              
              <button onClick={handleImportGoogleDrive} disabled={!!syncActionStatus}
                className="w-full rounded-2xl py-3 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)', border: '1.5px solid var(--color-border)' }}>
                <span>📁</span> {syncActionStatus === 'importing_drive' ? '⏳ Mengimpor dari Drive...' : 'Migrasi Backup dari Google Drive (Legacy)'}
              </button>

              {syncActionStatus && !['pulling', 'pushing', 'importing_drive'].includes(syncActionStatus) && (
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
          */}

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

          {/* Google Sheets Sync Section */}
          <div className="rounded-3xl p-6 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-3)' }}>Google Sheets</p>
            
            {sheetsUrl ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                  Tarik paksa pembaruan kosakata atau bab baru langsung dari spreadsheet Google Sheets kamu yang terhubung.
                </p>
                <button 
                  onClick={handleSyncSheets}
                  disabled={loadingSync}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-transform"
                  style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(91,94,244,0.2)' }}
                >
                  {loadingSync ? '⏳ Menyinkronkan...' : '🔄 Sinkron Google Sheets'}
                </button>
                {syncStatusMsg && (
                  <p className="text-center text-xs font-bold animate-pulse" style={{ color: 'var(--color-accent)' }}>
                    {syncStatusMsg}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                  Hubungkan Google Sheets kamu untuk mempermudah impor kosakata dan manajemen bab secara massal.
                </p>
                <Link href="/vocab" className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold no-underline active:scale-95 transition-transform border border-[var(--color-border)]"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text-2)' }}>
                  🔗 Hubungkan Google Sheets
                </Link>
              </div>
            )}
          </div>

          {/* AI Content Generation Section */}
          <div className="rounded-3xl p-6 anim-up d2" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-3)' }}>Konten AI ✨</p>
            <p className="text-xs font-semibold leading-relaxed mb-4" style={{ color: 'var(--color-text-2)' }}>
              Generate cerita naratif per bab pakai Groq AI (gratis, tanpa kartu kredit). Daftar di <span className="text-[var(--color-accent)] font-bold">console.groq.com</span> → API Keys.
            </p>

            {/* API Key input */}
            <div className="flex gap-2 mb-3">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                placeholder="gsk_..."
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="flex-1 rounded-2xl px-4 py-2.5 text-xs font-semibold border border-[var(--color-border)] outline-none bg-[var(--color-bg)] focus:border-[var(--color-accent)] transition-colors"
                style={{ color: 'var(--color-text-1)' }}
              />
              <button
                onClick={() => setShowGeminiKey(s => !s)}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] text-sm active:scale-90 transition-all cursor-pointer"
              >
                {showGeminiKey ? '🙈' : '👁️'}
              </button>
              <button
                onClick={handleSaveGeminiKey}
                className="rounded-2xl px-4 py-2.5 text-xs font-extrabold active:scale-95 transition-all cursor-pointer"
                style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
              >
                Simpan
              </button>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerateAllStories}
              disabled={generatingStories || !geminiKey.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(91,94,244,0.2)' }}
            >
              {generatingStories ? '⏳ Generating...' : '✨ Generate Cerita Semua Bab'}
            </button>

            {geminiStatus && (
              <p className="text-center text-[10px] font-bold mt-3 animate-pulse" style={{ color: generatingStories ? 'var(--color-accent)' : geminiStatus.includes('✓') ? 'var(--color-green)' : 'var(--color-amber)' }}>
                {geminiStatus}
              </p>
            )}

            <p className="text-[10px] text-center mt-3 font-semibold" style={{ color: 'var(--color-text-3)' }}>
              Cerita tersimpan lokal. API key hanya dikirim ke api.groq.com, tidak ke server lain.
            </p>
          </div>
          <div className="rounded-3xl p-6 anim-up d3" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-3)' }}>Notifikasi</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ 
                    background: (notifStatus === 'granted' && reminderEnabled) ? 'var(--color-green-light)' : 'var(--color-amber-light)' 
                  }}>
                  <span className="text-lg">🔔</span>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text-1)' }}>Pengingat Harian</p>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-3)' }}>
                    {notifStatus === 'denied' ? 'Izin ditolak (aktifkan di sistem)' :
                     (notifStatus === 'granted' && reminderEnabled) ? `Aktif (Setiap jam ${reminderTime})` :
                     (notifStatus === 'granted' && !reminderEnabled) ? 'Dinonaktifkan sementara' :
                     'Agar tidak lupa berlatih'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleToggleReminder} 
                className="rounded-xl px-4 py-2 text-sm font-bold active:scale-95 transition-all"
                style={{ 
                  background: (notifStatus === 'granted' && reminderEnabled) ? 'var(--color-red-light)' : 'var(--color-accent-light)', 
                  color: (notifStatus === 'granted' && reminderEnabled) ? 'var(--color-red)' : 'var(--color-accent)' 
                }}
              >
                {notifStatus === 'idle' ? 'Aktifkan' : 
                 notifStatus === 'denied' ? 'Buka Izin' :
                 reminderEnabled ? 'Matikan' : 'Aktifkan'}
              </button>
            </div>
            
            {notifStatus === 'granted' && reminderEnabled && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between anim-up">
                <p className="text-xs font-bold" style={{ color: 'var(--color-text-2)' }}>Waktu Pengingat</p>
                <input 
                  type="time" 
                  value={reminderTime} 
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-sm font-bold border border-[var(--color-border)] outline-none bg-[var(--color-bg)] transition-all focus:border-[var(--color-accent)]"
                  style={{ color: 'var(--color-text-1)' }}
                />
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="rounded-3xl p-6 anim-up d4" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
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
