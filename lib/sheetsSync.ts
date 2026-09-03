'use client'

import { parseCSVToVocab, loadLocalVocab, saveLocalVocab, type VocabItem } from './vocab'
import { fetchStories } from './stories'
import { syncToCloud } from './cloud'
import { getSheetsSyncTimestamp, setSheetsSyncTimestamp, setVocabUpdatedAt } from './storage'
import { SHEETS_THROTTLE_MS } from './constants'

// Deduplikasi inflight per URL
let inflight: Map<string, Promise<{ newItems: number; hasChanges: boolean; total: number } | null>> = new Map()

export interface SheetsSyncResult {
  newItems: number
  hasChanges: boolean
  total: number
}

/**
 * Sinkronisasi Sheets terpusat — menggantikan triple clone silentSyncFromSheets
 * di app/page.tsx:161, app/vocab/page.tsx:81, app/settings/page.tsx:37
 * - throttle 1 jam via kotoba_sheets_sync_timestamp
 * - dedup inflight per URL
 * - merge existingIds + chapter update
 * - fetchStories ponytail
 * - save + vocabUpdatedAt + syncToCloud jika |newItems|hasChanges
 */
export async function syncSheetsFromUrl(
  url: string,
  opts?: { force?: boolean; throttleMs?: number; sessionEmail?: string | null; onStories?: boolean }
): Promise<SheetsSyncResult | null> {
  const normalized = url.trim()
  if (!normalized) return null
  const throttleMs = opts?.throttleMs ?? SHEETS_THROTTLE_MS
  const force = opts?.force ?? false

  // Throttle check
  if (!force) {
    const last = getSheetsSyncTimestamp()
    const now = Date.now()
    if (last && now - last < throttleMs) {
      // console.log('[Sheets] Throttled')
      return null
    }
  }

  // Dedup inflight
  if (inflight.has(normalized)) return inflight.get(normalized)!

  const p = (async (): Promise<SheetsSyncResult | null> => {
    try {
      const t = Date.now()
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(normalized)}&t=${t}`)
      if (!res.ok) return null
      const csvText = await res.text()
      const parsed = parseCSVToVocab(csvText)
      if (parsed.length === 0) return null

      const localVocab = loadLocalVocab()
      const existingIds = new Set(localVocab.map(v => v.id))
      const newItems = parsed.filter(item => !existingIds.has(item.id))

      let hasChanges = false
      const updatedLocalVocab = localVocab.map(localItem => {
        const parsedItem = parsed.find(p => p.id === localItem.id)
        if (parsedItem && parsedItem.chapter !== localItem.chapter) {
          hasChanges = true
          return { ...localItem, chapter: parsedItem.chapter }
        }
        return localItem
      })

      setSheetsSyncTimestamp(Date.now())

      // Stories sync (ponytail)
      if (opts?.onStories !== false) {
        try {
          const storiesList = await fetchStories(normalized)
          if (storiesList.length > 0) {
            localStorage.setItem('kotoba_stories', JSON.stringify(storiesList))
          }
        } catch {}
      }

      if (newItems.length > 0 || hasChanges) {
        const updatedList = [...newItems, ...updatedLocalVocab]
        saveLocalVocab(updatedList)
        setVocabUpdatedAt(new Date().toISOString())
        if (opts?.sessionEmail) {
          try { await syncToCloud() } catch {}
        }
        return { newItems: newItems.length, hasChanges, total: updatedList.length }
      }
      return { newItems: 0, hasChanges: false, total: localVocab.length }
    } catch {
      return null
    } finally {
      inflight.delete(normalized)
    }
  })()

  inflight.set(normalized, p)
  return p
}

/**
 * Versi force (untuk tombol manual sync di vocab/settings) — bypass throttle
 */
export async function forceSyncSheetsFromUrl(url: string, sessionEmail?: string | null) {
  return syncSheetsFromUrl(url, { force: true, sessionEmail })
}
