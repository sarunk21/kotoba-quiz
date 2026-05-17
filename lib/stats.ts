'use client'

export interface GameStats {
  totalXP: number
  currentStreak: number
  longestStreak: number
  lastPlayedDate: string // YYYY-MM-DD
  totalSessions: number
  totalCorrect: number
  totalAnswered: number
  updatedAt: string      // ISO string for sync
}

const DEFAULT_STATS: GameStats = {
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  totalSessions: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  updatedAt: '',
}

export function loadStats(): GameStats {
  if (typeof window === 'undefined') return DEFAULT_STATS
  try {
    const raw = localStorage.getItem('kotoba_stats')
    if (!raw) return DEFAULT_STATS
    return { ...DEFAULT_STATS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STATS
  }
}

export function saveStats(stats: GameStats) {
  if (typeof window === 'undefined') return
  localStorage.setItem('kotoba_stats', JSON.stringify(stats))
}

export function updateAfterSession(correct: number, total: number, xpGained: number): GameStats {
  const stats = loadStats()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  let newDayStreak = stats.currentStreak
  if (stats.lastPlayedDate !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (stats.lastPlayedDate === yesterdayStr) {
      newDayStreak = stats.currentStreak + 1
    } else {
      newDayStreak = 1
    }
  }

  const updated: GameStats = {
    totalXP: stats.totalXP + xpGained,
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
