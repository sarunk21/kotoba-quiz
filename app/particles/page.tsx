'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PARTICLE_QUESTIONS, type ParticleQuestion } from '@/lib/particles-data'
import { playCorrect, playWrong, playFinish, playLoseHeart, playTap } from '@/lib/sounds'

export default function ParticlesQuizPage() {
  const router = useRouter()

  // Game States
  // Shuffle questions on mount
  const [questions, setQuestions] = useState<ParticleQuestion[]>(() => {
    return [...PARTICLE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const currentQuestion = useMemo(() => {
    return questions[currentIndex] || null
  }, [questions, currentIndex])

  const handleSelect = (option: string) => {
    if (isChecked) return
    playTap()
    setSelectedOption(option)
  }

  const handleCheck = () => {
    if (isChecked || !selectedOption || !currentQuestion) return

    const correct = currentQuestion.correct
    const isUserCorrect = selectedOption === correct

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
      setSelectedOption(null)
      setIsChecked(false)
    }
  }

  const handleRestart = () => {
    playTap()
    const shuffled = [...PARTICLE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
    setQuestions(shuffled)
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsChecked(false)
    setLives(3)
    setScore(0)
    setIsGameOver(false)
    setIsFinished(false)
  }

  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-sm font-bold text-[var(--color-text-2)]">Memuat latihan...</p>
      </div>
    )
  }

  const progressPct = Math.round((currentIndex / questions.length) * 100)

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-4 mb-8 anim-up">
          <button 
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform"
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

        {/* Game States Wrapper */}
        {isGameOver ? (
          /* Game Over Screen */
          <div className="my-auto flex flex-col items-center text-center p-6 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] shadow-card anim-pop">
            <span className="text-6xl mb-4">🕯️</span>
            <h2 className="text-xl font-black text-[var(--color-text-1)] mb-2">Nyawa Habis!</h2>
            <p className="text-xs font-semibold text-[var(--color-text-2)] mb-6 leading-relaxed">
              Kamu melakukan 3 kesalahan. Jangan menyerah! Coba lagi untuk menguasai partikel Jepang.
            </p>
            <div className="w-full flex flex-col gap-2.5">
              <button 
                onClick={handleRestart}
                className="w-full rounded-2xl py-3.5 text-sm font-extrabold bg-[var(--color-accent)] text-white shadow-btn active:scale-95 transition-transform"
              >
                Coba Lagi 🔄
              </button>
              <button 
                onClick={() => router.push('/')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        ) : isFinished ? (
          /* Finished Screen */
          <div className="my-auto flex flex-col items-center text-center p-6 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] shadow-card anim-pop">
            <span className="text-6xl mb-4">🏆</span>
            <h2 className="text-xl font-black text-[var(--color-text-1)] mb-2">Latihan Selesai!</h2>
            <p className="text-xs font-semibold text-[var(--color-text-2)] mb-6">
              Hebat! Kamu telah menyelesaikan latihan partikel hari ini.
            </p>

            {/* Scoreboard */}
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="rounded-2xl p-4 bg-[var(--color-accent-light)] border border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-2)]">Benar</p>
                <p className="text-2xl font-black text-[var(--color-accent)] mt-1">{score} / 10</p>
              </div>
              <div className="rounded-2xl p-4 bg-green-50 dark:bg-green-950/20 border border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text-2)]">Akurasi</p>
                <p className="text-2xl font-black text-green-500 mt-1">{Math.round((score / 10) * 100)}%</p>
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
                onClick={() => router.push('/')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Screen */
          <div className="flex-1 flex flex-col justify-between anim-up">
            {/* Question Card */}
            <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] p-6 shadow-card mb-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)] mb-3 block">
                PILIH PARTIKEL YANG TEPAT
              </span>
              <h2 className="text-2xl font-black jp tracking-wide leading-relaxed text-[var(--color-text-1)] mb-4 select-text">
                {isChecked 
                  ? currentQuestion.sentence.replace('___', ` 【 ${currentQuestion.correct} 】 `) 
                  : currentQuestion.sentence
                }
              </h2>
              <div className="h-[1.5px] w-full bg-[var(--color-border)] my-4" />
              <p className="text-xs font-bold text-[var(--color-text-2)] leading-relaxed select-text">
                🇮🇩 {currentQuestion.translation}
              </p>
            </div>

            {/* Multiple Choice Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedOption === opt
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
                  const isCorrectOpt = opt === currentQuestion.correct
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
                    onClick={() => handleSelect(opt)}
                    disabled={isChecked}
                    className="rounded-2xl p-4 text-base font-extrabold border-2 transition-all active:scale-95 text-center flex items-center justify-center min-h-[64px]"
                    style={btnStyle}
                  >
                    <span className="jp text-lg">{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation / Bottom Panel */}
            {isChecked && (
              <div 
                className={`rounded-[24px] p-4 border mb-6 anim-pop ${
                  isCorrect 
                    ? 'bg-green-50/50 dark:bg-green-950/10 border-green-500/30' 
                    : 'bg-red-50/50 dark:bg-red-950/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{isCorrect ? '✓' : '✗'}</span>
                  <h4 className={`text-xs font-black uppercase ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah!'}
                  </h4>
                </div>
                <p className="text-[10px] font-bold text-[var(--color-text-2)] leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto">
              {!isChecked ? (
                <button 
                  onClick={handleCheck}
                  disabled={!selectedOption}
                  className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
                  style={{
                    background: selectedOption ? 'var(--color-accent)' : 'var(--color-subtle)',
                    color: selectedOption ? '#fff' : 'var(--color-text-3)',
                    boxShadow: selectedOption ? '0 8px 20px rgba(91,94,244,0.28)' : 'none',
                    opacity: selectedOption ? 1 : 0.6
                  }}
                >
                  Periksa Jawaban 🔍
                </button>
              ) : (
                <button 
                  onClick={handleNext}
                  className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform text-white bg-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.28)]"
                >
                  {currentIndex + 1 >= questions.length ? 'Selesaikan Latihan 🎉' : 'Lanjut →'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
