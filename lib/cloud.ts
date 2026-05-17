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

/** Apply cloud data ke lokal — merge SRS (ambil level tertinggi), stats (ambil yang terbaru) */
function applyCloudData(cloud: CloudData) {
  // Merge SRS — item by item, level tertinggi menang
  const localSRS = loadSRS()
  const merged: SRSStore = { ...localSRS }
  for (const [id, wp] of Object.entries(cloud.srs)) {
    const local = localSRS[id]
    if (!local || wp.level > local.level || (wp.level === local.level && wp.lastSeen > local.lastSeen)) {
      merged[id] = wp
    }
  }
  saveSRS(merged)

  // Merge stats — ambil satu set utuh yang XP-nya lebih gede (asumsi lebih maju)
  const localStats = loadStats()
  const useCloud = cloud.stats.totalXP > localStats.totalXP
  
  if (useCloud) {
    saveStats(cloud.stats)
  }

  // Sheets URL — selalu prioritaskan cloud kalau ada (source of truth per akun)
  if (cloud.sheetsUrl) {
    localStorage.setItem('kotoba_sheets_url', cloud.sheetsUrl)
  }

  return { srs: merged, stats: useCloud ? cloud.stats : localStats, sheetsUrl: cloud.sheetsUrl }
}

/** Sync data: pull, merge with local, then push back */
export async function syncToCloud(): Promise<boolean> {
  try {
    // 1. Pull latest from cloud
    const res = await fetch('/api/sync', { cache: 'no-store' })
    if (res.ok) {
      const { data } = await res.json()
      if (data) {
        // 2. Merge cloud into local
        applyCloudData(data as CloudData)
      }
    }
    
    // 3. Push merged result back to cloud
    const dataToPush = collectLocalData()
    const pushRes = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToPush),
    })
    return pushRes.ok
  } catch {
    return false
  }
}

/** Legacy alias for pushToCloud, now uses syncToCloud for safety */
export const pushToCloud = syncToCloud

/** Pull dari cloud + merge ke lokal */
export async function pullFromCloud(): Promise<{ srs: SRSStore; stats: GameStats; sheetsUrl: string } | null> {
  try {
    const res = await fetch('/api/sync', { cache: 'no-store' })
    if (!res.ok) return null
    const { data } = await res.json()
    if (!data) return null
    return applyCloudData(data as CloudData)
  } catch {
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
