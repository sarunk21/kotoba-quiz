'use client'

import { loadSRS, saveSRS, type SRSStore } from './srs'
import { loadStats, saveStats, type GameStats } from './stats'
import { loadLocalVocab, saveLocalVocab, type VocabItem } from './vocab'

export interface CloudData {
  srs: SRSStore
  stats: GameStats
  vocab?: VocabItem[]
  vocabUpdatedAt?: string
  studyHistory?: Record<string, number>
  failedWords?: string[]
  updatedAt: string
}

/** Kumpulin semua data lokal */
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
    } catch (e) {
      console.error(e)
    }
  }

  return {
    srs: loadSRS(),
    stats: stats,
    vocab: loadLocalVocab(),
    vocabUpdatedAt: localStorage.getItem('kotoba_vocab_updated_at') || '',
    studyHistory,
    failedWords,
    updatedAt: stats.updatedAt || '',
  }
}

/** Merge cloud data dengan local data (Pure function, no side effects) */
function mergeCloudData(local: CloudData, cloud: CloudData): CloudData {
  // Safety check: Pastiin object exist
  const cloudSRS = cloud.srs || {}
  const cloudStats = cloud.stats || { updatedAt: '' }
  
  console.log('[Sync] Merging data...', { 
    localUpdate: local.stats.updatedAt,
    cloudUpdate: cloudStats.updatedAt 
  })

  // 1. Merge SRS — item by item, level tertinggi menang
  const mergedSRS: SRSStore = { ...local.srs }
  for (const [id, wp] of Object.entries(cloudSRS)) {
    const localWp = local.srs[id]
    if (!localWp || wp.level > localWp.level || (wp.level === localWp.level && wp.lastSeen > (localWp.lastSeen || ''))) {
      mergedSRS[id] = wp
    }
  }

  // 2. Merge Stats
  // Ambil yang paling baru updatenya (Last Write Wins)
  let cloudIsNewer = (cloudStats.updatedAt || '') > (local.stats.updatedAt || '')

  // Proteksi data kosong: Jika salah satu belum pernah main, gunakan data dari yang sudah pernah main
  if (local.stats.lastPlayedDate && !cloudStats.lastPlayedDate) {
    cloudIsNewer = false
  } else if (!local.stats.lastPlayedDate && cloudStats.lastPlayedDate) {
    cloudIsNewer = true
  }
  
  // XP, Sessions, Correct, Answered: Ambil yang TERBESAR (biar ga ilang progress dari device manapun)
  const mergedStats: GameStats = {
    totalSessions: Math.max(local.stats.totalSessions || 0, cloudStats.totalSessions || 0),
    totalCorrect: Math.max(local.stats.totalCorrect || 0, cloudStats.totalCorrect || 0),
    totalAnswered: Math.max(local.stats.totalAnswered || 0, cloudStats.totalAnswered || 0),
    // Streak & LastPlayed & Theme: Ikut yang paling baru updatenya
    currentStreak: cloudIsNewer ? (cloudStats.currentStreak || 0) : (local.stats.currentStreak || 0),
    longestStreak: Math.max(local.stats.longestStreak || 0, cloudStats.longestStreak || 0),
    lastPlayedDate: cloudIsNewer ? (cloudStats.lastPlayedDate || '') : (local.stats.lastPlayedDate || ''),
    updatedAt: cloudIsNewer ? (cloudStats.updatedAt || '') : (local.stats.updatedAt || ''),
  }

  // 3. Merge Vocab
  const cloudVocabIsNewer = (cloud.vocabUpdatedAt || '') > (local.vocabUpdatedAt || '')
  const mergedVocab = cloudVocabIsNewer ? (cloud.vocab ?? local.vocab) : (local.vocab ?? cloud.vocab)
  const mergedVocabUpdatedAt = cloudVocabIsNewer ? (cloud.vocabUpdatedAt || '') : (local.vocabUpdatedAt || '')

  // 4. Merge Study History
  const mergedHistory: Record<string, number> = { ...(local.studyHistory || {}) }
  const cloudHistory = cloud.studyHistory || {}
  for (const [date, count] of Object.entries(cloudHistory)) {
    mergedHistory[date] = Math.max(mergedHistory[date] || 0, count)
  }

  // 5. Merge Failed Words
  const localFailed = local.failedWords || []
  const cloudFailed = cloud.failedWords || []
  const mergedFailed = Array.from(new Set([...localFailed, ...cloudFailed]))

  return {
    srs: mergedSRS,
    stats: mergedStats,
    vocab: mergedVocab || undefined,
    vocabUpdatedAt: mergedVocabUpdatedAt,
    studyHistory: mergedHistory,
    failedWords: mergedFailed,
    updatedAt: cloudIsNewer ? (cloud.updatedAt || '') : (local.updatedAt || ''),
  }
}

/** Sync data: pull, merge with local, then push back */
export async function syncToCloud(): Promise<boolean> {
  try {
    const localData = collectLocalData()
    
    // 1. Pull latest from cloud
    const t = Date.now()
    const res = await fetch(`/api/sync?t=${t}`, { cache: 'no-store' })
    
    let finalData = localData
    if (res.ok) {
      const body = await res.json()
      if (body && body.data) {
        // 2. Merge in-memory
        finalData = mergeCloudData(localData, body.data as CloudData)
      }
    }
    
    // 3. Save merged result to local storage
    saveSRS(finalData.srs)
    saveStats(finalData.stats)
    if (finalData.vocab) {
      saveLocalVocab(finalData.vocab)
    }
    if (finalData.vocabUpdatedAt) {
      localStorage.setItem('kotoba_vocab_updated_at', finalData.vocabUpdatedAt)
    }
    if (finalData.studyHistory) {
      localStorage.setItem('kotoba_study_history', JSON.stringify(finalData.studyHistory))
    }
    if (finalData.failedWords) {
      localStorage.setItem('kotoba_failed_words', JSON.stringify(finalData.failedWords))
    }
    
    // 4. Update timestamp before push to ensure it's marked as the latest
    const now = new Date().toISOString()
    finalData.updatedAt = now
    finalData.stats.updatedAt = now
    saveStats(finalData.stats) // Save again with new timestamp

    // 5. Push merged result back to cloud
    const pushRes = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
      cache: 'no-store',
    })
    
    console.log('[Sync] Success', { ok: pushRes.ok })
    return pushRes.ok
  } catch (e) {
    console.error('[Sync] Error:', e)
    return false
  }
}

/** Push local data directly to cloud without pulling first (Danger: can overwrite) */
export async function forcePushToCloud(): Promise<boolean> {
  try {
    const data = collectLocalData()
    
    // Update timestamp before push
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
  } catch (e) {
    console.error('[ForcePush] Error:', e)
    return false
  }
}

/** Legacy alias for pushToCloud, now uses syncToCloud for safety */
export const pushToCloud = syncToCloud

/** Pull dari cloud + merge ke lokal */
export async function pullFromCloud(): Promise<{ srs: SRSStore; stats: GameStats; vocab?: VocabItem[] } | null> {
  try {
    const localData = collectLocalData()
    const t = Date.now()
    const res = await fetch(`/api/sync?t=${t}`, { cache: 'no-store' })
    if (!res.ok) return null
    const body = await res.json()
    if (!body || !body.data) return null
    
    const finalData = mergeCloudData(localData, body.data as CloudData)
    // Simpan hasil merge ke lokal
    saveSRS(finalData.srs)
    saveStats(finalData.stats)
    if (finalData.vocab) {
      saveLocalVocab(finalData.vocab)
    }
    if (finalData.vocabUpdatedAt) {
      localStorage.setItem('kotoba_vocab_updated_at', finalData.vocabUpdatedAt)
    }
    if (finalData.studyHistory) {
      localStorage.setItem('kotoba_study_history', JSON.stringify(finalData.studyHistory))
    }
    if (finalData.failedWords) {
      localStorage.setItem('kotoba_failed_words', JSON.stringify(finalData.failedWords))
    }
    return {
      srs: finalData.srs,
      stats: finalData.stats,
      vocab: finalData.vocab,
    }
  } catch (e) {
    console.error('[Pull] Error:', e)
    return null
  }
}

/** Reset total: hapus di cloud dan lokal */
export async function resetCloudData(): Promise<boolean> {
  try {
    // 1. Hapus di cloud
    const res = await fetch('/api/sync', { method: 'DELETE' })
    if (!res.ok) return false
    
    // 2. Bersihin lokal
    localStorage.removeItem('kotoba_srs')
    localStorage.removeItem('kotoba_stats')
    localStorage.removeItem('kotoba_vocab')
    localStorage.removeItem('kotoba_vocab_updated_at')
    
    return true
  } catch {
    return false
  }
}

/** Tarik backup dari Google Drive, gabungkan dengan data lokal, lalu kirim ke Firestore */
export async function importFromDrive(): Promise<{ success: boolean; error?: string }> {
  try {
    const localData = collectLocalData()
    
    // 1. Ambil data dari endpoint /api/sync/import-drive
    const res = await fetch('/api/sync/import-drive', { cache: 'no-store' })
    if (res.status === 401) {
      return { success: false, error: 'auth_required' }
    }
    if (res.status === 404) {
      return { success: false, error: 'backup_not_found' }
    }
    if (!res.ok) {
      const errBody = await res.json()
      return { success: false, error: errBody.error || 'Server error' }
    }
    
    const body = await res.json()
    if (!body || !body.data) {
      return { success: false, error: 'Data kosong' }
    }
    
    // 2. Gabungkan data (Drive data sebagai "cloud" data)
    const driveCloudData: CloudData = {
      srs: body.data.srs || {},
      stats: body.data.stats || { updatedAt: '' },
      vocab: body.data.vocab || undefined,
      vocabUpdatedAt: body.data.vocabUpdatedAt || '',
      updatedAt: body.data.updatedAt || '',
    }
    
    const finalData = mergeCloudData(localData, driveCloudData)
    
    // 3. Simpan hasil merge ke lokal
    saveSRS(finalData.srs)
    saveStats(finalData.stats)
    if (finalData.vocab) {
      saveLocalVocab(finalData.vocab)
    }
    if (finalData.vocabUpdatedAt) {
      localStorage.setItem('kotoba_vocab_updated_at', finalData.vocabUpdatedAt)
    }
    
    // 4. Update timestamp dan push ke Firestore
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
    
    if (pushRes.ok) {
      return { success: true }
    } else {
      return { success: false, error: 'Gagal push ke Firestore' }
    }
  } catch (e) {
    console.error('[ImportDrive] Error:', e)
    return { success: false, error: (e as Error).message }
  }
}
