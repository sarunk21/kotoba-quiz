'use client'

import { loadSRS, saveSRS } from './srs.store'
import { loadStats, saveStats } from './stats'
import { loadLocalVocab, saveLocalVocab } from './vocab-store'
import type { CloudData } from './cloud.types'
import { mergeCloudData } from './cloud-merge'

function collectLocalData(): CloudData {
  const stats = loadStats()
  let studyHistory: Record<string, number> = {}
  let failedWords: string[] = []
  if (typeof window !== 'undefined') {
    try {
      const sh = localStorage.getItem('kotoba_study_history')
      if (sh) studyHistory = JSON.parse(sh)
      const fw = localStorage.getItem('kotoba_failed_words')
      if (fw) failedWords = JSON.parse(fw)
    } catch {}
  }
  return {
    srs: loadSRS(),
    stats,
    vocab: loadLocalVocab(),
    vocabUpdatedAt: typeof window !== 'undefined' ? localStorage.getItem('kotoba_vocab_updated_at') || '' : '',
    studyHistory,
    failedWords,
    updatedAt: stats.updatedAt || '',
  }
}

function saveMergedLocal(finalData: CloudData) {
  saveSRS(finalData.srs)
  saveStats(finalData.stats)
  if (finalData.vocab) saveLocalVocab(finalData.vocab)
  if (finalData.vocabUpdatedAt) localStorage.setItem('kotoba_vocab_updated_at', finalData.vocabUpdatedAt)
  if (finalData.studyHistory) localStorage.setItem('kotoba_study_history', JSON.stringify(finalData.studyHistory))
  if (finalData.failedWords) localStorage.setItem('kotoba_failed_words', JSON.stringify(finalData.failedWords))
}

export async function syncToCloud(): Promise<boolean> {
  try {
    const localData = collectLocalData()
    const t = Date.now()
    const res = await fetch(`/api/sync?t=${t}`, { cache: 'no-store' })
    let finalData = localData
    if (res.ok) {
      const body = await res.json()
      if (body && body.data) {
        finalData = mergeCloudData(localData, body.data as CloudData)
      }
    }
    saveMergedLocal(finalData)
    const now = new Date().toISOString()
    finalData.updatedAt = now
    finalData.stats.updatedAt = now
    saveStats(finalData.stats)
    const pushRes = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
      cache: 'no-store',
    })
    return pushRes.ok
  } catch {
    return false
  }
}

export async function pullFromCloud() {
  try {
    const localData = collectLocalData()
    const t = Date.now()
    const res = await fetch(`/api/sync?t=${t}`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = await res.json()
    if (!body || !body.data) return null
    const finalData = mergeCloudData(localData, body.data as CloudData)
    saveMergedLocal(finalData)
    return { srs: finalData.srs, stats: finalData.stats, vocab: finalData.vocab }
  } catch {
    return null
  }
}

export async function forcePushToCloud(): Promise<boolean> {
  try {
    const data = collectLocalData()
    const now = new Date().toISOString()
    data.updatedAt = now
    data.stats.updatedAt = now
    saveStats(data.stats)
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}

export const pushToCloud = syncToCloud

export async function resetCloudData(): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', { method: 'DELETE' })
    if (!res.ok) return false
    localStorage.removeItem('kotoba_srs')
    localStorage.removeItem('kotoba_stats')
    localStorage.removeItem('kotoba_vocab')
    localStorage.removeItem('kotoba_vocab_updated_at')
    return true
  } catch {
    return false
  }
}

export { collectLocalData, mergeCloudData }
