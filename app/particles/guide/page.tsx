'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PARTICLE_GUIDE_DATA } from '@/lib/particles-guide-data'
import { playTap, speakJapanese } from '@/lib/sounds'

export default function ParticleGuidePage() {
 const router = useRouter()
 const [searchQuery, setSearchQuery] = useState('')
 const [selectedTag, setSelectedTag] = useState<string | null>(null)
 const [activeStructureTab, setActiveStructureTab] = useState<'sop' | 'skp'>('sop')
 const [playingSentence, setPlayingSentence] = useState<string | null>(null)

 // Get list of particles with brief tags for filter chips
 const tagList = useMemo(() => {
 return PARTICLE_GUIDE_DATA.map(item => ({
 particle: item.particle,
 romaji: item.romaji,
 summary: item.summary.replace(/Menandai |Menunjukkan |Menunjuk |Menyatakan /gi, '')
 }))
 }, [])

 // Filter particle data based on search and selected tag
 const filteredData = useMemo(() => {
 return PARTICLE_GUIDE_DATA.filter(item => {
 const q = searchQuery.toLowerCase().trim()
 const matchesSearch = 
 !q ||
 item.particle.toLowerCase().includes(q) ||
 item.title.toLowerCase().includes(q) ||
 item.summary.toLowerCase().includes(q) ||
 item.romaji.toLowerCase().includes(q) ||
 item.description.toLowerCase().includes(q)

 const matchesTag = selectedTag ? item.particle === selectedTag : true

 return matchesSearch && matchesTag
 })
 }, [searchQuery, selectedTag])

 const handleTagClick = (tag: string) => {
 playTap()
 if (selectedTag === tag) {
 setSelectedTag(null)
 } else {
 setSelectedTag(tag)
 }
 }

 const handleClearFilters = () => {
 playTap()
 setSearchQuery('')
 setSelectedTag(null)
 }

 const handlePlayVoice = (text: string) => {
 playTap()
 setPlayingSentence(text)
 speakJapanese(text)
 setTimeout(() => setPlayingSentence(null), 2500)
 }

 return (
 <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
 <div className="max-w-md md:max-w-2xl mx-auto w-full px-4 pt-8 pb-28 flex-1 flex flex-col">
 
 {/* Header Navigation */}
 <header className="flex items-center gap-3.5 mb-6 anim-up">
 <button 
 onClick={() => {
 playTap()
 if (typeof window !== 'undefined' && window.history.length > 1) {
 router.back()
 } else {
 router.push('/')
 }
 }}
 className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold bg-[var(--color-surface)] text-[var(--color-text-1)] border border-[var(--color-border)] active:scale-95 transition-all shrink-0 shadow-sm cursor-pointer"
 >
 ←
 </button>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-black text-[var(--color-text-1)] tracking-tight">
 Panduan Partikel
 </h1>
 <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[var(--color-accent-light)] text-[var(--color-accent)]">
 助詞 11 Partikel
 </span>
 </div>
 <p className="text-xs font-bold text-[var(--color-text-2)] mt-0.5">
 Kamus interaktif & cara penggunaan tata bahasa Jepang
 </p>
 </div>
 </header>

 {/* Search Bar */}
 <div className="relative mb-4 anim-up d1">
 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-3)] pointer-events-none">
 🔍
 </div>
 <input
 type="text"
 placeholder="Cari partikel, romaji, atau fungsi (misal: 'wa', 'objek', 'を')..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full rounded-2xl py-3.5 pl-11 pr-10 text-xs font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all shadow-sm"
 />
 {searchQuery && (
 <button
 onClick={() => setSearchQuery('')}
 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-subtle)] text-[var(--color-text-2)] text-[10px] font-extrabold hover:bg-[var(--color-border)] transition-colors cursor-pointer"
 >
 ✕
 </button>
 )}
 </div>

 {/* Filter Chips Horizontal Scroll */}
 <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar shrink-0 select-none anim-up d1">
 <button
 onClick={() => {
 playTap()
 setSelectedTag(null)
 }}
 className={`rounded-2xl px-4 py-2 text-xs font-extrabold border transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer ${
 selectedTag === null
 ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/20'
 : 'bg-[var(--color-surface)] text-[var(--color-text-2)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
 }`}
 >
 <span>✨</span> Semua ({PARTICLE_GUIDE_DATA.length})
 </button>

 {tagList.map((tag) => {
 const isSelected = selectedTag === tag.particle
 return (
 <button
 key={tag.particle}
 onClick={() => handleTagClick(tag.particle)}
 className={`rounded-2xl px-3.5 py-2 text-xs font-black border transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer ${
 isSelected
 ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/20'
 : 'bg-[var(--color-surface)] text-[var(--color-text-1)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
 }`}
 >
 <span className="jp text-sm text-[var(--color-accent)] group-hover:scale-110 transition-transform">
 {tag.particle}
 </span>
 <span className="text-[10px] font-bold opacity-80 uppercase tracking-tight">
 ({tag.romaji})
 </span>
 </button>
 )
 })}
 </div>

 {/* Guide Content */}
 <div className="space-y-6 flex-1">
 
 {/* Interactive Japanese Sentence Structure Card (Shown when no filter is active) */}
 {!searchQuery && !selectedTag && (
 <section className="bg-gradient-to-br from-white via-white to-indigo-50/30 dark:from-[#1a1d24] dark:via-[#1a1d24] dark:to-indigo-950/20 border border-[var(--color-border)] rounded-[32px] p-6 shadow-sm relative overflow-hidden anim-up">
 {/* Background Japanese Watermark */}
 <span className="absolute -top-4 -right-4 text-8xl font-black text-indigo-500/5 dark:text-indigo-400/5 jp select-none pointer-events-none">
 文法
 </span>

 <header className="flex items-center justify-between mb-4 relative z-10">
 <div className="flex items-center gap-3">
 <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
 <span className="text-xl font-black jp">文</span>
 </div>
 <div>
 <h2 className="text-base font-black text-[var(--color-text-1)] tracking-tight">
 Struktur Kalimat Jepang
 </h2>
 <p className="text-[10px] font-extrabold text-[var(--color-text-3)] uppercase tracking-wider mt-0.5">
 Prinsip Utama: Predikat (P) Selalu di Akhir
 </p>
 </div>
 </div>
 </header>

 <p className="text-xs font-semibold text-[var(--color-text-2)] leading-relaxed mb-5 relative z-10">
 Berbeda dengan Bahasa Indonesia yang berurutan <strong>Subjek - Predikat - Objek (S-P-O)</strong>, Bahasa Jepang menempatkan <strong>Predikat (Kata Kerja/Sifat) di akhir kalimat</strong> dan menggunakan partikel sebagai kata hubung.
 </p>

 {/* Structure Tabs (SOP vs SKP) */}
 <div className="flex bg-[var(--color-bg)] p-1 rounded-2xl border border-[var(--color-border)] mb-4 relative z-10">
 <button
 onClick={() => { playTap(); setActiveStructureTab('sop') }}
 className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
 activeStructureTab === 'sop'
 ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
 : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
 }`}
 >
 🎯 Pola 1: S - O - P (Objek)
 </button>
 <button
 onClick={() => { playTap(); setActiveStructureTab('skp') }}
 className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
 activeStructureTab === 'skp'
 ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
 : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
 }`}
 >
 📍 Pola 2: S - K - P (Keterangan)
 </button>
 </div>

 {/* Tab Content Display */}
 {activeStructureTab === 'sop' ? (
 <div className="rounded-2xl p-4 bg-[var(--color-surface)]/80/80 border border-[var(--color-border)] space-y-4 anim-fade-in relative z-10">
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
 1. Subjek + Objek + Predikat (Makan, Baca, Minum...)
 </span>
 <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
 Partikel を (o)
 </span>
 </div>
 <p className="text-xs text-[var(--color-text-2)] font-medium leading-relaxed">
 Digunakan ketika subjek melakukan tindakan langsung terhadap suatu benda/objek.
 </p>
 </div>

 {/* Visual Formula Pills */}
 <div className="grid grid-cols-3 gap-2 text-center">
 <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
 <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 block uppercase tracking-wider">Subjek (S)</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)] jp mt-0.5 block">私<span className="text-blue-500 font-bold ml-0.5">は</span></span>
 <span className="text-[9px] font-semibold text-[var(--color-text-3)] block italic">Watashi wa</span>
 </div>
 <div className="rounded-xl p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40">
 <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 block uppercase tracking-wider">Objek (O)</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)] jp mt-0.5 block">リンゴ<span className="text-rose-500 font-bold ml-0.5">を</span></span>
 <span className="text-[9px] font-semibold text-[var(--color-text-3)] block italic">Ringo o</span>
 </div>
 <div className="rounded-xl p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
 <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">Predikat (P)</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)] jp mt-0.5 block">食べます</span>
 <span className="text-[9px] font-semibold text-[var(--color-text-3)] block italic">Tabemasu</span>
 </div>
 </div>

 {/* Playable Example Card */}
 <div className="pt-2 border-t border-[var(--color-border)]">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Perbandingan Bahasa:</span>
 <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Tekan 🔊 untuk mendengar</span>
 </div>
 <button
 onClick={() => handlePlayVoice('私はリンゴを食べます。')}
 className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
 playingSentence === '私はリンゴを食べます。'
 ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
 : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)]'
 }`}
 >
 <div>
 <p className="text-xs font-extrabold text-[var(--color-text-1)]">
 Saya <span className="text-rose-500 font-black">makan apel</span>. <span className="text-[10px] text-[var(--color-text-3)] font-normal">(Indo: S-P-O)</span>
 </p>
 <p className="text-sm font-black text-[var(--color-text-1)] jp mt-0.5">
 私<span className="text-blue-500">は</span> リンゴ<span className="text-rose-500">を</span> 食べます。
 </p>
 </div>
 <span className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs shrink-0 shadow-sm active:scale-90 transition-transform">
 🔊
 </span>
 </button>
 </div>
 </div>
 ) : (
 <div className="rounded-2xl p-4 bg-[var(--color-surface)]/80/80 border border-[var(--color-border)] space-y-4 anim-fade-in relative z-10">
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
 2. Subjek + Keterangan + Predikat (Pergi, Datang, Tinggal...)
 </span>
 <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
 Partikel へ (e) / に (ni) / で (de)
 </span>
 </div>
 <p className="text-xs text-[var(--color-text-2)] font-medium leading-relaxed">
 Digunakan ketika kalimat menyertakan tempat tujuan, waktu, atau alat/sarana.
 </p>
 </div>

 {/* Visual Formula Pills */}
 <div className="grid grid-cols-3 gap-2 text-center">
 <div className="rounded-xl p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
 <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 block uppercase tracking-wider">Subjek (S)</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)] jp mt-0.5 block">私<span className="text-blue-500 font-bold ml-0.5">は</span></span>
 <span className="text-[9px] font-semibold text-[var(--color-text-3)] block italic">Watashi wa</span>
 </div>
 <div className="rounded-xl p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
 <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 block uppercase tracking-wider">Keterangan (K)</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)] jp mt-0.5 block">学校<span className="text-amber-500 font-bold ml-0.5">へ</span></span>
 <span className="text-[9px] font-semibold text-[var(--color-text-3)] block italic">Gakkou e</span>
 </div>
 <div className="rounded-xl p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
 <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">Predikat (P)</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)] jp mt-0.5 block">行きます</span>
 <span className="text-[9px] font-semibold text-[var(--color-text-3)] block italic">Ikimasu</span>
 </div>
 </div>

 {/* Playable Example Card */}
 <div className="pt-2 border-t border-[var(--color-border)]">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Perbandingan Bahasa:</span>
 <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Tekan 🔊 untuk mendengar</span>
 </div>
 <button
 onClick={() => handlePlayVoice('私は学校へ行きます。')}
 className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
 playingSentence === '私は学校へ行きます。'
 ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
 : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)]'
 }`}
 >
 <div>
 <p className="text-xs font-extrabold text-[var(--color-text-1)]">
 Saya <span className="text-amber-500 font-black">pergi ke sekolah</span>. <span className="text-[10px] text-[var(--color-text-3)] font-normal">(Indo: S-P-K)</span>
 </p>
 <p className="text-sm font-black text-[var(--color-text-1)] jp mt-0.5">
 私<span className="text-blue-500">は</span> 学校<span className="text-amber-500">へ</span> 行きます。
 </p>
 </div>
 <span className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs shrink-0 shadow-sm active:scale-90 transition-transform">
 🔊
 </span>
 </button>
 </div>
 </div>
 )}
 </section>
 )}

 {/* Empty Search Result */}
 {filteredData.length === 0 ? (
 <div className="my-auto py-12 text-center rounded-[32px] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-sm anim-up">
 <span className="text-5xl mb-3 block">🔍</span>
 <p className="text-base font-extrabold text-[var(--color-text-1)]">Partikel Tidak Ditemukan</p>
 <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1 mb-5">
 Tidak ada kata partikel yang sesuai dengan kata kunci &quot;{searchQuery || selectedTag}&quot;.
 </p>
 <button
 onClick={handleClearFilters}
 className="rounded-2xl px-5 py-2.5 text-xs font-extrabold bg-[var(--color-accent)] text-white active:scale-95 transition-transform shadow-md cursor-pointer"
 >
 Reset Filter 🔄
 </button>
 </div>
 ) : (
 /* Particle Cards List */
 filteredData.map((item, index) => (
 <article 
 key={item.id}
 className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden anim-up"
 style={{ animationDelay: `${index * 0.05}s` }}
 >
 {/* Background Watermark */}
 <span className="absolute -top-6 -right-6 text-8xl font-black text-gray-100/60 dark:text-gray-800/20 jp select-none pointer-events-none">
 {item.particle}
 </span>

 {/* Particle Heading */}
 <header className="flex items-center justify-between mb-4 relative z-10">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--color-accent)] to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20 border-2 border-[var(--color-surface)] shrink-0">
 <span className="text-3xl font-black jp leading-none">
 {item.particle}
 </span>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base font-black text-[var(--color-text-1)] leading-snug">
 {item.title}
 </h2>
 </div>
 <span className="inline-block mt-0.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] uppercase tracking-wider">
 Partikel {item.romaji}
 </span>
 </div>
 </div>
 </header>

 {/* Analogy & Description Box */}
 <div className="rounded-2xl p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 mb-5 relative z-10">
 <p className="text-xs font-bold text-[var(--color-text-1)] leading-relaxed">
 {item.description}
 </p>
 </div>

 {/* Example Sentences List */}
 <div className="space-y-4 relative z-10">
 <div className="flex items-center justify-between">
 <h3 className="text-[10px] font-black text-[var(--color-text-3)] uppercase tracking-wider flex items-center gap-1.5">
 <span>📖</span> Contoh Penggunaan & Kalimat ({item.usages.length}):
 </h3>
 </div>

 <div className="space-y-3">
 {item.usages.map((usage, idx) => (
 <div 
 key={idx}
 className="rounded-2xl p-4 bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
 >
 {/* Usage Title */}
 <p className="text-xs font-black text-[var(--color-text-1)] mb-2 flex items-center gap-2">
 <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0"></span>
 {usage.title}
 </p>
 
 {/* Playable Japanese Sentence Button */}
 <button
 onClick={() => handlePlayVoice(usage.exampleJp)}
 className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer mb-2.5 ${
 playingSentence === usage.exampleJp
 ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] scale-[0.99]'
 : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] shadow-xs'
 }`}
 >
 <div>
 <p className="text-base font-black text-[var(--color-text-1)] jp tracking-wide leading-relaxed">
 {usage.exampleJp}
 </p>
 <p className="text-[10px] font-semibold text-[var(--color-text-2)] italic mt-0.5">
 &quot;{usage.exampleRomaji}&quot;
 </p>
 </div>
 <span className="w-8 h-8 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center text-xs shrink-0 shadow-xs group-hover:scale-110 transition-transform">
 🔊
 </span>
 </button>
 
 {/* Meaning */}
 <div className="flex items-start gap-1.5 mb-2 pl-1">
 <span className="text-xs font-bold text-[var(--color-text-3)]">Arti:</span>
 <span className="text-xs font-extrabold text-[var(--color-text-1)]">
 {usage.exampleId}
 </span>
 </div>

 {/* Explanation Note */}
 {usage.note && (
 <div className="text-[11px] font-semibold text-[var(--color-text-2)] leading-relaxed pl-2.5 border-l-2 border-[var(--color-accent)] bg-[var(--color-surface)]/40/40 py-1 rounded-r-lg">
 💡 {usage.note}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Card Footer CTA */}
 <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between relative z-10">
 <span className="text-[10px] font-bold text-[var(--color-text-3)]">
 Siap uji pemahamanmu?
 </span>
 <Link
 href="/particles"
 onClick={playTap}
 className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--color-accent)] hover:underline no-underline"
 >
 <span>Mulai Kuis {item.particle}</span>
 <span>→</span>
 </Link>
 </div>
 </article>
 ))
 )}

 </div>
 </div>
 </div>
 )
}
