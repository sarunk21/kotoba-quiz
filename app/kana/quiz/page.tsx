'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KANA, kanaId, type KanaType, type KanaCard, getConfusableDistractors } from '@/lib/kana'
import {
  loadSRS, saveSRS, onCorrect, onWrong,
  getWordProgress, MASTERED_LEVEL,
  type SRSStore
} from '@/lib/srs'
import { playCorrect, playWrong, playStreak, playLevelUp, playFinish, speakJapanese, playTap } from '@/lib/sounds'
import { updateAfterSession } from '@/lib/stats'
import { pushToCloud } from '@/lib/cloud'
import { rescheduleDailyReminderIfNeeded } from '@/lib/notifications'

function VolumeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

type Phase = 'question' | 'feedback' | 'result'
type QuizMode = 'kana→romaji' | 'romaji→kana' | 'audio→kana'

interface SessionQuestionItem {
  card: KanaCard
  effectiveType: KanaType
}

interface SessionState {
  queue: SessionQuestionItem[]
  current: number
  lives: number
  sessionCorrect: number
  sessionAnswered: number
  roundStreak: number
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

  // Get similar distractors from confusable sets
  const confusableIds = getConfusableDistractors(correctCard, effectiveType)
  const confusablePool = pool.filter(c => confusableIds.includes(c.id) && c.id !== correctCard.id)
  
  // Shuffle similar distractors and take up to 3
  const similarWrongs = shuffle(confusablePool).slice(0, 3)
  
  // Pad with random characters if we have fewer than 3 similar ones
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

function QuizContent() {
  const router = useRouter()
  const params = useSearchParams()
  const rawType = params.get('type') || 'hiragana' // 'hiragana' | 'katakana' | 'both'
  const ids = params.get('ids')?.split(',') ?? KANA.map(c => c.id)

  const [phase, setPhase] = useState<Phase>('question')
  const [state, setState] = useState<SessionState | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showRomajiHint, setShowRomajiHint] = useState(false)
  const [quizMode, setQuizMode] = useState<QuizMode>('kana→romaji')
  const [cardKey, setCardKey] = useState(0)
  const [finalStats, setFinalStats] = useState<{ correct: number; total: number } | null>(null)
  const srsRef = useRef<SRSStore>(loadSRS())

  const pool = KANA.filter(c => ids.includes(c.id))

  const currentItem = state?.queue[state.current]
  const currentCard = currentItem?.card
  const currentType = currentItem?.effectiveType || 'hiragana'

  useEffect(() => { startQuiz() }, [])

  // Auto-play pronunciation when a new question loads
  useEffect(() => {
    if (phase === 'question' && currentCard) {
      const displayKana = currentType === 'hiragana' ? currentCard.hiragana : currentCard.katakana
      speakJapanese(displayKana)
    }
  }, [state?.current, phase, currentCard, currentType])

  function startQuiz() {
    // Generate session queue
    const selectedCards = shuffle(pool).slice(0, Math.min(15, pool.length))
    const queue: SessionQuestionItem[] = selectedCards.map(card => {
      let effType: KanaType = 'hiragana'
      if (rawType === 'both') {
        effType = Math.random() > 0.5 ? 'katakana' : 'hiragana'
      } else if (rawType === 'katakana') {
        effType = 'katakana'
      }
      return { card, effectiveType: effType }
    })

    setState({ queue, current: 0, lives: 3, sessionCorrect: 0, sessionAnswered: 0, roundStreak: 0 })
    if (queue[0]) {
      setChoices(getChoices(queue[0].card, queue[0].effectiveType, pool.length >= 4 ? pool : KANA, quizMode))
    }
    setSelected(null)
    setIsCorrect(null)
    setCardKey(k => k + 1)
    setPhase('question')
  }

  const handleAnswer = useCallback((choice: string) => {
    if (!state || phase !== 'question' || !currentItem || !currentCard) return
    
    const correctVal = quizMode === 'kana→romaji'
      ? currentCard.romaji
      : (currentType === 'hiragana' ? currentCard.hiragana : currentCard.katakana)

    const correct = choice === correctVal

    setSelected(choice)
    setIsCorrect(correct)
    setPhase('feedback')

    const kid = kanaId(currentCard.id, currentType)
    const prevLv = getWordProgress(srsRef.current, kid).level
    srsRef.current = correct ? onCorrect(srsRef.current, kid) : onWrong(srsRef.current, kid)
    const newLv = getWordProgress(srsRef.current, kid).level

    if (correct) {
      const ns = state.roundStreak + 1
      if (ns >= 3) playStreak()
      else if (newLv > prevLv && newLv >= MASTERED_LEVEL) playLevelUp()
      else playCorrect()
      setState(p => p ? { ...p, roundStreak: ns, sessionCorrect: p.sessionCorrect + 1, sessionAnswered: p.sessionAnswered + 1 } : p)
    } else {
      playWrong()
      setState(p => p ? { ...p, roundStreak: 0, lives: p.lives - 1, sessionAnswered: p.sessionAnswered + 1 } : p)
    }
  }, [state, phase, quizMode, currentItem, currentCard, currentType])

  async function nextQuestion() {
    if (!state) return
    if (state.lives <= 0 || state.current + 1 >= state.queue.length) {
      saveSRS(srsRef.current)
      playFinish()
      const fs = { correct: state.sessionCorrect, total: state.sessionAnswered }
      setFinalStats(fs)
      updateAfterSession(fs.correct, fs.total)
      rescheduleDailyReminderIfNeeded()
      
      const isAuto = localStorage.getItem('kotoba_sync_mode') !== 'manual'
      if (isAuto) pushToCloud()
      
      setPhase('result')
      return
    }

    const next = state.current + 1
    setState(p => p ? { ...p, current: next } : p)
    const nextItem = state.queue[next]
    const nextPool = pool.length >= 4 ? pool : KANA
    setChoices(getChoices(nextItem.card, nextItem.effectiveType, nextPool, quizMode))
    setSelected(null)
    setIsCorrect(null)
    setCardKey(k => k + 1)
    setPhase('question')
  }

  // Result screen
  if (phase === 'result' && finalStats) {
    const pct = finalStats.total > 0 ? Math.round((finalStats.correct / finalStats.total) * 100) : 0
    const great = pct >= 80
    return (
      <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto px-4 py-14" style={{ background: 'var(--color-bg)' }}>
        <div className="anim-pop flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{great ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
            <h2 className="font-extrabold text-2xl mb-2 text-[var(--color-text-1)]">
              {great ? '素晴らしい！ (Luar Biasa!)' : pct >= 50 ? 'Hasil yang Cukup Baik!' : 'Jangan Menyerah!'}
            </h2>
            <p className="text-xs font-semibold text-[var(--color-text-2)]">
              Kuis {rawType === 'both' ? 'Kana Gabungan' : rawType === 'hiragana' ? 'Hiragana' : 'Katakana'} · {great ? 'Semakin lancar!' : 'Teruslah berlatih!'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: '🎯', val: `${finalStats.correct}/${finalStats.total}`, label: 'Benar',   color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
              { icon: '📅', val: `+1`,                                       label: 'Sesi', color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
              { icon: '📊', val: `${pct}%`,                                  label: 'Akurasi', color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
            ].map(s => (
              <div key={s.label} className="rounded-3xl py-4 text-center border border-[var(--color-border)]/50" style={{ background: s.bg }}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-2)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { playTap(); startQuiz() }}
              className="w-full rounded-2xl py-4 text-sm font-extrabold active:scale-95 transition-transform text-white cursor-pointer shadow-lg"
              style={{ background: 'var(--color-accent)', boxShadow: '0 8px 24px rgba(91,94,244,0.3)' }}
            >
              Berlatih Lagi 🔄
            </button>
            <button 
              onClick={() => { playTap(); router.replace('/kana') }}
              className="w-full rounded-2xl py-4 text-sm font-extrabold active:scale-95 transition-transform bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] text-[var(--color-text-2)] cursor-pointer"
            >
              Kembali ke Menu Kana
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!state || !currentCard) return null

  const progress = (state.current / state.queue.length) * 100
  const wp = getWordProgress(srsRef.current, kanaId(currentCard.id, currentType))
  const displayKana = currentType === 'hiragana' ? currentCard.hiragana : currentCard.katakana
  const correctVal = quizMode === 'kana→romaji'
    ? currentCard.romaji
    : (currentType === 'hiragana' ? currentCard.hiragana : currentCard.katakana)

  return (
    <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto" style={{ background: 'var(--color-bg)' }}>

      {/* Top Bar Navigation */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => { playTap(); saveSRS(srsRef.current); pushToCloud(); router.replace('/kana') }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-base shrink-0 active:scale-95 transition-transform bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] shadow-xs cursor-pointer"
          >
            ✕
          </button>

          {/* Progress Bar */}
          <div className="flex-1 rounded-full overflow-hidden h-2.5 bg-[var(--color-subtle)]">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'var(--color-accent)', boxShadow: '0 0 10px rgba(91,94,244,0.4)' }} 
            />
          </div>
        </div>

        {/* Lives & Quiz Mode Toggle Bar */}
        <div className="flex items-center justify-between">
          {/* Hearts */}
          <div className="flex gap-1 items-center">
            {[1,2,3].map(i => (
              <span key={i} className={`text-base transition-all duration-300 ${i <= state.lives ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}`}>
                ❤️
              </span>
            ))}
          </div>

          {/* Quiz Mode Switches */}
          <div className="flex items-center gap-2">
            {/* Hint Romaji Toggle */}
            <button 
              onClick={() => { playTap(); setShowRomajiHint(v => !v) }}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer border ${
                showRomajiHint 
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' 
                  : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border-[var(--color-border)]'
              }`}
            >
              <span>{showRomajiHint ? '👁' : '🙈'}</span>
              Romaji
            </button>

            {/* Mode Switcher: Kana -> Romaji | Romaji -> Kana | Audio -> Kana */}
            <button 
              onClick={() => {
                playTap()
                setQuizMode(m => m === 'kana→romaji' ? 'romaji→kana' : m === 'romaji→kana' ? 'audio→kana' : 'kana→romaji')
              }}
              className="rounded-xl px-2.5 py-1 text-[11px] font-black bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] border border-[var(--color-border)] active:scale-95 cursor-pointer shadow-xs"
            >
              {quizMode === 'kana→romaji' ? 'あ → A' : quizMode === 'romaji→kana' ? 'A → あ' : '🔊 → あ'}
            </button>

            {/* Streak Counter */}
            {state.roundStreak >= 2 && (
              <span className="text-[10px] font-black px-2 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-900/50">
                🔥{state.roundStreak}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Quiz Body */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-extrabold text-[var(--color-text-3)]">
            Soal {state.current + 1} dari {state.queue.length}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
              {currentType === 'hiragana' ? 'Hiragana あ' : 'Katakana ア'}
            </span>
            <div className="flex items-center gap-1 rounded-full px-2 py-0.5 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)]">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{
                  background: wp.level >= MASTERED_LEVEL ? 'var(--color-green)' : wp.level >= 3 ? 'var(--color-accent)' : wp.level >= 1 ? 'var(--color-amber)' : 'var(--color-text-3)'
                }} 
              />
              <span className="text-[10px] font-bold text-[var(--color-text-2)]">
                {wp.level === 0 ? 'Baru' : wp.level >= MASTERED_LEVEL ? 'Hafal' : `Lv${wp.level}`}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold text-[var(--color-text-2)] mb-3">
          {quizMode === 'kana→romaji' 
            ? 'Pilih cara baca Romaji yang benar:' 
            : quizMode === 'romaji→kana' 
              ? `Pilih karakter ${currentType === 'hiragana' ? 'Hiragana' : 'Katakana'}:`
              : 'Dengarkan pelafalan & pilih karakter yang sesuai:'}
        </p>

        {/* Main Card */}
        <div 
          key={cardKey}
          className="rounded-3xl text-center mb-6 anim-up relative overflow-hidden bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-md p-8"
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${currentType === 'hiragana' ? 'var(--color-accent-light)' : '#faf0ff'} 0%, transparent 70%)`,
            }} 
          />

          {/* Pronunciation Audio Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            {/* Turtle (Slow-mo) */}
            <button 
              onClick={() => { playTap(); speakJapanese(displayKana, true) }}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-90 transition-all text-xs border border-[var(--color-border)] cursor-pointer"
              title="Pelafalan Lambat (Slow-mo)"
            >
              🐢
            </button>
            {/* Normal */}
            <button 
              onClick={() => { playTap(); speakJapanese(displayKana, false) }}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-90 transition-all text-[var(--color-text-2)] border border-[var(--color-border)] cursor-pointer"
              title="Pelafalan Normal"
            >
              <VolumeIcon size={14} />
            </button>
          </div>

          {/* Question Display */}
          {quizMode === 'kana→romaji' ? (
            <div className="relative">
              {showRomajiHint && (
                <p className="text-xs font-extrabold text-[var(--color-accent)] tracking-widest mb-1">
                  [ HINT: {currentCard.romaji} ]
                </p>
              )}
              <p className="jp-serif font-black text-6xl md:text-7xl text-[var(--color-text-1)] leading-none my-2">
                {displayKana}
              </p>
            </div>
          ) : quizMode === 'romaji→kana' ? (
            <div className="relative my-2">
              <p className="text-4xl md:text-5xl font-black text-[var(--color-accent)] tracking-wider">
                {currentCard.romaji}
              </p>
            </div>
          ) : (
            /* Audio Listening Question */
            <div className="relative py-3">
              <button 
                onClick={() => speakJapanese(displayKana)}
                className="mx-auto w-16 h-16 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/30 active:scale-90 transition-all cursor-pointer text-2xl"
              >
                🔊
              </button>
              <p className="text-xs font-bold text-[var(--color-text-2)] mt-3">
                Tekan tombol di atas untuk memutar ulang suara
              </p>
            </div>
          )}
        </div>

        {/* Choice Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {choices.map((choice, i) => {
            let style = 'bg-white dark:bg-[#1a1d24] border-[var(--color-border)] text-[var(--color-text-1)] hover:border-[var(--color-accent)]'
            
            if (phase === 'feedback') {
              if (choice === correctVal) {
                style = 'bg-green-500 text-white border-green-500 shadow-md shadow-green-500/20'
              } else if (choice === selected) {
                style = 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
              } else {
                style = 'opacity-30 bg-white dark:bg-[#1a1d24] border-[var(--color-border)] text-[var(--color-text-2)]'
              }
            }

            return (
              <button
                key={i}
                disabled={phase === 'feedback'}
                onClick={() => handleAnswer(choice)}
                className={`p-4 rounded-2xl font-black text-xl md:text-2xl transition-all border active:scale-95 cursor-pointer flex items-center justify-center min-h-[64px] ${style}`}
              >
                <span className={quizMode === 'kana→romaji' ? 'font-black tracking-wide' : 'jp font-black text-3xl'}>
                  {choice}
                </span>
              </button>
            )
          })}
        </div>

        {/* Fixed Feedback Action Sheet */}
        {phase === 'feedback' && (
          <div className="fixed bottom-0 left-0 right-0 z-50 anim-up shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl border-t bg-white dark:bg-[#1a1d24] border-[var(--color-border)] rounded-t-[32px]">
            <div className="max-w-sm md:max-w-2xl mx-auto px-5 py-5 flex flex-col gap-3">
              <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                isCorrect 
                  ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
              }`}>
                <div>
                  <p className="font-extrabold text-sm">
                    {isCorrect ? '✨ Benar! 正解！' : '❌ Kurang Tepat'}
                  </p>
                  <p className="text-xs font-semibold mt-0.5">
                    Jawaban benar: <strong className="jp text-base">{displayKana}</strong> = <span className="uppercase">{currentCard.romaji}</span>
                  </p>
                </div>
                <span className="text-2xl">{isCorrect ? '👏' : '💡'}</span>
              </div>

              <button 
                onClick={() => { playTap(); nextQuestion() }}
                className="w-full rounded-2xl py-3.5 text-base font-extrabold active:scale-95 transition-transform text-white bg-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.28)] cursor-pointer"
              >
                {state.current + 1 >= state.queue.length ? 'Selesaikan Kuis 🎉' : 'Lanjut →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function KanaQuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat kuis Kana...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
