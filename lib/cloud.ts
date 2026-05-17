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

/** Apply cloud data ke lokal — merge SRS (ambil level tertinggi), stats (ambil terbesar) */
function applyCloudData(cloud: CloudData) {
  // Merge SRS
  const localSRS = loadSRS()
  const merged: SRSStore = { ...localSRS }
  for (const [id, wp] of Object.entries(cloud.srs)) {
    const local = localSRS[id]
    // Ambil yang levelnya lebih tinggi, atau yang lebih baru kalau sama
    if (!local || wp.level > local.level || (wp.level === local.level && wp.lastSeen > local.lastSeen)) {
      merged[id] = wp
    }
  }
  saveSRS(merged)

  // Merge stats — ambil yang lebih besar
  const localStats = loadStats()
  const mergedStats: GameStats = {
    totalXP: Math.max(localStats.totalXP, cloud.stats.totalXP),
    currentStreak: Math.max(localStats.currentStreak, cloud.stats.currentStreak),
    longestStreak: Math.max(localStats.longestStreak, cloud.stats.longestStreak),
    lastPlayedDate: localStats.lastPlayedDate > cloud.stats.lastPlayedDate
      ? localStats.lastPlayedDate : cloud.stats.lastPlayedDate,
    totalSessions: Math.max(localStats.totalSessions, cloud.stats.totalSessions),
    totalCorrect: Math.max(localStats.totalCorrect, cloud.stats.totalCorrect),
    totalAnswered: Math.max(localStats.totalAnswered, cloud.stats.totalAnswered),
  }
  saveStats(mergedStats)

  // Sheets URL — pakai cloud kalau lokal kosong
  if (cloud.sheetsUrl && !localStorage.getItem('kotoba_sheets_url')) {
    localStorage.setItem('kotoba_sheets_url', cloud.sheetsUrl)
  }

  return { srs: merged, stats: mergedStats, sheetsUrl: cloud.sheetsUrl }
}

/** Push semua data ke cloud */
export async function pushToCloud(): Promise<boolean> {
  try {
    const data = collectLocalData()
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch {
    return false
  }
}

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
export async function fetchVocabCSV(sheetsUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetsUrl)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}
