'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PARTICLE_QUESTIONS, type ParticleQuestion } from '@/lib/particles-data'
import { playCorrect, playWrong, playFinish, playLoseHeart, playTap } from '@/lib/sounds'
import { addFuriganaToSentence } from '@/lib/vocab'

function generateQuestions(particle: string): ParticleQuestion[] {
  if (particle === 'all') {
    return [...PARTICLE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
  }

  let targetPool: ParticleQuestion[] = []
  let distractorPool: ParticleQuestion[] = []

  if (particle === 'lainnya') {
    const lainnyaList = ['へ', 'と', 'も', 'から', 'まで']
    targetPool = PARTICLE_QUESTIONS.filter(q => {
      return lainnyaList.some(p => q.correct.includes(p))
    })
    distractorPool = PARTICLE_QUESTIONS.filter(q => {
      const isTarget = lainnyaList.some(p => q.correct.includes(p))
      const hasOption = lainnyaList.some(p => q.options.includes(p))
      return !isTarget && hasOption
    })
  } else {
    targetPool = PARTICLE_QUESTIONS.filter(q => q.correct.includes(particle))
    distractorPool = PARTICLE_QUESTIONS.filter(q => !q.correct.includes(particle) && q.options.includes(particle))
  }

  const shuffledTargets = [...targetPool].sort(() => Math.random() - 0.5)
  const shuffledDistractors = [...distractorPool].sort(() => Math.random() - 0.5)

  // Aim for a mix: up to 5 target questions, and the rest distractors to make 10 total
  const targetCount = Math.min(5, shuffledTargets.length)
  const distractorCount = Math.min(10 - targetCount, shuffledDistractors.length)

  const selectedTargets = shuffledTargets.slice(0, targetCount)
  const selectedDistractors = shuffledDistractors.slice(0, distractorCount)

  let combined = [...selectedTargets, ...selectedDistractors]
  if (combined.length < 10) {
    const remainingTargets = shuffledTargets.slice(targetCount)
    const needed = 10 - combined.length
    combined = [...combined, ...remainingTargets.slice(0, needed)]
  }

  // Shuffle final list so they are mixed in order
  return combined.sort(() => Math.random() - 0.5)
}

function ParticlesQuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pParam = searchParams.get('p')

  // Selection state (null = show particle category selector screen)
  const [selectedParticle, setSelectedParticle] = useState<string | null>(null)

  // Initialize and sync quiz when query parameter 'p' changes
  useEffect(() => {
    if (pParam) {
      const selectedPool = generateQuestions(pParam)
      setQuestions(selectedPool)
      setSelectedParticle(pParam)
      setCurrentIndex(0)
      setSelectedOption(null)
      setIsChecked(false)
      setLives(3)
      setScore(0)
      setIsGameOver(false)
      setIsFinished(false)
    } else {
      setSelectedParticle(null)
    }
  }, [pParam])

  const [showFurigana, setShowFurigana] = useState(false)

  // Initialize showFurigana state on mount
  useEffect(() => {
    const saved = localStorage.getItem('kotoba_show_furigana')
    setShowFurigana(saved !== 'false') // default to true
  }, [])

  // Game States
  const [questions, setQuestions] = useState<ParticleQuestion[]>([])
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
    if (selectedParticle) {
      playTap()
      const selectedPool = generateQuestions(selectedParticle)
      setQuestions(selectedPool)
      setCurrentIndex(0)
      setSelectedOption(null)
      setIsChecked(false)
      setLives(3)
      setScore(0)
      setIsGameOver(false)
      setIsFinished(false)
    }
  }

  const startQuizWithParticle = (part: string) => {
    playTap()
    router.push(`/particles?p=${part}`)
  }

  // Render Selection Screen
  if (selectedParticle === null) {
    const particleCounts = {
      all: PARTICLE_QUESTIONS.length,
      'は': PARTICLE_QUESTIONS.filter(q => q.correct.includes('は')).length,
      'が': PARTICLE_QUESTIONS.filter(q => q.correct.includes('が')).length,
      'を': PARTICLE_QUESTIONS.filter(q => q.correct.includes('を')).length,
      'に': PARTICLE_QUESTIONS.filter(q => q.correct.includes('に')).length,
      'で': PARTICLE_QUESTIONS.filter(q => q.correct.includes('で')).length,
      'の': PARTICLE_QUESTIONS.filter(q => q.correct.includes('の')).length,
      'lainnya': PARTICLE_QUESTIONS.filter(q => {
        const p = q.correct
        return p.includes('へ') || p.includes('と') || p.includes('も') || p.includes('から') || p.includes('まで')
      }).length
    }

    return (
      <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-sm mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
          {/* Top Header */}
          <header className="flex items-center gap-4 mb-8 anim-up">
            <button 
              onClick={() => router.push('/')}
              className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Latihan Partikel</h1>
              <p className="text-xs font-semibold text-[var(--color-text-2)]">Pilih fokus partikel yang ingin kamu latih</p>
            </div>
          </header>

          <div className="space-y-4 my-auto">
            {/* Campur Semua */}
            <button 
              onClick={() => startQuizWithParticle('all')}
              className="w-full text-left bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white rounded-[24px] p-5 shadow-[0_8px_24px_rgba(91,94,244,0.25)] border-none active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black">⚡ Campur Semua</h3>
                  <p className="text-[10px] opacity-85 font-bold mt-1">Latihan gabungan dari seluruh partikel ({particleCounts.all} soal)</p>
                </div>
                <span className="text-2xl">🎯</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'は', title: 'Topik (は)', desc: 'Penunjuk Topik utama', icon: 'は', bg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40' },
                { key: 'が', title: 'Subjek (が)', desc: 'Penunjuk Pelaku/Eksistensi', icon: 'が', bg: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/40' },
                { key: 'を', title: 'Objek (を)', desc: 'Penunjuk Target tindakan', icon: 'を', bg: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40' },
                { key: 'に', title: 'Koordinat (に)', desc: 'Waktu spesifik / Tempat diam', icon: 'に', bg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 border-amber-100 dark:border-amber-900/40' },
                { key: 'で', title: 'Aktivitas (で)', desc: 'Latar aksi / Alat bantu', icon: 'で', bg: 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40' },
                { key: 'の', title: 'Kepunyaan (の)', desc: 'Lem perekat Kata Benda', icon: 'の', bg: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/40' }
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => startQuizWithParticle(p.key)}
                  className="rounded-[24px] p-4 text-left border flex flex-col justify-between h-32 active:scale-95 transition-transform cursor-pointer bg-white dark:bg-[#1a1d24] border-[var(--color-border)] shadow-sm"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black jp text-base ${p.bg}`}>
                      {p.icon}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)]">
                      {(particleCounts as any)[p.key]} soal
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--color-text-1)] mt-2">{p.title}</h4>
                    <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 leading-tight">{p.desc}</p>
                  </div>
                </button>
              ))}

              {/* Lainnya */}
              <button
                onClick={() => startQuizWithParticle('lainnya')}
                className="col-span-2 rounded-[24px] p-4 text-left border flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer bg-white dark:bg-[#1a1d24] border-[var(--color-border)] shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg bg-gray-100 dark:bg-gray-800 text-[var(--color-text-2)] border border-[var(--color-border)] shrink-0">
                    🔗
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-[var(--color-text-1)]">Partikel Lainnya (へ, と, も, から, まで)</h4>
                    <p className="text-[9px] font-semibold text-[var(--color-text-2)] mt-0.5 leading-tight">Menyatakan arah, penyerta, kesamaan, awal/akhir</p>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)] shrink-0">
                  {particleCounts.lainnya} soal
                </span>
              </button>
            </div>
          </div>
        </div>
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
            onClick={() => {
              playTap()
              router.push('/particles') // Return to selection screen
            }}
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
                onClick={() => router.push('/particles/guide')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 active:scale-95 transition-transform"
              >
                Pelajari Panduan Partikel 📖
              </button>
              <button 
                onClick={() => router.push('/particles')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Pilih Partikel Lain
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
                onClick={() => router.push('/particles/guide')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 active:scale-95 transition-transform"
              >
                Tinjau Panduan Partikel 📖
              </button>
              <button 
                onClick={() => router.push('/particles')}
                className="w-full rounded-2xl py-3.5 text-sm font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Pilih Partikel Lain
              </button>
            </div>
          </div>
        ) : (
          /* Active Question Screen */
          <div className="flex-1 flex flex-col justify-between anim-up">
            {/* Guide Quick Link & Furigana Toggle */}
            <div className="flex justify-between items-center mb-3">
              {/* Furigana Toggle */}
              <button 
                onClick={() => {
                  const newVal = !showFurigana
                  setShowFurigana(newVal)
                  localStorage.setItem('kotoba_show_furigana', String(newVal))
                  playTap()
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all active:scale-95 cursor-pointer ${
                  showFurigana 
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]' 
                    : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-3)] border-[var(--color-border)]'
                }`}
                title={showFurigana ? "Sembunyikan Furigana" : "Tampilkan Furigana"}
              >
                <span>あ</span>
                <span>Furigana: {showFurigana ? 'ON' : 'OFF'}</span>
              </button>

              {/* Guide Link */}
              <button 
                onClick={() => {
                  playTap()
                  router.push('/particles/guide')
                }}
                className="text-[10px] font-extrabold text-[var(--color-accent)] hover:underline flex items-center gap-1 active:scale-95 transition-all cursor-pointer bg-[var(--color-accent-light)] px-2.5 py-1 rounded-full border-none"
              >
                📖 Lihat Panduan Partikel
              </button>
            </div>

            {/* Question Card */}
            <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[32px] p-6 shadow-card mb-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-accent)] mb-3 block">
                PILIH PARTIKEL YANG TEPAT ({selectedParticle === 'all' ? 'CAMPUR' : `FOKUS MEMBEDAKAN ${selectedParticle?.toUpperCase()}`})
              </span>
              <h2 className="text-2xl font-black jp tracking-wide leading-relaxed text-[var(--color-text-1)] mb-4 select-text">
                {showFurigana ? (
                  <span dangerouslySetInnerHTML={{ 
                    __html: addFuriganaToSentence(
                      isChecked 
                        ? currentQuestion.sentence.replace('___', ` 【 ${currentQuestion.correct} 】 `) 
                        : currentQuestion.sentence
                    ) 
                  }} />
                ) : (
                  isChecked 
                    ? currentQuestion.sentence.replace('___', ` 【 ${currentQuestion.correct} 】 `) 
                    : currentQuestion.sentence
                )}
              </h2>
              <div className="h-[1.5px] w-full bg-[var(--color-border)] my-4" />
              <p className="text-xs font-bold text-[var(--color-text-2)] leading-relaxed select-text">
                Arti: {currentQuestion.translation}
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

export default function ParticlesQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg)]"><p className="text-sm font-bold text-[var(--color-text-2)]">Memuat halaman kuis...</p></div>}>
      <ParticlesQuizContent />
    </Suspense>
  )
}
