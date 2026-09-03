'use client'

import { getLocalDateString } from './dateUtils'
import type { SRSStore } from './srs.types'
import { LEVEL_WEIGHTS, MASTERED_LEVEL, MAX_LEVEL } from './srs.types'

function todayStr() { return getLocalDateString() }

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
        if (wp.nextReview <= today) dueCount++
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

export function getKanaSummary(kanaCards: { id: string }[], store: SRSStore) {
  const ids: string[] = []
  for (const c of kanaCards) {
    ids.push(`kana_hiragana_${c.id}`)
    ids.push(`kana_katakana_${c.id}`)
  }
  return getSRSSummary(ids, store)
}
