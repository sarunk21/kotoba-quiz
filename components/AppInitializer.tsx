'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AppInitializer() {
 const router = useRouter()
 const pathname = usePathname()

 // Keep a mutable reference to the latest pathname
 const pathnameRef = useRef(pathname)
 pathnameRef.current = pathname

 useEffect(() => {
 let active = true

 async function initCapacitor() {
 try {
 const { Capacitor } = await import('@capacitor/core')
 if (!Capacitor.isNativePlatform()) return

 const { App } = await import('@capacitor/app')

 // Clean up listeners for App before registering our single stable listener
 await App.removeAllListeners()

 await App.addListener('backButton', () => {
 if (!active) return

 const currentPath = pathnameRef.current
 if (currentPath === '/') {
 if (window.history.state?.modal === 'practice') {
 window.history.back()
 } else {
 App.exitApp()
 }
 } else {
 // For other subpages, navigate back in the browser history stack
 window.history.back()
 }
 })

 // Reschedule daily reminder on start
 import('@/lib/notifications').then(({ rescheduleDailyReminderIfNeeded }) => {
 rescheduleDailyReminderIfNeeded()
 }).catch(err => {
 console.error('Failed to load notifications module in AppInitializer start:', err)
 })

 // Listen for app coming to foreground (resume) to update reminder
 await App.addListener('appStateChange', ({ isActive }) => {
 if (!active) return
 if (isActive) {
 import('@/lib/notifications').then(({ rescheduleDailyReminderIfNeeded }) => {
 rescheduleDailyReminderIfNeeded()
 }).catch(err => {
 console.error('Failed to load notifications module in AppInitializer appStateChange:', err)
 })
 }
 })
 } catch (e) {
 console.error('[Capacitor App Listener Error]', e)
 }
 }

  initCapacitor()

  return () => {
  active = false
  }
  }, []) // Empty dependency array: runs only once on mount!

  // Auto-clear legacy Sheets/AI keys (Hapus Total) — Firebase + lokal only
  useEffect(() => {
  try {
  ;['kotoba_sheets_url','kotoba_sheets_sync_timestamp','kotoba_stories','kotoba_groq_key','kotoba_gemini_key'].forEach(k => localStorage.removeItem(k))
  } catch {}
  }, [])

  return null
}

