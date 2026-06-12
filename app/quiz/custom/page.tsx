'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { playTap } from '@/lib/sounds'

export interface CustomQuestion {
  id: string
  type: 'multiple-choice' | 'checkbox' | 'text' | 'section'
  title: string
  choices?: string[]
  section?: string
  description?: string
}

export interface CustomQuiz {
  id: string
  title: string
  description: string
  questions: CustomQuestion[]
  answerKey?: Record<string, string> // maps questionId -> correct answer
}

export default function CustomQuizPage() {
  const router = useRouter()

  const [quizzes, setQuizzes] = useState<CustomQuiz[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('kotoba_custom_quizzes')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return []
  })
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState('')
  
  // State for editing answer key
  const [editingQuiz, setEditingQuiz] = useState<CustomQuiz | null>(null)
  const [tempAnswers, setTempAnswers] = useState<Record<string, string>>({})

  const saveQuizzesToStorage = (updatedList: CustomQuiz[]) => {
    localStorage.setItem('kotoba_custom_quizzes', JSON.stringify(updatedList))
    setQuizzes(updatedList)
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl) return

    playTap()
    setIsImporting(true)
    setImportError('')

    try {
      const response = await fetch(`/api/import-form?url=${encodeURIComponent(importUrl)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengimpor kuis')
      }

      const newQuiz: CustomQuiz = result
      
      // Check if already exists
      const exists = quizzes.some(q => q.id === newQuiz.id)
      if (exists) {
        throw new Error('Kuis ini sudah pernah diimpor!')
      }

      // Add to list
      const updatedList = [newQuiz, ...quizzes]
      saveQuizzesToStorage(updatedList)

      // Close modal
      setShowImportModal(false)
      setImportUrl('')

      // Automatically open answer key editor for this quiz
      setEditingQuiz(newQuiz)
      setTempAnswers({})
    } catch (err: unknown) {
      if (err instanceof Error) {
        setImportError(err.message)
      } else {
        setImportError('Terjadi kesalahan yang tidak dikenal.')
      }
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = (quizId: string) => {
    playTap()
    if (confirm('Apakah Anda yakin ingin menghapus kuis ini dari aplikasi?')) {
      const updatedList = quizzes.filter(q => q.id !== quizId)
      saveQuizzesToStorage(updatedList)
    }
  }

  // Answer Key Editor handlers
  const handleOpenKeyEditor = (quiz: CustomQuiz) => {
    playTap()
    setEditingQuiz(quiz)
    setTempAnswers(quiz.answerKey || {})
  }

  const handleSelectAnswer = (qId: string, value: string) => {
    setTempAnswers(prev => ({
      ...prev,
      [qId]: value
    }))
  }

  const handleSaveAnswerKey = () => {
    if (!editingQuiz) return
    playTap()

    // Validate that at least one key is set (or warn if not all are set)
    const questionsCount = editingQuiz.questions.filter(q => q.type !== 'section').length
    const answeredCount = Object.keys(tempAnswers).length

    if (answeredCount < questionsCount) {
      if (!confirm(`Peringatan: Baru ${answeredCount} dari ${questionsCount} soal yang diatur kunci jawabannya. Simpan saja?`)) {
        return
      }
    }

    const updatedQuiz = {
      ...editingQuiz,
      answerKey: tempAnswers
    }

    const updatedList = quizzes.map(q => q.id === editingQuiz.id ? updatedQuiz : q)
    saveQuizzesToStorage(updatedList)
    setEditingQuiz(null)
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-md md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Header Navigation */}
        <header className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => {
              playTap()
              router.push('/')
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-black text-[var(--color-text-1)] leading-tight">Kuis Google Form</h1>
            <p className="text-xs font-semibold text-[var(--color-text-2)]">Impor dan kerjakan kuis dari tempat belajar Anda</p>
          </div>
        </header>

        {/* Action Button: Import New */}
        <div className="mb-6">
          <button
            onClick={() => {
              playTap()
              setShowImportModal(true)
            }}
            className="w-full rounded-2xl py-4 text-sm font-extrabold text-white bg-[var(--color-accent)] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(91,94,244,0.28)]"
          >
            📥 Impor Kuis Google Form Baru
          </button>
        </div>

        {/* Custom Quiz List */}
        <div className="space-y-4 flex-1">
          {quizzes.length === 0 ? (
            <div className="my-auto py-12 text-center rounded-[32px] bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] p-6">
              <span className="text-5xl mb-4 block">📋</span>
              <p className="text-sm font-extrabold text-[var(--color-text-1)]">Belum Ada Kuis Terimpor</p>
              <p className="text-xs font-semibold text-[var(--color-text-2)] mt-1 mb-6">
                Masukkan link Google Form untuk latihan mandiri di sini.
              </p>
              <button
                onClick={() => {
                  playTap()
                  setShowImportModal(true)
                }}
                className="rounded-xl px-4 py-2.5 text-xs font-bold bg-[var(--color-accent-light)] text-[var(--color-accent)] active:scale-95 transition-transform border border-[var(--color-accent)]"
              >
                Impor Sekarang
              </button>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const totalQ = quiz.questions.filter(q => q.type !== 'section').length
              const hasKey = quiz.answerKey && Object.keys(quiz.answerKey).length > 0
              const keyPercent = quiz.answerKey 
                ? Math.round((Object.keys(quiz.answerKey).length / totalQ) * 100) 
                : 0

              return (
                <article 
                  key={quiz.id}
                  className="bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <header className="mb-2">
                    <h2 className="text-sm font-black text-[var(--color-text-1)] leading-snug">
                      {quiz.title}
                    </h2>
                    {quiz.description && (
                      <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-1 leading-relaxed line-clamp-2">
                        {quiz.description}
                      </p>
                    )}
                  </header>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg)] text-[var(--color-text-2)] border border-[var(--color-border)]">
                      📝 {totalQ} Pertanyaan
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      hasKey 
                        ? 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-500 border-green-200' 
                        : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-500 border-amber-200'
                    }`}>
                      🔑 Kunci Jawaban: {hasKey ? `${keyPercent}% Siap` : 'Belum Diatur'}
                    </span>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {hasKey ? (
                      <Link 
                        href={`/quiz/custom/practice?id=${quiz.id}`}
                        onClick={playTap}
                        className="rounded-xl py-2.5 text-center text-[11px] font-extrabold text-white bg-green-500 hover:bg-green-600 active:scale-95 transition-all no-underline shadow-sm"
                      >
                        🎯 Mulai Latihan
                      </Link>
                    ) : (
                      <button 
                        onClick={() => handleOpenKeyEditor(quiz)}
                        className="rounded-xl py-2.5 text-center text-[11px] font-extrabold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all shadow-sm"
                      >
                        🔑 Atur Kunci Dulu
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenKeyEditor(quiz)}
                      className="rounded-xl py-2.5 text-center text-[11px] font-bold bg-[var(--color-subtle)] text-[var(--color-text-1)] border border-[var(--color-border)] active:scale-95 transition-all"
                    >
                      🛠️ Edit Kunci ({keyPercent}%)
                    </button>
                    <button 
                      onClick={() => handleDelete(quiz.id)}
                      className="col-span-2 rounded-xl py-2 text-center text-[10px] font-semibold text-red-500 bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all border border-red-200/50"
                    >
                      🗑️ Hapus Kuis
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>

      {/* ── Modal Impor Kuis ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!isImporting) setShowImportModal(false) }}
          />
          <div className="bg-white dark:bg-[#1a1d24] rounded-[28px] p-6 w-full max-w-sm relative shadow-2xl z-10 border border-[var(--color-border)] anim-pop">
            <h3 className="text-base font-extrabold text-[var(--color-text-1)] mb-1">Impor Kuis Baru</h3>
            <p className="text-xs font-semibold text-[var(--color-text-2)] mb-4">Tempel link Google Form (viewform) kuis Anda.</p>
            
            <form onSubmit={handleImport} className="space-y-4">
              <div>
                <input
                  type="url"
                  required
                  disabled={isImporting}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full rounded-2xl py-3 px-4 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)] focus:bg-white"
                />
              </div>

              {importError && (
                <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200/50 leading-relaxed">
                  ⚠️ {importError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isImporting}
                  className="flex-1 rounded-xl py-3 text-xs font-extrabold text-white bg-[var(--color-accent)] active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isImporting ? '⏳ Mengimpor...' : 'Impor Kuis'}
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl px-4 py-3 text-xs font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Answer Key Editor (Kunci Jawaban) ── */}
      {editingQuiz && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center px-4 pb-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingQuiz(null)}
          />
          <div 
            className="bg-white dark:bg-[#1a1d24] rounded-t-[32px] rounded-b-[24px] p-6 w-full max-w-md relative shadow-2xl z-10 border border-[var(--color-border)] flex flex-col"
            style={{ maxHeight: '85dvh' }}
          >
            {/* Top Bar inside Modal */}
            <div className="w-12 h-1.5 rounded-full bg-[var(--color-border)] mx-auto mb-4 shrink-0" />
            
            <header className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--color-text-1)]">Edit Kunci Jawaban</h3>
                <p className="text-[10px] font-semibold text-[var(--color-text-2)] mt-0.5">{editingQuiz.title}</p>
              </div>
              <button 
                onClick={() => setEditingQuiz(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-[var(--color-bg)] active:scale-95 transition-all text-xs"
                style={{ color: 'var(--color-text-2)' }}
              >
                ✕
              </button>
            </header>

            {/* Scrollable Questions List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar mb-4">
              {editingQuiz.questions.map((q) => {
                if (q.type === 'section') {
                  return (
                    <div key={q.id} className="border-t border-[var(--color-border)] pt-4 mt-6 first:mt-2 first:border-0 first:pt-0">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-[var(--color-text-3)] mb-1">
                        📂 {q.title}
                      </h4>
                      {q.description && (
                        <p className="text-[9px] font-semibold text-[var(--color-text-2)] leading-relaxed italic">
                          {q.description}
                        </p>
                      )}
                    </div>
                  )
                }

                const currentKey = tempAnswers[q.id] || ''

                return (
                  <div 
                    key={q.id}
                    className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/20 space-y-2.5"
                  >
                    <p className="text-xs font-black text-[var(--color-text-1)] jp leading-relaxed select-text">
                      {q.title}
                    </p>

                    {/* Multiple Choice Option Picker */}
                    {q.type === 'multiple-choice' && q.choices && (
                      <div className="grid grid-cols-1 gap-1.5 pl-1">
                        {q.choices.map((choice) => {
                          const isSelected = currentKey === choice
                          return (
                            <button
                              key={choice}
                              onClick={() => handleSelectAnswer(q.id, choice)}
                              className={`text-left rounded-xl p-2.5 text-[10px] font-bold border transition-all active:scale-[0.99] flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]'
                                  : 'bg-white dark:bg-[#1a1d24] text-[var(--color-text-1)] border-[var(--color-border)]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-bold shrink-0 ${
                                isSelected 
                                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' 
                                  : 'border-[var(--color-border)]'
                              }`}>
                                {isSelected && '✓'}
                              </span>
                              <span className="jp">{choice}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Text Answer Input */}
                    {q.type === 'text' && (
                      <div className="pl-1">
                        <input
                          type="text"
                          placeholder="Masukkan kata kunci jawaban..."
                          value={currentKey}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                          className="w-full rounded-xl py-2 px-3 text-[10px] font-bold bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-accent)]"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 flex gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={handleSaveAnswerKey}
                className="flex-1 rounded-xl py-3 text-xs font-extrabold text-white bg-green-500 hover:bg-green-600 active:scale-95 transition-transform shadow-sm"
              >
                💾 Simpan Kunci Jawaban
              </button>
              <button
                onClick={() => setEditingQuiz(null)}
                className="rounded-xl px-4 py-3 text-xs font-bold bg-[var(--color-subtle)] text-[var(--color-text-2)] active:scale-95 transition-transform"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
