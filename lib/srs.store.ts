'use client'

import { getLocalDateString, addLocalDateDays } from './dateUtils'
import type { SRSStore, WordProgress } from './srs.types'
import { MAX_LEVEL, SRS_INTERVALS } from './srs.types'

function todayStr() { return getLocalDateString() }
function addDays(days: number) { return addLocalDateDays(days) }

let cachedSRSStore: SRSStore | null = null

export function loadSRS(): SRSStore {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem('kotoba_srs')
  if (!raw) {
    cachedSRSStore = null
    return {}
  }
  if (cachedSRSStore) return cachedSRSStore
  try {
    cachedSRSStore = JSON.parse(raw) as SRSStore
    return cachedSRSStore
  } catch {
    return {}
  }
}

export function saveSRS(store: SRSStore) {
  cachedSRSStore = store
  if (typeof window === 'undefined') return
  localStorage.setItem('kotoba_srs', JSON.stringify(store))
}

export function getWordProgress(store: SRSStore, id: string): WordProgress {
  return store[id] ?? {
    id,
    level: 0,
    nextReview: todayStr(),
    correctCount: 0,
    wrongCount: 0,
    lastSeen: '',
  }
}

export function onCorrect(store: SRSStore, id: string): SRSStore {
  const wp = getWordProgress(store, id)
  const newLevel = Math.min(wp.level + 1, MAX_LEVEL)
  const interval = SRS_INTERVALS[newLevel] ?? 90
  return {
    ...store,
    [id]: {
      ...wp,
      level: newLevel,
      nextReview: addDays(interval),
      correctCount: wp.correctCount + 1,
      lastSeen: todayStr(),
    },
  }
}

export function onWrong(store: SRSStore, id: string): SRSStore {
  const wp = getWordProgress(store, id)
  const newLevel = Math.max(wp.level - 1, 0)
  return {
    ...store,
    [id]: {
      ...wp,
      level: newLevel,
      nextReview: todayStr(),
      wrongCount: wp.wrongCount + 1,
      lastSeen: todayStr(),
    },
  }
}
