'use client'

import type { SRSStore } from './srs.types'
import type { GameStats } from './stats'
import type { CloudData } from './cloud.types'

export function mergeCloudData(local: CloudData, cloud: CloudData): CloudData {
  const cloudSRS = cloud.srs || {}
  const cloudStats = cloud.stats || { updatedAt: '' } as GameStats
  
  const mergedSRS: SRSStore = { ...local.srs }
  for (const [id, wp] of Object.entries(cloudSRS)) {
    const localWp = local.srs[id]
    if (!localWp || wp.level > localWp.level || (wp.level === localWp.level && wp.lastSeen > (localWp.lastSeen || ''))) {
      mergedSRS[id] = wp
    }
  }

  let cloudIsNewer = (cloudStats.updatedAt || '') > (local.stats.updatedAt || '')
  if (local.stats.lastPlayedDate && !cloudStats.lastPlayedDate) {
    cloudIsNewer = false
  } else if (!local.stats.lastPlayedDate && cloudStats.lastPlayedDate) {
    cloudIsNewer = true
  }
  
  const mergedStats: GameStats = {
    totalSessions: Math.max(local.stats.totalSessions || 0, cloudStats.totalSessions || 0),
    totalCorrect: Math.max(local.stats.totalCorrect || 0, cloudStats.totalCorrect || 0),
    totalAnswered: Math.max(local.stats.totalAnswered || 0, cloudStats.totalAnswered || 0),
    currentStreak: cloudIsNewer ? (cloudStats.currentStreak || 0) : (local.stats.currentStreak || 0),
    longestStreak: Math.max(local.stats.longestStreak || 0, cloudStats.longestStreak || 0),
    lastPlayedDate: cloudIsNewer ? (cloudStats.lastPlayedDate || '') : (local.stats.lastPlayedDate || ''),
    updatedAt: cloudIsNewer ? (cloudStats.updatedAt || '') : (local.stats.updatedAt || ''),
  }

  const cloudVocabIsNewer = (cloud.vocabUpdatedAt || '') > (local.vocabUpdatedAt || '')
  const mergedVocab = cloudVocabIsNewer ? (cloud.vocab ?? local.vocab) : (local.vocab ?? cloud.vocab)
  const mergedVocabUpdatedAt = cloudVocabIsNewer ? (cloud.vocabUpdatedAt || '') : (local.vocabUpdatedAt || '')

  const mergedHistory: Record<string, number> = { ...(local.studyHistory || {}) }
  const cloudHistory = cloud.studyHistory || {}
  for (const [date, count] of Object.entries(cloudHistory)) {
    mergedHistory[date] = Math.max(mergedHistory[date] || 0, count)
  }

  const localFailed = local.failedWords || []
  const cloudFailed = cloud.failedWords || []
  const mergedFailed = Array.from(new Set([...localFailed, ...cloudFailed]))

  const mergedChapterImages = { ...(local.chapterImages || {}), ...(cloud.chapterImages || {}) }

  return {
    srs: mergedSRS,
    stats: mergedStats,
    vocab: mergedVocab || undefined,
    vocabUpdatedAt: mergedVocabUpdatedAt,
    studyHistory: mergedHistory,
    failedWords: mergedFailed,
    chapterImages: mergedChapterImages,
    updatedAt: cloudIsNewer ? (cloud.updatedAt || '') : (local.updatedAt || ''),
  }
}
