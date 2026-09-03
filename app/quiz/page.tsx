'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadLocalVocab, getDisplayText, type VocabItem, getGlobalVocab, addFuriganaToSentence } from '@/lib/vocab'
import { recordFailedWord, removeFailedWord, getFailedWords } from '@/lib/failed'
import { loadSRS, buildQueue, MASTERED_LEVEL, type SRSStore } from '@/lib/srs'
import { playTap, speakJapanese } from '@/lib/sounds'
import { SPECIALIZED_DATA } from '@/lib/specialized'
import { getWordJLPTLevel } from '@/lib/jlpt'
import { useQuizEngine, TOTAL_QUESTIONS } from '@/lib/quiz-engine'
import { useQuizAudio } from '@/hooks/useQuizAudio'
import { getShowFurigana, setShowFurigana as saveShowFurigana } from '@/lib/storage'
import { shuffle, getVocabChoices, getCategoryStyle, getNextReviewLabel } from '@/lib/quiz-helpers'
import QuizHeader from '@/components/quiz/QuizHeader'
import FeedbackSheet from '@/components/quiz/FeedbackSheet'
import ResultScreen from '@/components/quiz/ResultScreen'
import ExitConfirmModal from '@/components/quiz/ExitConfirmModal'
import { IconVolume, IconSlowMo, IconLightbulb } from '@/components/ui/icons'

// shuffle, getVocabChoices, getCategoryStyle, getNextReviewLabel kini terpusat di lib/quiz-helpers.ts (ponytail)
const getChoices = getVocabChoices

function parseChapterNum(chapterStr?: string): number {
 if (!chapterStr) return 1
 const match = chapterStr.match(/\d+/)
 return match ? parseInt(match[0], 10) : 1
}

function getMaxActiveChapterNumber(vocabList: VocabItem[], store: SRSStore): number {
 let maxChapter = 1
 for (const item of vocabList) {
 const prog = store[item.id]
 if (prog && (prog.level > 0 || prog.correctCount > 0 || prog.wrongCount > 0)) {
 const chNum = parseChapterNum(item.chapter)
 if (chNum > maxChapter) maxChapter = chNum
 }
 }
 return maxChapter
}

export default function QuizPage() {
 return (
 <Suspense fallback={
 <div className="flex items-center justify-center min-h-dvh bg-[var(--color-bg)]">
 <div className="text-center">
 <p className="jp text-3xl mb-3 text-[var(--color-text-2)]">読み込み中</p>
 <div className="flex justify-center gap-1.5">
 {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[var(--color-accent)]" style={{ opacity: 0.3 + i * 0.35 }} />)}
 </div>
 </div>
 </div>
 }>
 <QuizContent />
 </Suspense>
 )
}

function QuizContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const mode = searchParams.get('mode')
 const type = searchParams.get('type')
 const chapter = searchParams.get('chapter')
 const level = searchParams.get('level')
 const isKanjiMode = mode === 'kanji'
 const isSpecialMode = mode === 'special'
 const isListeningMode = mode === 'listening'

 const [vocab, setVocab] = useState<VocabItem[]>([])
 const [questionPool, setQuestionPool] = useState<VocabItem[]>([])
 const [queue, setQueue] = useState<VocabItem[]>([])
 const [choices, setChoices] = useState<string[]>([])
 const [showHint, setShowHint] = useState(false)
 const [showFurigana, setShowFurigana] = useState(true)
 const [isInitialized, setIsInitialized] = useState(false)

 // Initialize queue — pakai TOTAL_QUESTIONS terpusat
 const buildAndSetQueue = useCallback((v: VocabItem[], store: SRSStore, fullPool?: VocabItem[]) => {
 const { dueIds, newIds, refreshIds } = buildQueue(v.map(i => i.id), store, TOTAL_QUESTIONS)
 const allIds = [...dueIds, ...newIds, ...refreshIds].slice(0, TOTAL_QUESTIONS)
 const map = Object.fromEntries(v.map(i => [i.id, i]))
 const qList = allIds.map(id => map[id]).filter(Boolean)
 setQueue(qList)
 if (qList.length > 0) {
 setChoices(getChoices(qList[0], fullPool || v))
 }
 }, [])

 useEffect(() => {
 setShowFurigana(getShowFurigana())
 }, [])

 useEffect(() => {
 const store = loadSRS()
 if (isSpecialMode) {
 const allCategoryItems = SPECIALIZED_DATA[type || ''] || []
 let filtered = allCategoryItems
 if (chapter) filtered = allCategoryItems.filter(item => item.chapter === chapter)
 if (filtered.length > 0) {
 setVocab(allCategoryItems)
 setQuestionPool(filtered)
 buildAndSetQueue(filtered, store, allCategoryItems)
 setIsInitialized(true)
 } else {
 setIsInitialized(true)
 }
 return
 }

 let v: VocabItem[] | null = getGlobalVocab()
 if (!v || v.length === 0) v = loadLocalVocab()

 if (v && v.length > 0) {
 let pool = v
 if (isKanjiMode) pool = pool.filter(item => item.kanji && item.kanji !== item.hiragana)
 if (mode === 'failed') {
 const failedIds = new Set(getFailedWords())
 pool = pool.filter(item => failedIds.has(item.id))
 }

 let filtered = pool
 if (chapter) {
 filtered = pool.filter(item => item.chapter === chapter)
 } else if (!isKanjiMode && !isSpecialMode && mode !== 'failed' && !level) {
 const maxActiveCh = getMaxActiveChapterNumber(pool, store)
 const adaptivePool = pool.filter(item => parseChapterNum(item.chapter) <= maxActiveCh)
 if (adaptivePool.length > 0) filtered = adaptivePool
 }
 if (level) filtered = filtered.filter(item => getWordJLPTLevel(item.kanji, item.chapter) === level)

 if (filtered.length > 0) {
 setVocab(pool)
 setQuestionPool(filtered)
 buildAndSetQueue(filtered, store, v)
 setIsInitialized(true)
 } else {
 setIsInitialized(true)
 }
 } else {
 setIsInitialized(true)
 }
 }, [isKanjiMode, isSpecialMode, type, chapter, level, mode, buildAndSetQueue])

 // Engine hook
 const engine = useQuizEngine<VocabItem>({
 queue,
 srsEnabled: true,
 getSrsId: item => item.id,
 checkAnswer: (item, choice) => {
 const correct = choice === item.arti
 if (correct) removeFailedWord(item.id)
 else recordFailedWord(item.id)
 return correct
 },
 })

 // Update choices when current changes
 useEffect(() => {
 if (engine.currentItem && vocab.length > 0) {
 setChoices(getChoices(engine.currentItem, vocab))
 setShowHint(false)
 }
 }, [engine.current, engine.currentItem, vocab])

 // Auto-speak via hook terpusat — work untuk semua bank data
 useQuizAudio(engine.phase, engine.currentItem, (item) => item.hiragana || item.kanji, queue, engine.current)

 if (!isInitialized) {
 return (
 <div className="flex items-center justify-center min-h-dvh bg-[var(--color-bg)]">
 <div className="text-center">
 <p className="jp text-3xl mb-3 text-[var(--color-text-2)]">読み込み中</p>
 <div className="flex justify-center gap-1.5">
 {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[var(--color-accent)]" style={{ opacity: 0.3 + i * 0.35 }} />)}
 </div>
 </div>
 </div>
 )
 }

 if (queue.length === 0 || (engine.phase === 'result')) {
 return (
 <ResultScreen
 correct={engine.sessionCorrect}
 total={engine.sessionAnswered}
 emoji={engine.sessionCorrect / Math.max(1, engine.sessionAnswered) >= 0.8 ? '🎉' : '💪'}
 title="Sesi Selesai!"
 subtitle="Kerja bagus! Progres telah disimpan."
 onRetry={() => {
 buildAndSetQueue(questionPool, loadSRS(), vocab)
 engine.reset()
 }}
 onHome={() => router.replace('/')}
 />
 )
 }

 const q = engine.currentItem
 if (!q) return null

 const { main, sub } = getDisplayText(q)
 const cat = getCategoryStyle(q.category)
 const wpLevel = engine.getProgress(q.id)
 const isRefresh = wpLevel >= MASTERED_LEVEL

 return (
 <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto bg-[var(--color-bg)]">
 {/* Quiz Header */}
 <QuizHeader
 progress={engine.progress}
 lives={engine.lives}
 livesEnabled={engine.livesEnabled}
 onClose={() => engine.setShowExitConfirm(true)}
 badges={
 <div className="flex items-center gap-1.5 flex-wrap justify-end">
 {chapter && <span className="badge bg-[var(--color-accent-light)] text-[var(--color-accent)]">{chapter}</span>}
 {isKanjiMode && <span className="badge bg-[var(--color-accent)] text-white">{level ? `JLPT ${level}` : 'Kanji'}</span>}
 {isRefresh && <span className="badge bg-[var(--color-green-light)] text-[var(--color-green)]">refresh</span>}
 {engine.roundStreak >= 2 && <span className="badge bg-[var(--color-amber-light)] text-[var(--color-amber)]">🔥 {engine.roundStreak}x</span>}
 </div>
 }
 />

 {/* Quiz Body */}
 <div className="flex-1 px-4 flex flex-col">
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-bold text-[var(--color-text-3)]">{engine.current + 1} / {queue.length}</p>
 <span className="text-xs font-extrabold px-3 py-1 rounded-lg" style={{ background: cat.bg, color: cat.color }}>
 {q.category}
 </span>
 </div>

 <p className="text-base font-bold mb-4 text-[var(--color-text-2)]">Artinya apa?</p>

 {/* Card */}
 <div key={engine.cardKey} className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] shadow-card text-center mb-6 anim-up relative overflow-hidden p-6 sm:p-8">
 <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${cat.bg} 0%, transparent 65%)` }} />

 {/* Card Actions */}
 {!(isListeningMode && engine.phase === 'question') && (
 <div className="flex justify-end items-center gap-1.5 mb-2 relative z-10">
 {sub && (
 <button
 onClick={() => {
 const newVal = !showFurigana
 setShowFurigana(newVal)
 saveShowFurigana(newVal)
 playTap()
 }}
 className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs transition-all border cursor-pointer ${
 showFurigana ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-[var(--color-surface)] text-[var(--color-text-3)] border-[var(--color-border)]'
 }`}
 title="Furigana"
 >
 あ
 </button>
 )}
 <button
 onClick={() => speakJapanese(q.hiragana || q.kanji, true)}
 className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] active:scale-95 transition-all border border-[var(--color-border)] text-xs cursor-pointer"
 title="Slow-mo"
 >
 🐢
 </button>
 <button
 onClick={() => speakJapanese(q.hiragana || q.kanji, false)}
 className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] active:scale-95 transition-all border border-[var(--color-border)] text-[var(--color-text-2)] cursor-pointer"
 title="Normal"
 >
 <IconVolume size={14} />
 </button>
 </div>
 )}

 <div className="min-h-[20px] mb-2 flex justify-center relative z-10">
 {!(isListeningMode && engine.phase === 'question') && sub && !showFurigana && (
 isKanjiMode ? (
 showHint ? (
 <p className="jp text-xs anim-pop text-[var(--color-text-3)] tracking-wider">{sub}</p>
 ) : (
 <button onClick={() => { setShowHint(true); playTap() }} className="text-[10px] font-bold px-3 py-1 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-3)]">
 💡 Hint?
 </button>
 )
 ) : (
 <p className="jp text-xs text-[var(--color-text-3)] tracking-wider">{sub}</p>
 )
 )}
 </div>

 {isListeningMode && engine.phase === 'question' ? (
 <div className="flex flex-col items-center justify-center py-6 relative z-10">
 <button onClick={() => speakJapanese(q.hiragana || q.kanji)} className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--color-accent-light)] border border-[var(--color-accent)] active:scale-95 cursor-pointer">
 <span className="text-3xl text-[var(--color-accent)] animate-pulse">🔊</span>
 </button>
 <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-4">Ketuk untuk mendengar suara</p>
 </div>
 ) : (
 <p className="relative z-10 jp" style={{ fontSize: main.length > 6 ? '2.2rem' : main.length > 3 ? '2.8rem' : '3.5rem', fontWeight: 700, color: 'var(--color-text-1)', lineHeight: 1.2 }}>
 {sub && showFurigana ? (
 <ruby>
 {main}
 <rt className="font-semibold text-[var(--color-text-3)] select-none opacity-85" style={{ fontSize: '0.38em' }}>{sub}</rt>
 </ruby>
 ) : main}
 </p>
 )}

 {/* Level pill */}
 <div className="relative z-10 mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-[var(--color-bg)] border border-[var(--color-border-light)]">
 <div className="w-1.5 h-1.5 rounded-full" style={{ background: wpLevel >= 5 ? 'var(--color-green)' : wpLevel >= 3 ? 'var(--color-accent)' : wpLevel >= 1 ? 'var(--color-amber)' : 'var(--color-text-3)' }} />
 <span className="text-xs font-semibold text-[var(--color-text-2)]">
 {wpLevel === 0 ? 'Baru' : wpLevel >= MASTERED_LEVEL ? 'Hafal' : `Lv.${wpLevel}`}
 </span>
 </div>
 </div>

 {/* Choices */}
 <div className="grid grid-cols-2 gap-2.5">
 {choices.map((c, i) => {
 const isAns = c === q.arti
 const isSel = c === engine.selected
 let bg = 'var(--color-surface)'
 let border = '1.5px solid var(--color-border)'
 let color = 'var(--color-text-1)'
 let shadow = 'var(--shadow-card)'
 let extra = ''

 if (engine.selected) {
 if (isAns) {
 bg = 'var(--color-green-light)'; border = '2px solid var(--color-green)'
 color = 'var(--color-green-dark)'; shadow = 'none'; extra = 'anim-correct'
 } else if (isSel) {
 bg = 'var(--color-red-light)'; border = '2px solid var(--color-red)'
 color = 'var(--color-red-dark)'; shadow = 'none'; extra = 'anim-shake'
 } else {
 color = 'var(--color-text-3)'; shadow = 'none'
 }
 }

 return (
 <button
 key={i}
 onClick={() => engine.answer(c)}
 disabled={!!engine.selected}
 className={`rounded-[var(--radius-md)] px-3.5 py-4 text-sm font-bold text-left leading-snug active:scale-95 transition-all cursor-pointer ${extra}`}
 style={{ background: bg, border, color, boxShadow: shadow }}
 onPointerDown={() => { if (!engine.selected) playTap() }}
 >
 {c}
 </button>
 )
 })}
 </div>
 </div>

 {/* Feedback Sheet */}
 {engine.selected && engine.isCorrect !== null && (
 <FeedbackSheet
 isCorrect={engine.isCorrect}
 statusText={engine.isCorrect ? (engine.roundStreak >= 3 ? `🔥 ${engine.roundStreak}x Streak!` : 'Bener!') : 'Salah!'}
 detail={
 engine.isCorrect
 ? wpLevel >= MASTERED_LEVEL ? 'Masih hafal! Review 90 hari lagi' : `Naik level → ${getNextReviewLabel(wpLevel)}`
 : <span>Jawaban tepat: <strong className="jp font-bold text-[var(--color-green)]">{q.arti}</strong></span>
 }
 onNext={engine.next}
 >
 {q.contohKalimat && (
 <div className="space-y-1.5">
 <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Contoh Kalimat:</p>
 <p className="jp text-sm font-bold text-[var(--color-text-1)]" dangerouslySetInnerHTML={{ __html: addFuriganaToSentence(q.contohKalimat) }} />
 <p className="text-xs font-semibold text-[var(--color-text-2)]">{q.contohKalimatArti}</p>
 <div className="flex gap-2 pt-1">
 <button onClick={() => speakJapanese(q.hiragana || q.kanji)} className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-[var(--color-surface)] text-[var(--color-text-2)] border border-[var(--color-border)] cursor-pointer">🔊 Kata Saja</button>
 <button onClick={() => speakJapanese(q.contohKalimat || '')} className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-[var(--color-indigo-light)] text-[var(--color-indigo)] border border-[var(--color-border)] cursor-pointer">🔊 Kalimat Penuh</button>
 </div>
 </div>
 )}
 </FeedbackSheet>
 )}

 {/* Exit Modal */}
 <ExitConfirmModal
 open={engine.showExitConfirm}
 onCancel={() => engine.setShowExitConfirm(false)}
 onExit={() => router.replace('/')}
 />

 <div style={{ height: 28 }} />
 </div>
 )
}
