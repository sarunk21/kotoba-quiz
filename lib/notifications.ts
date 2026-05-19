import { loadStats } from './stats'

export type NotificationType = 'reminder' | 'streak_lost' | 'streak_at_risk'

export function checkNotificationNeeds(): { type: NotificationType; message: string } | null {
  const stats = loadStats()
  if (!stats.lastPlayedDate) return null

  const today = new Date().toISOString().split('T')[0]
  if (stats.lastPlayedDate === today) return null

  const lastPlayed = new Date(stats.lastPlayedDate)
  const todayDate = new Date(today)
  const diffTime = Math.abs(todayDate.getTime() - lastPlayed.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return {
      type: 'streak_at_risk',
      message: '🔥 Streak lu mau padam le! Latihan bentar yuk biar tetep nyala.'
    }
  }

  if (diffDays > 1 && diffDays <= 3) {
    return {
      type: 'streak_lost',
      message: '🕯️ Streak lu udah padam... Tapi tenang, mending mulai lagi sekarang daripada telat!'
    }
  }

  if (diffDays > 3) {
    return {
      type: 'reminder',
      message: '👋 Udah lama gak kelihatan nih. Gaskan latihan lagi biar jago Jepangnya!'
    }
  }

  return null
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function showLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  
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
