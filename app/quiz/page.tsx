'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadLocalVocab, getDisplayText, type VocabItem, getGlobalVocab, setGlobalVocab } from '@/lib/vocab'
import { updateAfterSession } from '@/lib/stats'
import {
  loadSRS, saveSRS, onCorrect, onWrong,
  buildQueue, getWordProgress, SRS_INTERVALS, MASTERED_LEVEL,
  type SRSStore
} from '@/lib/srs'
import { pushToCloud } from '@/lib/cloud'
import { playCorrect, playWrong, playStreak, playLevelUp, playTap, playLoseHeart, playFinish, speakJapanese } from '@/lib/sounds'
import { SPECIALIZED_DATA } from '@/lib/specialized'
import { getWordJLPTLevel } from '@/lib/jlpt'

type Phase = 'loading' | 'question' | 'feedback' | 'result'

interface SessionState {
  queue: VocabItem[]
  current: number
  lives: number
  sessionCorrect: number
  sessionAnswered: number
  roundStreak: number
}

const TOTAL_QUESTIONS = 10
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

function getChoices(correct: VocabItem, pool: VocabItem[]): string[] {
  // First, try to get wrong choices of the same category
  const sameCategoryPool = pool.filter(v => v.id !== correct.id && v.category === correct.category)
  
  let wrongs: VocabItem[] = []
  if (sameCategoryPool.length >= 3) {
    wrongs = shuffle(sameCategoryPool).slice(0, 3)
  } else {
    // If not enough same category items, mix with the rest of the pool
    const otherPool = pool.filter(v => v.id !== correct.id && v.category !== correct.category)
    wrongs = [...sameCategoryPool, ...shuffle(otherPool).slice(0, 3 - sameCategoryPool.length)]
  }
  
  return shuffle([correct.arti, ...wrongs.map(v => v.arti)])
}

const CAT: Record<string, { color: string; bg: string }> = {
  'Kata Benda': { color: 'var(--color-cat-noun)', bg: 'var(--color-cat-noun-bg)' },
  'Kata Kerja': { color: 'var(--color-cat-verb)', bg: 'var(--color-cat-verb-bg)' },
  'Kata Sifat': { color: 'var(--color-cat-adj)',  bg: 'var(--color-cat-adj-bg)' },
}

function getCategoryStyle(category: string) {
  if (!category) return CAT['Kata Benda']
  if (CAT[category]) return CAT[category]
  
  const catLower = category.toLowerCase()
  if (catLower.includes('benda')) return CAT['Kata Benda']
  if (catLower.includes('kerja')) return CAT['Kata Kerja']
  if (catLower.includes('sifat')) return CAT['Kata Sifat']
  if (catLower.includes('ungkapan')) return { color: '#d97706', bg: 'rgba(217,119,6,0.12)' }
  if (catLower.includes('keterangan')) return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' }
  if (catLower.includes('partikel')) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' }
  if (catLower.includes('angka')) return { color: 'var(--color-amber)', bg: 'var(--color-amber-light)' }
  if (catLower.includes('hari')) return { color: 'var(--color-red)', bg: 'var(--color-red-light)' }
  if (catLower.includes('uang')) return { color: 'var(--color-accent)', bg: 'var(--color-accent-light)' }
  
  return { color: 'var(--color-text-2)', bg: 'var(--color-subtle)' }
}


export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p className="jp text-3xl mb-3" style={{ color: 'var(--color-text-2)' }}>読み込み中</p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)', opacity: 0.3 + i * 0.35 }} />)}
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

  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [questionPool, setQuestionPool] = useState<VocabItem[]>([])
  const [phase, setPhase] = useState<'loading' | 'question' | 'feedback' | 'result'>('loading')
  const [state, setState] = useState<SessionState | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [cardKey, setCardKey] = useState(0)
  const [finalStats, setFinalStats] = useState<{ correct: number; total: number; srsStore: SRSStore } | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)
  const srsRef = useRef<SRSStore>({})
  const initialized = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem('kotoba_show_furigana')
    setShowFurigana(saved !== 'false') // default to true
  }, [])

  const startQuiz = useCallback((v: VocabItem[], store: SRSStore, fullPool?: VocabItem[]) => {
    const { dueIds, newIds, refreshIds } = buildQueue(v.map(i => i.id), store, TOTAL_QUESTIONS)
    const allIds = [...dueIds, ...newIds, ...refreshIds].slice(0, TOTAL_QUESTIONS)
    const map = Object.fromEntries(v.map(i => [i.id, i]))
    const queue = allIds.map(id => map[id]).filter(Boolean)
    if (!queue.length) { setFinalStats({ correct: 0, total: 0, srsStore: store }); setPhase('result'); return }
    setState({ queue, current: 0, lives: 3, sessionCorrect: 0, sessionAnswered: 0, roundStreak: 0 })
    setChoices(getChoices(queue[0], fullPool || v))
    setSelected(null); setIsCorrect(null); setCardKey(k => k + 1); setPhase('question'); setShowHint(false)
  }, [])

  useEffect(() => {
    async function init() {
      if (initialized.current) return
      const store = loadSRS(); srsRef.current = store

      if (isSpecialMode) {
        const allCategoryItems = SPECIALIZED_DATA[type || ''] || []
        let filtered = allCategoryItems
        if (chapter) {
          filtered = allCategoryItems.filter(item => item.chapter === chapter)
        }
        if (filtered.length > 0) {
          setVocab(allCategoryItems)
          setQuestionPool(filtered)
          startQuiz(filtered, store, allCategoryItems)
          initialized.current = true
        } else {
          setFinalStats({ correct: 0, total: 0, srsStore: store }); setPhase('result')
        }
        return
      }

      let v: VocabItem[] | null = getGlobalVocab()
      if (!v || v.length === 0) {
        v = loadLocalVocab()
      }

      if (v && v.length > 0) {
        let pool = v
        if (isKanjiMode) {
          pool = pool.filter(item => item.kanji && item.kanji !== item.hiragana)
        }
        let filtered = pool
        if (chapter) {
          filtered = pool.filter(item => item.chapter === chapter)
        }
        if (level) {
          filtered = filtered.filter(item => getWordJLPTLevel(item.kanji, item.chapter) === level)
        }

        if (filtered.length > 0) {
          setVocab(pool)
          setQuestionPool(filtered)
          startQuiz(filtered, store, pool)
          initialized.current = true
        } else {
          setFinalStats({ correct: 0, total: 0, srsStore: store }); setPhase('result')
        }
      } else if (phase === 'loading') {
        setFinalStats({ correct: 0, total: 0, srsStore: store }); setPhase('result')
      }
    }
    init()
  }, [isKanjiMode, isSpecialMode, type, chapter, level, startQuiz])

  // Auto-play pronunciation when a new question loads
  useEffect(() => {
    if (phase === 'question' && state?.queue && state.queue[state.current]) {
      const currentVocab = state.queue[state.current]
      speakJapanese(currentVocab.hiragana || currentVocab.kanji)
    }
  }, [state?.current, phase])


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
      // Sound: streak > level up > correct
      if (ns >= 3) playStreak()
      else if (newLevel > prevLevel && newLevel >= MASTERED_LEVEL) playLevelUp()
      else playCorrect()
      setState(p => p ? { ...p, roundStreak: ns, sessionCorrect: p.sessionCorrect + 1, sessionAnswered: p.sessionAnswered + 1 } : p)
    } else {
      playWrong()
      if (state.lives - 1 <= 0) playLoseHeart()
      setState(p => p ? { ...p, roundStreak: 0, lives: p.lives - 1, sessionAnswered: p.sessionAnswered + 1 } : p)
    }
  }, [state, phase])

  async function nextQuestion() {
    if (!state) return
    if (state.lives <= 0 || state.current + 1 >= state.queue.length) {
      saveSRS(srsRef.current)
      const fs = { correct: state.sessionCorrect, total: state.sessionAnswered, srsStore: srsRef.current }
      updateAfterSession(fs.correct, fs.total)
      
      const isAuto = localStorage.getItem('kotoba_sync_mode') !== 'manual'
      if (isAuto) pushToCloud() // sync ke drive (Background sync biar ga stuck)
      
      setFinalStats(fs)
      playFinish(); setPhase('result'); return
    }
    const next = state.current + 1
    setState(p => p ? { ...p, current: next } : p)
    setChoices(getChoices(state.queue[next], vocab))
    setSelected(null); setIsCorrect(null); setCardKey(k => k + 1); setPhase('question'); setShowHint(false)
  }

  /* Loading */
  if (phase === 'loading' || !state) {
    return (
      <div className="flex items-center justify-center min-h-dvh" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p className="jp text-3xl mb-3" style={{ color: 'var(--color-text-2)' }}>読み込み中</p>
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
      onRetry={() => startQuiz(questionPool, srsRef.current, vocab)} onHome={() => router.replace('/')} isKanji={isKanjiMode} />
  }

  const q = state.queue[state.current]
  const { main, sub } = getDisplayText(q)
  const progress = (state.current / state.queue.length) * 100
  const cat = getCategoryStyle(q.category)
  const wp = getWordProgress(srsRef.current, q.id)
  const isRefresh = wp.level >= MASTERED_LEVEL

  return (
    <div className="flex flex-col min-h-dvh max-w-sm mx-auto" style={{ background: 'var(--color-bg)' }}>

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-5">
          {/* Close */}
          <button onClick={() => { saveSRS(srsRef.current); pushToCloud(); router.replace('/') }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 active:scale-95 transition-transform"
            style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            ✕
          </button>

          {/* Progress bar */}
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 10, background: 'var(--color-subtle)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: progress + '%', background: 'var(--color-accent)', boxShadow: '0 0 8px rgba(91,94,244,0.35)' }} />
          </div>
        </div>

        {/* Lives + badges */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <span key={i} style={{ fontSize: 18, opacity: i <= state.lives ? 1 : 0.15, transition: 'opacity 0.3s' }}>❤️</span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {isKanjiMode && (
              <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider"
                style={{ background: 'var(--color-accent)', color: '#fff' }}>
                {level ? `Kanji JLPT ${level}` : 'Kanji Mode'}
              </span>
            )}
            {isSpecialMode && (
              <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase tracking-wider"
                style={{ background: 'var(--color-accent)', color: '#fff' }}>
                Latihan {type === 'angka' ? 'Angka' : type === 'hari' ? 'Hari/Waktu' : 'Uang'}{chapter ? ` • ${chapter}` : ''}
              </span>
            )}
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
          
          {/* Pronunciation buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
            {/* Furigana Toggle */}
            {sub && (
              <button 
                onClick={() => {
                  const newVal = !showFurigana
                  setShowFurigana(newVal)
                  localStorage.setItem('kotoba_show_furigana', String(newVal))
                  playTap()
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs active:scale-95 transition-all border ${
                  showFurigana 
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' 
                    : 'bg-[var(--color-bg)] text-[var(--color-text-3)] border-[var(--color-border)]'
                }`}
                title={showFurigana ? "Sembunyikan Furigana" : "Tampilkan Furigana"}
              >
                あ
              </button>
            )}
            {/* Turtle (Slow-mo) */}
            <button onClick={() => speakJapanese(q.hiragana || q.kanji, true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all text-sm border border-[var(--color-border)]"
              title="Pelafalan Lambat (Slow-mo)">
              🐢
            </button>
            {/* Normal */}
            <button onClick={() => speakJapanese(q.hiragana || q.kanji, false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all text-[var(--color-text-2)] border border-[var(--color-border)]"
              title="Pelafalan Normal">
              <VolumeIcon size={16} />
            </button>
          </div>


          
          <div className="min-h-[20px] mb-2 flex justify-center">
            {sub && !showFurigana && (isKanjiMode ? (
              showHint ? (
                <p className="relative jp text-xs anim-pop" style={{ color: 'var(--color-text-3)', letterSpacing: '0.1em' }}>{sub}</p>
              ) : (
                <button onClick={() => { setShowHint(true); playTap() }} 
                  className="relative text-[10px] font-bold px-3 py-1 rounded-full border border-dashed border-[var(--color-border)] text-[var(--color-text-3)] active:scale-95 transition-all">
                  💡 Hint?
                </button>
              )
            ) : (
              <p className="relative jp text-xs" style={{ color: 'var(--color-text-3)', letterSpacing: '0.1em' }}>{sub}</p>
            ))}
          </div>

          <p className="relative jp" style={{
            fontSize: main.length > 6 ? '2.2rem' : main.length > 3 ? '2.8rem' : '3.5rem',
            fontWeight: 700, color: 'var(--color-text-1)', lineHeight: 1.2,
          }}>
            {sub && showFurigana ? (
              <ruby className="ruby-text">
                {main}
                <rt className="font-semibold text-[var(--color-text-3)] dark:text-gray-400 select-none tracking-normal opacity-85 block pb-1" style={{ fontSize: '0.38em' }}>
                  {sub}
                </rt>
              </ruby>
            ) : (
              main
            )}
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
                  : <span>Jawaban: <span className="jp font-bold" style={{ color: 'var(--color-green-dark)' }}>{q.arti}</span></span>
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
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

/* ── Result Screen ── */
function ResultScreen({ stats, vocab, srsStore, onRetry, onHome, isKanji }: {
  stats: { correct: number; total: number }
  vocab: VocabItem[]; srsStore: SRSStore
  onRetry: () => void; onHome: () => void; isKanji?: boolean
}) {
  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const great = pct >= 80; const ok = pct >= 50

  return (
    <div className="flex flex-col min-h-dvh max-w-sm mx-auto px-4 py-14" style={{ background: 'var(--color-bg)' }}>
      <div className="anim-pop flex-1 flex flex-col">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{great ? '🎉' : ok ? '💪' : '📚'}</div>
          <h2 className="font-extrabold mb-2" style={{ fontSize: '1.4rem', color: 'var(--color-text-1)' }}>
            {great ? 'すごい！ Luar biasa!' : ok ? 'Hasil yang cukup baik!' : 'Jangan menyerah!'}
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-2)' }}>
            {great ? 'Pertahankan terus ya!' : ok ? 'Ulangi agar semakin lancar!' : 'Coba lagi, pasti bisa!'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { icon: '🎯', val: `${stats.correct}/${stats.total}`, label: 'Benar',   color: 'var(--color-green)',  bg: 'var(--color-green-light)' },
            { icon: '📅', val: `+1`,                             label: 'Session', color: 'var(--color-amber)',  bg: 'var(--color-amber-light)' },
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
            Berlatih lagi 🔄
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
