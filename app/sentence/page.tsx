'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loadSRS, type SRSStore } from '@/lib/srs'
import { parseCSVToVocab, type VocabItem } from '@/lib/vocab'
import { fetchVocabCSV } from '@/lib/cloud'
import { speakJapanese, playCorrect, playWrong } from '@/lib/sounds'
import { SENTENCE_DB, type SentenceItem } from '@/lib/sentences'

interface WordBlock {
  id: string
  text: string
}

export default function SentencePage() {
  const router = useRouter()
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [srsStore, setSrsStore] = useState<SRSStore>({})
  const [loading, setLoading] = useState(true)
  
  // Game states
  const [mode, setMode] = useState<'list' | 'play' | 'success'>('list')
  const [activeSentence, setActiveSentence] = useState<SentenceItem | null>(null)
  const [assembledWords, setAssembledWords] = useState<WordBlock[]>([])
  const [availableWords, setAvailableWords] = useState<WordBlock[]>([])
  const [isIncorrect, setIsIncorrect] = useState(false)
  const [showSlowMo, setShowSlowMo] = useState(false)
  const [progressStore, setProgressStore] = useState<Record<string, boolean>>({})
  
  // Filter state
  const [filterMode, setFilterMode] = useState<'unlocked' | 'all'>('unlocked')

  // Load SRS and Vocab data
  useEffect(() => {
    const store = loadSRS()
    setSrsStore(store)
    
    // Load sentence completion progress
    try {
      const prog = localStorage.getItem('kotoba_sentences_progress')
      if (prog) setProgressStore(JSON.parse(prog))
    } catch (e) {}

    const url = localStorage.getItem('kotoba_sheets_url')
    async function load() {
      setLoading(true)
      if (url) {
        const csv = await fetchVocabCSV(url)
        if (csv) {
          const parsed = parseCSVToVocab(csv)
          setVocab(parsed)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  // Helper to check if a specific word from the database exists and has level > 0
  const getWordStatus = (word: string) => {
    const matchingVocab = vocab.find(v => v.kanji === word || v.hiragana === word)
    if (!matchingVocab) {
      return { found: false, studied: false }
    }
    const level = srsStore[matchingVocab.id]?.level ?? 0
    return { found: true, studied: level > 0, item: matchingVocab }
  }

  // Check if a sentence is unlocked (all required words have level > 0)
  const isSentenceUnlocked = (sentence: SentenceItem) => {
    if (sentence.requiredWords.length === 0) return true
    return sentence.requiredWords.every(w => {
      const status = getWordStatus(w)
      return status.studied
    })
  }

  // Computed lists
  const sentenceList = useMemo(() => {
    return SENTENCE_DB.map(s => {
      const unlocked = isSentenceUnlocked(s)
      const completed = !!progressStore[s.id]
      return {
        ...s,
        unlocked,
        completed
      }
    })
  }, [vocab, srsStore, progressStore])

  const filteredSentences = useMemo(() => {
    if (filterMode === 'unlocked') {
      return sentenceList.filter(s => s.unlocked)
    }
    return sentenceList
  }, [sentenceList, filterMode])

  const unlockedCount = useMemo(() => {
    return sentenceList.filter(s => s.unlocked).length
  }, [sentenceList])

  const completedCount = useMemo(() => {
    return sentenceList.filter(s => s.completed).length
  }, [sentenceList])

  // Start a sentence scramble exercise
  const startSentence = (sentence: SentenceItem) => {
    setActiveSentence(sentence)
    setAssembledWords([])
    const blocks: WordBlock[] = sentence.words.map((w, idx) => ({
      id: `${w}-${idx}-${Math.random()}`,
      text: w
    }))
    // Shuffle the blocks
    const shuffled = [...blocks].sort(() => Math.random() - 0.5)
    setAvailableWords(shuffled)
    setMode('play')
    setIsIncorrect(false)
  }

  // Handle word block actions
  const tapAvailableWord = (block: WordBlock, index: number) => {
    const newAvailable = [...availableWords]
    newAvailable.splice(index, 1)
    setAvailableWords(newAvailable)
    setAssembledWords([...assembledWords, block])
  }

  const tapAssembledWord = (block: WordBlock, index: number) => {
    const newAssembled = [...assembledWords]
    newAssembled.splice(index, 1)
    setAssembledWords(newAssembled)
    setAvailableWords([...availableWords, block])
  }

  const resetSentence = () => {
    if (!activeSentence) return
    const blocks: WordBlock[] = activeSentence.words.map((w, idx) => ({
      id: `${w}-${idx}-${Math.random()}`,
      text: w
    }))
    setAvailableWords([...blocks].sort(() => Math.random() - 0.5))
    setAssembledWords([])
    setIsIncorrect(false)
  }

  // Check user answer
  const checkAnswer = () => {
    if (!activeSentence) return
    const correct = activeSentence.correctOrder
    const isMatch = assembledWords.length === correct.length &&
                    assembledWords.every((b, idx) => b.text === correct[idx])

    if (isMatch) {
      playCorrect()
      speakJapanese(activeSentence.japanese, showSlowMo)
      
      const newProg = { ...progressStore, [activeSentence.id]: true }
      setProgressStore(newProg)
      localStorage.setItem('kotoba_sentences_progress', JSON.stringify(newProg))
      
      setMode('success')
    } else {
      playWrong()
      setIsIncorrect(true)
      setTimeout(() => setIsIncorrect(false), 800)
    }
  }

  // Move to the next sentence
  const handleNext = () => {
    const currentList = filteredSentences
    const currentIndex = currentList.findIndex(s => s.id === activeSentence?.id)
    if (currentIndex !== -1 && currentIndex < currentList.length - 1) {
      startSentence(currentList[currentIndex + 1])
    } else {
      setMode('list')
      setActiveSentence(null)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-sm mx-auto" style={{ background: 'var(--color-bg)' }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-effect {
          animation: shake 0.4s ease-in-out;
        }
        .anim-pop {
          animation: pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── MODE: LIST OF SENTENCES ── */}
      {mode === 'list' && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-4 pt-12 pb-4 flex items-center justify-between">
            <button onClick={() => router.push('/')}
              className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-lg active:scale-95 transition-transform"
              style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              ‹
            </button>
            <p className="font-extrabold text-base text-[var(--color-text-1)]">Rangkai Kalimat</p>
            <div className="w-9 h-9" /> {/* Spacer */}
          </div>

          <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-3xl" style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--color-text-3)' }}>Terbuka</p>
                <p className="text-xl font-black mt-1" style={{ color: 'var(--color-accent)' }}>{unlockedCount} <span className="text-xs font-normal opacity-60">/ {sentenceList.length}</span></p>
              </div>
              <div className="text-center border-l" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--color-text-3)' }}>Selesai</p>
                <p className="text-xl font-black mt-1" style={{ color: 'var(--color-green)' }}>{completedCount} <span className="text-xs font-normal opacity-60">/ {sentenceList.length}</span></p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setFilterMode('unlocked')}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] border"
                style={{
                  background: filterMode === 'unlocked' ? 'var(--color-accent-light)' : 'var(--color-white)',
                  color: filterMode === 'unlocked' ? 'var(--color-accent)' : 'var(--color-text-2)',
                  borderColor: filterMode === 'unlocked' ? 'var(--color-accent)' : 'var(--color-border)',
                }}>
                🔓 Bisa Dimainkan
              </button>
              <button onClick={() => setFilterMode('all')}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] border"
                style={{
                  background: filterMode === 'all' ? 'var(--color-accent-light)' : 'var(--color-white)',
                  color: filterMode === 'all' ? 'var(--color-accent)' : 'var(--color-text-2)',
                  borderColor: filterMode === 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                }}>
                🌐 Semua Kalimat
              </button>
            </div>

            {/* Info Message if sheets not set / empty */}
            {vocab.length === 0 && !loading && (
              <div className="p-4 rounded-2xl text-xs font-bold text-center mb-4" style={{ background: 'var(--color-amber-light)', color: 'var(--color-amber)' }}>
                ⚠️ Hubungkan Google Sheets di Settings & pelajari kosakata untuk membuka kunci lebih banyak kalimat. Anda tetap bisa mencoba semua kalimat.
              </div>
            )}

            {/* List */}
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-xs font-bold animate-pulse" style={{ color: 'var(--color-text-3)' }}>Memuat kalimat...</p>
                </div>
              ) : filteredSentences.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">📭</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text-3)' }}>
                    {filterMode === 'unlocked' ? 'Belum ada kalimat yang terbuka. Pelajari lebih banyak kata dulu!' : 'Belum ada kalimat.'}
                  </p>
                </div>
              ) : (
                filteredSentences.map(item => (
                  <button key={item.id} onClick={() => startSentence(item)}
                    className="w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] relative"
                    style={{
                      background: 'var(--color-white)',
                      borderColor: 'var(--color-border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-extrabold text-[var(--color-text-1)] flex-1 leading-snug">{item.meaning}</p>
                      {item.completed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
                          Selesai ✓
                        </span>
                      ) : !item.unlocked ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: 'var(--color-subtle)', color: 'var(--color-text-3)' }}>
                          🔒 Kunci
                        </span>
                      ) : null}
                    </div>

                    {/* Word Requirement badges */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.requiredWords.map(w => {
                        const status = getWordStatus(w)
                        return (
                          <span key={w} className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5"
                            style={{
                              background: status.studied ? 'var(--color-green-light)' : 'var(--color-subtle)',
                              color: status.studied ? 'var(--color-green)' : 'var(--color-text-3)',
                            }}>
                            {status.studied ? '✓' : '🔒'} {w}
                          </span>
                        )
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODE: PLAY EXERCISE ── */}
      {mode === 'play' && activeSentence && (
        <div className="flex-1 flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => { setMode('list'); setActiveSentence(null) }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 active:scale-95 transition-transform"
              style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              ✕
            </button>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--color-text-3)' }}>Rangkai Kalimat</p>
            <div className="w-9 h-9" />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Sound Pronunciation Helper */}
              <div className="flex justify-center gap-2 mb-4">
                <button onClick={() => speakJapanese(activeSentence.japanese, false)}
                  className="px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider bg-[var(--color-white)] active:scale-95 transition-all text-[var(--color-text-2)] border-[var(--color-border)] flex items-center gap-1">
                  🔊 Suara
                </button>
                <button onClick={() => speakJapanese(activeSentence.japanese, true)}
                  className="px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider bg-[var(--color-white)] active:scale-95 transition-all text-[var(--color-text-3)] border-[var(--color-border)] flex items-center gap-1">
                  🐢 Lambat
                </button>
              </div>

              {/* Translation Display */}
              <div className="text-center px-2 py-4 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-3)' }}>Indonesian</p>
                <p className="text-lg font-black leading-snug" style={{ color: 'var(--color-text-1)' }}>{activeSentence.meaning}</p>
              </div>

              {/* Workspace / Assembly Area */}
              <div className={`min-h-[90px] rounded-3xl p-4 border-2 border-dashed mb-6 flex flex-wrap gap-2.5 items-center justify-center transition-all ${isIncorrect ? 'shake-effect border-red-400 bg-red-50' : 'border-[var(--color-border)] bg-white'}`}>
                {assembledWords.length === 0 ? (
                  <p className="text-xs font-semibold select-none text-[var(--color-text-3)] opacity-60 text-center">Ketuk kata di bawah untuk merangkai...</p>
                ) : (
                  assembledWords.map((block, idx) => (
                    <button key={block.id} onClick={() => tapAssembledWord(block, idx)}
                      className="px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm border anim-pop active:scale-95 transition-transform"
                      style={{
                        background: 'var(--color-accent-light)',
                        borderColor: 'var(--color-accent)',
                        color: 'var(--color-accent)'
                      }}>
                      {block.text}
                    </button>
                  ))
                )}
              </div>

              {/* Word Pool / Available Words */}
              <div className="flex flex-wrap justify-center gap-2.5 p-4 rounded-3xl mb-8" style={{ background: 'rgba(0,0,0,0.02)' }}>
                {availableWords.map((block, idx) => (
                  <button key={block.id} onClick={() => tapAvailableWord(block, idx)}
                    className="px-4 py-2.5 rounded-2xl font-bold text-sm shadow-sm border active:scale-95 transition-transform"
                    style={{
                      background: 'var(--color-white)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-1)'
                    }}>
                    {block.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex gap-3 mb-6">
              <button onClick={resetSentence}
                className="px-6 py-4 rounded-2xl text-sm font-extrabold transition-all border active:scale-95"
                style={{ background: 'var(--color-white)', color: 'var(--color-text-2)', borderColor: 'var(--color-border)' }}>
                Reset
              </button>
              <button onClick={checkAnswer} disabled={assembledWords.length === 0}
                className="flex-1 py-4 rounded-2xl text-sm font-extrabold transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #5b5ef4 0%, #7c7ff7 100%)',
                  color: '#ffffff',
                  boxShadow: assembledWords.length > 0 ? '0 6px 20px rgba(91,94,244,0.3)' : 'none'
                }}>
                Cek Jawaban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODE: SUCCESS SCREEN ── */}
      {mode === 'success' && activeSentence && (
        <div className="flex-1 flex flex-col justify-between p-6 text-center anim-pop">
          <div className="my-auto">
            {/* Sparkly check icon */}
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-lg"
              style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
              🎉
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-3)' }}>Hebat! Susunan Benar</p>
            
            {/* Large sentence display */}
            <p className="jp text-3xl font-black mb-3 mt-4 leading-normal" style={{ color: 'var(--color-text-1)' }}>
              {activeSentence.japanese}
            </p>
            
            <p className="text-sm font-semibold mb-6" style={{ color: 'var(--color-text-2)' }}>
              {activeSentence.meaning}
            </p>

            {/* Pronunciation options */}
            <div className="flex justify-center gap-3 mb-8">
              <button onClick={() => speakJapanese(activeSentence.japanese, false)}
                className="px-4 py-2.5 rounded-2xl border text-xs font-bold bg-[var(--color-white)] active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm">
                🔊 Ulangi
              </button>
              <button onClick={() => speakJapanese(activeSentence.japanese, true)}
                className="px-4 py-2.5 rounded-2xl border text-xs font-bold bg-[var(--color-white)] active:scale-95 transition-transform flex items-center gap-1.5 shadow-sm">
                🐢 Pelan
              </button>
            </div>
          </div>

          <button onClick={handleNext}
            className="w-full py-4 rounded-2xl text-sm font-extrabold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 20px rgba(16,185,129,0.3)'
            }}>
            Lanjut
          </button>
        </div>
      )}
    </div>
  )
}
