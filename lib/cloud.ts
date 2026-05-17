'use client'

import { loadSRS, saveSRS, type SRSStore } from './srs'

/** Upload SRS ke Google Drive via API route */
export async function pushToCloud(store: SRSStore): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Ambil SRS dari Google Drive, merge dengan lokal (cloud menang kalau lebih baru) */
export async function pullFromCloud(): Promise<SRSStore | null> {
  try {
    const res = await fetch('/api/sync')
    if (!res.ok) return null
    const { data } = await res.json()
    if (!data) return null

    // Merge: ambil level tertinggi per kata
    const local = loadSRS()
    const merged: SRSStore = { ...local }
    for (const [id, wp] of Object.entries(data as SRSStore)) {
      const localWp = local[id]
      if (!localWp || wp.level > localWp.level || wp.lastSeen > localWp.lastSeen) {
        merged[id] = wp
      }
    }
    saveSRS(merged)
    return merged
  } catch {
    return null
  }
}

/** Fetch CSV vocab via server-side proxy (bypass CORS) */
export async function fetchVocabCSV(sheetsUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetsUrl)}`)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}
