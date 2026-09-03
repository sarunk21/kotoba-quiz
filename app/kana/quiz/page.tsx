'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KANA, kanaId, type KanaType, type KanaCard, getConfusableDistractors } from '@/lib/kana'
import { MASTERED_LEVEL } from '@/lib/srs'
import { playTap, speakJapanese } from '@/lib/sounds'
import { useQuizEngine, TOTAL_QUESTIONS } from '@/lib/quiz-engine'
import { useQuizAudio } from '@/hooks/useQuizAudio'
import QuizHeader from '@/components/quiz/QuizHeader'
import FeedbackSheet from '@/components/quiz/FeedbackSheet'
import ResultScreen from '@/components/quiz/ResultScreen'
import ExitConfirmModal from '@/components/quiz/ExitConfirmModal'
import { IconVolume } from '@/components/ui/icons'

type QuizMode = 'kana→romaji' | 'romaji→kana' | 'audio→kana'

interface SessionQuestionItem {
 card: KanaCard
 effectiveType: KanaType
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

function getChoices(
 correctCard: KanaCard, 
 effectiveType: KanaType, 
 pool: KanaCard[], 
 mode: QuizMode
): string[] {
 const getVal = (c: KanaCard) => {
 if (mode === 'kana→romaji') return c.romaji
 return effectiveType === 'hiragana' ? c.hiragana : c.katakana
 }

 const confusableIds = getConfusableDistractors(correctCard, effectiveType)
 const confusablePool = pool.filter(c => confusableIds.includes(c.id) && c.id !== correctCard.id)
 const similarWrongs = shuffle(confusablePool).slice(0, 3)
 
 const needed = 3 - similarWrongs.length
 let paddingWrongs: KanaCard[] = []
 if (needed > 0) {
 const excludedIds = new Set([correctCard.id, ...similarWrongs.map(w => w.id)])
 const remainingPool = pool.filter(c => !excludedIds.has(c.id))
 paddingWrongs = shuffle(remainingPool).slice(0, needed)
 }
 
 const wrongs = [...similarWrongs, ...paddingWrongs].map(getVal)
 return shuffle([getVal(correctCard), ...wrongs])
}

export default function KanaQuizPage() {
 return (
 <Suspense fallback={
 <div className="flex items-center justify-center min-h-dvh bg-[var(--color-bg)]">
 <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat kuis Kana...</p>
 </div>
 }>
 <KanaQuizContent />
 </Suspense>
 )
}

function KanaQuizContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const rawType = searchParams.get('type') || 'hiragana'
 const ids = searchParams.get('ids')?.split(',') ?? KANA.map(c => c.id)

 const pool = useMemo(() => KANA.filter(c => ids.includes(c.id)), [ids])

 const [queue, setQueue] = useState<SessionQuestionItem[]>([])
 const [choices, setChoices] = useState<string[]>([])
 const [quizMode, setQuizMode] = useState<QuizMode>('kana→romaji')
 const [showRomajiHint, setShowRomajiHint] = useState(false)
 const [isInitialized, setIsInitialized] = useState(false)

 const buildQueueSession = useCallback(() => {
 const selectedCards = shuffle(pool).slice(0, Math.min(TOTAL_QUESTIONS, pool.length))
 const qList: SessionQuestionItem[] = selectedCards.map(card => {
 let effType: KanaType = 'hiragana'
 if (rawType === 'both') {
 effType = Math.random() > 0.5 ? 'katakana' : 'hiragana'
 } else if (rawType === 'katakana') {
 effType = 'katakana'
 }
 return { card, effectiveType: effType }
 })
 setQueue(qList)
 if (qList[0]) {
 setChoices(getChoices(qList[0].card, qList[0].effectiveType, pool.length >= 4 ? pool : KANA, quizMode))
 }
 }, [pool, rawType, quizMode])

 useEffect(() => {
 buildQueueSession()
 setIsInitialized(true)
 }, [buildQueueSession])

 const engine = useQuizEngine<SessionQuestionItem>({
 queue,
 srsEnabled: true,
 getSrsId: item => kanaId(item.card.id, item.effectiveType),
 checkAnswer: (item, choice) => {
 const correctVal = quizMode === 'kana→romaji'
 ? item.card.romaji
 : (item.effectiveType === 'hiragana' ? item.card.hiragana : item.card.katakana)
 return choice === correctVal
 },
 })

 // Update choices on question change
 useEffect(() => {
 if (engine.currentItem) {
 const nextPool = pool.length >= 4 ? pool : KANA
 setChoices(getChoices(engine.currentItem.card, engine.currentItem.effectiveType, nextPool, quizMode))
 setShowRomajiHint(false)
 }
 }, [engine.current, engine.currentItem, pool, quizMode])

 // Auto-play via hook terpusat — TTS work untuk semua kana
 useQuizAudio(engine.phase, engine.currentItem, (item) => {
 return item.effectiveType === 'hiragana' ? item.card.hiragana : item.card.katakana
 }, queue, engine.current)

 if (!isInitialized) return null

 if (queue.length === 0 || engine.phase === 'result') {
 return (
 <ResultScreen
 correct={engine.sessionCorrect}
 total={engine.sessionAnswered}
 emoji="🎉"
 title="Kuis Kana Selesai!"
 subtitle={`Kuis ${rawType === 'both' ? 'Kana Gabungan' : rawType === 'hiragana' ? 'Hiragana' : 'Katakana'}`}
 onRetry={() => {
 buildQueueSession()
 engine.reset()
 }}
 onHome={() => router.replace('/kana')}
 homeLabel="Kembali ke Menu Kana"
 />
 )
 }

 const currentItem = engine.currentItem
 if (!currentItem) return null

 const { card, effectiveType } = currentItem
 const displayKana = effectiveType === 'hiragana' ? card.hiragana : card.katakana
 const correctVal = quizMode === 'kana→romaji'
 ? card.romaji
 : (effectiveType === 'hiragana' ? card.hiragana : card.katakana)

 const kid = kanaId(card.id, effectiveType)
 const wpLevel = engine.getProgress(kid)

 return (
 <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto bg-[var(--color-bg)]">
 {/* Quiz Header */}
 <QuizHeader
 progress={engine.progress}
 lives={engine.lives}
 livesEnabled={engine.livesEnabled}
 onClose={() => engine.setShowExitConfirm(true)}
 badges={
 <div className="flex items-center gap-1.5">
 {engine.roundStreak >= 2 && <span className="badge bg-[var(--color-amber-light)] text-[var(--color-amber)]">🔥 {engine.roundStreak}x</span>}
 </div>
 }
 />

 {/* Main Body */}
 <div className="flex-1 px-4 flex flex-col">
 <div className="flex items-center justify-between mb-3">
 <p className="text-xs font-extrabold text-[var(--color-text-3)]">
 Soal {engine.current + 1} dari {queue.length}
 </p>
 <div className="flex items-center gap-2">
 <span className="badge bg-[var(--color-accent-light)] text-[var(--color-accent)]">
 {effectiveType === 'hiragana' ? 'Hiragana あ' : 'Katakana ア'}
 </span>
 <div className="flex items-center gap-1 rounded-full px-2.5 py-1 bg-[var(--color-surface)] border border-[var(--color-border)]">
 <div className="w-1.5 h-1.5 rounded-full" style={{ background: wpLevel >= MASTERED_LEVEL ? 'var(--color-green)' : wpLevel >= 3 ? 'var(--color-accent)' : wpLevel >= 1 ? 'var(--color-amber)' : 'var(--color-text-3)' }} />
 <span className="text-[10px] font-bold text-[var(--color-text-2)]">
 {wpLevel === 0 ? 'Baru' : wpLevel >= MASTERED_LEVEL ? 'Hafal' : `Lv${wpLevel}`}
 </span>
 </div>
 </div>
 </div>

 {/* Mode Toggles */}
 <div className="flex items-center justify-between mb-4">
 <p className="text-xs font-bold text-[var(--color-text-2)]">
 {quizMode === 'kana→romaji' ? 'Pilih Romaji yang benar:' : quizMode === 'romaji→kana' ? 'Pilih karakter Kana:' : 'Dengarkan suara & pilih karakter:'}
 </p>
 <div className="flex gap-2">
 <button
 onClick={() => { playTap(); setShowRomajiHint(v => !v) }}
 className={`rounded-xl px-2.5 py-1 text-[11px] font-extrabold border cursor-pointer ${showRomajiHint ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-[var(--color-surface)] text-[var(--color-text-2)] border-[var(--color-border)]'}`}
 >
 {showRomajiHint ? '👁' : '🙈'} Hint
 </button>
 <button
 onClick={() => {
 playTap()
 setQuizMode(m => m === 'kana→romaji' ? 'romaji→kana' : m === 'romaji→kana' ? 'audio→kana' : 'kana→romaji')
 }}
 className="rounded-xl px-2.5 py-1 text-[11px] font-black bg-[var(--color-surface)] text-[var(--color-text-1)] border border-[var(--color-border)] cursor-pointer"
 >
 {quizMode === 'kana→romaji' ? 'あ → A' : quizMode === 'romaji→kana' ? 'A → あ' : '🔊 → あ'}
 </button>
 </div>
 </div>

 {/* Card */}
 <div key={engine.cardKey} className="rounded-[var(--radius-xl)] text-center mb-6 relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-card p-8">
 <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: `radial-gradient(ellipse at 50% 0%, ${effectiveType === 'hiragana' ? 'var(--color-accent-light)' : 'var(--color-purple-light)'} 0%, transparent 70%)` }} />

 <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
 <button onClick={() => { playTap(); speakJapanese(displayKana, true) }} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs cursor-pointer" title="Slow-mo">🐢</button>
 <button onClick={() => { playTap(); speakJapanese(displayKana, false) }} className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-2)] cursor-pointer" title="Normal"><IconVolume size={14} /></button>
 </div>

 {quizMode === 'kana→romaji' ? (
 <div className="relative">
 {showRomajiHint && <p className="text-xs font-extrabold text-[var(--color-accent)] tracking-widest mb-1">[ HINT: {card.romaji} ]</p>}
 <p className="jp-serif font-black text-6xl md:text-7xl text-[var(--color-text-1)] leading-none my-2">{displayKana}</p>
 </div>
 ) : quizMode === 'romaji→kana' ? (
 <div className="relative my-2"><p className="text-4xl md:text-5xl font-black text-[var(--color-accent)] tracking-wider">{card.romaji}</p></div>
 ) : (
 <div className="relative py-3">
 <button onClick={() => speakJapanese(displayKana)} className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-lg cursor-pointer text-2xl">🔊</button>
 <p className="text-xs font-bold text-[var(--color-text-2)] mt-3">Tekan untuk memutar ulang suara</p>
 </div>
 )}
 </div>

 {/* Choice Grid */}
 <div className="grid grid-cols-2 gap-3 mb-6">
 {choices.map((choice, i) => {
 let style = 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-1)] hover:border-[var(--color-accent)]'
 if (engine.selected) {
 if (choice === correctVal) style = 'bg-[var(--color-green)] text-white border-[var(--color-green)] shadow-md'
 else if (choice === engine.selected) style = 'bg-[var(--color-red)] text-white border-[var(--color-red)] shadow-md'
 else style = 'opacity-30 bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-2)]'
 }

 return (
 <button
 key={i}
 disabled={!!engine.selected}
 onClick={() => engine.answer(choice)}
 className={`p-4 rounded-[var(--radius-md)] font-black text-xl md:text-2xl transition-all border active:scale-95 cursor-pointer flex items-center justify-center min-h-[64px] ${style}`}
 >
 <span className={quizMode === 'kana→romaji' ? 'font-black tracking-wide' : 'jp font-black text-3xl'}>{choice}</span>
 </button>
 )
 })}
 </div>

 {/* Feedback Sheet */}
 {engine.selected && engine.isCorrect !== null && (
 <FeedbackSheet
 isCorrect={engine.isCorrect}
 statusText={engine.isCorrect ? '✨ Benar! 正解！' : '❌ Kurang Tepat'}
 detail={<span>Jawaban benar: <strong className="jp text-base">{displayKana}</strong> = <span className="uppercase">{card.romaji}</span></span>}
 onNext={engine.next}
 />
 )}

 <ExitConfirmModal
 open={engine.showExitConfirm}
 onCancel={() => engine.setShowExitConfirm(false)}
 onExit={() => router.replace('/kana')}
 />
 </div>
 </div>
 )
}
