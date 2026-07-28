'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadSRS, calculateChapterProgress, type SRSStore } from '@/lib/srs'
import { playTap } from '@/lib/sounds'
import { 
  SPECIALIZED_DATA, 
  SPECIAL_CHAPTER_SEQUENCES, 
  CHAPTER_METADATA 
} from '@/lib/specialized'

type SpecialType = 'angka' | 'hari' | 'uang' | 'tubuh' | 'keluarga' | 'salam'

function SpecialSelectContent() {
  const router = useRouter()
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [activeTab, setActiveTab] = useState<SpecialType>('angka')

  useEffect(() => {
    setSrsStore(loadSRS())
  }, [])

  const getSpecialChapterPct = (type: SpecialType, chapterName: string) => {
    const items = SPECIALIZED_DATA[type] || []
    const chapterItems = items.filter(v => v.chapter === chapterName)
    if (chapterItems.length === 0) return 0
    const prog = calculateChapterProgress(chapterItems.map(i => i.id), srsStore)
    return prog.pct
  }

  const isSpecialChapterUnlocked = (type: SpecialType, chapterName: string) => {
    const sequence = SPECIAL_CHAPTER_SEQUENCES[type]
    if (!sequence) return true
    const index = sequence.indexOf(chapterName)
    if (index <= 0) return true
    
    const prevChapter = sequence[index - 1]
    const prevPct = getSpecialChapterPct(type, prevChapter)
    return prevPct >= 30
  }

  const isAllSpecialChaptersUnlocked = (type: SpecialType) => {
    const sequence = SPECIAL_CHAPTER_SEQUENCES[type] || []
    return sequence.every(ch => isSpecialChapterUnlocked(type, ch))
  }

  const tabList = [
    { key: 'angka', label: 'Angka', icon: '🔢' },
    { key: 'hari', label: 'Waktu & Hari', icon: '📅' },
    { key: 'uang', label: 'Uang', icon: '💴' },
    { key: 'tubuh', label: 'Tubuh', icon: '🧠' },
    { key: 'keluarga', label: 'Keluarga', icon: '👨‍👩‍👧‍👦' },
    { key: 'salam', label: 'Salam', icon: '🤝' },
  ] as const

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6 anim-up">
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
            <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Latihan Khusus</h1>
            <p className="text-xs font-semibold text-[var(--color-text-2)]">Kategori angka, tanggal, waktu, & nominal uang</p>
          </div>
        </header>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 p-1.5 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl mb-6 shrink-0 select-none shadow-sm overflow-x-auto no-scrollbar">
          {tabList.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  playTap()
                  setActiveTab(tab.key)
                }}
                className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all shrink-0 ${
                  isActive 
                    ? 'bg-[var(--color-accent)] text-white shadow-sm'
                    : 'text-[var(--color-text-2)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Chapters List */}
        <div className="space-y-4 my-auto">
          <p className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">
            Fokus Bab ({tabList.find(t => t.key === activeTab)?.label}):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(SPECIAL_CHAPTER_SEQUENCES[activeTab] || []).map((chName) => {
              const isUnlocked = isSpecialChapterUnlocked(activeTab, chName)
              const pct = getSpecialChapterPct(activeTab, chName)
              const meta = CHAPTER_METADATA[activeTab]?.[chName] || { label: chName, icon: '📖' }

              if (isUnlocked) {
                return (
                  <Link
                    key={chName}
                    href={`/quiz?mode=special&type=${activeTab}&chapter=${chName}`}
                    onClick={playTap}
                    className="flex flex-col p-4.5 rounded-3xl bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] no-underline hover:border-[var(--color-accent)] active:scale-[0.98] transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between w-full mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--color-bg)] flex items-center justify-center text-xl shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-[var(--color-text-1)] tracking-tight">{meta.label}</h4>
                          <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">Modul Kuis SRS</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                        pct >= 80 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : pct > 0 
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                            : 'bg-[var(--color-subtle)] text-[var(--color-text-3)]'
                      }`}>
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
              } else {
                const sequence = SPECIAL_CHAPTER_SEQUENCES[activeTab]
                const idx = sequence.indexOf(chName)
                const prevChName = idx > 0 ? sequence[idx - 1] : ''
                const prevMeta = CHAPTER_METADATA[activeTab]?.[prevChName] || { label: prevChName }

                return (
                  <div
                    key={chName}
                    className="flex items-center justify-between p-4.5 rounded-3xl bg-gray-50/60 dark:bg-gray-800/20 border border-[var(--color-border)] opacity-60 text-xs font-bold text-[var(--color-text-3)] cursor-not-allowed select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--color-subtle)] flex items-center justify-center text-lg shrink-0">
                        🔒
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-[var(--color-text-3)]">{meta.label}</h4>
                        <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">Bab dikunci</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                      Selesaikan {prevMeta.label.split(' (')[0]} &ge; 30%
                    </span>
                  </div>
                )
              }
            })}

            {/* Campur Semua */}
            {(() => {
              const allUnlocked = isAllSpecialChaptersUnlocked(activeTab)
              if (allUnlocked) {
                return (
                  <Link
                    href={`/quiz?mode=special&type=${activeTab}`}
                    onClick={playTap}
                    className="flex items-center justify-center p-4 rounded-[24px] no-underline text-xs font-black text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] shadow-[0_8px_24px_rgba(91,94,244,0.25)] active:scale-[0.98] transition-all mt-2"
                  >
                    ⚡ Campur Semua Materi {activeTab === 'angka' ? 'Angka' : activeTab === 'hari' ? 'Hari/Waktu' : 'Uang'}
                  </Link>
                )
              } else {
                return (
                  <div
                    className="flex items-center justify-center p-4 rounded-[24px] text-xs font-black text-[var(--color-text-3)] bg-gray-100/40 dark:bg-gray-800/10 border border-[var(--color-border)] opacity-60 cursor-not-allowed select-none mt-2"
                  >
                    🔒 Buka semua bab untuk campur materi
                  </div>
                )
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SpecialSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat halaman latihan...</p>
      </div>
    }>
      <SpecialSelectContent />
    </Suspense>
  )
}
