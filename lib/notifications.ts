import { loadStats } from './stats'
import { getLocalDateString, parseLocalDateString } from './dateUtils'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export type NotificationType = 'reminder' | 'streak_lost' | 'streak_at_risk'

export function checkNotificationNeeds(): { type: NotificationType; message: string } | null {
  const stats = loadStats()
  if (!stats.lastPlayedDate) return null

  const today = getLocalDateString()
  if (stats.lastPlayedDate === today) return null

  const lastPlayed = parseLocalDateString(stats.lastPlayedDate)
  const todayDate = parseLocalDateString(today)
  const diffTime = Math.abs(todayDate.getTime() - lastPlayed.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return {
      type: 'streak_at_risk',
      message: '🔥 Streak kamu hampir padam! Mari berlatih sebentar agar tetap aktif.'
    }
  }

  if (diffDays > 1 && diffDays <= 3) {
    return {
      type: 'streak_lost',
      message: '🕯️ Streak kamu telah padam... Namun jangan khawatir, mari mulai kembali sekarang!'
    }
  }

  if (diffDays > 3) {
    return {
      type: 'reminder',
      message: '👋 Sudah cukup lama tidak berlatih. Mari kembali berlatih agar kemampuan bahasa Jepangmu semakin meningkat!'
    }
  }

  return null
}

export async function checkNotificationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'default'> {
  if (typeof window === 'undefined') return 'denied'

  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions()
      return status.display === 'prompt-with-rationale' ? 'prompt' : status.display
    } catch (e) {
      console.error('Failed to check native notification permissions:', e)
      return 'denied'
    }
  }

  if (!('Notification' in window)) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.requestPermissions()
      if (perm.display === 'granted') {
        // Auto-schedule daily reminder when granted
        await scheduleDailyReminder()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to request native notification permission:', e)
      return false
    }
  }

  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function showLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined') return

  if (Capacitor.isNativePlatform()) {
    try {
      // Use a fixed ID (2) to prevent duplicate notifications from stacking up
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: 2,
            extra: { tag: 'kotoba-reminder' }
          }
        ]
      })
    } catch (e) {
      console.error('Failed to show native local notification:', e)
    }
    return
  }

  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    // Try via service worker for better PWA support
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: 'kotoba-reminder'
      } as any)
    } else {
      new Notification(title, { body })
    }
  }
}

export async function scheduleDailyReminder(hour: number = 20, minute: number = 0) {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) return

  try {
    // Cancel existing reminder first to prevent duplication
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })

    // Schedule daily repeating reminder
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: '言葉カード — Kotoba Quiz',
          body: '🔥 Streak kamu hampir padam! Yuk luangkan waktu 2 menit untuk berlatih hari ini.',
          schedule: {
            on: {
              hour,
              minute
            },
            repeats: true
          }
        }
      ]
    })
    console.log(`Daily native reminder scheduled at ${hour}:${minute} successfully.`)
  } catch (e) {
    console.error('Failed to schedule native reminder:', e)
  }
}

export async function cancelDailyReminder() {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) return

  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] })
    console.log('Daily native reminder cancelled successfully.')
  } catch (e) {
    console.error('Failed to cancel native reminder:', e)
  }
}

