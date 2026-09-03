'use client'

import type { SRSStore } from './srs.types'
import type { GameStats } from './stats'
import type { VocabItem } from './vocab.types'

export interface CloudData {
  srs: SRSStore
  stats: GameStats
  vocab?: VocabItem[]
  vocabUpdatedAt?: string
  studyHistory?: Record<string, number>
  failedWords?: string[]
  chapterImages?: Record<string, string>
  updatedAt: string
}
