'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SENTENCE_QUESTIONS, type SentenceQuestion } from '@/lib/sentences-data'
import { playTap, speakJapanese } from '@/lib/sounds'
import { addFuriganaToSentence } from '@/lib/vocab'
import { useQuizEngine, TOTAL_QUESTIONS } from '@/lib/quiz-engine'
import { useQuizAudio } from '@/hooks/useQuizAudio'
import { getShowFurigana, setShowFurigana as saveShowFurigana } from '@/lib/storage'
import QuizHeader from '@/components/quiz/QuizHeader'
import FeedbackSheet from '@/components/quiz/FeedbackSheet'
import ResultScreen from '@/components/quiz/ResultScreen'
import ExitConfirmModal from '@/components/quiz/ExitConfirmModal'

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

export default function SentencesQuizPage() {
 const router = useRouter()

 const [questions, setQuestions] = useState<SentenceQuestion[]>(() => {
 return shuffle(SENTENCE_QUESTIONS).slice(0, TOTAL_QUESTIONS)
 })

 const [availableBlocks, setAvailableBlocks] = useState<string[]>([])
 const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
 const [showFurigana, setShowFurigana] = useState(true)

 useEffect(() => {
 setShowFurigana(getShowFurigana())
 }, [])

 const engine = useQuizEngine<SentenceQuestion>({
 queue: questions,
 srsEnabled: true,
 getSrsId: q => `sentence_${q.id}`,
 checkAnswer: (q, choice) => choice === q.japanese,
 })

 const q = engine.currentItem

 // Reset block pools on question change
 useEffect(() => {
 if (!q) return
 setAvailableBlocks(shuffle([...q.blocks]))
 setSelectedBlocks([])
 }, [engine.current, q])

 // TTS work untuk arti Indonesia → jepang blocks, dan saat feedback
 useQuizAudio(engine.phase, engine.currentItem, (item) => item.japanese, questions, engine.current)

 const handleBlockTap = (block: string, isFromSelected: boolean) => {
 if (engine.selected) return
 playTap()

 if (isFromSelected) {
 setSelectedBlocks(prev => prev.filter(b => b !== block))
 setAvailableBlocks(prev => [...prev, block])
 } else {
 setAvailableBlocks(prev => prev.filter(b => b !== block))
 setSelectedBlocks(prev => [...prev, block])
 }
 }

 const handleCheck = () => {
 if (engine.selected || selectedBlocks.length === 0 || !q) return
 const userSentence = selectedBlocks.join('')
 engine.answer(userSentence)
 if (userSentence === q.japanese) {
 speakJapanese(q.japanese)
 }
 }

 const handleRestart = () => {
 playTap()
 setQuestions(shuffle(SENTENCE_QUESTIONS).slice(0, TOTAL_QUESTIONS))
 engine.reset()
 }

 if (questions.length === 0 || engine.phase === 'result') {
 return (
 <ResultScreen
 correct={engine.sessionCorrect}
 total={engine.sessionAnswered}
 emoji="🏆"
 title="Susun Kalimat Selesai!"
 subtitle="Hebat! Kemampuan susun kalimatmu tercatat di SRS."
 onRetry={handleRestart}
 onHome={() => router.push('/')}
 />
 )
 }

 if (!q) return null

 return (
 <div className="min-h-dvh flex flex-col justify-between bg-[var(--color-bg)]">
 <div className="max-w-sm md:max-w-2xl mx-auto w-full flex-1 flex flex-col">
 {/* Header */}
 <QuizHeader
 progress={engine.progress}
 lives={engine.lives}
 livesEnabled={engine.livesEnabled}
 onClose={() => engine.setShowExitConfirm(true)}
 badges={<span className="badge bg-[var(--color-green-light)] text-[var(--color-green)]">Kalimat</span>}
 />

 {/* Content */}
 <div className="flex-1 px-4 flex flex-col justify-between pt-2 pb-24">
 <div>
 {/* Top row: Furigana toggle */}
 <div className="flex justify-between items-center mb-3">
 <p className="text-xs font-bold text-[var(--color-text-2)]">
 Soal {engine.current + 1} dari {questions.length}
 </p>
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
 </div>

 {/* Prompt Card */}
 <div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] p-6 shadow-card mb-6">
 <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)] mb-2 block">
 SUSUN KALIMAT JEPANG DARI ARTI BERIKUT:
 </span>
 <p className="text-lg font-extrabold text-[var(--color-text-1)] mb-2">
 &ldquo;{q.indonesian}&rdquo;
 </p>
 {engine.selected && (
 <p className="jp text-base font-bold text-[var(--color-text-2)] pt-3 border-t border-[var(--color-border-light)]">
 {showFurigana ? (
 <span dangerouslySetInnerHTML={{ __html: addFuriganaToSentence(q.japanese) }} />
 ) : (
 q.japanese
 )}
 </p>
 )}
 </div>

 {/* Assembled Blocks Drop Zone */}
 <div className="mb-4">
 <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-2">
 Hasil Susunan:
 </p>
 <div className="min-h-[60px] border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] p-3 bg-[var(--color-surface)] flex gap-2 flex-wrap items-center">
 {selectedBlocks.length === 0 ? (
 <span className="text-xs font-bold text-[var(--color-text-3)] italic">
 Ketuk blok kata di bawah untuk menyusun...
 </span>
 ) : (
 selectedBlocks.map((block, idx) => (
 <button
 key={idx}
 onClick={() => handleBlockTap(block, true)}
 disabled={!!engine.selected}
 className="jp px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)] font-extrabold text-sm shadow-card active:scale-95 transition-all cursor-pointer"
 >
 {block}
 </button>
 ))
 )}
 </div>
 </div>

 {/* Available Word Bank */}
 <div>
 <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-2">
 Pilihan Kata:
 </p>
 <div className="flex gap-2 flex-wrap min-h-[60px]">
 {availableBlocks.map((block, idx) => (
 <button
 key={idx}
 onClick={() => handleBlockTap(block, false)}
 disabled={!!engine.selected}
 className="jp px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-text-1)] border border-[var(--color-border)] font-extrabold text-sm shadow-card active:scale-95 transition-all cursor-pointer hover:border-[var(--color-accent)]"
 >
 {block}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Action Button */}
 {!engine.selected && (
 <button
 onClick={handleCheck}
 disabled={selectedBlocks.length === 0}
 className="w-full rounded-2xl py-4 text-sm font-extrabold text-white bg-[var(--color-accent)] active:scale-95 transition-all text-center shadow-elevated cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-6"
 >
 Periksa Susunan ✓
 </button>
 )}
 </div>
 </div>

 {/* Feedback Sheet */}
 {engine.selected && engine.isCorrect !== null && (
 <FeedbackSheet
 isCorrect={engine.isCorrect}
 statusText={engine.isCorrect ? '✨ Susunan Benar! 正解！' : '❌ Kurang Tepat'}
 detail={<span>💡 {q.explanation}</span>}
 onNext={engine.next}
 />
 )}

 {/* Exit Confirmation */}
 <ExitConfirmModal
 open={engine.showExitConfirm}
 onCancel={() => engine.setShowExitConfirm(false)}
 onExit={() => router.push('/')}
 />
 </div>
 )
}
