'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { loadSRS, getSRSSummary, type SRSStore } from '@/lib/srs'
import { parseCSVToVocab, type VocabItem } from '@/lib/vocab'
import { fetchVocabCSV } from '@/lib/cloud'
import { KANA } from '@/lib/kana'
import { SPECIALIZED_DATA } from '@/lib/specialized'

const SPECIAL_CHAPTER_SEQUENCES: Record<string, string[]> = {
  angka: ['Dasar', 'Ratusan', 'Ribuan', 'Penghitung', 'Orang', 'Batang'],
  hari: ['Hari', 'Tanggal', 'Waktu', 'Menit'],
  uang: ['Yen', 'Tanya']
}

const CHAPTER_METADATA: Record<string, Record<string, { label: string; icon: string }>> = {
  angka: {
    Dasar: { label: 'Angka Dasar (1-10)', icon: '🔢' },
    Ratusan: { label: 'Ratusan (100 - 800)', icon: '💯' },
    Ribuan: { label: 'Ribuan & Puluh Ribu', icon: '🏔️' },
    Penghitung: { label: 'Buah & Barang (~tsu)', icon: '📦' },
    Orang: { label: 'Penghitung Orang (~nin)', icon: '👥' },
    Batang: { label: 'Batang & Botol (~hon/pon/bon)', icon: '🥢' },
  },
  hari: {
    Hari: { label: 'Nama Hari (Senin - Minggu)', icon: '📅' },
    Tanggal: { label: 'Tanggal (1-10, 14, 20, 24)', icon: '📆' },
    Waktu: { label: 'Jam & Waktu (~ji)', icon: '⏰' },
    Menit: { label: 'Menit (~fun/pun)', icon: '⏱️' },
  },
  uang: {
    Yen: { label: 'Nominal Yen (100 - 10.000)', icon: '💴' },
    Tanya: { label: 'Kalimat Tanya Harga', icon: '💬' },
  }
}

export default function BottomNav() {
  const pathname = usePathname()
  const [showPracticeModal, setShowPracticeModal] = useState(false)
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [selectedSpecialType, setSelectedSpecialType] = useState<'angka' | 'hari' | 'uang' | null>(null)

  // Load local data on mount / open
  useEffect(() => {
    if (showPracticeModal) {
      setSrsStore(loadSRS())
      const url = typeof window !== 'undefined' ? localStorage.getItem('kotoba_sheets_url') || '' : ''
      if (url) {
        fetchVocabCSV(url).then(csv => {
          if (csv) {
            const parsed = parseCSVToVocab(csv)
            setVocab(parsed)
          }
        }).catch(() => {})
      }
    } else {
      setSelectedSpecialType(null)
    }
  }, [showPracticeModal])

  const srs = vocab.length > 0 ? getSRSSummary(vocab.map(v => v.id), srsStore) : null
  const kanjiVocab = vocab.filter(v => v.kanji && v.kanji !== v.hiragana)

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
      return { name, pct }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [vocab, srsStore])

  const getSpecialChapterPct = (type: string, chapterName: string) => {
    const items = SPECIALIZED_DATA[type] || []
    const chapterItems = items.filter(v => v.chapter === chapterName)
    if (chapterItems.length === 0) return 0
    const MAX_LEVEL = 6
    let totalLevelsAchieved = 0
    chapterItems.forEach(item => {
      const level = srsStore[item.id]?.level || 0
      totalLevelsAchieved += Math.min(level, MAX_LEVEL)
    })
    const maxPossibleLevels = chapterItems.length * MAX_LEVEL
    return Math.round((totalLevelsAchieved / maxPossibleLevels) * 100)
  }

  const isSpecialChapterUnlocked = (type: string, chapterName: string) => {
    const sequence = SPECIAL_CHAPTER_SEQUENCES[type]
    if (!sequence) return true
    const index = sequence.indexOf(chapterName)
    if (index <= 0) return true
    
    const prevChapter = sequence[index - 1]
    const prevPct = getSpecialChapterPct(type, prevChapter)
    return prevPct >= 40
  }

  const isAllSpecialChaptersUnlocked = (type: string) => {
    const sequence = SPECIAL_CHAPTER_SEQUENCES[type] || []
    return sequence.every(ch => isSpecialChapterUnlocked(type, ch))
  }

  const leftTabs = [
    { name: 'Beranda', path: '/', icon: '🏠' },
    { name: 'Kamus', path: '/progress', icon: '📖' },
  ]

  const rightTabs = [
    { name: 'Karakter', path: '/kana', icon: 'あ' },
    { name: 'Pengaturan', path: '/settings', icon: '⚙️' },
  ]

  const noVocab = vocab.length === 0

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 select-none">
        <div 
          className="w-full max-w-sm rounded-[28px] flex items-center justify-between py-2 px-3 border border-[var(--color-border)] bg-white/90 dark:bg-[#1a1d24]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-300 relative"
        >
          {/* Left Tabs */}
          <div className="flex-1 flex justify-around">
            {leftTabs.map((tab) => {
              const isActive = pathname === tab.path
              return (
                <Link 
                  key={tab.path} 
                  href={tab.path}
                  className="flex flex-col items-center justify-center gap-0.5 select-none no-underline flex-1 py-1 relative transition-transform active:scale-95"
                >
                  <div 
                    className={`text-xl transition-all duration-200 ${isActive ? 'scale-110 font-bold' : 'opacity-50 scale-100 hover:opacity-75'}`}
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}
                  >
                    {tab.icon}
                  </div>
                  <span 
                    className="text-[9px] font-black tracking-wider transition-colors duration-200 uppercase"
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    {tab.name}
                  </span>
                  
                  {isActive && (
                    <div 
                      className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full"
                      style={{
                        background: 'var(--color-accent)',
                        boxShadow: '0 2px 6px rgba(91, 94, 244, 0.4)',
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Center Float Button */}
          <div className="flex justify-center px-1 shrink-0">
            <button 
              onClick={() => setShowPracticeModal(true)}
              className="flex items-center justify-center select-none no-underline w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-dark)] shadow-[0_6px_20px_rgba(91,94,244,0.4)] active:scale-90 transition-all -mt-8 border-4 border-white dark:border-[#1a1d24]"
            >
              <span className="text-xl text-white">🎯</span>
            </button>
          </div>

          {/* Right Tabs */}
          <div className="flex-1 flex justify-around">
            {rightTabs.map((tab) => {
              const isActive = pathname === tab.path
              return (
                <Link 
                  key={tab.path} 
                  href={tab.path}
                  className="flex flex-col items-center justify-center gap-0.5 select-none no-underline flex-1 py-1 relative transition-transform active:scale-95"
                >
                  <div 
                    className={`text-xl transition-all duration-200 ${isActive ? 'scale-110 font-bold' : 'opacity-50 scale-100 hover:opacity-75'}`}
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                    }}
                  >
                    {tab.icon}
                  </div>
                  <span 
                    className="text-[9px] font-black tracking-wider transition-colors duration-200 uppercase"
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
                      opacity: isActive ? 1 : 0.6,
                    }}
                  >
                    {tab.name}
                  </span>
                  
                  {isActive && (
                    <div 
                      className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full"
                      style={{
                        background: 'var(--color-accent)',
                        boxShadow: '0 2px 6px rgba(91, 94, 244, 0.4)',
                      }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Practice Mode Selection Bottom Sheet ── */}
      {showPracticeModal && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4 select-none">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowPracticeModal(false)} 
          />
          <div 
            className="bg-white dark:bg-[#1a1d24] rounded-t-[32px] rounded-b-[24px] p-6 w-full max-w-sm relative shadow-2xl z-10 border border-[var(--color-border)] animate-slide-up"
            style={{
              maxHeight: '85dvh',
              overflowY: 'auto'
            }}
          >
            {/* Handle bar at the top */}
            <div className="w-12 h-1.5 rounded-full bg-[var(--color-border)] mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--color-text-1)]">Pilih Latihan</h3>
                <p className="text-xs font-semibold text-[var(--color-text-2)] mt-0.5">Pilih jenis latihan yang ingin kamu ikuti</p>
              </div>
              <button 
                onClick={() => setShowPracticeModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-[var(--color-bg)] active:scale-95 transition-all text-xs"
                style={{ color: 'var(--color-text-2)' }}
              >
                ✕
              </button>
            </div>

            {noVocab ? (
              <div className="rounded-2xl p-5 mb-4 text-center border border-[var(--color-accent)] bg-[var(--color-white)]">
                <div className="text-3xl mb-2">📋</div>
                <p className="font-extrabold text-sm text-[var(--color-text-1)]">Sheets Belum Diset</p>
                <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1 mb-3">
                  Hubungkan Google Sheets kamu di halaman Pengaturan agar dapat berlatih kosakata.
                </p>
                <Link 
                  href="/settings" 
                  onClick={() => setShowPracticeModal(false)} 
                  className="inline-block rounded-xl px-4 py-2 text-xs font-extrabold text-white no-underline bg-[var(--color-accent)] active:scale-95 transition-transform"
                >
                  Ke Pengaturan ⚙️
                </Link>
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {/* Option 1: SRS Vocab Quiz */}
                <Link href="/quiz" onClick={() => setShowPracticeModal(false)} className="block no-underline active:scale-[0.98] transition-transform">
                  <div className="rounded-2xl p-4 flex items-center gap-4 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all">
                    <div className="text-3xl">🧠</div>
                    <div className="flex-1">
                      <p className="font-extrabold text-sm text-[var(--color-text-1)]">Kosakata Harian (SRS)</p>
                      <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">
                        {srs && srs.dueCount > 0 ? `${srs.dueCount} kata siap direview` : 'Latih kosakata baru/due hari ini'}
                      </p>
                    </div>
                    <span className="text-[var(--color-text-3)] font-bold text-lg">›</span>
                  </div>
                </Link>

                {/* Option 2: Kanji Quiz */}
                {kanjiVocab.length > 0 && (
                  <Link href="/quiz?mode=kanji" onClick={() => setShowPracticeModal(false)} className="block no-underline active:scale-[0.98] transition-transform">
                    <div className="rounded-2xl p-4 flex items-center gap-4 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all">
                      <div className="jp-serif text-3xl font-extrabold text-[var(--color-accent)] leading-none flex items-center justify-center w-8">漢</div>
                      <div className="flex-1">
                        <p className="font-extrabold text-sm text-[var(--color-text-1)]">Fokus Membaca Kanji</p>
                        <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">
                          Latih {kanjiVocab.length} kata yang menggunakan Kanji
                        </p>
                      </div>
                      <span className="text-[var(--color-text-3)] font-bold text-lg">›</span>
                    </div>
                  </Link>
                )}
              </div>
            )}

            {/* Option 3 (Always Available): Kana Quiz */}
            <Link href="/kana" onClick={() => setShowPracticeModal(false)} className="block no-underline active:scale-[0.98] transition-transform mb-4">
              <div className="rounded-2xl p-4 flex items-center gap-4 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all">
                <div className="jp-serif text-3xl leading-none flex items-center justify-center w-8">あ</div>
                <div className="flex-1">
                  <p className="font-extrabold text-sm text-[var(--color-text-1)]">Hiragana & Katakana</p>
                  <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">
                    Latih {KANA.length} karakter dasar Jepang
                  </p>
                </div>
                <span className="text-[var(--color-text-3)] font-bold text-lg">›</span>
              </div>
            </Link>

            {/* Latihan Khusus (Angka, Hari, Uang) */}
            <div className="border-t border-[var(--color-border)] pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <p className="font-extrabold text-xs uppercase tracking-wider text-[var(--color-text-3)]">Latihan Khusus</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-2">
                <button 
                  onClick={() => setSelectedSpecialType(selectedSpecialType === 'angka' ? null : 'angka')} 
                  className="block no-underline active:scale-95 transition-transform"
                >
                  <div className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center border transition-all h-24 w-full ${
                    selectedSpecialType === 'angka' 
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' 
                      : 'border-[var(--color-border)] bg-[var(--color-white)] hover:bg-[var(--color-bg)]'
                  }`}>
                    <span className="text-2xl mb-1">🔢</span>
                    <p className="text-[10px] font-black text-[var(--color-text-1)] leading-tight">Angka &<br/>Penghitung</p>
                  </div>
                </button>
                <button 
                  onClick={() => setSelectedSpecialType(selectedSpecialType === 'hari' ? null : 'hari')} 
                  className="block no-underline active:scale-95 transition-transform"
                >
                  <div className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center border transition-all h-24 w-full ${
                    selectedSpecialType === 'hari' 
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' 
                      : 'border-[var(--color-border)] bg-[var(--color-white)] hover:bg-[var(--color-bg)]'
                  }`}>
                    <span className="text-2xl mb-1">📅</span>
                    <p className="text-[10px] font-black text-[var(--color-text-1)] leading-tight">Hari &<br/>Waktu</p>
                  </div>
                </button>
                <button 
                  onClick={() => setSelectedSpecialType(selectedSpecialType === 'uang' ? null : 'uang')} 
                  className="block no-underline active:scale-95 transition-transform"
                >
                  <div className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center border transition-all h-24 w-full ${
                    selectedSpecialType === 'uang' 
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' 
                      : 'border-[var(--color-border)] bg-[var(--color-white)] hover:bg-[var(--color-bg)]'
                  }`}>
                    <span className="text-2xl mb-1">💴</span>
                    <p className="text-[10px] font-black text-[var(--color-text-1)] leading-tight">Uang &<br/>Harga</p>
                  </div>
                </button>
              </div>

              {/* Submenu Latihan Khusus */}
              {selectedSpecialType && (
                <div className="mt-3 p-3.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] space-y-2 animate-slide-up">
                  <p className="font-extrabold text-[9px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">
                    Fokus Materi ({selectedSpecialType === 'angka' ? 'Angka' : selectedSpecialType === 'hari' ? 'Hari/Waktu' : 'Uang'}):
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {(SPECIAL_CHAPTER_SEQUENCES[selectedSpecialType] || []).map((chName) => {
                      const isUnlocked = isSpecialChapterUnlocked(selectedSpecialType, chName)
                      const pct = getSpecialChapterPct(selectedSpecialType, chName)
                      const meta = CHAPTER_METADATA[selectedSpecialType]?.[chName] || { label: chName, icon: '📖' }
                      
                      if (isUnlocked) {
                        return (
                          <Link 
                            key={chName}
                            href={`/quiz?mode=special&type=${selectedSpecialType}&chapter=${chName}`}
                            onClick={() => setShowPracticeModal(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-white)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] no-underline text-[11px] font-extrabold text-[var(--color-text-1)] active:scale-[0.98] transition-transform"
                          >
                            <div className="flex items-center gap-2">
                              <span>{meta.icon} {meta.label}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{
                                background: pct >= 80 ? 'var(--color-green-light)' : pct > 0 ? 'var(--color-accent-light)' : 'var(--color-subtle)',
                                color: pct >= 80 ? 'var(--color-green)' : pct > 0 ? 'var(--color-accent)' : 'var(--color-text-3)'
                              }}>
                                {pct}%
                              </span>
                            </div>
                            <span className="text-[var(--color-text-3)]">›</span>
                          </Link>
                        )
                      } else {
                        const sequence = SPECIAL_CHAPTER_SEQUENCES[selectedSpecialType]
                        const idx = sequence.indexOf(chName)
                        const prevChName = idx > 0 ? sequence[idx - 1] : ''
                        const prevMeta = CHAPTER_METADATA[selectedSpecialType]?.[prevChName] || { label: prevChName }
                        
                        return (
                          <div 
                            key={chName}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-100/50 dark:bg-gray-800/10 border border-[var(--color-border)] opacity-60 text-[11px] font-bold text-[var(--color-text-3)] cursor-not-allowed select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span>🔒 {meta.icon} {meta.label}</span>
                            </div>
                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                              Butuh 40% di {prevMeta.label.split(' (')[0]}
                            </span>
                          </div>
                        )
                      }
                    })}

                    {/* Campur Semua Materi */}
                    {(() => {
                      const allUnlocked = isAllSpecialChaptersUnlocked(selectedSpecialType)
                      if (allUnlocked) {
                        return (
                          <Link 
                            href={`/quiz?mode=special&type=${selectedSpecialType}`} 
                            onClick={() => setShowPracticeModal(false)} 
                            className="flex items-center justify-center p-2.5 rounded-xl no-underline text-[11px] font-black text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] active:scale-[0.98] transition-all mt-1"
                          >
                            ⚡ Campur Semua Materi
                          </Link>
                        )
                      } else {
                        return (
                          <div 
                            className="flex items-center justify-center p-2.5 rounded-xl text-[11px] font-black text-[var(--color-text-3)] bg-gray-100/50 dark:bg-gray-800/10 border border-[var(--color-border)] opacity-60 cursor-not-allowed select-none mt-1"
                          >
                            🔒 Buka semua bab untuk campur materi
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Chapters sub-section inside the Modal */}
            {!noVocab && chapters.length > 0 && (
              <div className="border-t border-[var(--color-border)] pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-extrabold text-xs uppercase tracking-wider text-[var(--color-text-3)]">Latihan Per Bab</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)]">
                    {chapters.length} Bab
                  </span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                  {chapters.map(ch => {
                    const pct = ch.pct
                    return (
                      <Link 
                        key={ch.name} 
                        href={`/quiz?chapter=${encodeURIComponent(ch.name)}`} 
                        onClick={() => setShowPracticeModal(false)}
                        className="block no-underline shrink-0 active:scale-95 transition-transform"
                      >
                        <div className="rounded-2xl p-3.5 w-28 flex flex-col items-center justify-center text-center border border-[var(--color-border)] bg-[var(--color-white)]">
                          <div className="text-xl mb-1.5">📖</div>
                          <p className="text-xs font-extrabold truncate w-full text-[var(--color-text-1)]" title={ch.name}>{ch.name}</p>
                          <div className="w-full mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-bold text-[var(--color-text-3)]">Progress</span>
                              <span className="text-[8px] font-bold" style={{ color: pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' }}>{pct}%</span>
                            </div>
                            <div className="w-full h-1 rounded-full overflow-hidden bg-[var(--color-bg)]">
                              <div className="h-full rounded-full transition-all duration-500" 
                                style={{ 
                                  width: `${pct}%`, 
                                  background: pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' 
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bottomNavSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bottomNavFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: bottomNavSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: bottomNavFadeIn 0.2s ease-out forwards; }
      `}</style>
    </>
  )
}
