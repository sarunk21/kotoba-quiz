'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadSRS } from '@/lib/srs'
import { loadLocalVocab, type VocabItem } from '@/lib/vocab'
import { getWordJLPTLevel } from '@/lib/jlpt'
import { playTap } from '@/lib/sounds'

function KanjiSelectContent() {
 const router = useRouter()
 const [vocab, setVocab] = useState<VocabItem[]>([])
 
 useEffect(() => {
 setVocab(loadLocalVocab())
 }, [])

 const kanjiVocab = useMemo(() => {
 return vocab.filter(v => v.kanji && v.kanji !== v.hiragana)
 }, [vocab])

 const kanjiLevels = useMemo(() => {
 const counts = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 }
 kanjiVocab.forEach(v => {
 const lvl = getWordJLPTLevel(v.kanji, v.chapter)
 counts[lvl]++
 })
 return counts
 }, [kanjiVocab])

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
 className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-[var(--color-surface)] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0"
 >
 ←
 </button>
 <div>
 <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Membaca Kanji</h1>
 <p className="text-xs font-semibold text-[var(--color-text-2)]">Latihan Kanji berdasarkan level JLPT</p>
 </div>
 </header>

 {/* Kanji Level Cards List */}
 <div className="space-y-4 my-auto">
 <p className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-1">
 Pilih Tingkat JLPT Kanji:
 </p>

 <div className="grid grid-cols-1 gap-3">
 {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => {
 const count = kanjiLevels[lvl]
 const isAvailable = count > 0

 if (isAvailable) {
 return (
 <Link 
 key={lvl}
 href={`/quiz?mode=kanji&level=${lvl}`}
 onClick={playTap}
 className="flex items-center justify-between p-5 rounded-[24px] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] border border-[var(--color-border)] no-underline active:scale-[0.98] transition-all shadow-sm"
 >
 <div className="flex items-center gap-4">
 <span className="jp-serif text-3xl font-black text-[var(--color-accent)] leading-none flex items-center justify-center w-12 h-12 bg-[var(--color-accent-light)] rounded-2xl shrink-0">
 {lvl}
 </span>
 <div>
 <h4 className="text-sm font-black text-[var(--color-text-1)]">JLPT {lvl} Kanji</h4>
 <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">Berlatih membaca Kanji tingkat {lvl}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] px-2.5 py-1 rounded-full font-black bg-[var(--color-accent-light)] text-[var(--color-accent)]">
 {count} kata
 </span>
 <span className="text-[var(--color-text-3)] font-bold text-lg leading-none">›</span>
 </div>
 </Link>
 )
 } else {
 return (
 <div 
 key={lvl}
 className="flex items-center justify-between p-5 rounded-[24px] bg-gray-100/40 dark:bg-gray-800/10 border border-[var(--color-border)] opacity-60 text-xs font-bold text-[var(--color-text-3)] cursor-not-allowed select-none"
 >
 <div className="flex items-center gap-4">
 <span className="jp-serif text-3xl font-black text-[var(--color-text-3)] leading-none flex items-center justify-center w-12 h-12 bg-[var(--color-subtle)] rounded-2xl shrink-0">
 {lvl}
 </span>
 <div>
 <h4 className="text-sm font-black text-[var(--color-text-3)]">JLPT {lvl} Kanji</h4>
 <p className="text-[10px] font-semibold text-[var(--color-text-3)] mt-0.5">Belum ada kata Kanji tingkat {lvl}</p>
 </div>
 </div>
 <span className="text-[10px] font-black text-[var(--color-text-3)] bg-[var(--color-subtle)] px-2.5 py-1 rounded-full">
 🔒 Locked
 </span>
 </div>
 )
 }
 })}

 {/* Campur Semua Kanji */}
 {kanjiVocab.length > 0 && (
 <Link 
 href="/quiz?mode=kanji" 
 onClick={playTap} 
 className="flex items-center justify-center gap-2 p-5 rounded-[24px] no-underline text-sm font-black text-white bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] shadow-[0_8px_24px_var(--color-accent-glow)] active:scale-[0.98] transition-all mt-2"
 >
 <span>⚡ Campur Semua Kanji</span>
 <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--color-surface)]/20 text-white">
 {kanjiVocab.length} kata
 </span>
 </Link>
 )}
 </div>
 </div>
 </div>
 </div>
 )
}

export default function KanjiSelectPage() {
 return (
 <Suspense fallback={
 <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
 <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat halaman kuis...</p>
 </div>
 }>
 <KanjiSelectContent />
 </Suspense>
 )
}
