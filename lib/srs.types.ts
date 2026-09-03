'use client'

export const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 90]
export const MAX_LEVEL = 6
export const MASTERED_LEVEL = 5
export const LEVEL_WEIGHTS = [0, 0.25, 0.45, 0.65, 0.85, 0.95, 1.0]

export interface WordProgress {
  id: string
  level: number
  nextReview: string
  correctCount: number
  wrongCount: number
  lastSeen: string
}

export interface SRSStore {
  [vocabId: string]: WordProgress
}
