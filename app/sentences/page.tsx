'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SENTENCE_QUESTIONS, type SentenceQuestion } from '@/lib/sentences-data'
import { playCorrect, playWrong, playFinish, playLoseHeart, playTap, speakJapanese } from '@/lib/sounds'
import { addFuriganaToSentence, extractVocabRefFromSentence } from '@/lib/vocab'
import { updateAfterSession } from '@/lib/stats'

export default function SentencesQuizPage() {
  const router = useRouter()

  // Game States
  // Shuffle questions on mount
  const [questions, setQuestions] = useState<SentenceQuestion[]>(() => {
    return [...SENTENCE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([])
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
  const [isChecked, setIsChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const [showFurigana, setShowFurigana] = useState(false)

  // Initialize showFurigana state on mount
  useEffect(() => {
    const saved = localStorage.getItem('kotoba_show_furigana')
    setShowFurigana(saved !== 'false') // default to true
  }, [])

  const currentQuestion = useMemo(() => {
    return questions[currentIndex] || null
  }, [questions, currentIndex])

  // Initialize blocks when question changes
  useEffect(() => {
    if (!currentQuestion) return
    const timer = setTimeout(() => {
      const shuffledBlocks = [...currentQuestion.blocks].sort(() => Math.random() - 0.5)
      setAvailableBlocks(shuffledBlocks)
      setSelectedBlocks([])
      setIsChecked(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [currentQuestion])

  const handleBlockTap = (block: string, isFromSelected: boolean) => {
    if (isChecked) return
    playTap()

    if (isFromSelected) {
      // Remove from selected, return to available
      setSelectedBlocks(prev => prev.filter(b => b !== block))
      setAvailableBlocks(prev => [...prev, block])
    } else {
      // Add to selected, remove from available
      setAvailableBlocks(prev => prev.filter(b => b !== block))
      setSelectedBlocks(prev => [...prev, block])
    }
  }

  const handleCheck = () => {
    if (isChecked || selectedBlocks.length === 0 || !currentQuestion) return

    const userSentence = selectedBlocks.join('')
    const isUserCorrect = userSentence === currentQuestion.japanese

    setIsCorrect(isUserCorrect)
    setIsChecked(true)

    if (isUserCorrect) {
      playCorrect()
      speakJapanese(currentQuestion.japanese)
      setScore(s => s + 1)
    } else {
      playWrong()
      playLoseHeart()
      const nextLives = lives - 1
      setLives(nextLives)
      if (nextLives <= 0) {
        updateAfterSession(score, currentIndex + 1)
        setTimeout(() => setIsGameOver(true), 1200)
      }
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      updateAfterSession(score, questions.length)
      playFinish()
      setIsFinished(true)
    } else {
      playTap()
      setCurrentIndex(c => c + 1)
    }
  }

  const handleRestart = () => {
    playTap()
    const shuffled = [...SENTENCE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10)
    setQuestions(shuffled)
    setCurrentIndex(0)
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
      <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
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
              Kamu melakukan 3 kesalahan. Ayo coba lagi untuk memperkuat pemahaman struktur kalimat Jepang.
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
              Luar biasa! Kamu telah menguasai susunan kalimat Jepang hari ini.
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
            <div>
              {/* Furigana Toggle */}
              <div className="flex justify-between items-center mb-3">
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
              </div>

              {/* Meaning Hint Box */}
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-[24px] p-4 shadow-sm mb-5 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-1 block">
                  SUSUN KALIMAT UNTUK ARTI DI BAWAH INI:
                </span>
                <p className="text-sm font-extrabold text-[var(--color-text-1)] select-text">
                  Arti: {currentQuestion.indonesian}
                </p>

                {/* Core Vocabulary Reference Breakdown */}
                {(() => {
                  const refs = extractVocabRefFromSentence(currentQuestion.japanese)
                  if (refs.length === 0) return null
                  return (
                    <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-left">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-accent)] mb-1.5 flex items-center gap-1">
                        <span>📖</span> Referensi Kata (Minna no Nihongo):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {refs.map((v, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--color-subtle)] text-[9px] font-bold text-[var(--color-text-1)] border border-[var(--color-border)]">
                            <span className="jp font-black text-[10px]">{v.kanji}</span>
                            <span className="text-[var(--color-text-3)]">({v.hiragana})</span>
                            <span className="text-[var(--color-text-2)]">{v.arti}</span>
                            <span className="text-[8px] font-black px-1 rounded bg-[var(--color-accent-light)] text-[var(--color-accent)]">{v.chapter}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Selected Blocks Area */}
              <div 
                className="min-h-[100px] border-2 border-dashed border-[var(--color-border)] rounded-[24px] p-4 mb-6 flex flex-wrap gap-2.5 items-center justify-center bg-white/40 dark:bg-[#1a1d24]/20 transition-colors"
                style={{
                  borderColor: isChecked 
                    ? isCorrect 
                      ? 'rgb(34, 197, 94)' 
                      : 'rgb(239, 68, 68)'
                    : 'var(--color-border)'
                }}
              >
                {selectedBlocks.length === 0 ? (
                  <span className="text-xs font-semibold text-[var(--color-text-3)] italic">Tuk kepingan kata di bawah...</span>
                ) : (
                  selectedBlocks.map((block) => (
                    <button 
                      key={block}
                      onClick={() => handleBlockTap(block, true)}
                      disabled={isChecked}
                      className="rounded-xl px-3 py-2 text-xs font-bold bg-white dark:bg-[#1a1d24] border-2 border-[var(--color-border)] text-[var(--color-text-1)] shadow-sm active:scale-90 transition-transform jp"
                    >
                      {showFurigana ? (
                        <span dangerouslySetInnerHTML={{ __html: addFuriganaToSentence(block) }} />
                      ) : (
                        block
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Available Blocks Pile */}
              <div className="flex flex-wrap gap-2.5 items-center justify-center mb-6">
                {availableBlocks.map((block) => (
                  <button 
                    key={block}
                    onClick={() => handleBlockTap(block, false)}
                    disabled={isChecked}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] text-[var(--color-text-1)] shadow-sm active:scale-90 transition-transform hover:border-[var(--color-accent)] jp"
                  >
                    {showFurigana ? (
                      <span dangerouslySetInnerHTML={{ __html: addFuriganaToSentence(block) }} />
                    ) : (
                      block
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto">
              {!isChecked && (
                <button 
                  onClick={handleCheck}
                  disabled={selectedBlocks.length === 0}
                  className="w-full rounded-2xl py-4 text-base font-extrabold active:scale-95 transition-transform"
                  style={{
                    background: selectedBlocks.length > 0 ? 'var(--color-accent)' : 'var(--color-subtle)',
                    color: selectedBlocks.length > 0 ? '#fff' : 'var(--color-text-3)',
                    boxShadow: selectedBlocks.length > 0 ? '0 8px 20px rgba(91,94,244,0.28)' : 'none',
                    opacity: selectedBlocks.length > 0 ? 1 : 0.6
                  }}
                >
                  Periksa Susunan Kalimat 🔍
                </button>
              )}
            </div>

            {/* Fixed Bottom Feedback Sheet */}
            {isChecked && (
              <div className="fixed bottom-0 left-0 right-0 z-50 anim-up shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl border-t bg-white dark:bg-[#1a1d24] border-[var(--color-border)] rounded-t-[32px]">
                <div className="max-w-sm md:max-w-2xl mx-auto px-5 py-5 flex flex-col gap-3.5">
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
                      <div className="mb-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Kunci Jawaban:</p>
                        {showFurigana ? (
                          <p className="text-xs font-black text-green-600 dark:text-green-400 jp" dangerouslySetInnerHTML={{ __html: addFuriganaToSentence(currentQuestion.japanese) }} />
                        ) : (
                          <p className="text-xs font-black text-green-600 dark:text-green-400 jp">{currentQuestion.japanese}</p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-3)]">Penjelasan Tata Bahasa:</p>
                      <p className="text-xs font-bold text-[var(--color-text-2)] leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
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
      </div>
    </div>
  )
}
