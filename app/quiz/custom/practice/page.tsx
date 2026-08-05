'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CustomQuiz, CustomQuestion } from '../page'
import { playCorrect, playWrong, playFinish, playLoseHeart, playTap, speakJapanese } from '@/lib/sounds'
import { addFuriganaToSentence } from '@/lib/vocab'

export default function CustomQuizPracticePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat latihan...</p>
      </div>
    }>
      <CustomQuizPracticeContent />
    </Suspense>
  )
}

function CustomQuizPracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quizId = searchParams.get('id')

  // Game States
  const [quiz, setQuiz] = useState<CustomQuiz | null>(null)
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [textInput, setTextInput] = useState<string>('')
  
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kotoba_show_furigana')
    setShowFurigana(saved !== 'false')
  }, [])

  // Intercept browser / device back button during active quiz
  useEffect(() => {
    if (!quiz || isFinished || isGameOver) return
    window.history.pushState({ inQuiz: true }, '', window.location.href)

    const handlePopState = () => {
      window.history.pushState({ inQuiz: true }, '', window.location.href)
      setShowExitConfirm(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [quiz, isFinished, isGameOver])

  // Load quiz on mount
  useEffect(() => {
    if (!quizId) return
    const saved = localStorage.getItem('kotoba_custom_quizzes')
    if (saved) {
      try {
        const list: CustomQuiz[] = JSON.parse(saved)
        const found = list.find(q => q.id === quizId)
        if (found) {
          setTimeout(() => {
            setQuiz(found)
            // Filter out section headers and keep only actual questions
            const actualQuestions = found.questions.filter(q => q.type !== 'section')
            // Shuffle questions for practice
            const shuffled = [...actualQuestions].sort(() => Math.random() - 0.5)
            setQuestions(shuffled)
          }, 0)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [quizId])

  const currentQuestion = useMemo(() => {
    return questions[currentIndex] || null
  }, [questions, currentIndex])

  const correctAnswer = useMemo(() => {
    if (!quiz || !currentQuestion) return ''
    return quiz.answerKey?.[currentQuestion.id] || ''
  }, [quiz, currentQuestion])

  const handleSelectOption = (choice: string) => {
    if (isChecked) return
    playTap()
    setSelectedAnswer(choice)
  }

  const handleCheck = () => {
    if (isChecked || !currentQuestion || !quiz) return

    const userAns = currentQuestion.type === 'text' ? textInput : selectedAnswer
    if (!userAns.trim()) return // Don't allow empty answers

    let isUserCorrect = false
    if (currentQuestion.type === 'text') {
      isUserCorrect = userAns.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    } else {
      isUserCorrect = userAns === correctAnswer
    }

    setIsCorrect(isUserCorrect)
    setIsChecked(true)

    if (isUserCorrect) {
      playCorrect()
      setScore(s => s + 1)
    } else {
      playWrong()
      playLoseHeart()
      const nextLives = lives - 1
      setLives(nextLives)
      if (nextLives <= 0) {
        setTimeout(() => setIsGameOver(true), 1200)
      }
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      playFinish()
      setIsFinished(true)
    } else {
      playTap()
      setCurrentIndex(c => c + 1)
      setSelectedAnswer('')
      setTextInput('')
      setIsChecked(false)
    }
  }

  const handleRestart = () => {
    playTap()
    // Reshuffle questions
    if (quiz) {
      const actualQuestions = quiz.questions.filter(q => q.type !== 'section')
      setQuestions([...actualQuestions].sort(() => Math.random() - 0.5))
    }
    setCurrentIndex(0)
    setSelectedAnswer('')
    setTextInput('')
    setIsChecked(false)
    setLives(3)
    setScore(0)
    setIsGameOver(false)
    setIsFinished(false)
  }

  if (!quiz || questions.length === 0 || !currentQuestion) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm font-bold text-[var(--color-text-2)]">Kuis tidak ditemukan atau memuat...</p>
      </div>
    )
  }

  const progressPct = Math.round((currentIndex / questions.length) * 100)

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-4 mb-8 anim-up">
          <button 
            onClick={() => {
              playTap()
              setShowExitConfirm(true)
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform cursor-pointer"
          >
            ←
          </button>
          
          {/* Progress Bar */}
          <div className="flex-1 h-3 rounded-full bg-[var(--color-subtle)] overflow-hidden border border-[var(--color-border)]">
            <div 
              className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Lives Indicator */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(h => (
              <span key={h} className="text-lg transition-transform duration-300">
                {h <= lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </header>

        {/* Game Screen Wrapper */}
        {isGameOver ? (
          /* Game Over Screen */
          <div className="my-auto flex flex-col items-center text-center p-6 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] shadow-card anim-pop">
            <span className="text-6xl mb-4">🕯️</span>
            <h2 className="text-xl font-black text-[var(--color-text-1)] mb-2">Nyawa Habis!</h2>
            <p className="text-xs font-semibold text-[var(--color-text-2)] mb-6 leading-relaxed">
              Kamu melakukan 3 kesalahan dalam kuis ini. Jangan berkecil hati, ayo latih kembali!
            </p>
            <div className="w-full flex flex-col gap-2.5">
              <button 
                onClick={handleRestart}
                className="w-full rounded-2xl py-3.5 text-sm font-extrabold bg-[var(--color-accent)] text-white shadow-btn active:scale-95 transition-transform"
              >
                Coba Lagi 🔄
              </button>
              <button 
                onClick={() => router.push('/quiz/custom')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Kembali ke Daftar Kuis
              </button>
            </div>
          </div>
        ) : isFinished ? (
          /* Finished Screen */
          <div className="my-auto flex flex-col items-center text-center p-6 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] shadow-card anim-pop">
            <span className="text-6xl mb-4">🏆</span>
            <h2 className="text-xl font-black text-[var(--color-text-1)] mb-2">Selesai!</h2>
            <p className="text-xs font-semibold text-[var(--color-text-2)] mb-6">
              Hebat! Kamu telah menyelesaikan kuis &quot;{quiz.title}&quot; hari ini.
            </p>

            {/* Scoreboard */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="rounded-2xl p-4 bg-[var(--color-accent-light)] border border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-2)]">Benar</p>
                <p className="text-2xl font-black text-[var(--color-accent)] mt-1">{score} / {questions.length}</p>
              </div>
              <div className="rounded-2xl p-4 bg-green-50 dark:bg-green-950/20 border border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-2)]">Akurasi</p>
                <p className="text-2xl font-black text-green-500 mt-1">{Math.round((score / questions.length) * 100)}%</p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button 
                onClick={handleRestart}
                className="w-full rounded-2xl py-3.5 text-sm font-extrabold bg-[var(--color-accent)] text-white shadow-btn active:scale-95 transition-transform"
              >
                Latihan Lagi 🔄
              </button>
              <button 
                onClick={() => router.push('/quiz/custom')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Kembali ke Daftar Kuis
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Screen */
          <div className="flex-1 flex flex-col justify-between anim-up">
            <div>
              {/* Section Header Hint (if belongs to a section) */}
              {currentQuestion.section && (
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-2.5 block text-center">
                  📁 Bagian: {currentQuestion.section}
                </span>
              )}

              {/* Question Card */}
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] p-6 shadow-card mb-5 text-center relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)]">
                    PERTANYAAN {currentIndex + 1} DARI {questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Furigana Toggle */}
                    <button 
                      onClick={() => {
                        const newVal = !showFurigana
                        setShowFurigana(newVal)
                        localStorage.setItem('kotoba_show_furigana', String(newVal))
                        playTap()
                      }}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-all active:scale-95 cursor-pointer ${
                        showFurigana 
                          ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' 
                          : 'bg-[var(--color-bg)] text-[var(--color-text-3)] border-[var(--color-border)]'
                      }`}
                      title={showFurigana ? "Sembunyikan Furigana" : "Tampilkan Furigana"}
                    >
                      <span>あ</span>
                      <span>{showFurigana ? 'ON' : 'OFF'}</span>
                    </button>
                    <button 
                      onClick={() => speakJapanese(currentQuestion.title)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all text-xs border border-[var(--color-border)] text-[var(--color-text-2)] cursor-pointer"
                      title="Dengarkan Suara"
                    >
                      🔊
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-black jp tracking-wide leading-relaxed text-[var(--color-text-1)] select-text">
                  {showFurigana ? (
                    <span dangerouslySetInnerHTML={{ 
                      __html: addFuriganaToSentence(currentQuestion.title) 
                    }} />
                  ) : (
                    currentQuestion.title
                  )}
                </h2>
              </div>

              {/* Multiple Choice Answers */}
              {currentQuestion.type !== 'text' && currentQuestion.choices && (
                <div className="space-y-2.5 mb-6">
                  {currentQuestion.choices.map((opt) => {
                    const isSelected = selectedAnswer === opt
                    let btnStyle = {
                      background: 'var(--color-white)',
                      color: 'var(--color-text-1)',
                      borderColor: 'var(--color-border)'
                    }

                    if (isSelected) {
                      btnStyle = {
                        background: 'var(--color-accent-light)',
                        color: 'var(--color-accent)',
                        borderColor: 'var(--color-accent)'
                      }
                    }

                    if (isChecked) {
                      const isCorrectOpt = opt === correctAnswer
                      if (isCorrectOpt) {
                        btnStyle = {
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: 'rgb(34, 197, 94)',
                          borderColor: 'rgb(34, 197, 94)'
                        }
                      } else if (isSelected && !isCorrect) {
                        btnStyle = {
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'rgb(239, 68, 68)',
                          borderColor: 'rgb(239, 68, 68)'
                        }
                      }
                    }

                    return (
                      <button 
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isChecked}
                        className="w-full rounded-2xl p-4 text-xs font-black border-2 transition-all active:scale-[0.99] text-left flex items-center justify-between gap-3 min-h-[58px]"
                        style={btnStyle}
                      >
                        <span className="jp leading-relaxed">{opt}</span>
                        {isChecked && opt === correctAnswer && <span className="text-green-500 font-bold">✓</span>}
                        {isChecked && isSelected && !isCorrect && <span className="text-red-500 font-bold">✗</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Text Short Answer Input */}
              {currentQuestion.type === 'text' && (
                <div className="mb-6">
                  <input
                    type="text"
                    disabled={isChecked}
                    placeholder="Ketik jawaban Anda disini..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full rounded-2xl py-4 px-4 text-xs font-black bg-white dark:bg-[#1a1d24] border-2 text-[var(--color-text-1)] focus:outline-none transition-all shadow-sm"
                    style={{
                      borderColor: isChecked 
                        ? isCorrect 
                          ? 'rgb(34, 197, 94)' 
                          : 'rgb(239, 68, 68)'
                        : 'var(--color-border)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-auto">
              {!isChecked && (
                <button 
                  onClick={handleCheck}
                  disabled={currentQuestion.type === 'text' ? !textInput.trim() : !selectedAnswer}
                  className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform cursor-pointer"
                  style={{
                    background: (currentQuestion.type === 'text' ? textInput.trim() : selectedAnswer) 
                      ? 'var(--color-accent)' 
                      : 'var(--color-subtle)',
                    color: (currentQuestion.type === 'text' ? textInput.trim() : selectedAnswer) 
                      ? '#fff' 
                      : 'var(--color-text-3)',
                    boxShadow: (currentQuestion.type === 'text' ? textInput.trim() : selectedAnswer) 
                      ? '0 8px 20px rgba(91,94,244,0.28)' 
                      : 'none',
                    opacity: (currentQuestion.type === 'text' ? textInput.trim() : selectedAnswer) ? 1 : 0.6
                  }}
                >
                  Periksa Jawaban 🔍
                </button>
              )}
            </div>

            {/* Fixed Bottom Feedback Sheet */}
            {isChecked && (
              <div className="fixed bottom-0 left-0 right-0 z-[160] anim-up shadow-[0_-8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl border-t bg-white dark:bg-[#1a1d24] border-[var(--color-border)] rounded-t-[32px]">
                <div className="max-w-sm md:max-w-2xl mx-auto px-5 pt-5 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-3.5">
                  <div className={`p-4 rounded-2xl border ${
                    isCorrect 
                      ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300' 
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{isCorrect ? '✓' : '✗'}</span>
                      <h4 className={`text-xs font-black uppercase ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isCorrect ? 'Jawaban Benar!' : 'Jawaban Kurang Tepat'}
                      </h4>
                    </div>
                    {!isCorrect && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-0.5">Jawaban yang Benar:</p>
                        <p className="text-xs font-black text-green-600 dark:text-green-400 jp">{correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleNext}
                    className="w-full rounded-2xl py-3.5 text-base font-extrabold active:scale-95 transition-transform text-white bg-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.28)] cursor-pointer"
                  >
                    {currentIndex + 1 >= questions.length ? 'Selesaikan Latihan 🎉' : 'Lanjut →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Exit Confirmation Modal ── */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm anim-fade">
            <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center anim-pop">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-2xl mx-auto mb-3">
                ⚠️
              </div>
              <h3 className="text-base font-black text-[var(--color-text-1)] mb-1">
                Keluar dari Kuis Custom?
              </h3>
              <p className="text-xs font-semibold text-[var(--color-text-3)] mb-6">
                Kemajuan sesi kuis ini belum selesai. Apakah Anda yakin ingin keluar?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => { playTap(); setShowExitConfirm(false) }}
                  className="w-full py-3 rounded-xl font-extrabold text-xs bg-[var(--color-accent)] text-white active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Lanjutkan Kuis ➔
                </button>
                <button
                  onClick={() => {
                    playTap()
                    router.push('/quiz/custom')
                  }}
                  className="w-full py-3 rounded-xl font-extrabold text-xs bg-[var(--color-subtle)] text-rose-600 dark:text-rose-400 active:scale-95 transition-all cursor-pointer"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
