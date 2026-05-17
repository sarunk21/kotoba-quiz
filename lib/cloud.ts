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
  return {
    srs: loadSRS(),
    stats: loadStats(),
    sheetsUrl: localStorage.getItem('kotoba_sheets_url') || '',
    updatedAt: new Date().toISOString(),
  }
}

/** Merge cloud data dengan local data (Pure function, no side effects) */
function mergeCloudData(local: CloudData, cloud: CloudData): CloudData {
  console.log('[Sync] Merging data...', { localUpdate: local.stats.updatedAt, cloudUpdate: cloud.stats.updatedAt })

  // 1. Merge SRS — item by item, level tertinggi menang
  const mergedSRS: SRSStore = { ...local.srs }
  for (const [id, wp] of Object.entries(cloud.srs)) {
    const localWp = local.srs[id]
    if (!localWp || wp.level > localWp.level || (wp.level === localWp.level && wp.lastSeen > localWp.lastSeen)) {
      mergedSRS[id] = wp
    }
  }

  // 2. Merge Stats
  // Gunakan 'updatedAt' sebagai penentu utama
  const cloudIsNewer = cloud.stats.updatedAt > (local.stats.updatedAt || '')
  
  const mergedStats: GameStats = {
    // XP, Sessions, Correct, Answered: Ambil yang TERBESAR (biar ga ilang progress dari device manapun)
    totalXP: Math.max(local.stats.totalXP, cloud.stats.totalXP),
    totalSessions: Math.max(local.stats.totalSessions, cloud.stats.totalSessions),
    totalCorrect: Math.max(local.stats.totalCorrect, cloud.stats.totalCorrect),
    totalAnswered: Math.max(local.stats.totalAnswered, cloud.stats.totalAnswered),
    // Streak & LastPlayed: Ikut yang paling baru updatenya
    currentStreak: cloudIsNewer ? cloud.stats.currentStreak : local.stats.currentStreak,
    longestStreak: Math.max(local.stats.longestStreak, cloud.stats.longestStreak),
    lastPlayedDate: cloudIsNewer ? cloud.stats.lastPlayedDate : local.stats.lastPlayedDate,
    updatedAt: cloudIsNewer ? cloud.stats.updatedAt : local.stats.updatedAt,
  }

  // 3. Sheets URL
  // Jika lokal kosong, ambil cloud. Jika ada, lokal menang (user baru aja ganti di settings)
  const mergedUrl = local.sheetsUrl || cloud.sheetsUrl

  return {
    srs: mergedSRS,
    stats: mergedStats,
    sheetsUrl: mergedUrl,
    updatedAt: cloudIsNewer ? cloud.updatedAt : local.updatedAt,
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
      const { data: cloudData } = await res.json()
      if (cloudData) {
        // 2. Merge in-memory
        finalData = mergeCloudData(localData, cloudData as CloudData)
      }
    }
    
    // 3. Save merged result to local storage
    saveSRS(finalData.srs)
    saveStats(finalData.stats)
    if (finalData.sheetsUrl) {
      localStorage.setItem('kotoba_sheets_url', finalData.sheetsUrl)
    }
    
    // 4. Push merged result back to cloud
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
