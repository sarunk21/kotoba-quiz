'use client'

import { saveSRS, type SRSStore } from './srs'
import { updateAfterSession } from './stats'
import { pushToCloud } from './cloud'
import { rescheduleDailyReminderIfNeeded } from './notifications'

/**
 * Single place to persist everything after a quiz session ends.
 * Replaces the copy-pasted block that lived in every quiz page.
 */
export async function finishSession(store: SRSStore, correct: number, total: number) {
  saveSRS(store)
  if (total > 0) {
    updateAfterSession(correct, total)
    rescheduleDailyReminderIfNeeded()
  }

  const isAuto = typeof window !== 'undefined' && localStorage.getItem('kotoba_sync_mode') !== 'manual'
  if (isAuto) {
    try {
      await pushToCloud()
    } catch (e) {
      console.error('[finishSession] cloud sync failed', e)
    }
  }
}

/** Lives system can be turned off in Settings for relaxed learning mode. */
export function loadLivesEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('kotoba_lives_enabled') !== 'false'
}
