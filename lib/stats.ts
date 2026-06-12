'use client'

import { getLocalDateString } from './dateUtils'

export interface GameStats {
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string // YYYY-MM-DD
  totalSessions: number
  totalCorrect: number
  totalAnswered: number
  updatedAt: string      // ISO string for sync
}

const DEFAULT_STATS: GameStats = {
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  totalSessions: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  updatedAt: '',
}

/** Check if streak should be reset (if more than 1 day has passed since last played) */
export function checkAndResetStreak(stats: GameStats): GameStats {
  if (!stats.lastPlayedDate) return stats
  
  const today = getLocalDateString()
  if (stats.lastPlayedDate === today) return stats

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getLocalDateString(yesterday)

  // Jika hari terakhir main bukan hari ini DAN bukan kemarin, berarti streak putus
  if (stats.lastPlayedDate !== yesterdayStr) {
    const updated = {
      ...stats,
      currentStreak: 0
      // Keep original stats.updatedAt to prevent passive resets from overriding newer cloud sync states
    }
    saveStats(updated)
    return updated
  }

  return stats
}

export function loadStats(): GameStats {
  if (typeof window === 'undefined') return DEFAULT_STATS
  try {
    const raw = localStorage.getItem('kotoba_stats')
    if (!raw) return DEFAULT_STATS
    const parsed = { ...DEFAULT_STATS, ...JSON.parse(raw) }
    return checkAndResetStreak(parsed)
  } catch {
    return DEFAULT_STATS
  }
}

export function saveStats(stats: GameStats) {
  if (typeof window === 'undefined') return
  localStorage.setItem('kotoba_stats', JSON.stringify(stats))
}

export function recordStudyHistory(questionsCount: number) {
  if (typeof window === 'undefined') return
  try {
    const today = getLocalDateString()
    const saved = localStorage.getItem('kotoba_study_history')
    const history: Record<string, number> = saved ? JSON.parse(saved) : {}
    history[today] = (history[today] || 0) + questionsCount
    localStorage.setItem('kotoba_study_history', JSON.stringify(history))
  } catch (e) {
    console.error(e)
  }
}

export function updateAfterSession(correct: number, total: number): GameStats {
  const stats = loadStats()
  const today = getLocalDateString() // YYYY-MM-DD
  
  // Record history count
  recordStudyHistory(total)

  let newDayStreak = stats.currentStreak
  if (stats.lastPlayedDate !== today) {
    // Kita udah tau dari loadStats() kalau masuk sini berarti lastPlayedDate adalah yesterdayStr
    // atau emang baru main pertama kali
    newDayStreak = stats.currentStreak + 1
  }

  const updated: GameStats = {
    currentStreak: newDayStreak,
    longestStreak: Math.max(stats.longestStreak, newDayStreak),
    lastPlayedDate: today,
    totalSessions: stats.totalSessions + 1,
    totalCorrect: stats.totalCorrect + correct,
    totalAnswered: stats.totalAnswered + total,
    updatedAt: new Date().toISOString(),
  }
  saveStats(updated)
  return updated
}

/** Update updatedAt timestamp only (for settings changes) */
export function touchStats(): GameStats {
  const stats = loadStats()
  const updated: GameStats = {
    ...stats,
    updatedAt: new Date().toISOString(),
  }
  saveStats(updated)
  return updated
}
