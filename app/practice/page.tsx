'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { playTap, speakJapanese } from '@/lib/sounds'
import { addFuriganaToSentence } from '@/lib/vocab'
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
  const [topicFilter, setTopicFilter] = useState<'latihan' | 'vocab'>('latihan')
  const [selectedBab, setSelectedBab] = useState<string | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<ChapterExercise | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [showFurigana, setShowFurigana] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kotoba_show_furigana')
    setShowFurigana(saved !== 'false')
  }, [])

  useEffect(() => {
    setLoadingExercises(true)
    const file = topicFilter === 'latihan' ? '/data/practice-default.json' : '/data/vocab-practice-default.json'
    fetch(file)
      .then(res => res.json())
      .then((data: ChapterExercise[]) => {
        setExercises(data)
        setLoadingExercises(false)
      })
      .catch(err => {
        console.error('[PracticeHub] Error loading practice json:', err)
        setLoadingExercises(false)
      })
  }, [topicFilter])

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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[var(--color-accent)] uppercase tracking-wider">
                    {activeQuiz.bab} • Soal {currentQIndex + 1} / {activeQuiz.questions.length}
                  </span>
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
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => speakJapanese(activeQuiz.questions[currentQIndex].title)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] active:scale-95 transition-all text-xs border border-[var(--color-border)] text-[var(--color-text-2)]"
                    title="Dengarkan Suara"
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-xs font-bold text-[var(--color-text-3)] hover:text-red-500 cursor-pointer"
                  >
                    ✕ Keluar
                  </button>
                </div>
              </div>

              {/* Question Title */}
              <h3 className="text-base font-extrabold text-[var(--color-text-1)] mb-3 leading-relaxed">
                {showFurigana ? (
                  <span dangerouslySetInnerHTML={{ 
                    __html: addFuriganaToSentence(activeQuiz.questions[currentQIndex].title) 
                  }} />
                ) : (
                  activeQuiz.questions[currentQIndex].title
                )}
              </h3>

              {activeQuiz.questions[currentQIndex].description && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--color-subtle)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-2)]">
                  💡 {activeQuiz.questions[currentQIndex].description}
                </div>
              )}

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

              {/* Fixed Bottom Feedback Sheet */}
              {isAnswered && (
                <div className="fixed bottom-0 left-0 right-0 z-50 anim-up shadow-[0_-8px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl border-t bg-white dark:bg-[#1a1d24] border-[var(--color-border)] rounded-t-[32px]">
                  <div className="max-w-sm md:max-w-2xl mx-auto px-5 py-5 flex flex-col gap-3">
                    <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                      selectedChoice === activeQuiz.questions[currentQIndex].correctAnswer 
                        ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-300' 
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
                    }`}>
                      <div>
                        <p className="font-extrabold text-sm">
                          {selectedChoice === activeQuiz.questions[currentQIndex].correctAnswer ? '✨ Benar! 正解！' : '❌ Kurang Tepat'}
                        </p>
                        <p className="text-xs font-semibold mt-0.5">
                          Jawaban benar: <strong className="jp text-sm font-extrabold">{activeQuiz.questions[currentQIndex].correctAnswer}</strong>
                        </p>
                      </div>
                      <span className="text-2xl">{selectedChoice === activeQuiz.questions[currentQIndex].correctAnswer ? '👏' : '💡'}</span>
                    </div>

                    <button 
                      onClick={nextQuestion}
                      className="w-full rounded-2xl py-3.5 text-base font-extrabold active:scale-95 transition-transform text-white bg-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.28)] cursor-pointer"
                    >
                      {currentQIndex < activeQuiz.questions.length - 1 ? 'Soal Berikutnya ➔' : 'Lihat Hasil 🎉'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Practice Menu Grid */
        <div className="space-y-7">
          {/* Main Practice Categories */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Kuis Kosakata Per Bab (Featured) */}
            <Link
              href="/quiz/chapters"
              onClick={playTap}
              className="col-span-2 block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-[28px] p-5 text-white shadow-lg hover:shadow-xl transition-all relative overflow-hidden border border-indigo-400/30">
                {/* Background glow */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-sm border border-white/20">
                      📖
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base text-white tracking-tight">Kuis Kosakata Per Bab</h3>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-indigo-950 uppercase tracking-wider shadow-xs">
                          SRS
                        </span>
                      </div>
                      <p className="text-xs font-medium text-indigo-100/90 mt-1">
                        Bab 1–25 • Pelajari & Kuis Hafalan Terstruktur
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="w-full sm:w-auto text-center text-xs font-black bg-white text-indigo-600 px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:bg-indigo-50 transition-colors">
                      <span>Pilih Bab</span>
                      <span>➔</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Hiragana & Katakana */}
            <Link
              href="/kana"
              onClick={playTap}
              className="block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl font-black mb-3 jp-serif">
                  あ
                </div>
                <div>
                  <p className="font-extrabold text-xs text-[var(--color-text-1)]">Kana SRS Quiz</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">
                    104 Karakter Kana
                  </p>
                </div>
              </div>
            </Link>

            {/* Kuis Partikel */}
            <Link
              href="/particles"
              onClick={playTap}
              className="block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-sm transition-all h-full flex flex-col justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-black mb-3 jp-serif">
                  助
                </div>
                <div>
                  <p className="font-extrabold text-xs text-[var(--color-text-1)]">Kuis Partikel</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">
                    は, が, を, に, で...
                  </p>
                </div>
              </div>
            </Link>

            {/* Susun Kalimat */}
            <Link
              href="/sentences"
              onClick={playTap}
              className="col-span-2 block no-underline active:scale-[0.98] transition-transform"
            >
              <div className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-4 hover:shadow-sm transition-all h-full flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-black shrink-0 jp-serif">
                  文
                </div>
                <div>
                  <p className="font-extrabold text-xs text-[var(--color-text-1)]">Susun Kalimat</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">
                    Latihan menyusun struktur kalimat Jepang
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Specialized Practice Section: Ungkapan Sehari-hari */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-xs font-black text-[var(--color-text-1)] uppercase tracking-wider">
                  🎯 Latihan Praktik Sehari-hari
                </h2>
                <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">
                  Topik penting penggunaan harian
                </p>
              </div>
              <Link href="/quiz/special" onClick={playTap} className="text-[10px] font-extrabold text-[var(--color-accent)] no-underline hover:underline">
                Lihat Semua →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { title: 'Hari & Waktu', desc: 'Senin-Minggu & Jam', icon: '📅', url: '/quiz/special?type=hari', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { title: 'Angka & Unit', desc: '1-10rb, ~つ, ~人...', icon: '🔢', url: '/quiz/special?type=angka', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { title: 'Tanggal & Bulan', desc: '1-31日 & 1-12月', icon: '📆', url: '/quiz/special?type=hari', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
                { title: 'Uang & Belanja', desc: 'Nominal Yen & Kasir', icon: '💴', url: '/quiz/special?type=uang', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                { title: 'Anggota Tubuh', desc: 'Kepala, Wajah, Badan', icon: '🧠', url: '/quiz/special?type=tubuh', bg: 'bg-rose-50 dark:bg-rose-950/30' },
                { title: 'Keluarga & Salam', desc: 'Keluarga & Percakapan', icon: '🤝', url: '/quiz/special?type=salam', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.url}
                  onClick={playTap}
                  className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl p-3.5 flex flex-col justify-between no-underline hover:border-[var(--color-accent)] transition-all active:scale-[0.98] shadow-xs"
                >
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center text-lg mb-2.5 shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--color-text-1)] truncate">{item.title}</h4>
                    <p className="text-[9px] font-bold text-[var(--color-text-3)] mt-0.5 truncate">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section: Latihan Per Bab (Topic Filter) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
              <div>
                <h2 className="text-sm font-black text-[var(--color-text-1)] uppercase tracking-wider">
                  📖 Kuis & Latihan Per Bab (Bab 1–25)
                </h2>
                <p className="text-[10px] font-bold text-[var(--color-text-3)] mt-0.5">
                  {topicFilter === 'latihan' ? '1.007 Soal Latihan A, B, C & Tata Bahasa' : '909 Soal Kuis Hafalan Kosakata'}
                </p>
              </div>

              {/* Topic Filter Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-[#1a1d24] p-1 rounded-2xl border border-[var(--color-border)] self-start sm:self-auto shadow-xs">
                <button
                  onClick={() => { playTap(); setTopicFilter('latihan') }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    topicFilter === 'latihan'
                      ? 'bg-[var(--color-accent)] text-white shadow-xs'
                      : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
                  }`}
                >
                  QUIZ Latihan A, B, C
                </button>
                <button
                  onClick={() => { playTap(); setTopicFilter('vocab') }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    topicFilter === 'vocab'
                      ? 'bg-[var(--color-accent)] text-white shadow-xs'
                      : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)]'
                  }`}
                >
                  QUIZ Kosakata
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1 no-scrollbar">
              {loadingExercises ? (
                <div className="col-span-2 py-8 text-center bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-2xl">
                  <div className="w-6 h-6 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[var(--color-text-2)]">Memuat Soal Kuis...</p>
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
