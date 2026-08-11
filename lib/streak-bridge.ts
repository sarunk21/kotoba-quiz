import { Capacitor, registerPlugin } from '@capacitor/core'
import { getLocalDateString } from './dateUtils'
import type { GameStats } from './stats'

export interface StreakWidgetPluginInterface {
  updateStreak(options: {
    currentStreak: number
    lastPlayedDate: string
    isTodayDone: boolean
    longestStreak: number
  }): Promise<{ success: boolean }>
}

const StreakWidgetPlugin = registerPlugin<StreakWidgetPluginInterface>('StreakWidgetPlugin')

/**
 * Synchronize current streak state to Native Android Home Screen Widget (if in Capacitor)
 * and trigger local event for in-app UI widgets.
 */
export async function syncStreakToNative(stats: GameStats) {
  if (typeof window === 'undefined') return

  const today = getLocalDateString()
  const isTodayDone = stats.lastPlayedDate === today

  // Dispatch browser custom event for instant in-app reactivity
  try {
    window.dispatchEvent(
      new CustomEvent('kotoba_streak_updated', {
        detail: {
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          lastPlayedDate: stats.lastPlayedDate,
          isTodayDone,
        },
      })
    )
  } catch (e) {
    console.error('[StreakBridge] Error dispatching custom event:', e)
  }

  // If running in Capacitor Native (Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      await StreakWidgetPlugin.updateStreak({
        currentStreak: stats.currentStreak,
        lastPlayedDate: stats.lastPlayedDate,
        isTodayDone,
        longestStreak: stats.longestStreak,
      })
    } catch (err) {
      // Plugin might not be registered if not on Android, safe fallback
      console.log('[StreakBridge] Native widget update skipped/failed:', err)
    }
  }
}
