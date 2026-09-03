'use client'

import { AUDIO_CACHE_NAME, AUDIO_CACHE_MAX_ENTRIES } from './constants'

// Singleton helpers untuk TTS cache — menggantikan duplikasi caches.open('kotoba-audio-cache') di lib/sounds.ts:159/209/234

let abortControllers = new Map<string, AbortController>()

function getCache(): Promise<Cache | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return Promise.resolve(null)
  return caches.open(AUDIO_CACHE_NAME)
}

async function evictIfNeeded(cache: Cache) {
  try {
    const keys = await cache.keys()
    if (keys.length > AUDIO_CACHE_MAX_ENTRIES) {
      // hapus yang paling lama (FIFO)
      const toDelete = keys.slice(0, keys.length - AUDIO_CACHE_MAX_ENTRIES)
      await Promise.all(toDelete.map(r => cache.delete(r)))
    }
  } catch {}
}

export function stopAudioFetch(text: string) {
  const key = `/api/audio?text=${encodeURIComponent(text)}`
  const ctrl = abortControllers.get(key)
  if (ctrl) { try { ctrl.abort() } catch {} ; abortControllers.delete(key) }
}

export function stopAllAudioFetch() {
  for (const [, c] of abortControllers) try { c.abort() } catch {}
  abortControllers.clear()
}

export async function getCachedAudioBlob(text: string): Promise<Blob | null> {
  const url = `/api/audio?text=${encodeURIComponent(text)}`
  try {
    const cache = await getCache()
    if (!cache) return null
    const match = await cache.match(url)
    if (!match) return null
    return await match.blob()
  } catch { return null }
}

export async function fetchAndCacheAudio(text: string): Promise<Blob | null> {
  const url = `/api/audio?text=${encodeURIComponent(text)}`
  const ctrl = new AbortController()
  abortControllers.set(url, ctrl)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const clone = res.clone()
    const blob = await res.blob()
    // simpan async
    try {
      const cache = await getCache()
      if (cache) {
        await cache.put(url, clone)
        await evictIfNeeded(cache)
      }
    } catch {}
    return blob
  } catch {
    return null
  } finally {
    abortControllers.delete(url)
  }
}

export async function preloadAudio(text: string) {
  if (typeof window === 'undefined' || !text || !navigator.onLine) return
  const url = `/api/audio?text=${encodeURIComponent(text)}`
  try {
    const cache = await getCache()
    if (!cache) return
    const match = await cache.match(url)
    if (match) return
    const ctrl = new AbortController()
    // timeout 8s
    const timeout = setTimeout(() => ctrl.abort(), 8000)
    try {
      const res = await fetch(url, { signal: ctrl.signal })
      if (res.ok) {
        await cache.put(url, res)
        await evictIfNeeded(cache)
      }
    } finally { clearTimeout(timeout) }
  } catch {}
}
