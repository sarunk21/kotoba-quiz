'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { loadSRS, getSRSSummary, type SRSStore } from '@/lib/srs'
import { loadLocalVocab, type VocabItem } from '@/lib/vocab'
import { getFailedWords } from '@/lib/failed'
import { playTap } from '@/lib/sounds'
import { IconHome, IconBook, IconBolt, IconSettings, IconTarget } from '@/components/ui/icons'

export default function BottomNav() {
 const pathname = usePathname()
 const [showPracticeModal, setShowPracticeModal] = useState(false)
 const [srsStore, setSrsStore] = useState<SRSStore>({})
 const [vocab, setVocab] = useState<VocabItem[]>([])
 const [failedCount, setFailedCount] = useState(0)

 const cardRef = useRef<HTMLDivElement>(null)
 const dragStartY = useRef(0)
 const isDraggingRef = useRef(false)

 // Load local data on mount / open — via lib/failed (storage terpusat)
 useEffect(() => {
 if (showPracticeModal) {
 setSrsStore(loadSRS())
 setVocab(loadLocalVocab())
 try {
 setFailedCount(getFailedWords().length)
 } catch (e) {
 console.error(e)
 setFailedCount(0)
 }
 }
 }, [showPracticeModal])

 // Lock background body scroll when modal is open
 useEffect(() => {
 if (showPracticeModal) {
 document.body.style.overflow = 'hidden'
 } else {
 document.body.style.overflow = ''
 }
 return () => {
 document.body.style.overflow = ''
 }
 }, [showPracticeModal])

 // Drag to dismiss event handlers
 const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
 if (e.button !== 0) return // Only primary button
 const target = e.currentTarget as HTMLElement
 target.setPointerCapture(e.pointerId)
 dragStartY.current = e.clientY
 isDraggingRef.current = true
 
 if (cardRef.current) {
 cardRef.current.style.transition = 'none'
 cardRef.current.style.animation = 'none'
 }
 }

 const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
 if (!isDraggingRef.current) return
 const deltaY = e.clientY - dragStartY.current
 if (deltaY > 0 && cardRef.current) {
 cardRef.current.style.transform = `translateY(${deltaY}px)`
 }
 }

 const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
 if (!isDraggingRef.current) return
 isDraggingRef.current = false
 
 const target = e.currentTarget as HTMLElement
 try {
 target.releasePointerCapture(e.pointerId)
 } catch (err) {
 // Ignore if pointer capture was already released
 }

 const deltaY = e.clientY - dragStartY.current
 if (cardRef.current) {
 cardRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
 
 const threshold = 120 // 120px to trigger dismiss
 if (deltaY > threshold) {
 cardRef.current.style.transform = 'translateY(100%)'
 setTimeout(() => {
 closeModal()
 if (cardRef.current) {
 cardRef.current.style.transform = ''
 cardRef.current.style.transition = ''
 }
 }, 250)
 } else {
 cardRef.current.style.transform = 'translateY(0)'
 setTimeout(() => {
 if (cardRef.current) {
 cardRef.current.style.transition = ''
 }
 }, 250)
 }
 }
 }

 // Listen to popstate to handle back button closing the modal
 useEffect(() => {
 if (showPracticeModal) {
 if (window.history.state?.modal !== 'practice') {
 window.history.pushState({ modal: 'practice' }, '')
 }

 const handlePopState = (e: PopStateEvent) => {
 if (e.state?.modal !== 'practice') {
 setShowPracticeModal(false)
 }
 }

 window.addEventListener('popstate', handlePopState)
 return () => {
 window.removeEventListener('popstate', handlePopState)
 }
 }
 }, [showPracticeModal])

 // On mount, check if state has modal open (e.g. going back to page)
 useEffect(() => {
 if (window.history.state?.modal === 'practice') {
 setShowPracticeModal(true)
 }
 }, [])

 // Handler for closing the modal manually (clicks on backdrop or X)
 const closeModal = () => {
 if (window.history.state?.modal === 'practice') {
 window.history.back()
 } else {
 setShowPracticeModal(false)
 }
 }

 const togglePracticeModal = () => {
 if (showPracticeModal) {
 closeModal()
 } else {
 setShowPracticeModal(true)
 }
 }

 // Handler for link clicks to ensure we replace state (clear modal from history)
 // so going back from next page returns to a closed modal
 const handleLinkClick = () => {
 if (window.history.state?.modal === 'practice') {
 window.history.replaceState(null, '')
 }
 setShowPracticeModal(false)
 }

 const srs = vocab.length > 0 ? getSRSSummary(vocab.map(v => v.id), srsStore) : null
 const kanjiVocab = vocab.filter(v => v.kanji && v.kanji !== v.hiragana)

 const hasChapters = useMemo(() => {
 return vocab.some(v => v.chapter)
 }, [vocab])

 const leftTabs = [
 { name: 'Beranda', path: '/', Icon: IconHome },
 { name: 'Kosakata', path: '/vocab', Icon: IconBook },
 ]

 const rightTabs = [
 { name: 'Latihan', path: '/practice', Icon: IconBolt },
 { name: 'Pengaturan', path: '/settings', Icon: IconSettings },
 ]

 const noVocab = vocab.length === 0

 return (
 <>
 <div className="fixed bottom-0 left-0 right-0 z-[130] flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] select-none">
 <div 
 className="w-full max-w-sm md:max-w-2xl rounded-[28px] flex items-center justify-between py-2 px-3 border border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)] transition-all duration-300 relative"
 >
 {/* Left Tabs */}
 <div className="flex-1 flex justify-around">
 {leftTabs.map((tab) => {
 const isActive = pathname === tab.path
 const Icon = tab.Icon
 return (
 <Link 
 key={tab.path} 
 href={tab.path}
 className="flex flex-col items-center justify-center gap-0.5 select-none no-underline flex-1 py-1 relative transition-transform active:scale-95"
 >
 <div 
 className={`transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-50 scale-100 hover:opacity-75'}`}
 style={{
 color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
 }}
 >
 <Icon size={20} />
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

 {/* Center Float Button (1-Tap Direct Launch SRS Quiz) */}
 <div className="flex justify-center px-1 shrink-0">
 <Link 
 href="/quiz"
 onClick={playTap}
 className="flex items-center justify-center select-none no-underline w-14 h-14 rounded-full bg-[var(--color-accent)] shadow-[0_6px_20px_var(--color-accent-glow)] active:scale-90 transition-all -mt-8 border-4 border-[var(--color-surface)]"
 >
 <span className="text-white transition-all duration-300 block">
 <IconTarget size={22} />
 </span>
 </Link>
 </div>

 {/* Right Tabs */}
 <div className="flex-1 flex justify-around">
 {rightTabs.map((tab) => {
 const isActive = pathname === tab.path
 const Icon = tab.Icon
 return (
 <Link 
 key={tab.path} 
 href={tab.path}
 className="flex flex-col items-center justify-center gap-0.5 select-none no-underline flex-1 py-1 relative transition-transform active:scale-95"
 >
 <div 
 className={`transition-all duration-200 ${isActive ? 'scale-110' : 'opacity-50 scale-100 hover:opacity-75'}`}
 style={{
 color: isActive ? 'var(--color-accent)' : 'var(--color-text-2)',
 }}
 >
 <Icon size={20} />
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
 onClick={closeModal} 
 />
 <div 
 ref={cardRef}
 className="bg-[var(--color-surface)] rounded-t-[32px] rounded-b-[24px] pt-6 px-6 pb-24 w-full max-w-sm md:max-w-2xl relative shadow-2xl z-10 border border-[var(--color-border)] animate-slide-up no-scrollbar"
 style={{
 maxHeight: '85dvh',
 overflowY: 'auto'
 }}
 >
 {/* Drag handle area */}
 <div 
 className="cursor-grab active:cursor-grabbing select-none touch-none"
 onPointerDown={handlePointerDown}
 onPointerMove={handlePointerMove}
 onPointerUp={handlePointerUp}
 onPointerCancel={handlePointerUp}
 >
 {/* Handle bar at the top */}
 <div className="w-12 h-1.5 rounded-full bg-[var(--color-border)] mx-auto mb-5" />

 <div className="flex items-center justify-between mb-5" onPointerDown={(e) => e.stopPropagation()}>
 <div>
 <h3 className="text-lg font-extrabold text-[var(--color-text-1)]">Pilih Latihan</h3>
 <p className="text-xs font-semibold text-[var(--color-text-2)] mt-0.5">Pilih jenis latihan yang ingin kamu ikuti</p>
 </div>
 <button 
 onClick={closeModal}
 className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-[var(--color-bg)] active:scale-95 transition-all text-xs"
 style={{ color: 'var(--color-text-2)' }}
 >
 ✕
 </button>
 </div>
 </div>

 {noVocab ? (
 <div className="rounded-2xl p-5 mb-5 text-center border border-[var(--color-accent)] bg-[var(--color-white)]">
 <div className="text-3xl mb-2">📋</div>
 <p className="font-extrabold text-sm text-[var(--color-text-1)]">Belum Ada Kosakata</p>
 <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1 mb-3">
 Kelola kosakata kamu terlebih dahulu di halaman Kelola Kosakata agar dapat berlatih.
 </p>
 <Link 
 href="/vocab" 
 onClick={handleLinkClick} 
 className="inline-block rounded-xl px-4 py-2 text-xs font-extrabold text-white no-underline bg-[var(--color-accent)] active:scale-95 transition-transform"
 >
 Kelola Kosakata ⚙️
 </Link>
 </div>
 ) : (
 <div className="space-y-4">
 {/* Section: Utama */}
 <div>
 <p className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-2.5">Latihan Utama</p>
 <div className="space-y-2.5">
 {/* Featured: SRS Vocab Quiz */}
 <Link href="/quiz" onClick={handleLinkClick} className="block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3.5 flex items-center gap-3.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all">
 <div className="text-3xl filter drop-shadow-sm">🧠</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-sm text-[var(--color-text-1)]">Kosakata Harian (SRS)</p>
 <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5 truncate">
 {srs && srs.dueCount > 0 ? `${srs.dueCount} kata siap direview` : 'Berlatih kosakata baru/due hari ini'}
 </p>
 </div>
 <span className="text-[var(--color-text-3)] font-bold text-lg">›</span>
 </div>
 </Link>

 {/* Grid: Kanji & Kana */}
 <div className="grid grid-cols-2 gap-2.5">
 {kanjiVocab.length > 0 && (
 <Link href="/quiz/kanji" onClick={handleLinkClick} className="block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="jp-serif text-2xl font-extrabold text-[var(--color-accent)] leading-none flex items-center justify-center w-8 h-8 bg-[var(--color-accent-light)] rounded-xl shrink-0">漢</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Membaca Kanji</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 Berlatih {kanjiVocab.length} kata Kanji
 </p>
 </div>
 </div>
 </Link>
 )}

 <Link href="/kana" onClick={handleLinkClick} className={`block no-underline active:scale-[0.98] transition-transform ${kanjiVocab.length === 0 ? 'col-span-2' : ''}`}>
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="jp-serif text-2xl font-extrabold text-indigo-500 leading-none flex items-center justify-center w-8 h-8 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl shrink-0">あ</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Hiragana & Katakana</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 104 karakter dasar Jepang
 </p>
 </div>
 </div>
 </Link>

 <Link href="/quiz?mode=listening" onClick={handleLinkClick} className="col-span-2 block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3.5 flex items-center gap-3 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="text-2xl flex items-center justify-center w-8 h-8 bg-purple-50 dark:bg-purple-950/30 rounded-xl shrink-0">🔊</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Kuis Pendengaran</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 Tebak arti kata dari suara pelafalan (Listening)
 </p>
 </div>
 </div>
 </Link>
 </div>
 </div>
 </div>

 {/* Section: Tata Bahasa */}
 <div>
 <p className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-2.5">Tata Bahasa & Kalimat</p>
 <div className="grid grid-cols-2 gap-2.5">
 {/* Latihan Partikel */}
 <Link href="/particles" onClick={handleLinkClick} className="block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="jp-serif text-2xl font-extrabold text-amber-500 leading-none flex items-center justify-center w-8 h-8 bg-amber-50 dark:bg-amber-950/30 rounded-xl shrink-0">助</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Kuis Partikel</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 Kuis partikel (は, が, を...)
 </p>
 </div>
 </div>
 </Link>

 {/* Penyusunan Kalimat */}
 <Link href="/sentences" onClick={handleLinkClick} className="col-span-2 block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="jp-serif text-2xl font-extrabold text-green-500 leading-none flex items-center justify-center w-8 h-8 bg-green-50 dark:bg-green-950/30 rounded-xl shrink-0">文</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Susun Kalimat</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 Susun kata jadi kalimat
 </p>
 </div>
 </div>
 </Link>
 </div>
 </div>

 {/* Section: Latihan Tambahan */}
 <div className="border-t border-[var(--color-border)] pt-4 mt-2">
 <p className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)] mb-2.5">Latihan Tambahan</p>
 <div className="grid grid-cols-2 gap-2.5">
 {/* Latihan Khusus */}
 <Link href="/quiz/special" onClick={handleLinkClick} className="block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="text-2xl flex items-center justify-center w-8 h-8 bg-amber-50 dark:bg-amber-950/30 rounded-xl shrink-0">🔢</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Latihan Khusus</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 Angka, Waktu, & Uang
 </p>
 </div>
 </div>
 </Link>

 {/* Latihan Per Bab */}
 {hasChapters && (
 <Link href="/quiz/chapters" onClick={handleLinkClick} className="block no-underline active:scale-[0.98] transition-transform">
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="text-2xl flex items-center justify-center w-8 h-8 bg-green-50 dark:bg-green-950/30 rounded-xl shrink-0">📖</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Latihan Per Bab</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 Bab dari Google Sheets
 </p>
 </div>
 </div>
 </Link>
 )}

 {/* Tinjau Salah (Weakness Review) */}
 <Link
 href={failedCount > 0 ? "/quiz?mode=failed" : "#"}
 onClick={(e) => {
 if (failedCount === 0) {
 e.preventDefault()
 return
 }
 handleLinkClick()
 }}
 className={`col-span-2 block no-underline active:scale-[0.98] transition-transform ${failedCount === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
 >
 <div className="rounded-2xl p-3 flex items-center gap-2.5 border border-[var(--color-border)] hover:bg-[var(--color-bg)] bg-[var(--color-white)] transition-all h-full">
 <div className="text-2xl flex items-center justify-center w-8 h-8 bg-red-50 dark:bg-red-950/30 rounded-xl shrink-0">❌</div>
 <div className="flex-1 min-w-0">
 <p className="font-extrabold text-xs text-[var(--color-text-1)] truncate">Tinjau Salah (Weakness Review)</p>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 line-clamp-2 leading-tight">
 {failedCount > 0 ? `${failedCount} kata salah siap diperbaiki` : 'Belum ada kosakata yang salah'}
 </p>
 </div>
 </div>
 </Link>
 </div>
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
