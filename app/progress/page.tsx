'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadSRS, getWordProgress, SRS_INTERVALS, MASTERED_LEVEL, type SRSStore } from '@/lib/srs'
import { parseCSVToVocab, type VocabItem } from '@/lib/vocab'

const CAT: Record<string, { color: string; bg: string }> = {
  'Kata Benda': { color: 'var(--color-cat-noun)', bg: 'var(--color-cat-noun-bg)' },
  'Kata Kerja': { color: 'var(--color-cat-verb)', bg: 'var(--color-cat-verb-bg)' },
  'Kata Sifat': { color: 'var(--color-cat-adj)',  bg: 'var(--color-cat-adj-bg)' },
}

export default function ProgressPage() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')

  useEffect(() => {
    setSrsStore(loadSRS())
    const url = localStorage.getItem('kotoba_sheets_url')
    async function load() {
      let v: VocabItem[] = []
      if (url) {
        try {
          const res = await fetch(`/api/sheets?url=${encodeURIComponent(url)}`)
          const parsed = parseCSVToVocab(await res.text())
          if (parsed.length >= 4) v = parsed
        } catch { }
      }
      setVocab(v)
    }
    load()
  }, [])

  const filtered = vocab.filter(v => {
    const lv = srsStore[v.id]?.level ?? 0
    if (filter === 'new')      return lv === 0
    if (filter === 'learning') return lv > 0 && lv < MASTERED_LEVEL
    if (filter === 'mastered') return lv >= MASTERED_LEVEL
    return true
  })

  const tabs = [
    { key: 'all',      label: 'Semua' },
    { key: 'new',      label: 'Baru' },
    { key: 'learning', label: 'Proses' },
    { key: 'mastered', label: 'Hafal' },
  ] as const

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto px-4 pt-12 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 anim-up">
          <button onClick={() => router.push('/')}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ←
          </button>
          <div>
            <h1 className="font-extrabold text-lg" style={{ color: 'var(--color-text-1)' }}>Progress Kata</h1>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>{vocab.length} kata total</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 anim-up d1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className="rounded-2xl px-3.5 py-2 text-xs font-bold transition-all active:scale-95"
              style={{
                background: filter === t.key ? 'var(--color-accent)' : 'var(--color-white)',
                color: filter === t.key ? '#fff' : 'var(--color-text-2)',
                boxShadow: filter === t.key ? '0 4px 10px rgba(91,94,244,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Vocab cards */}
        <div className="flex flex-col gap-2.5 anim-up d2">
          {filtered.map(v => {
            const wp = getWordProgress(srsStore, v.id)
            const lv = wp.level
            const pct = Math.round((lv / 6) * 100)
            const barColor = lv >= MASTERED_LEVEL ? 'var(--color-green)' : lv >= 3 ? 'var(--color-accent)' : lv >= 1 ? 'var(--color-amber)' : 'var(--color-subtle)'
            const cat = CAT[v.category] ?? CAT['Kata Benda']
            const nextReview = wp.nextReview
            const today = new Date().toISOString().split('T')[0]
            const isDue = nextReview <= today && lv > 0
            const daysLeft = nextReview > today
              ? Math.ceil((new Date(nextReview).getTime() - new Date(today).getTime()) / 86400000)
              : 0

            return (
              <div key={v.id} className="rounded-2xl p-4 shadow-card" style={{ background: 'var(--color-white)' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="jp font-bold text-base" style={{ color: 'var(--color-text-1)' }}>
                        {v.kanji || v.hiragana}
                      </p>
                      {v.hiragana && v.kanji !== v.hiragana && (
                        <p className="text-xs jp" style={{ color: 'var(--color-text-3)' }}>{v.hiragana}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>{v.arti}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: cat.bg, color: cat.color }}>
                      {v.category}
                    </span>
                    {lv >= MASTERED_LEVEL ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                        Hafal ✓
                      </span>
                    ) : isDue ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                        Review!
                      </span>
                    ) : lv === 0 ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                        Baru
                      </span>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-3)' }}>
                        {daysLeft}h lagi
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--color-subtle)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: barColor }} />
                  </div>
                  <span className="text-xs font-bold w-7 text-right" style={{ color: barColor }}>Lv{lv}</span>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>Ga ada kata di kategori ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
