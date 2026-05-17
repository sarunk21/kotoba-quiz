'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { parseCSVToVocab, getDisplayText, type VocabItem } from '@/lib/vocab'
import { updateAfterSession } from '@/lib/stats'
import {
  loadSRS, saveSRS, onCorrect, onWrong,
  buildQueue, getWordProgress, SRS_INTERVALS, MASTERED_LEVEL,
  type SRSStore
} from '@/lib/srs'
import { fetchVocabCSV, pushToCloud } from '@/lib/cloud'
import { playCorrect, playWrong, playStreak, playLevelUp, playTap, playLoseHeart, playFinish } from '@/lib/sounds'

type Phase = 'loading' | 'question' | 'feedback' | 'result'

interface SessionState {
  queue: VocabItem[]
  current: number
  lives: number
  sessionXP: number
  sessionCorrect: number
  sessionAnswered: number
  roundStreak: number
}

const TOTAL_QUESTIONS = 10
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

function getChoices(correct: VocabItem, pool: VocabItem[]): string[] {
  const wrongs = shuffle(pool.filter(v => v.id !== correct.id)).slice(0, 3).map(v => v.arti)
  return shuffle([correct.arti, ...wrongs])
}

const CAT: Record<string, { color: string; bg: string }> = {
  'Kata Benda': { color: 'var(--color-cat-noun)', bg: 'var(--color-cat-noun-bg)' },
  'Kata Kerja': { color: 'var(--color-cat-verb)', bg: 'var(--color-cat-verb-bg)' },
  'Kata Sifat': { color: 'var(--color-cat-adj)',  bg: 'var(--color-cat-adj-bg)' },
}

export default function QuizPage() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [state, setState] = useState<SessionState | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [xpKey, setXpKey] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [cardKey, setCardKey] = useState(0)
  const [finalStats, setFinalStats] = useState<{ correct: number; total: number; xp: number; srsStore: SRSStore } | null>(null)
  const srsRef = useRef<SRSStore>({})

  useEffect(() => {
    async function init() {
      const store = loadSRS(); srsRef.current = store
      const url = localStorage.getItem('kotoba_sheets_url')
      let v: VocabItem[] = []
      if (url) {
        try {
          const csv = await fetchVocabCSV(url)
          if (csv) {
            const parsed = parseCSVToVocab(csv)
            if (parsed.length >= 4) v = parsed
          }
        } catch { }
      }
      if (v.length > 0) setVocab(v)
    }
    init()
  }, [])

  useEffect(() => { if (vocab.length > 0) startQuiz(vocab, srsRef.current) }, [vocab])

  function startQuiz(v: VocabItem[], store: SRSStore) {
    const { dueIds, newIds, refreshIds } = buildQueue(v.map(i => i.id), store, TOTAL_QUESTIONS)
    const allIds = [...dueIds, ...newIds, ...refreshIds].slice(0, TOTAL_QUESTIONS)
    const map = Object.fromEntries(v.map(i => [i.id, i]))
    const queue = allIds.map(id => map[id]).filter(Boolean)
    if (!queue.length) { setFinalStats({ correct: 0, total: 0, xp: 0, srsStore: store }); setPhase('result'); return }
    setState({ queue, current: 0, lives: 3, sessionXP: 0, sessionCorrect: 0, sessionAnswered: 0, roundStreak: 0 })
    setChoices(getChoices(queue[0], v))
    setSelected(null); setIsCorrect(null); setCardKey(k => k + 1); setPhase('question')
  }

  const handleAnswer = useCallback((choice: string) => {
    if (!state || phase !== 'question') return
    const q = state.queue[state.current]
    const correct = choice === q.arti
    setSelected(choice); setIsCorrect(correct); setPhase('feedback')
    const prevLevel = getWordProgress(srsRef.current, q.id).level
    srsRef.current = correct ? onCorrect(srsRef.current, q.id) : onWrong(srsRef.current, q.id)
    const newLevel = getWordProgress(srsRef.current, q.id).level
    if (correct) {
      const ns = state.roundStreak + 1
      const gained = ns >= 3 ? 20 : 10
      setXpGained(gained); setXpKey(k => k + 1)
      // Sound: streak > level up > correct
      if (ns >= 3) playStreak()
      else if (newLevel > prevLevel && newLevel >= MASTERED_LEVEL) playLevelUp()
      else playCorrect()
      setState(p => p ? { ...p, roundStreak: ns, sessionXP: p.sessionXP + gained, sessionCorrect: p.sessionCorrect + 1, sessionAnswered: p.sessionAnswered + 1 } : p)
    } else {
      playWrong()
      if (state.lives - 1 <= 0) playLoseHeart()
      setState(p => p ? { ...p, roundStreak: 0, lives: p.lives - 1, sessionAnswered: p.sessionAnswered + 1 } : p)
    }
  }, [state, phase])

  function nextQuestion() {
    if (!state) return
    if (state.lives <= 0 || state.current + 1 >= state.queue.length) {
      saveSRS(srsRef.current)
      const fs = { correct: state.sessionCorrect, total: state.sessionAnswered, xp: state.sessionXP, srsStore: srsRef.current }
      updateAfterSession(fs.correct, fs.total, fs.xp)
      pushToCloud() // sync to drive (after stats updated)
      setFinalStats(fs)
      playFinish(); setPhase('result'); return
    }
    const next = state.current + 1
    setState(p => p ? { ...p, current: next } : p)
    setChoices(getChoices(state.queue[next], vocab))
    setSelected(null); setIsCorrect(null); setCardKey(k => k + 1); setPhase('question')
  }

  /* Loading */
  if (phase === 'loading' || !state) {
    return (
      <div className="flex items-center justify-center min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p className="jp-serif text-3xl mb-3" style={{ color: 'var(--color-text-2)' }}>読み込み中</p>
          <div className="flex justify-center gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)', opacity: 0.3 + i * 0.35 }} />)}
          </div>
        </div>
      </div>
    )
  }

  /* Result */
  if (phase === 'result' && finalStats) {
    return <ResultScreen stats={finalStats} vocab={vocab} srsStore={finalStats.srsStore}
      onRetry={() => startQuiz(vocab, srsRef.current)} onHome={() => router.push('/')} />
  }

  const q = state.queue[state.current]
  const { main, sub } = getDisplayText(q)
  const progress = (state.current / state.queue.length) * 100
  const cat = CAT[q.category] ?? CAT['Kata Benda']
  const wp = getWordProgress(srsRef.current, q.id)
  const isRefresh = wp.level >= MASTERED_LEVEL

  return (
    <div className="flex flex-col min-h-dvh max-w-sm mx-auto" style={{ background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-5">
          {/* Close */}
          <button onClick={() => { saveSRS(srsRef.current); pushToCloud(); router.push('/') }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ✕
          </button>

          {/* Progress bar */}
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, background: 'var(--color-subtle)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: progress + '%', background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(91,94,244,0.35)' }} />
          </div>

          {/* XP chip */}
          <div className="relative shrink-0">
            <div className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5" style={{ background: 'var(--color-amber-light)' }}>
              <span style={{ fontSize: 12 }}>⚡</span>
              <span className="text-sm font-extrabold" style={{ color: 'var(--color-amber)' }}>{state.sessionXP}</span>
            </div>
            {xpGained > 0 && (
              <span key={xpKey} className="anim-xp absolute -top-1 right-0 text-sm font-extrabold pointer-events-none"
                style={{ color: 'var(--color-green)' }}>+{xpGained}</span>
            )}
          </div>
        </div>

        {/* Lives + badges */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <span key={i} style={{ fontSize: 18, opacity: i <= state.lives ? 1 : 0.15, transition: 'opacity 0.3s' }}>❤️</span>
            ))}
          </div>
          <div className="flex gap-2">
            {isRefresh && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>🔄 refresh</span>
            )}
            {state.roundStreak >= 2 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>🔥 {state.roundStreak}x</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Quiz body ── */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: 'var(--color-text-3)' }}>
            {state.current + 1} / {state.queue.length}
          </p>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
            {q.category}
          </span>
        </div>

        <p className="text-base font-bold mb-5" style={{ color: 'var(--color-text-2)' }}>Artinya apa?</p>

        {/* Kanji card */}
        <div key={cardKey} className="rounded-3xl text-center mb-6 anim-up relative overflow-hidden"
          style={{ background: 'var(--color-white)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', padding: '32px 24px' }}>
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 50% 0%, ${cat.bg} 0%, transparent 60%)`,
          }} />
          {sub && (
            <p className="relative jp text-xs mb-2" style={{ color: 'var(--color-text-3)', letterSpacing: '0.1em' }}>{sub}</p>
          )}
          <p className="relative jp-serif" style={{
            fontSize: main.length > 6 ? '2.2rem' : main.length > 3 ? '2.8rem' : '3.5rem',
            fontWeight: 700, color: 'var(--color-text-1)', lineHeight: 1.2,
          }}>
            {main}
          </p>
          {/* Level dot */}
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'var(--color-bg)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{
              background: wp.level >= 5 ? 'var(--color-green)' : wp.level >= 3 ? 'var(--color-accent)' : wp.level >= 1 ? 'var(--color-amber)' : 'var(--color-text-3)'
            }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
              {wp.level === 0 ? 'Baru' : wp.level >= MASTERED_LEVEL ? 'Hafal' : `Lv.${wp.level}`}
            </span>
          </div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-2.5">
          {choices.map((c, i) => {
            const isAns = c === q.arti
            const isSel = c === selected
            let bg = 'var(--color-white)'
            let border = '1.5px solid var(--color-border)'
            let color = 'var(--color-text-1)'
            let shadow = '0 1px 4px rgba(0,0,0,0.06)'
            let extraCls = ''

            if (selected) {
              if (isAns) {
                bg = 'var(--color-green-light)'; border = '2px solid var(--color-green)'
                color = 'var(--color-green-dark)'; shadow = '0 2px 8px rgba(34,197,94,0.2)'
                extraCls = 'anim-correct'
              } else if (isSel) {
                bg = 'var(--color-red-light)'; border = '2px solid var(--color-red)'
                color = 'var(--color-red-dark)'; shadow = 'none'
                extraCls = 'anim-shake'
              } else {
                color = 'var(--color-text-3)'; shadow = 'none'
              }
            }

            return (
              <button key={i} onClick={() => handleAnswer(c)} disabled={!!selected}
                className={`rounded-2xl px-3 py-4 text-sm font-bold text-left leading-snug active:scale-95 transition-transform ${extraCls}`}
                style={{ background: bg, border, color, boxShadow: shadow, fontFamily: 'inherit' }}
                onPointerDown={() => { if (!selected) playTap() }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Feedback panel ── */}
      {selected && (
        <div className="anim-up px-4 pt-5 pb-8 mt-5"
          style={{
            background: isCorrect ? 'var(--color-green-light)' : 'var(--color-red-light)',
            borderRadius: '28px 28px 0 0',
            borderTop: `1.5px solid ${isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-base" style={{ color: isCorrect ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}>
                {isCorrect
                  ? state.roundStreak >= 3 ? `🔥 ${state.roundStreak}x Streak!` : '✓ Bener!'
                  : '✗ Salah!'}
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>
                {isCorrect
                  ? wp.level >= MASTERED_LEVEL
                    ? 'Masih hafal! Muncul lagi 90 hari lagi'
                    : `Naik level → review ${SRS_INTERVALS[Math.min(wp.level + 1, 6)]} hari lagi`
                  : <span>Jawaban: <span className="font-bold" style={{ color: 'var(--color-green-dark)' }}>{q.arti}</span></span>
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

/* ── Result Screen ── */
function ResultScreen({ stats, vocab, srsStore, onRetry, onHome }: {
  stats: { correct: number; total: number; xp: number }
  vocab: VocabItem[]; srsStore: SRSStore
  onRetry: () => void; onHome: () => void
}) {
  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const great = pct >= 80; const ok = pct >= 50

  return (
    <div className="flex flex-col min-h-dvh max-w-sm mx-auto px-4 py-14" style={{ background: 'var(--color-bg)' }}>
      <div className="anim-pop flex-1 flex flex-col">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{great ? '🎉' : ok ? '💪' : '📚'}</div>
          <h2 className="font-extrabold mb-2" style={{ fontSize: '1.4rem', color: 'var(--color-text-1)' }}>
            {great ? 'すごい！ Keren banget!' : ok ? 'Lumayan nih!' : 'Jangan nyerah!'}
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
            {great ? 'Pertahanin terus ya!' : ok ? 'Ulangi biar makin lancar!' : 'Coba lagi, pasti bisa!'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { icon: '🎯', val: `${stats.correct}/${stats.total}`, label: 'Benar',   color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
            { icon: '⚡', val: `+${stats.xp}`,                   label: 'XP',      color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
            { icon: '📊', val: `${pct}%`,                        label: 'Akurasi', color: 'var(--color-accent)', bg: 'var(--color-accent-light)' },
          ].map(s => (
            <div key={s.label} className="rounded-3xl py-4 text-center" style={{ background: s.bg }}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-2)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5 mt-auto">
          <button onClick={onRetry}
            className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
            style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 8px 20px rgba(91,94,244,0.28)' }}>
            Latihan lagi 🔄
          </button>
          <button onClick={onHome}
            className="w-full rounded-2xl py-4 text-base font-bold active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', border: '1.5px solid var(--color-border)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            Kembali ke beranda
          </button>
        </div>
      </div>
    </div>
  )
}
