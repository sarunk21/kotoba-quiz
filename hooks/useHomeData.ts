'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadStats, type GameStats } from '@/lib/stats'
import { loadSRS, type SRSStore, getSRSSummary, getKanaSummary } from '@/lib/srs'
import { loadLocalVocab, type VocabItem } from '@/lib/vocab'
import { getHistoryRaw } from '@/lib/storage'
import { KANA } from '@/lib/kana'
import { checkNotificationNeeds } from '@/lib/notifications'
import { syncToCloud } from '@/lib/cloud'

export function useHomeData(sessionEmail?: string | null) {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [studyHistory, setStudyHistory] = useState<Record<string, number>>({})
  const [notificationNeed, setNotificationNeed] = useState<{ type: string; message: string } | null>(null)

  const refreshLocal = useCallback(() => {
    setStats(loadStats())
    setSrsStore(loadSRS())
    setVocab(loadLocalVocab())
    const sh = getHistoryRaw()
    if (sh) {
      try { setStudyHistory(JSON.parse(sh)) } catch {}
    }
    const need = checkNotificationNeeds()
    if (need) setNotificationNeed(need)
  }, [])

  useEffect(() => {
    refreshLocal()
  }, [refreshLocal])

  const doSync = useCallback(async () => {
    if (!sessionEmail) return false
    const ok = await syncToCloud()
    if (ok) refreshLocal()
    return ok
  }, [sessionEmail, refreshLocal])

  const srs = vocab.length > 0 ? getSRSSummary(vocab.map(v => v.id), srsStore) : null
  const kanaSrs = getKanaSummary(KANA, srsStore)
  const kanjiVocab = vocab.filter(v => v.kanji && v.kanji !== v.hiragana)
  const kanjiSrs = kanjiVocab.length > 0 ? getSRSSummary(kanjiVocab.map(v => v.id), srsStore) : null

  return { stats, srsStore, vocab, studyHistory, notificationNeed, setNotificationNeed, srs, kanaSrs, kanjiSrs, refreshLocal, doSync, setVocab, setStudyHistory, setStats, setSrsStore }
}
