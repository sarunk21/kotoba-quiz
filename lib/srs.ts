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
  const dueLevel5: string[] = []
  const futureLevel5: string[] = []
  const dueLevel6: string[] = []
  const futureLevel6: string[] = []

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
    } else if (wp.level < MAX_LEVEL) { // Level 5 (Sudah Hafal but not fully complete/Level 6 yet)
      if (wp.nextReview <= today) {
        dueLevel5.push(id)
      } else {
        futureLevel5.push(id)
      }
    } else { // Level 6 (Fully Mastered)
      if (wp.nextReview <= today) {
        dueLevel6.push(id)
      } else {
        futureLevel6.push(id)
      }
    }
  }

  // Shuffle each bucket
  const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
  const dueBelumHafalSh = shuffle(dueBelumHafal)
  const newSh = shuffle(newWords)
  const futureBelumHafalSh = shuffle(futureBelumHafal)
  const dueLevel5Sh = shuffle(dueLevel5)
  const futureLevel5Sh = shuffle(futureLevel5)
  const dueLevel6Sh = shuffle(dueLevel6)
  const futureLevel6Sh = shuffle(futureLevel6)

  // Combined refresh/filler list: prioritize unmemorized (level 1-4) & level 5, then fully mastered level 6
  const refreshIds = [
    ...futureBelumHafalSh,
    ...futureLevel5Sh,
    ...dueLevel6Sh,
    ...futureLevel6Sh
  ]

  return {
    dueIds: [...dueBelumHafalSh, ...dueLevel5Sh],
    newIds: newSh,
    refreshIds: refreshIds,
  }
}

// Granular level weights for immediate, satisfying visual progress feedback (Level 0-6)
export const LEVEL_WEIGHTS = [0, 0.25, 0.45, 0.65, 0.85, 0.95, 1.0]

/** Calculate chapter progress with granular level weights */
export function calculateChapterProgress(vocabIds: string[], store: SRSStore) {
  if (!vocabIds || vocabIds.length === 0) {
    return { pct: 0, masteredCount: 0, learningCount: 0, newCount: 0, total: 0 }
  }

  let totalWeight = 0
  let masteredCount = 0
  let learningCount = 0
  let newCount = 0

  for (const id of vocabIds) {
    const wp = store[id]
    const lvl = wp ? Math.min(Math.max(wp.level, 0), MAX_LEVEL) : 0
    totalWeight += LEVEL_WEIGHTS[lvl] ?? 0

    if (lvl === 0) {
      newCount++
    } else if (lvl >= MASTERED_LEVEL) {
      masteredCount++
    } else {
      learningCount++
    }
  }

  const pct = Math.round((totalWeight / vocabIds.length) * 100)
  return {
    pct,
    masteredCount,
    learningCount,
    newCount,
    total: vocabIds.length,
  }
}

/** Stats summary for home screen & dashboards */
export function getSRSSummary(vocabIds: string[], store: SRSStore) {
  const today = todayStr()
  let dueCount = 0
  let newCount = 0
  let masteredCount = 0
  let learningCount = 0
  let totalWeight = 0
  let totalCorrect = 0
  let totalWrong = 0

  for (const id of vocabIds) {
    const wp = store[id]
    if (!wp || wp.level === 0) {
      newCount++
    } else {
      const lvl = Math.min(Math.max(wp.level, 0), MAX_LEVEL)
      totalWeight += LEVEL_WEIGHTS[lvl] ?? 0
      totalCorrect += wp.correctCount || 0
      totalWrong += wp.wrongCount || 0

      if (lvl >= MASTERED_LEVEL) {
        masteredCount++
        if (wp.nextReview <= today) dueCount++ // mastered but due for refresh
      } else {
        learningCount++
        if (wp.nextReview <= today) dueCount++
      }
    }
  }

  const pct = vocabIds.length > 0 ? Math.round((totalWeight / vocabIds.length) * 100) : 0
  const totalAnswered = totalCorrect + totalWrong
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  return { dueCount, newCount, masteredCount, learningCount, total: vocabIds.length, pct, accuracyPct }
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
