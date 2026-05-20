'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

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

function getCategoryStyle(category: string) {
  if (!category) return CAT['Kata Benda']
  if (CAT[category]) return CAT[category]
  
  const catLower = category.toLowerCase()
  if (catLower.includes('benda')) return CAT['Kata Benda']
  if (catLower.includes('kerja')) return CAT['Kata Kerja']
  if (catLower.includes('sifat')) return CAT['Kata Sifat']
  if (catLower.includes('ungkapan')) return { color: '#d97706', bg: 'rgba(217,119,6,0.12)' }
  if (catLower.includes('keterangan')) return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' }
  if (catLower.includes('partikel')) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' }
  
  return { color: 'var(--color-text-2)', bg: 'var(--color-subtle)' }
}


const PAGE_SIZE = 20

export default function ProgressPage() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all')
  const [search, setSearch] = useState('')
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'chapter'>('category')
  const [selectedChapter, setSelectedChapter] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [openDropdown, setOpenDropdown] = useState<'status' | 'chapter' | 'category' | 'group' | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)

  const filterBarRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside the filter container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])



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

  // Unique chapters in vocabulary
  const chapters = useMemo(() => {
    const set = new Set<string>()
    vocab.forEach(v => {
      if (v.chapter) set.add(v.chapter)
    })
    return Array.from(set).sort()
  }, [vocab])

  // Unique categories in vocabulary
  const categories = useMemo(() => {
    const set = new Set<string>()
    vocab.forEach(v => {
      if (v.category) set.add(v.category)
    })
    return Array.from(set).sort()
  }, [vocab])


  const filtered = useMemo(() => {
    let result = vocab.filter(v => {
      const lv = srsStore[v.id]?.level ?? 0
      if (filter === 'new')      return lv === 0
      if (filter === 'learning') return lv > 0 && lv < MASTERED_LEVEL
      if (filter === 'mastered') return lv >= MASTERED_LEVEL
      return true
    })

    // Chapter filter
    if (selectedChapter !== 'all') {
      if (selectedChapter === 'none') {
        result = result.filter(v => !v.chapter)
      } else {
        result = result.filter(v => v.chapter === selectedChapter)
      }
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(v => v.category === selectedCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(v => 
        v.arti.toLowerCase().includes(q) ||
        v.hiragana.toLowerCase().includes(q) ||
        v.kanji.toLowerCase().includes(q)
      )
    }

    return result
  }, [vocab, srsStore, filter, selectedChapter, selectedCategory, search])


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

  // Reset pagination saat filter, search, bab, atau tipe ganti
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, search, selectedChapter, selectedCategory])

  // Reset filter ketika tipe grouping berubah agar tidak tabrakan
  useEffect(() => {
    if (groupBy === 'category') {
      setSelectedChapter('all')
    } else if (groupBy === 'chapter') {
      setSelectedCategory('all')
    }
  }, [groupBy])


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

        {/* Custom Filter Bar */}
        <div ref={filterBarRef} className={`grid ${groupBy === 'none' ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-6 anim-up d1 relative z-20`}>
          {/* Status Dropdown */}
          <div className="relative">
            <button onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="w-full flex items-center justify-between gap-1 rounded-2xl px-3 py-2.5 text-xs font-bold border transition-all active:scale-[0.98] select-none text-left"
              style={{
                background: 'var(--color-white)',
                color: filter !== 'all' ? 'var(--color-accent)' : 'var(--color-text-2)',
                borderColor: filter !== 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                boxShadow: filter !== 'all' ? '0 4px 12px rgba(91,94,244,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
              <span className="truncate">{filter === 'all' ? '🎯 Status' : filter === 'new' ? '🆕 Baru' : filter === 'learning' ? '⚡ Proses' : '🎓 Hafal'}</span>
              <span className="text-[8px] opacity-60 shrink-0">▼</span>
            </button>
            {openDropdown === 'status' && (
              <div className="absolute top-full mt-2 left-0 w-[160px] rounded-2xl p-1.5 z-50 border anim-pop"
                style={{ background: 'var(--color-white)', borderColor: 'var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                {[
                  { key: 'all', label: '🎯 Semua Status' },
                  { key: 'new', label: '🆕 Baru' },
                  { key: 'learning', label: '⚡ Proses' },
                  { key: 'mastered', label: '🎓 Hafal' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => { setFilter(opt.key as any); setOpenDropdown(null) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: filter === opt.key ? 'var(--color-accent-light)' : 'transparent',
                      color: filter === opt.key ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tipe Dropdown */}
          {(groupBy === 'none' || groupBy === 'category') && (
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
                className="w-full flex items-center justify-between gap-1 rounded-2xl px-3 py-2.5 text-xs font-bold border transition-all active:scale-[0.98] select-none text-left"
                style={{
                  background: 'var(--color-white)',
                  color: selectedCategory !== 'all' ? 'var(--color-accent)' : 'var(--color-text-2)',
                  borderColor: selectedCategory !== 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                  boxShadow: selectedCategory !== 'all' ? '0 4px 12px rgba(91,94,244,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                <span className="truncate">{selectedCategory === 'all' ? '📂 Tipe' : `📂 ${selectedCategory}`}</span>
                <span className="text-[8px] opacity-60 shrink-0">▼</span>
              </button>
              {openDropdown === 'category' && (
                <div className={`absolute top-full mt-2 ${groupBy === 'none' ? 'right-0' : 'left-1/2 -translate-x-1/2'} w-[160px] max-h-[220px] overflow-y-auto no-scrollbar rounded-2xl p-1.5 z-50 border anim-pop`}
                  style={{ background: 'var(--color-white)', borderColor: 'var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                  <button onClick={() => { setSelectedCategory('all'); setOpenDropdown(null) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: selectedCategory === 'all' ? 'var(--color-accent-light)' : 'transparent',
                      color: selectedCategory === 'all' ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}>
                    📂 Semua Tipe
                  </button>
                  {categories.map(catName => (
                    <button key={catName} onClick={() => { setSelectedCategory(catName); setOpenDropdown(null) }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                      style={{
                        background: selectedCategory === catName ? 'var(--color-accent-light)' : 'transparent',
                        color: selectedCategory === catName ? 'var(--color-accent)' : 'var(--color-text-2)',
                      }}>
                      📂 {catName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chapter Dropdown */}
          {(groupBy === 'none' || groupBy === 'chapter') && (
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === 'chapter' ? null : 'chapter')}
                className="w-full flex items-center justify-between gap-1 rounded-2xl px-3 py-2.5 text-xs font-bold border transition-all active:scale-[0.98] select-none text-left"
                style={{
                  background: 'var(--color-white)',
                  color: selectedChapter !== 'all' ? 'var(--color-accent)' : 'var(--color-text-2)',
                  borderColor: selectedChapter !== 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                  boxShadow: selectedChapter !== 'all' ? '0 4px 12px rgba(91,94,244,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                <span className="truncate">{selectedChapter === 'all' ? '📖 Bab' : selectedChapter === 'none' ? '📖 Tanpa Bab' : `📖 ${selectedChapter}`}</span>
                <span className="text-[8px] opacity-60 shrink-0">▼</span>
              </button>
              {openDropdown === 'chapter' && (
                <div className={`absolute top-full mt-2 ${groupBy === 'none' ? 'left-0' : 'left-1/2 -translate-x-1/2'} w-[180px] max-h-[220px] overflow-y-auto no-scrollbar rounded-2xl p-1.5 z-50 border anim-pop`}
                  style={{ background: 'var(--color-white)', borderColor: 'var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                  <button onClick={() => { setSelectedChapter('all'); setOpenDropdown(null) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: selectedChapter === 'all' ? 'var(--color-accent-light)' : 'transparent',
                      color: selectedChapter === 'all' ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}>
                    📖 Semua Bab
                  </button>
                  <button onClick={() => { setSelectedChapter('none'); setOpenDropdown(null) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: selectedChapter === 'none' ? 'var(--color-accent-light)' : 'transparent',
                      color: selectedChapter === 'none' ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}>
                    📖 Tanpa Bab
                  </button>
                  {chapters.map(ch => (
                    <button key={ch} onClick={() => { setSelectedChapter(ch); setOpenDropdown(null) }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                      style={{
                        background: selectedChapter === ch ? 'var(--color-accent-light)' : 'transparent',
                        color: selectedChapter === ch ? 'var(--color-accent)' : 'var(--color-text-2)',
                      }}>
                      📖 {ch}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grouping Dropdown */}
          <div className="relative">
            <button onClick={() => setOpenDropdown(openDropdown === 'group' ? null : 'group')}
              className="w-full flex items-center justify-between gap-1 rounded-2xl px-3 py-2.5 text-xs font-bold border transition-all active:scale-[0.98] select-none text-left"
              style={{
                background: 'var(--color-white)',
                color: groupBy !== 'none' ? 'var(--color-accent)' : 'var(--color-text-2)',
                borderColor: groupBy !== 'none' ? 'var(--color-accent)' : 'var(--color-border)',
                boxShadow: groupBy !== 'none' ? '0 4px 12px rgba(91,94,244,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
              <span className="truncate">{groupBy === 'none' ? '❌ Grup' : groupBy === 'category' ? '📂 Tipe' : '📖 Bab'}</span>
              <span className="text-[8px] opacity-60 shrink-0">▼</span>
            </button>
            {openDropdown === 'group' && (
              <div className="absolute top-full mt-2 right-0 w-[150px] rounded-2xl p-1.5 z-50 border anim-pop"
                style={{ background: 'var(--color-white)', borderColor: 'var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                {[
                  { key: 'none', label: '❌ Tanpa Grup' },
                  { key: 'category', label: '📂 Grup Tipe Kata' },
                  { key: 'chapter', label: '📖 Grup Bab' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => { setGroupBy(opt.key as any); setOpenDropdown(null) }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: groupBy === opt.key ? 'var(--color-accent-light)' : 'transparent',
                      color: groupBy === opt.key ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
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
                    const cat = getCategoryStyle(v.category)
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

