'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadSRS, type SRSStore } from '@/lib/srs'
import { loadLocalVocab, type VocabItem } from '@/lib/vocab'
import { playTap } from '@/lib/sounds'

function ChaptersSelectContent() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [srsStore, setSrsStore] = useState<SRSStore>({})

  useEffect(() => {
    setVocab(loadLocalVocab())
    setSrsStore(loadSRS())
  }, [])

  const chapters = useMemo(() => {
    const map = new Map<string, string[]>()
    vocab.forEach(v => {
      if (v.chapter) {
        if (!map.has(v.chapter)) map.set(v.chapter, [])
        map.get(v.chapter)!.push(v.id)
      }
    })
    
    const MAX_LEVEL = 6
    return Array.from(map.entries()).map(([name, ids]) => {
      let totalLevelsAchieved = 0
      ids.forEach(id => {
        const level = srsStore[id]?.level || 0
        totalLevelsAchieved += Math.min(level, MAX_LEVEL)
      })
      const maxPossibleLevels = ids.length * MAX_LEVEL
      const pct = maxPossibleLevels > 0 ? Math.round((totalLevelsAchieved / maxPossibleLevels) * 100) : 0
      return { name, pct, count: ids.length }
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
  }, [vocab, srsStore])

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
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
            <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Latihan Per Bab</h1>
            <p className="text-xs font-semibold text-[var(--color-text-2)]">Daftar bab kosakata yang di-import dari Google Sheets</p>
          </div>
        </header>

        {/* Chapters Cards Grid */}
        <div className="space-y-4 my-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)]">
              Pilih Bab Latihan:
            </p>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[var(--color-subtle)] text-[var(--color-text-2)]">
              {chapters.length} Bab
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="rounded-3xl p-6 text-center border border-[var(--color-border)] bg-white dark:bg-[#1a1d24]">
              <span className="text-4xl mb-2 block">📋</span>
              <p className="font-black text-sm text-[var(--color-text-1)]">Belum Ada Bab</p>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1 mb-4">
                Pastiin kamu udah men-sync Google Sheets dengan benar atau masukkan url di tab pengaturan.
              </p>
              <Link 
                href="/settings"
                onClick={playTap}
                className="inline-block rounded-xl px-4 py-2.5 text-xs font-black text-white no-underline bg-[var(--color-accent)] active:scale-95 transition-transform"
              >
                Pengaturan Google Sheets ⚙️
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {chapters.map((ch) => {
                const pct = ch.pct
                return (
                  <Link
                    key={ch.name}
                    href={`/quiz?chapter=${encodeURIComponent(ch.name)}`}
                    onClick={playTap}
                    className="flex flex-col p-4 rounded-[24px] bg-white dark:bg-[#1a1d24] hover:bg-[var(--color-bg)] border border-[var(--color-border)] no-underline active:scale-[0.98] transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-bg)] shrink-0">
                          📖
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-[var(--color-text-1)] truncate w-36" title={ch.name}>{ch.name}</h4>
                          <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5">{ch.count} kosakata</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{
                        background: pct >= 80 ? 'var(--color-green-light)' : pct > 0 ? 'var(--color-accent-light)' : 'var(--color-subtle)',
                        color: pct >= 80 ? 'var(--color-green)' : pct > 0 ? 'var(--color-accent)' : 'var(--color-text-3)'
                      }}>
                        {pct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--color-subtle)]">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${pct}%`, 
                          background: pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' 
                        }} 
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChaptersSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat daftar bab...</p>
      </div>
    }>
      <ChaptersSelectContent />
    </Suspense>
  )
}
