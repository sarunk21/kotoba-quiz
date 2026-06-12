'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadSRS, type SRSStore, MASTERED_LEVEL } from '@/lib/srs'
import { loadLocalVocab, type VocabItem } from '@/lib/vocab'
import { getWordJLPTLevel } from '@/lib/jlpt'
import { playTap } from '@/lib/sounds'

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const
type JLPTLevel = typeof LEVELS[number]

const LEVEL_COLORS: Record<JLPTLevel, { accent: string; bg: string; text: string }> = {
  'N5': { accent: 'var(--color-green)', bg: 'var(--color-green-light)', text: 'var(--color-green)' },
  'N4': { accent: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
  'N3': { accent: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
  'N2': { accent: '#f59e0b', bg: '#fef3c7', text: '#b45309' },
  'N1': { accent: 'var(--color-red)', bg: 'var(--color-red-light)', text: 'var(--color-red)' },
}

function JLPTContent() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null)

  useEffect(() => {
    setSrsStore(loadSRS())
    setVocab(loadLocalVocab())
  }, [])

  const levelStats = useMemo(() => {
    const stats: Record<JLPTLevel, { total: number; kanjiCount: number; pct: number }> = {
      'N5': { total: 0, kanjiCount: 0, pct: 0 },
      'N4': { total: 0, kanjiCount: 0, pct: 0 },
      'N3': { total: 0, kanjiCount: 0, pct: 0 },
      'N2': { total: 0, kanjiCount: 0, pct: 0 },
      'N1': { total: 0, kanjiCount: 0, pct: 0 },
    }

    const MAX_LEVEL = 6
    const levelSum: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 }

    vocab.forEach(item => {
      const lvl = getWordJLPTLevel(item.kanji, item.chapter)
      if (stats[lvl]) {
        stats[lvl].total++
        if (item.kanji && item.kanji !== item.hiragana) {
          stats[lvl].kanjiCount++
        }
        const srsLvl = srsStore[item.id]?.level || 0
        levelSum[lvl] += Math.min(srsLvl, MAX_LEVEL)
      }
    })

    LEVELS.forEach(lvl => {
      const maxPossible = stats[lvl].total * MAX_LEVEL
      stats[lvl].pct = maxPossible > 0 ? Math.round((levelSum[lvl] / maxPossible) * 100) : 0
    })

    return stats
  }, [vocab, srsStore])

  const toggleExpand = (lvl: JLPTLevel) => {
    playTap()
    setExpandedLevel(expandedLevel === lvl ? null : lvl)
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 anim-up">
          <button 
            onClick={() => {
              playTap()
              router.push('/')
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Latihan Per Level JLPT</h1>
            <p className="text-xs font-semibold text-[var(--color-text-2)]">Pelajari kosakata berdasarkan klasifikasi level ujian JLPT</p>
          </div>
        </header>

        {/* Levels Grid */}
        <div className="space-y-4 my-auto">
          {LEVELS.map((lvl) => {
            const stat = levelStats[lvl]
            const colors = LEVEL_COLORS[lvl]
            const isExpanded = expandedLevel === lvl

            return (
              <div 
                key={lvl}
                className="rounded-[28px] bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-sm overflow-hidden transition-all duration-300"
              >
                {/* Level Card Header */}
                <button
                  onClick={() => toggleExpand(lvl)}
                  className="w-full text-left p-5 flex items-center justify-between gap-3 active:bg-[var(--color-bg)]/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span 
                      className="text-xl font-black w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
                      style={{ background: colors.bg, color: colors.accent, borderColor: 'rgba(0,0,0,0.03)' }}
                    >
                      {lvl}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-[var(--color-text-1)]">Ujian JLPT {lvl}</h4>
                      <p className="text-[10px] font-bold text-[var(--color-text-2)] mt-0.5">
                        {stat.total} kata · {stat.kanjiCount} Kanji
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                      style={{ background: colors.bg, color: colors.accent }}
                    >
                      {stat.pct}%
                    </span>
                    <span className="text-[var(--color-text-3)] text-sm font-black transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                      ›
                    </span>
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-5 pb-5">
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--color-subtle)]">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${stat.pct}%`, 
                        background: colors.accent 
                      }} 
                    />
                  </div>
                </div>

                {/* Submenu action buttons */}
                {isExpanded && (
                  <div className="bg-[var(--color-bg)]/30 border-t border-[var(--color-border)] p-4 grid grid-cols-3 gap-2 anim-down">
                    <Link
                      href={`/quiz?level=${lvl}`}
                      onClick={playTap}
                      className={`rounded-xl py-3 text-center text-[10px] font-black no-underline active:scale-95 transition-all text-white bg-[var(--color-accent)] ${stat.total === 0 ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      📖 Kosakata
                    </Link>
                    <Link
                      href={`/quiz?mode=kanji&level=${lvl}`}
                      onClick={playTap}
                      className={`rounded-xl py-3 text-center text-[10px] font-black no-underline active:scale-95 transition-all text-white bg-green-500 ${stat.kanjiCount === 0 ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      漢 Kanji
                    </Link>
                    <Link
                      href={`/quiz?mode=listening&level=${lvl}`}
                      onClick={playTap}
                      className={`rounded-xl py-3 text-center text-[10px] font-black no-underline active:scale-95 transition-all text-white bg-purple-500 ${stat.total === 0 ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                      🔊 Pendengaran
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function JLPTPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat daftar level JLPT...</p>
      </div>
    }>
      <JLPTContent />
    </Suspense>
  )
}
