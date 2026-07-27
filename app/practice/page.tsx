'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { playTap } from '@/lib/sounds'
import BottomNav from '@/components/BottomNav'

interface PracticeQuestion {
  id: string
  title: string
  description?: string
  choices: string[]
  correctAnswer: string
  bab: string
}

interface ChapterExercise {
  bab: string
  title: string
  url: string
  questionsCount: number
  questions: PracticeQuestion[]
}

export default function PracticeHubPage() {
  const [exercises, setExercises] = useState<ChapterExercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [selectedBab, setSelectedBab] = useState<string | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<ChapterExercise | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)

  useEffect(() => {
    fetch('/data/practice-default.json')
      .then(res => res.json())
      .then((data: ChapterExercise[]) => {
        setExercises(data)
        setLoadingExercises(false)
      })
      .catch(err => {
        console.error('[PracticeHub] Error loading practice-default.json:', err)
        setLoadingExercises(false)
      })
  }, [])

  const startChapterQuiz = (ch: ChapterExercise) => {
    playTap()
    setActiveQuiz(ch)
    setCurrentQIndex(0)
    setSelectedChoice(null)
    setScore(0)
    setIsAnswered(false)
    setQuizFinished(false)
  }

  const handleAnswer = (choice: string) => {
    if (isAnswered || !activeQuiz) return
    playTap()
    setSelectedChoice(choice)
    setIsAnswered(true)

    const currentQ = activeQuiz.questions[currentQIndex]
    if (choice === currentQ.correctAnswer) {
      setScore(s => s + 1)
    }
  }

  const nextQuestion = () => {
    playTap()
    if (!activeQuiz) return

    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex(i => i + 1)
      setSelectedChoice(null)
      setIsAnswered(false)
    } else {
      setQuizFinished(true)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-28 pt-6 px-4 max-w-xl mx-auto">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text-1)] tracking-tight">
            あ Pusat Latihan & Tata Bahasa
          </h1>
          <p className="text-xs font-bold text-[var(--color-text-2)] mt-0.5">
            Latihan partikel, susun kalimat, dan 1.459 soal per bab (Bab 1–25)
          </p>
        </div>
      </div>

      {/* Mode Kuis Aktif Modal/Overlay */}
      {activeQuiz ? (
        <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-3xl p-5 shadow-xl transition-all">
          {quizFinished ? (
            /* Quiz Completed View */
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-xl font-extrabold text-[var(--color-text-1)]">Kuis Selesai!</h2>
              <p className="text-xs font-bold text-[var(--color-text-2)] mt-1">
                Kamu menjawab <span className="text-[var(--color-accent)] font-extrabold text-sm">{score}</span> dari {activeQuiz.questions.length} soal dengan benar.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => startChapterQuiz(activeQuiz)}
                  className="flex-1 py-3 rounded-2xl font-black text-xs bg-[var(--color-accent-light)] text-[var(--color-accent)] active:scale-95 transition-transform"
                >
                  🔄 Ulangi Kuis
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="flex-1 py-3 rounded-2xl font-black text-xs bg-[var(--color-subtle)] text-[var(--color-text-1)] active:scale-95 transition-transform"
                >
                  Kembali ke Menu
                </button>
              </div>
            </div>
          ) : (
            /* Active Question View */
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
                <span className="text-xs font-extrabold text-[var(--color-accent)] uppercase tracking-wider">
                  {activeQuiz.bab} • Soal {currentQIndex + 1} / {activeQuiz.questions.length}
                </span>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs font-bold text-[var(--color-text-3)] hover:text-red-500"
                >
                  ✕ Keluar
                </button>
              </div>

              {/* Question Title */}
              <h3 className="text-base font-extrabold text-[var(--color-text-1)] mb-4 leading-relaxed">
                {activeQuiz.questions[currentQIndex].title}
              </h3>

              {/* Choice Buttons */}
              <div className="space-y-2.5 mb-6">
                {activeQuiz.questions[currentQIndex].choices.map((choice, idx) => {
                  const isCorrect = choice === activeQuiz.questions[currentQIndex].correctAnswer
                  const isSelected = choice === selectedChoice

                  let btnStyle = 'border-[var(--color-border)] bg-[var(--color-white)] text-[var(--color-text-1)] hover:bg-[var(--color-subtle)]'
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-extrabold'
                    } else if (isSelected) {
                      btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-extrabold'
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleAnswer(choice)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs font-bold active:scale-[0.98] ${btnStyle}`}
                    >
                      <span className="mr-2 opacity-60">{String.fromCharCode(65 + idx)}.</span>
                      {choice}
                    </button>
                  )
                })}
              </div>

              {/* Next Question Button */}
              {isAnswered && (
                <button
                  onClick={nextQuestion}
                  className="w-full py-3.5 rounded-2xl bg-[var(--color-accent)] text-white font-black text-xs shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                >
                  {currentQIndex < activeQuiz.questions.length - 1 ? 'Soal Berikutnya ➔' : 'Lihat Hasil 🎉'}
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Practice Menu Grid */
        <div className="space-y-6">
          {/* Main Practice Categories */}
          <div className="grid grid-cols-2 gap-3">
            {/* Hiragana & Katakana */}
            <Link
              href="/kana"
              onClick={playTap}
              className="block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-md transition-all h-full">
                <div className="jp-serif text-3xl font-extrabold text-indigo-500 mb-2">あ</div>
                <p className="font-extrabold text-xs text-[var(--color-text-1)]">Kana SRS Quiz</p>
                <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">
                  104 Karakter Hiragana & Katakana
                </p>
              </div>
            </Link>

            {/* Kuis Partikel */}
            <Link
              href="/particles"
              onClick={playTap}
              className="block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-md transition-all h-full">
                <div className="jp-serif text-3xl font-extrabold text-amber-500 mb-2">助</div>
                <p className="font-extrabold text-xs text-[var(--color-text-1)]">Kuis Partikel</p>
                <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">
                  Partikel は, が, を, に, で...
                </p>
              </div>
            </Link>

            {/* Susun Kalimat */}
            <Link
              href="/sentences"
              onClick={playTap}
              className="col-span-2 block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-md transition-all h-full">
                <div className="jp-serif text-3xl font-extrabold text-green-500 mb-2">文</div>
                <p className="font-extrabold text-xs text-[var(--color-text-1)]">Susun Kalimat</p>
                <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">
                  Latihan susun blok kata
                </p>
              </div>
            </Link>
          </div>

          {/* Section: Latihan Per Bab (1.459 Soal Extracted) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[var(--color-text-1)] uppercase tracking-wider">
                  📖 Latihan Per Bab (Bab 1–25)
                </h2>
                <p className="text-[10px] font-bold text-[var(--color-text-3)]">
                  1.459 Soal Latihan Pilihan Ganda
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1 no-scrollbar">
              {loadingExercises ? (
                <div className="col-span-2 py-8 text-center bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl">
                  <div className="w-6 h-6 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[var(--color-text-2)]">Memuat 1.459 Soal Latihan...</p>
                </div>
              ) : (
                exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    onClick={() => startChapterQuiz(ex)}
                    className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-[var(--color-accent)] transition-all active:scale-[0.98]"
                  >
                    <div>
                      <span className="text-xs font-black text-[var(--color-accent)] block">
                        {ex.bab}
                      </span>
                      <p className="text-[11px] font-bold text-[var(--color-text-2)] line-clamp-1">
                        {ex.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-[var(--color-subtle)] px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-[var(--color-text-2)] shrink-0">
                      <span>{ex.questions.length} soal</span>
                      <span className="text-[var(--color-accent)]">➔</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </main>
  )
}
