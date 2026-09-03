'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PARTICLE_QUESTIONS, type ParticleQuestion } from '@/lib/particles-data'
import { playTap, speakJapanese } from '@/lib/sounds'
import { addFuriganaToSentence, extractVocabRefFromSentence } from '@/lib/vocab'
import { useQuizEngine, TOTAL_QUESTIONS } from '@/lib/quiz-engine'
import { useQuizAudio } from '@/hooks/useQuizAudio'
import { getShowFurigana, setShowFurigana as saveShowFurigana } from '@/lib/storage'
import QuizHeader from '@/components/quiz/QuizHeader'
import FeedbackSheet from '@/components/quiz/FeedbackSheet'
import ResultScreen from '@/components/quiz/ResultScreen'
import ExitConfirmModal from '@/components/quiz/ExitConfirmModal'
import { IconVolume, IconLightbulb } from '@/components/ui/icons'
import BottomNav from '@/components/BottomNav'

function generateQuestions(particle: string): ParticleQuestion[] {
 if (particle === 'all') {
 return [...PARTICLE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL_QUESTIONS)
 }

 let targetPool: ParticleQuestion[] = []
 let distractorPool: ParticleQuestion[] = []

 if (particle === 'lainnya') {
 const lainnyaList = ['へ', 'と', 'も', 'から', 'まで']
 targetPool = PARTICLE_QUESTIONS.filter(q => lainnyaList.some(p => q.correct.includes(p)))
 distractorPool = PARTICLE_QUESTIONS.filter(q => {
 const isTarget = lainnyaList.some(p => q.correct.includes(p))
 const hasOption = lainnyaList.some(p => q.options.includes(p))
 return !isTarget && hasOption
 })
 } else {
 targetPool = PARTICLE_QUESTIONS.filter(q => q.correct.includes(particle))
 distractorPool = PARTICLE_QUESTIONS.filter(q => !q.correct.includes(particle) && q.options.includes(particle))
 }

 const shuffledTargets = [...targetPool].sort(() => Math.random() - 0.5)
 const shuffledDistractors = [...distractorPool].sort(() => Math.random() - 0.5)

 const targetCount = Math.min(5, shuffledTargets.length)
 const distractorCount = Math.min(TOTAL_QUESTIONS - targetCount, shuffledDistractors.length)

 const selectedTargets = shuffledTargets.slice(0, targetCount)
 const selectedDistractors = shuffledDistractors.slice(0, distractorCount)

 let combined = [...selectedTargets, ...selectedDistractors]
 if (combined.length < TOTAL_QUESTIONS) {
 const remainingTargets = shuffledTargets.slice(targetCount)
 const needed = TOTAL_QUESTIONS - combined.length
 combined = [...combined, ...remainingTargets.slice(0, needed)]
 }

 return combined.sort(() => Math.random() - 0.5)
}

export default function ParticlesQuizPage() {
 return (
 <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]"><p className="text-sm font-bold text-[var(--color-text-2)]">Memuat halaman kuis...</p></div>}>
 <ParticlesQuizContent />
 </Suspense>
 )
}

function ParticlesQuizContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const pParam = searchParams.get('p')

 const [selectedParticle, setSelectedParticle] = useState<string | null>(null)
 const [questions, setQuestions] = useState<ParticleQuestion[]>([])
 const [showFurigana, setShowFurigana] = useState(true)

 useEffect(() => {
 setShowFurigana(getShowFurigana())
 }, [])

 useEffect(() => {
 if (pParam) {
 setQuestions(generateQuestions(pParam))
 setSelectedParticle(pParam)
 } else {
 setSelectedParticle(null)
 }
 }, [pParam])

 const engine = useQuizEngine<ParticleQuestion>({
 queue: questions,
 srsEnabled: true,
 getSrsId: q => `particle_${q.id}`,
 checkAnswer: (q, choice) => choice === q.correct,
 })

 // Auto-speak via hook terpusat
 useQuizAudio(engine.phase, engine.currentItem, (item) => item.sentence.replace('___', item.correct), questions, engine.current)

 const startQuizWithParticle = (part: string) => {
 playTap()
 router.push(`/particles?p=${part}`)
 }

 // ── 1. Selection Screen (if no ?p=) ──
 if (selectedParticle === null) {
 const particleCounts = {
 all: PARTICLE_QUESTIONS.length,
 'は': PARTICLE_QUESTIONS.filter(q => q.correct.includes('は')).length,
 'が': PARTICLE_QUESTIONS.filter(q => q.correct.includes('が')).length,
 'を': PARTICLE_QUESTIONS.filter(q => q.correct.includes('を')).length,
 'に': PARTICLE_QUESTIONS.filter(q => q.correct.includes('に')).length,
 'で': PARTICLE_QUESTIONS.filter(q => q.correct.includes('で')).length,
 'の': PARTICLE_QUESTIONS.filter(q => q.correct.includes('の')).length,
 'lainnya': PARTICLE_QUESTIONS.filter(q => {
 const p = q.correct
 return p.includes('へ') || p.includes('と') || p.includes('も') || p.includes('から') || p.includes('まで')
 }).length
 }

 return (
 <div className="min-h-dvh flex flex-col justify-between bg-[var(--color-bg)]">
 <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
 <header className="flex items-center gap-4 mb-8 anim-up">
 <button
 onClick={() => router.push('/')}
 className="w-9 h-9 rounded-xl flex items-center justify-center font-bold bg-[var(--color-surface)] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0 cursor-pointer"
 >
 ←
 </button>
 <div>
 <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Latihan Partikel</h1>
 <p className="text-xs font-semibold text-[var(--color-text-2)]">Pilih fokus partikel yang ingin kamu latih</p>
 </div>
 </header>

 <div className="space-y-4 my-auto">
 <button
 onClick={() => startQuizWithParticle('all')}
 className="w-full text-left bg-[var(--color-accent)] text-white rounded-[24px] p-5 shadow-elevated border-none active:scale-[0.98] transition-transform cursor-pointer"
 >
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-base font-black">⚡ Campur Semua</h3>
 <p className="text-[10px] opacity-85 font-bold mt-1">Latihan gabungan dari seluruh partikel ({particleCounts.all} soal)</p>
 </div>
 <span className="text-2xl">🎯</span>
 </div>
 </button>

 <div className="grid grid-cols-2 gap-3">
 {[
 { key: 'は', title: 'Topik (は)', desc: 'Penunjuk Topik utama', icon: 'は', bg: 'bg-[var(--color-indigo-light)] text-[var(--color-indigo)] border-[var(--color-border)]' },
 { key: 'が', title: 'Subjek (が)', desc: 'Penunjuk Pelaku/Eksistensi', icon: 'が', bg: 'bg-[var(--color-indigo-light)] text-[var(--color-indigo)] border-[var(--color-border)]' },
 { key: 'を', title: 'Objek (を)', desc: 'Penunjuk Target tindakan', icon: 'を', bg: 'bg-[var(--color-red-light)] text-[var(--color-red)] border-[var(--color-border)]' },
 { key: 'に', title: 'Koordinat (に)', desc: 'Waktu spesifik / Tempat diam', icon: 'に', bg: 'bg-[var(--color-amber-light)] text-[var(--color-amber)] border-[var(--color-border)]' },
 { key: 'で', title: 'Aktivitas (で)', desc: 'Latar aksi / Alat bantu', icon: 'で', bg: 'bg-[var(--color-green-light)] text-[var(--color-green)] border-[var(--color-border)]' },
 { key: 'の', title: 'Kepunyaan (の)', desc: 'Lem perekat Kata Benda', icon: 'の', bg: 'bg-[var(--color-purple-light)] text-[var(--color-purple)] border-[var(--color-border)]' }
 ].map(p => (
 <button
 key={p.key}
 onClick={() => startQuizWithParticle(p.key)}
 className="rounded-[24px] p-4 text-left border flex flex-col justify-between h-32 active:scale-95 transition-transform cursor-pointer bg-[var(--color-surface)] border-[var(--color-border)] shadow-card"
 >
 <div className="flex items-center justify-between w-full">
 <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black jp text-base ${p.bg}`}>
 {p.icon}
 </span>
 <span className="badge bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)]">
 {(particleCounts as any)[p.key]} soal
 </span>
 </div>
 <div>
 <h4 className="text-xs font-black text-[var(--color-text-1)] mt-2">{p.title}</h4>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 leading-tight">{p.desc}</p>
 </div>
 </button>
 ))}

 <button
 onClick={() => startQuizWithParticle('lainnya')}
 className="col-span-2 rounded-[24px] p-4 text-left border flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer bg-[var(--color-surface)] border-[var(--color-border)] shadow-card"
 >
 <div className="flex items-center gap-3.5">
 <span className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)] shrink-0">
 🔗
 </span>
 <div>
 <h4 className="text-xs font-black text-[var(--color-text-1)]">Partikel Lainnya (へ, と, も, から, まで)</h4>
 <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 leading-tight">Menyatakan arah, penyerta, kesamaan, awal/akhir</p>
 </div>
 </div>
 <span className="badge bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)] shrink-0">
 {particleCounts.lainnya} soal
 </span>
 </button>
 </div>
 </div>
 </div>
 <BottomNav />
 </div>
 )
 }

 // ── 2. Result Screen ──
 if (questions.length === 0 || engine.phase === 'result') {
 return (
 <ResultScreen
 correct={engine.sessionCorrect}
 total={engine.sessionAnswered}
 emoji="🏆"
 title="Latihan Partikel Selesai!"
 subtitle="Hebat! Progres partikel telah disimpan ke SRS."
 onRetry={() => {
 setQuestions(generateQuestions(selectedParticle))
 engine.reset()
 }}
 onHome={() => router.push('/particles')}
 homeLabel="Pilih Partikel Lain"
 />
 )
 }

 // ── 3. Active Quiz Question ──
 const q = engine.currentItem
 if (!q) return null

 return (
 <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto bg-[var(--color-bg)]">
 <QuizHeader
 progress={engine.progress}
 lives={engine.lives}
 livesEnabled={engine.livesEnabled}
 onClose={() => engine.setShowExitConfirm(true)}
 badges={<span className="badge bg-[var(--color-amber-light)] text-[var(--color-amber)]">Partikel</span>}
 />

 <div className="flex-1 px-4 flex flex-col justify-between">
 <div>
 {/* Top Info Bar */}
 <div className="flex justify-between items-center mb-3">
 <button
 onClick={() => {
 const newVal = !showFurigana
 setShowFurigana(newVal)
 saveShowFurigana(newVal)
 playTap()
 }}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
 showFurigana ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-[var(--color-surface)] text-[var(--color-text-3)] border-[var(--color-border)]'
 }`}
 >
 <span>あ</span>
 <span>Furigana: {showFurigana ? 'ON' : 'OFF'}</span>
 </button>

 <button
 onClick={() => { playTap(); router.push('/particles/guide') }}
 className="text-[10px] font-extrabold text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer bg-[var(--color-accent-light)] px-2.5 py-1 rounded-full border-none"
 >
 📖 Lihat Panduan
 </button>
 </div>

 {/* Question Card */}
 <div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-6 shadow-card mb-6 text-center relative overflow-hidden">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)]">
 PILIH PARTIKEL YANG TEPAT ({selectedParticle === 'all' ? 'CAMPUR' : `FOKUS ${selectedParticle.toUpperCase()}`})
 </span>
 <button
 onClick={() => speakJapanese(q.sentence.replace('___', q.correct))}
 className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-2)] cursor-pointer"
 title="Pelafalan"
 >
 <IconVolume size={14} />
 </button>
 </div>

 <h2 className="text-2xl font-black jp tracking-wide leading-relaxed text-[var(--color-text-1)] mb-4 select-text">
 {showFurigana ? (
 <span dangerouslySetInnerHTML={{
 __html: addFuriganaToSentence(
 engine.selected ? q.sentence.replace('___', ` 【 ${q.correct} 】 `) : q.sentence
 )
 }} />
 ) : (
 engine.selected ? q.sentence.replace('___', ` 【 ${q.correct} 】 `) : q.sentence
 )}
 </h2>
 <div className="h-[1px] w-full bg-[var(--color-border-light)] my-4" />
 <p className="text-xs font-bold text-[var(--color-text-2)] leading-relaxed">
 Arti: {q.translation}
 </p>

 {/* Vocab Reference Breakdown */}
 {(() => {
 const refs = extractVocabRefFromSentence(q.sentence)
 if (refs.length === 0) return null
 return (
 <div className="mt-4 pt-3 border-t border-[var(--color-border-light)] text-left">
 <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)] mb-2 flex items-center gap-1">
 <IconLightbulb size={12} /> Kosakata Minna no Nihongo:
 </p>
 <div className="flex flex-wrap gap-1.5">
 {refs.map((v, i) => (
 <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-bg)] text-[10px] font-bold text-[var(--color-text-1)] border border-[var(--color-border-light)]">
 <span className="jp font-black text-xs">{v.kanji}</span>
 <span className="text-[var(--color-text-3)] text-[9px]">({v.hiragana})</span>
 <span className="text-[var(--color-text-2)]">{v.arti}</span>
 </span>
 ))}
 </div>
 </div>
 )
 })()}
 </div>

 {/* Option Grid */}
 <div className="grid grid-cols-2 gap-3.5 mb-6">
 {q.options.map((opt, idx) => {
 const isSel = engine.selected === opt
 const isCorrectOpt = opt === q.correct

 let style = "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-1)] hover:border-[var(--color-accent)]"

 if (engine.selected) {
 if (isCorrectOpt) {
 style = "border-[var(--color-green)] bg-[var(--color-green-light)] text-[var(--color-green-dark)] font-extrabold"
 } else if (isSel && !engine.isCorrect) {
 style = "border-[var(--color-red)] bg-[var(--color-red-light)] text-[var(--color-red-dark)] font-extrabold"
 }
 }

 return (
 <button
 key={opt}
 onClick={() => engine.answer(opt)}
 disabled={!!engine.selected}
 className={`rounded-[var(--radius-md)] p-4 border-2 transition-all active:scale-95 flex items-center justify-between min-h-[64px] cursor-pointer shadow-card ${style}`}
 >
 <span className="text-xs font-black opacity-50">{String.fromCharCode(65 + idx)}</span>
 <span className="jp text-2xl font-black">{opt}</span>
 <span className="w-4 text-right text-xs">
 {engine.selected && isCorrectOpt ? '✓' : engine.selected && isSel && !engine.isCorrect ? '✕' : ''}
 </span>
 </button>
 )
 })}
 </div>
 </div>
 </div>

 {/* Feedback Sheet */}
 {engine.selected && engine.isCorrect !== null && (
 <FeedbackSheet
 isCorrect={engine.isCorrect}
 statusText={engine.isCorrect ? '✨ Jawaban Benar! 正解！' : '❌ Jawaban Kurang Tepat'}
 detail={<span>💡 {q.explanation}</span>}
 onNext={engine.next}
 />
 )}

 {/* Exit Modal */}
 <ExitConfirmModal
 open={engine.showExitConfirm}
 onCancel={() => engine.setShowExitConfirm(false)}
 onExit={() => router.push('/particles')}
 />
 </div>
 )
}
