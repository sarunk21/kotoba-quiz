'use client'

import { loadSRS, saveSRS, type SRSStore } from './srs'
import { loadStats, saveStats, type GameStats } from './stats'

export interface CloudData {
  srs: SRSStore
  stats: GameStats
  sheetsUrl: string
  updatedAt: string
}

/** Kumpulin semua data lokal */
function collectLocalData(): CloudData {
  const stats = loadStats()
  return {
    srs: loadSRS(),
    stats: stats,
    sheetsUrl: localStorage.getItem('kotoba_sheets_url') || '',
    updatedAt: stats.updatedAt || '',
  }
}

/** Merge cloud data dengan local data (Pure function, no side effects) */
function mergeCloudData(local: CloudData, cloud: CloudData): CloudData {
  // Safety check: Pastiin object exist
  const cloudSRS = cloud.srs || {}
  const cloudStats = cloud.stats || { totalXP: 0, updatedAt: '' }
  
  console.log('[Sync] Merging data...', { 
    localXP: local.stats.totalXP, 
    cloudXP: cloudStats.totalXP,
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
  const cloudIsNewer = (cloudStats.updatedAt || '') > (local.stats.updatedAt || '')
  
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

  // 3. Sheets URL
  // Jika lokal kosong, ambil cloud. Jika cloud kosong, ambil lokal.
  // Jika dua-duanya ada, ambil yang paling baru.
  let mergedUrl = local.sheetsUrl
  if (!local.sheetsUrl) {
    mergedUrl = cloud.sheetsUrl || ''
  } else if (cloud.sheetsUrl && cloudIsNewer) {
    mergedUrl = cloud.sheetsUrl
  }

  return {
    srs: mergedSRS,
    stats: mergedStats,
    sheetsUrl: mergedUrl,
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
    // Always set, even if empty (to allow clearing)
    localStorage.setItem('kotoba_sheets_url', finalData.sheetsUrl || '')
    
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
export async function pullFromCloud(): Promise<{ srs: SRSStore; stats: GameStats; sheetsUrl: string } | null> {
  try {
    const localData = collectLocalData()
    const t = Date.now()
    const res = await fetch(`/api/sync?t=${t}`, { cache: 'no-store' })
    if (!res.ok) return null
    const { data: cloudData } = await res.json()
    if (!cloudData) return null
    
    const finalData = mergeCloudData(localData, cloudData as CloudData)
    // Simpan hasil merge ke lokal
    saveSRS(finalData.srs)
    saveStats(finalData.stats)
    if (finalData.sheetsUrl) {
      localStorage.setItem('kotoba_sheets_url', finalData.sheetsUrl)
    }
    return finalData
  } catch (e) {
    console.error('[Pull] Error:', e)
    return null
  }
}

/** Fetch CSV vocab via server-side proxy (bypass CORS) */
export async function fetchVocabCSV(sheetsUrl: string, force = false): Promise<string | null> {
  try {
    const t = force ? `&t=${Date.now()}` : ''
    const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetsUrl)}${t}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/** Reset total: hapus di cloud dan lokal */
export async function resetCloudData(): Promise<boolean> {
  try {
    // 1. Hapus di Drive
    const res = await fetch('/api/sync', { method: 'DELETE' })
    if (!res.ok) return false
    
    // 2. Bersihin lokal
    localStorage.removeItem('kotoba_srs')
    localStorage.removeItem('kotoba_stats')
    localStorage.removeItem('kotoba_sheets_url')
    
    return true
  } catch {
    return false
  }
}
