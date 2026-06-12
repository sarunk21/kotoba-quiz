'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { KANA, kanaId, type KanaType, type KanaCard } from '@/lib/kana'
import {
  loadSRS, saveSRS, onCorrect, onWrong,
  getWordProgress, SRS_INTERVALS, MASTERED_LEVEL,
  type SRSStore
} from '@/lib/srs'
import { playCorrect, playWrong, playStreak, playLevelUp, playTap, playFinish, speakJapanese } from '@/lib/sounds'

import { updateAfterSession } from '@/lib/stats'
import { pushToCloud } from '@/lib/cloud'
import { rescheduleDailyReminderIfNeeded } from '@/lib/notifications'

type Phase = 'question' | 'feedback' | 'result'
type QuizMode = 'kana→romaji' | 'romaji→kana'

interface SessionState {
  queue: KanaCard[]
  current: number
  lives: number
  sessionCorrect: number
  sessionAnswered: number
  roundStreak: number
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

function getChoices(correct: KanaCard, pool: KanaCard[], type: KanaType, mode: QuizMode): string[] {
  const getVal = (c: KanaCard) => mode === 'kana→romaji'
    ? c.romaji
    : (type === 'hiragana' ? c.hiragana : c.katakana)
  const wrongs = shuffle(pool.filter(c => c.id !== correct.id)).slice(0, 3).map(getVal)
  return shuffle([getVal(correct), ...wrongs])
}

function QuizContent() {
  const router = useRouter()
  const params = useSearchParams()
  const kanaType = (params.get('type') || 'hiragana') as KanaType
  const ids = params.get('ids')?.split(',') ?? KANA.map(c => c.id)

  const [phase, setPhase] = useState<Phase>('question')
  const [state, setState] = useState<SessionState | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showRomaji, setShowRomaji] = useState(false)
  const [quizMode, setQuizMode] = useState<QuizMode>('kana→romaji')
  const [cardKey, setCardKey] = useState(0)
  const [finalStats, setFinalStats] = useState<{ correct: number; total: number } | null>(null)
  const srsRef = useRef<SRSStore>(loadSRS())

  const pool = KANA.filter(c => ids.includes(c.id))

  useEffect(() => { startQuiz() }, [])

  // Auto-play pronunciation when a new question loads
  useEffect(() => {
    if (phase === 'question' && state?.queue && state.queue[state.current]) {
      const q = state.queue[state.current]
      const displayKana = kanaType === 'hiragana' ? q.hiragana : q.katakana
      speakJapanese(displayKana)
    }
  }, [state?.current, phase, kanaType])


  function startQuiz() {
    const queue = shuffle(pool).slice(0, Math.min(15, pool.length))
    setState({ queue, current: 0, lives: 3, sessionCorrect: 0, sessionAnswered: 0, roundStreak: 0 })
    setChoices(getChoices(queue[0], pool.length >= 4 ? pool : KANA, kanaType, quizMode))
    setSelected(null); setIsCorrect(null); setCardKey(k => k + 1); setPhase('question')
  }

  const handleAnswer = useCallback((choice: string) => {
    if (!state || phase !== 'question') return
    const q = state.queue[state.current]
    const correctVal = quizMode === 'kana→romaji'
      ? q.romaji
      : (kanaType === 'hiragana' ? q.hiragana : q.katakana)
    const correct = choice === correctVal

    setSelected(choice); setIsCorrect(correct); setPhase('feedback')

    const kid = kanaId(q.id, kanaType)
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
  }, [state, phase, quizMode, kanaType])

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
      if (isAuto) pushToCloud() // sync ke drive (Background sync biar ga stuck)
      
      setPhase('result')
      return
    }
    const next = state.current + 1
    setState(p => p ? { ...p, current: next } : p)
    const nextPool = pool.length >= 4 ? pool : KANA
    setChoices(getChoices(state.queue[next], nextPool, kanaType, quizMode))
    setSelected(null); setIsCorrect(null); setCardKey(k => k + 1); setPhase('question')
  }

  // Result screen
  if (phase === 'result' && finalStats) {
    const pct = finalStats.total > 0 ? Math.round((finalStats.correct / finalStats.total) * 100) : 0
    const great = pct >= 80
    return (
      <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto px-4 py-14" style={{ background: 'var(--color-bg)' }}>
        <div className="anim-pop flex-1 flex flex-col">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{great ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
            <h2 className="font-extrabold mb-2" style={{ fontSize: '1.4rem', color: 'var(--color-text-1)' }}>
              {great ? 'すごい！' : pct >= 50 ? 'Hasil yang cukup baik!' : 'Jangan menyerah!'}
            </h2>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
              {kanaType === 'hiragana' ? 'Hiragana' : 'Katakana'} · {great ? 'Semakin lancar!' : 'Teruslah berlatih!'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {[
              { icon: '🎯', val: `${finalStats.correct}/${finalStats.total}`, label: 'Benar',   color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
              { icon: '📅', val: `+1`,                                       label: 'Session', color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
              { icon: '📊', val: `${pct}%`,                                  label: 'Akurasi', color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
            ].map(s => (
              <div key={s.label} className="rounded-3xl py-4 text-center" style={{ background: s.bg }}>
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 mt-auto">
            <button onClick={startQuiz}
              className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
              style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 8px 20px rgba(91,94,244,0.28)' }}>
              Berlatih lagi 🔄
            </button>
            <button onClick={() => router.replace('/kana')}
              className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform"
              style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-2)' }}>
              Kembali ke menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!state) return null
  const q = state.queue[state.current]
  const progress = (state.current / state.queue.length) * 100
  const wp = getWordProgress(srsRef.current, kanaId(q.id, kanaType))
  const displayKana = kanaType === 'hiragana' ? q.hiragana : q.katakana
  const correctVal = quizMode === 'kana→romaji'
    ? q.romaji
    : (kanaType === 'hiragana' ? q.hiragana : q.katakana)

  return (
    <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto" style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { saveSRS(srsRef.current); pushToCloud(); router.replace('/kana') }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ✕
          </button>

          {/* Progress */}
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, background: 'var(--color-subtle)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: progress + '%', background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(91,94,244,0.35)' }} />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Lives */}
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <span key={i} style={{ fontSize: 17, opacity: i <= state.lives ? 1 : 0.15, transition: 'opacity 0.3s' }}>❤️</span>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Romaji toggle */}
            <button onClick={() => setShowRomaji(v => !v)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95"
              style={{
                background: showRomaji ? 'var(--color-accent-light)' : 'var(--color-subtle)',
                color: showRomaji ? 'var(--color-accent)' : 'var(--color-text-3)',
              }}>
              <span>{showRomaji ? '👁' : '🙈'}</span>
              romaji
            </button>

            {/* Mode toggle */}
            <button onClick={() => setQuizMode(m => m === 'kana→romaji' ? 'romaji→kana' : 'kana→romaji')}
              className="rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95"
              style={{ background: 'var(--color-subtle)', color: 'var(--color-text-2)' }}>
              {quizMode === 'kana→romaji' ? 'あ→A' : 'A→あ'}
            </button>

            {/* Streak */}
            {state.roundStreak >= 2 && (
              <span className="text-xs font-bold px-2.5 py-1.5 rounded-xl"
                style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                🔥{state.roundStreak}x
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quiz body */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-3)' }}>
            {state.current + 1} / {state.queue.length}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: kanaType === 'hiragana' ? 'var(--color-accent-light)' : '#faf0ff', color: kanaType === 'hiragana' ? 'var(--color-accent)' : '#a855f7' }}>
              {kanaType === 'hiragana' ? 'Hiragana' : 'Katakana'}
            </span>
            <div className="flex items-center gap-1 rounded-full px-2 py-1" style={{ background: 'var(--color-bg)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{
                background: wp.level >= MASTERED_LEVEL ? 'var(--color-green)' : wp.level >= 3 ? 'var(--color-accent)' : wp.level >= 1 ? 'var(--color-amber)' : 'var(--color-text-3)'
              }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
                {wp.level === 0 ? 'Baru' : wp.level >= MASTERED_LEVEL ? 'Hafal' : `Lv${wp.level}`}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm font-bold mb-4" style={{ color: 'var(--color-text-2)' }}>
          {quizMode === 'kana→romaji' ? 'Cara baca?' : 'Tulis dalam ' + (kanaType === 'hiragana' ? 'hiragana' : 'katakana') + ':'}
        </p>

        {/* Main card */}
        <div key={cardKey}
          className="rounded-3xl text-center mb-6 anim-up relative overflow-hidden"
          style={{ background: 'var(--color-white)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', padding: '32px 24px' }}>
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${kanaType === 'hiragana' ? 'var(--color-accent-light)' : '#faf0ff'} 0%, transparent 60%)`,
          }} />

          {/* Pronunciation buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            {/* Turtle (Slow-mo) */}
            <button onClick={() => speakJapanese(displayKana, true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all text-sm border border-[var(--color-border)]"
              title="Pelafalan Lambat (Slow-mo)">
              🐢
            </button>
            {/* Normal */}
            <button onClick={() => speakJapanese(displayKana, false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all text-[var(--color-text-2)] border border-[var(--color-border)]"
              title="Pelafalan Normal">
              <VolumeIcon size={16} />
            </button>
          </div>


          {/* Question */}
          {quizMode === 'kana→romaji' ? (
            <div className="relative">
              {/* Show romaji as hint above if enabled */}
              {showRomaji && (
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-3)', letterSpacing: '0.1em' }}>
                  {q.romaji}
                </p>
              )}
              <p className="jp-serif font-bold" style={{ fontSize: '5rem', color: 'var(--color-text-1)', lineHeight: 1 }}>
                {displayKana}
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--color-text-3)' }}>
                {q.groupLabel}
              </p>
            </div>
          ) : (
            <div className="relative">
              <p className="font-extrabold relative" style={{ fontSize: '2.8rem', color: 'var(--color-text-1)', lineHeight: 1.1 }}>
                {q.romaji}
              </p>
              {showRomaji && (
                <p className="jp text-base mt-2" style={{ color: 'var(--color-text-3)' }}>
                  {displayKana}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-2.5">
          {choices.map((c, i) => {
            const isAns = c === correctVal
            const isSel = c === selected
            let bg = 'var(--color-white)', border = '1.5px solid var(--color-border)'
            let color = 'var(--color-text-1)', shadow = '0 1px 4px rgba(0,0,0,0.06)'
            let cls = ''

            if (selected) {
              if (isAns) {
                bg = 'var(--color-green-light)'; border = '2px solid var(--color-green)'
                color = 'var(--color-green-dark)'; cls = 'anim-correct'
              } else if (isSel) {
                bg = 'var(--color-red-light)'; border = '2px solid var(--color-red)'
                color = 'var(--color-red-dark)'; shadow = 'none'; cls = 'anim-shake'
              } else {
                color = 'var(--color-text-3)'; shadow = 'none'
              }
            }

            const isKanaChoice = quizMode === 'romaji→kana'
            return (
              <button key={i} onClick={() => { playTap(); handleAnswer(c) }} disabled={!!selected}
                className={`rounded-2xl px-3 py-4 text-center active:scale-95 transition-transform ${cls}`}
                style={{ background: bg, border, color, boxShadow: shadow }}>
                <span className={isKanaChoice ? "jp" : ""} style={{ fontSize: isKanaChoice ? '1.8rem' : '1rem', fontWeight: isKanaChoice ? 700 : 600 }}>
                  {c}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Feedback panel */}
      {selected && (
        <div className="anim-up px-4 pt-5 pb-8 mt-5"
          style={{
            background: isCorrect ? 'var(--color-green-light)' : 'var(--color-red-light)',
            borderRadius: '28px 28px 0 0',
            borderTop: `1.5px solid ${isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-extrabold text-base" style={{ color: isCorrect ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}>
                {isCorrect ? (state.roundStreak >= 3 ? `🔥 ${state.roundStreak}x Streak!` : '✓ Bener!') : '✗ Salah!'}
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>
                {isCorrect
                  ? wp.level >= MASTERED_LEVEL
                    ? 'Masih hafal! Muncul lagi 90 hari'
                    : `Naik level → review ${SRS_INTERVALS[Math.min(wp.level + 1, 6)]} hari lagi`
                  : <span>
                      <span className="jp font-bold" style={{ color: 'var(--color-text-1)' }}>{displayKana}</span>
                      {' = '}
                      <span style={{ color: 'var(--color-green-dark)', fontWeight: 700 }}>{q.romaji}</span>
                    </span>
                }
              </p>
            </div>
            <button onClick={nextQuestion}
              className="shrink-0 rounded-2xl px-6 py-3 text-sm font-extrabold active:scale-95 transition-transform"
              style={{
                background: isCorrect ? 'var(--color-green)' : 'var(--color-red)',
                color: '#fff',
                boxShadow: isCorrect ? '0 4px 12px rgba(34,197,94,0.3)' : '0 4px 12px rgba(239,68,68,0.3)',
              }}>
              Lanjut →
            </button>
          </div>
        </div>
      )}
      {!selected && <div style={{ height: 28 }} />}
    </div>
  )
}

export default function KanaQuizPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        <p className="jp text-2xl" style={{ color: 'var(--color-text-2)' }}>読み込み中...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}

function VolumeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

