'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loadSRS, calculateChapterProgress, type SRSStore } from '@/lib/srs'
 import { loadLocalVocab, type VocabItem } from '@/lib/vocab'
 import { playTap } from '@/lib/sounds'
 import { type ChapterStory } from '@/lib/stories'
 import { getStoriesRaw } from '@/lib/storage'

function ChaptersSelectContent() {
 const router = useRouter()
 const [vocab, setVocab] = useState<VocabItem[]>([])
 const [srsStore, setSrsStore] = useState<SRSStore>({})
 const [stories, setStories] = useState<ChapterStory[]>([])

 useEffect(() => {
 setVocab(loadLocalVocab())
 setSrsStore(loadSRS())
 try {
 const stored = getStoriesRaw()
 if (stored) {
 setStories(JSON.parse(stored) as ChapterStory[])
 }
 } catch (e) {
 console.error('[Stories Load Error]', e)
 }
 }, [])

 const chapters = useMemo(() => {
 const map = new Map<string, string[]>()
 vocab.forEach(v => {
 if (v.chapter) {
 if (!map.has(v.chapter)) map.set(v.chapter, [])
 map.get(v.chapter)!.push(v.id)
 }
 })

 return Array.from(map.entries()).map(([name, ids]) => {
 const prog = calculateChapterProgress(ids, srsStore)
 return { 
 name, 
 pct: prog.pct, 
 count: ids.length, 
 masteredCount: prog.masteredCount,
 learningCount: prog.learningCount 
 }
 }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
 }, [vocab, srsStore])

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
 <div className="rounded-3xl p-6 text-center border border-[var(--color-border)] bg-[var(--color-surface)]">
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {chapters.map((ch) => {
 const pct = ch.pct
 const hasStory = stories.some(s => s.chapter === ch.name)
 return (
 <div
 key={ch.name}
 className="flex flex-col p-4.5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs hover:border-[var(--color-accent)] transition-all"
 >
 <div className="flex items-center justify-between w-full mb-3.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-[var(--color-indigo-light)] text-[var(--color-indigo)] flex items-center justify-center text-xl shrink-0">
 📖
 </div>
 <div>
 <h4 className="text-xs font-extrabold text-[var(--color-text-1)] truncate w-36" title={ch.name}>{ch.name}</h4>
 <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">
 {ch.masteredCount}/{ch.count} hafal • {ch.count} kata
 </p>
 </div>
 </div>
  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
 pct >= 80 
 ? 'bg-[var(--color-green-light)] text-[var(--color-green)]' 
 : pct > 0 
 ? 'bg-[var(--color-indigo-light)] text-[var(--color-indigo)]' 
 : 'bg-[var(--color-subtle)] text-[var(--color-text-3)]'
 }`}>
 {pct}%
 </span>
 </div>

 {/* Progress Bar */}
 <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--color-subtle)] mb-4">
 <div 
 className="h-full rounded-full transition-all duration-500" 
 style={{ 
 width: `${pct}%`, 
 background: pct >= 80 ? 'var(--color-green)' : 'var(--color-accent)' 
 }} 
 />
 </div>

 {/* Actions */}
 <div className="flex gap-2 mt-auto">
 <Link
 href={`/quiz?chapter=${encodeURIComponent(ch.name)}`}
 onClick={playTap}
 className="w-full flex items-center justify-center py-2.5 px-3.5 rounded-xl font-extrabold text-xs text-white bg-[var(--color-accent)] active:scale-95 transition-all text-center no-underline cursor-pointer shadow-xs"
 >
 ⚡ Mulai Kuis
 </Link>
 </div>
 </div>
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
