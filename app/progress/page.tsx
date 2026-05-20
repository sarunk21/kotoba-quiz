'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { loadSRS, getWordProgress, MASTERED_LEVEL, type SRSStore } from '@/lib/srs'
import { parseCSVToVocab, type VocabItem } from '@/lib/vocab'
import { fetchVocabCSV } from '@/lib/cloud'
import { speakJapanese } from '@/lib/sounds'


const CAT: Record<string, { color: string; bg: string }> = {
  'Kata Benda': { color: 'var(--color-cat-noun)', bg: 'var(--color-cat-noun-bg)' },
  'Kata Kerja': { color: 'var(--color-cat-verb)', bg: 'var(--color-cat-verb-bg)' },
  'Kata Sifat': { color: 'var(--color-cat-adj)',  bg: 'var(--color-cat-adj-bg)' },
}

const PAGE_SIZE = 20

export default function ProgressPage() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'chapter'>('category')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSrsStore(loadSRS())
    const url = localStorage.getItem('kotoba_sheets_url')
    async function load() {
      setLoading(true)
      if (url) {
        const csv = await fetchVocabCSV(url)
        if (csv) {
          const parsed = parseCSVToVocab(csv)
          setVocab(parsed)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let result = vocab.filter(v => {
      const lv = srsStore[v.id]?.level ?? 0
      if (filter === 'new')      return lv === 0
      if (filter === 'learning') return lv > 0 && lv < MASTERED_LEVEL
      if (filter === 'mastered') return lv >= MASTERED_LEVEL
      return true
    })

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(v => 
        v.arti.toLowerCase().includes(q) ||
        v.hiragana.toLowerCase().includes(q) ||
        v.kanji.toLowerCase().includes(q)
      )
    }

    return result
  }, [vocab, srsStore, filter, search])

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') return { '': filtered }
    
    const groups: Record<string, VocabItem[]> = {}
    filtered.forEach(v => {
      const key = groupBy === 'category' ? v.category : (v.chapter || 'Tanpa Bab')
      if (!groups[key]) groups[key] = []
      groups[key].push(v)
    })
    return groups
  }, [filtered, groupBy])

  // Reset pagination saat filter atau search ganti
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, search])

  const flattenedVisible = useMemo(() => {
    // We still want to respect visibleCount for performance
    // But grouping makes it tricky. For now, let's just slice the total filtered
    return filtered.slice(0, visibleCount)
  }, [filtered, visibleCount])

  // To maintain grouping with pagination, we'll re-group the sliced items
  const paginatedGroups = useMemo(() => {
    if (groupBy === 'none') return { '': flattenedVisible }
    const groups: Record<string, VocabItem[]> = {}
    flattenedVisible.forEach(v => {
      const key = groupBy === 'category' ? v.category : (v.chapter || 'Tanpa Bab')
      if (!groups[key]) groups[key] = []
      groups[key].push(v)
    })
    return groups
  }, [flattenedVisible, groupBy])

  const hasMore = visibleCount < filtered.length


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
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>{filtered.length} kata {filter !== 'all' ? 'ditemukan' : 'total'}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-5 anim-up d1">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari arti, hiragana, atau kanji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition-all"
              style={{ 
                background: 'var(--color-white)', 
                color: 'var(--color-text-1)',
                border: '1.5px solid var(--color-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold active:scale-90 transition-transform"
                style={{ background: 'var(--color-subtle)', color: 'var(--color-text-2)' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter & Grouping Controls */}
        <div className="flex gap-2.5 mb-6 anim-up d1">
          {/* Status Filter */}
          <div className="flex-1 relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
              className="w-full appearance-none rounded-2xl py-3.5 pl-4 pr-10 text-xs font-bold outline-none cursor-pointer border transition-all"
              style={{
                background: 'var(--color-white)',
                color: 'var(--color-text-1)',
                borderColor: filter !== 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                boxShadow: filter !== 'all' ? '0 4px 12px rgba(91,94,244,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
                fontFamily: 'inherit',
              }}>
              <option value="all">🎯 Semua Status</option>
              <option value="new">🆕 Belum Dipelajari (Baru)</option>
              <option value="learning">⚡ Sedang Dipelajari (Proses)</option>
              <option value="mastered">🎓 Sudah Hafal</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[var(--color-text-3)]">▼</div>
          </div>

          {/* Grouping Filter */}
          <div className="flex-1 relative">
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)}
              className="w-full appearance-none rounded-2xl py-3.5 pl-4 pr-10 text-xs font-bold outline-none cursor-pointer border transition-all"
              style={{
                background: 'var(--color-white)',
                color: 'var(--color-text-1)',
                borderColor: groupBy !== 'none' ? 'var(--color-accent)' : 'var(--color-border)',
                boxShadow: groupBy !== 'none' ? '0 4px 12px rgba(91,94,244,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
                fontFamily: 'inherit',
              }}>
              <option value="none">❌ Tanpa Grup</option>
              <option value="category">📂 Grup: Tipe Kata</option>
              <option value="chapter">📖 Grup: Bab</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-[var(--color-text-3)]">▼</div>
          </div>
        </div>

        {/* Vocab cards */}
        <div className="flex flex-col gap-6 anim-up d2">
          {loading ? (
             <div className="text-center py-12">
               <p className="text-sm font-bold animate-pulse" style={{ color: 'var(--color-text-3)' }}>Narik data terbaru...</p>
             </div>
          ) : (
            <>
              {Object.entries(paginatedGroups).map(([groupName, items]) => (
                <div key={groupName} className="flex flex-col gap-2.5">
                  {groupName && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--color-text-3)' }}>{groupName}</p>
                      <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                    </div>
                  )}
                  {items.map(v => {
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
                              <button onClick={() => speakJapanese(v.hiragana || v.kanji)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-90 transition-all text-[var(--color-text-2)] border border-[var(--color-border)] ml-1 shrink-0"
                                title="Pelafalan">
                                <VolumeIcon size={12} />
                              </button>
                            </div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>{v.arti}</p>
                            {v.chapter && groupBy !== 'chapter' && (
                              <p className="text-[10px] font-bold mt-1" style={{ color: 'var(--color-text-3)' }}>📖 {v.chapter}</p>
                            )}
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
                </div>
              ))}

              {hasMore && (
                <button onClick={() => setVisibleCount(p => p + PAGE_SIZE)}
                  className="w-full rounded-2xl py-4 mt-2 text-sm font-bold active:scale-95 transition-all"
                  style={{ background: 'var(--color-white)', color: 'var(--color-accent)', border: '1.5px solid var(--color-border)' }}>
                  Muat lebih banyak... ({filtered.length - visibleCount} sisa)
                </button>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">📭</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>Ga ada kata di kategori ini</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function VolumeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

