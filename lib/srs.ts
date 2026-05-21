'use client'

import { getLocalDateString, addLocalDateDays } from './dateUtils'

// SRS intervals in days per level
// Level: 0=new, 1=1d, 2=3d, 3=7d, 4=14d, 5=30d, 6=90d (mastered but refreshed)
export const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 90]
export const MAX_LEVEL = 6
export const MASTERED_LEVEL = 5 // level 5+ = "mastered"

export interface WordProgress {
  id: string          // vocab item id
  level: number       // 0–6
  nextReview: string  // ISO date string
  correctCount: number
  wrongCount: number
  lastSeen: string    // ISO date string
}

export interface SRSStore {
  [vocabId: string]: WordProgress
}

function todayStr() {
  return getLocalDateString()
}

function addDays(days: number): string {
  return addLocalDateDays(days)
}

export function loadSRS(): SRSStore {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('kotoba_srs') || '{}')
  } catch {
    return {}
  }
}

export function saveSRS(store: SRSStore) {
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

/** Call after a correct answer */
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

/** Call after a wrong answer */
export function onWrong(store: SRSStore, id: string): SRSStore {
  const wp = getWordProgress(store, id)
  const newLevel = Math.max(wp.level - 1, 0)
  return {
    ...store,
    [id]: {
      ...wp,
      level: newLevel,
      nextReview: todayStr(), // show again today
      wrongCount: wp.wrongCount + 1,
      lastSeen: todayStr(),
    },
  }
}

/** 
 * Build a smart quiz queue from vocab list.
 * Priority: 
 * 1. Due today & Belum Hafal (level 1-4)
 * 2. New words (level 0)
 * 3. Future / review Belum Hafal (level 1-4, not due yet but unmemorized)
 * 4. Due today & Sudah Hafal (level 5-6)
 * 5. Future / review Sudah Hafal (level 5-6)
 */
export function buildQueue(
  vocabIds: string[],
  store: SRSStore,
  maxCards = 10
): { dueIds: string[]; newIds: string[]; refreshIds: string[] } {
  const today = todayStr()

  const dueBelumHafal: string[] = []
  const newWords: string[] = []
  const futureBelumHafal: string[] = []
  const dueSudahHafal: string[] = []
  const futureSudahHafal: string[] = []

  for (const id of vocabIds) {
    const wp = store[id]
    if (!wp || wp.level === 0) {
      newWords.push(id)
    } else if (wp.level < MASTERED_LEVEL) {
      if (wp.nextReview <= today) {
        dueBelumHafal.push(id)
      } else {
        futureBelumHafal.push(id)
      }
    } else {
      if (wp.nextReview <= today) {
        dueSudahHafal.push(id)
      } else {
        futureSudahHafal.push(id)
      }
    }
  }

  // Shuffle each bucket
  const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
  const dueBelumHafalSh = shuffle(dueBelumHafal)
  const newSh = shuffle(newWords)
  const futureBelumHafalSh = shuffle(futureBelumHafal)
  const dueSudahHafalSh = shuffle(dueSudahHafal)
  const futureSudahHafalSh = shuffle(futureSudahHafal)

  // Combined refresh/filler list: prioritizing unmemorized, then mastered
  const refreshIds = [...futureBelumHafalSh, ...dueSudahHafalSh, ...futureSudahHafalSh]

  return {
    dueIds: dueBelumHafalSh,
    newIds: newSh,
    refreshIds: refreshIds,
  }
}

/** Stats summary for home screen */
export function getSRSSummary(vocabIds: string[], store: SRSStore) {
  const today = todayStr()
  let dueCount = 0
  let newCount = 0
  let masteredCount = 0
  let learningCount = 0
  let totalLevelsAchieved = 0

  for (const id of vocabIds) {
    const wp = store[id]
    if (!wp || wp.level === 0) {
      newCount++
    } else {
      totalLevelsAchieved += Math.min(wp.level, MAX_LEVEL)
      if (wp.level >= MASTERED_LEVEL) {
        masteredCount++
        if (wp.nextReview <= today) dueCount++ // mastered but due for refresh
      } else {
        learningCount++
        if (wp.nextReview <= today) dueCount++
      }
    }
  }

  const maxPossibleLevels = vocabIds.length * MAX_LEVEL
  const pct = maxPossibleLevels > 0 ? Math.round((totalLevelsAchieved / maxPossibleLevels) * 100) : 0

  return { dueCount, newCount, masteredCount, learningCount, total: vocabIds.length, pct }
}

/** Stats summary for all kana */
export function getKanaSummary(kanaCards: { id: string }[], store: SRSStore) {
  const ids: string[] = []
  for (const c of kanaCards) {
    ids.push(`kana_hiragana_${c.id}`)
    ids.push(`kana_katakana_${c.id}`)
  }
  return getSRSSummary(ids, store)
}
