'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { loadSRS, onCorrect, onWrong, MASTERED_LEVEL, type SRSStore } from './srs'
import { playCorrect, playWrong, playStreak, playLevelUp, playFinish, playLoseHeart } from './sounds'
import { finishSession, loadLivesEnabled } from './session'

export const TOTAL_QUESTIONS = 10

export type QuizPhase = 'question' | 'feedback' | 'result'

export interface QuizEngineOptions<T> {
  queue: T[]
  srsEnabled?: boolean
  getSrsId?: (item: T) => string
  checkAnswer: (item: T, choice: string) => boolean
  onAnswered?: (item: T, correct: boolean) => void
  onFinish?: (correct: number, total: number, store: SRSStore) => void
}

export function useQuizEngine<T>(opts: QuizEngineOptions<T>) {
  const { queue, srsEnabled = true, getSrsId, checkAnswer, onAnswered, onFinish } = opts

  const [phase, setPhase] = useState<QuizPhase>('question')
  const [current, setCurrent] = useState(0)
  const [lives, setLives] = useState(3)
  const [livesEnabled, setLivesEnabled] = useState(true)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionAnswered, setSessionAnswered] = useState(0)
  const [roundStreak, setRoundStreak] = useState(0)

  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [cardKey, setCardKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const srsRef = useRef<SRSStore>({})

  useEffect(() => {
    srsRef.current = loadSRS()
    setLivesEnabled(loadLivesEnabled())
  }, [])

  // Browser back-button exit guard during active quiz
  useEffect(() => {
    if (phase !== 'question' && phase !== 'feedback') return
    window.history.pushState({ inQuiz: true }, '', window.location.href)
    const handlePop = () => {
      window.history.pushState({ inQuiz: true }, '', window.location.href)
      setShowExitConfirm(true)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [phase])

  const currentItem = queue[current]

  const answer = useCallback((choice: string) => {
    if (!currentItem || phase !== 'question') return

    const correct = checkAnswer(currentItem, choice)
    setSelected(choice)
    setIsCorrect(correct)
    setPhase('feedback')

    if (onAnswered) {
      onAnswered(currentItem, correct)
    }

    if (srsEnabled && getSrsId) {
      const srsId = getSrsId(currentItem)
      const prevLevel = srsRef.current[srsId]?.level || 0
      srsRef.current = correct ? onCorrect(srsRef.current, srsId) : onWrong(srsRef.current, srsId)
      const newLevel = srsRef.current[srsId]?.level || 0

      if (correct) {
        const ns = roundStreak + 1
        if (ns >= 3) playStreak()
        else if (newLevel > prevLevel && newLevel >= MASTERED_LEVEL) playLevelUp()
        else playCorrect()
        setRoundStreak(ns)
        setSessionCorrect(c => c + 1)
      } else {
        playWrong()
        if (livesEnabled && lives - 1 <= 0) playLoseHeart()
        setRoundStreak(0)
        if (livesEnabled) setLives(l => l - 1)
      }
    } else {
      // Non-SRS mode (e.g. general stats update)
      if (correct) {
        const ns = roundStreak + 1
        if (ns >= 3) playStreak()
        else playCorrect()
        setRoundStreak(ns)
        setSessionCorrect(c => c + 1)
      } else {
        playWrong()
        if (livesEnabled && lives - 1 <= 0) playLoseHeart()
        setRoundStreak(0)
        if (livesEnabled) setLives(l => l - 1)
      }
    }

    setSessionAnswered(a => a + 1)
  }, [currentItem, phase, checkAnswer, srsEnabled, getSrsId, roundStreak, livesEnabled, lives, onAnswered])

  const finish = useCallback(() => {
    playFinish()
    setPhase('result')
    finishSession(srsRef.current, sessionCorrect, sessionAnswered)
    if (onFinish) {
      onFinish(sessionCorrect, sessionAnswered, srsRef.current)
    }
  }, [sessionCorrect, sessionAnswered, onFinish])

  const next = useCallback(() => {
    if ( (livesEnabled && lives <= 0) || current + 1 >= queue.length) {
      finish()
      return
    }
    setCurrent(c => c + 1)
    setSelected(null)
    setIsCorrect(null)
    setCardKey(k => k + 1)
    setPhase('question')
  }, [livesEnabled, lives, current, queue.length, finish])

  const progress = queue.length > 0 ? (current / queue.length) * 100 : 0

  /** Live SRS level for the given id (safe: returns 0 when missing). */
  const getProgress = useCallback((id: string): number => {
    return srsRef.current[id]?.level ?? 0
  }, [])

  /** Raw access to the live SRS store (for exit-save etc). */
  const getSrsStore = useCallback((): SRSStore => srsRef.current, [])

  /** Restart the session flow. Page should update its own queue state first. */
  const reset = useCallback(() => {
    setCurrent(0)
    setLives(3)
    setSessionCorrect(0)
    setSessionAnswered(0)
    setRoundStreak(0)
    setSelected(null)
    setIsCorrect(null)
    setCardKey(k => k + 1)
    setPhase('question')
  }, [])

  return {
    phase,
    current,
    currentItem,
    queueLength: queue.length,
    progress,
    lives,
    livesEnabled,
    sessionCorrect,
    sessionAnswered,
    roundStreak,
    selected,
    isCorrect,
    cardKey,
    showExitConfirm,
    setShowExitConfirm,
    answer,
    next,
    finish,
    reset,
    getProgress,
    getSrsStore,
  }
}
