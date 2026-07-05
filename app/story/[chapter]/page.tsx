'use client'

import { useEffect, useState, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadLocalVocab, addFuriganaToSentence, type VocabItem } from '@/lib/vocab'
import { speakJapanese, playTap } from '@/lib/sounds'
import { type ChapterStory } from '@/lib/stories'

interface PageProps {
  params: Promise<{
    chapter: string
  }>
}

export default function StoryPage({ params }: PageProps) {
  const router = useRouter()
  // Unwrap parameters according to Next.js 16 convention
  const { chapter: rawChapter } = use(params)
  const chapter = decodeURIComponent(rawChapter)

  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [stories, setStories] = useState<ChapterStory[]>([])
  const [showTranslation, setShowTranslation] = useState(false)

  useEffect(() => {
    setVocab(loadLocalVocab())
    // load stories
    try {
      const stored = localStorage.getItem('kotoba_stories')
      if (stored) {
        setStories(JSON.parse(stored) as ChapterStory[])
      }
    } catch (e) {
      console.error('[StoryPage Load Error]', e)
    }
  }, [])

  // Find the story for this chapter
  const story = useMemo(() => {
    return stories.find(s => s.chapter === chapter)
  }, [stories, chapter])

  // Get vocabularies in this chapter
  const chapterVocab = useMemo(() => {
    return vocab.filter(v => v.chapter === chapter)
  }, [vocab, chapter])

  // Highlight vocabulary in the story
  const highlightedStoryHtml = useMemo(() => {
    if (!story || !story.storyJapanese) return ''
    
    // First, convert sentences and inject Furigana
    let html = addFuriganaToSentence(story.storyJapanese)
    
    // Sort vocab descending by length to match longer words first
    const sortedVocabs = [...chapterVocab].sort((a, b) => {
      const lenA = a.kanji?.length || a.hiragana.length
      const lenB = b.kanji?.length || b.hiragana.length
      return lenB - lenA
    })

    // Highlight each vocabulary in the parsed html
    for (const v of sortedVocabs) {
      const kanji = v.kanji || v.hiragana
      const hiragana = v.hiragana

      // If kanji exists, search for the ruby block first
      if (kanji !== hiragana) {
        const rubyPattern = new RegExp(`(<ruby>${kanji}<rt style="font-size: 0\\.38em"[^>]*>${hiragana}</rt></ruby>)`, 'g')
        if (html.match(rubyPattern)) {
          html = html.replace(rubyPattern, `<span class="bg-[var(--color-accent-light)] text-[var(--color-accent)] font-extrabold px-1 rounded-lg border border-[var(--color-accent)]/20">$1</span>`)
          continue
        }
      }

      // Fallback/Plain text matching (only if not inside HTML tags)
      const regex = new RegExp(`(${kanji})(?![^<>]*>)`, 'g')
      html = html.replace(regex, `<span class="bg-[var(--color-accent-light)] text-[var(--color-accent)] font-extrabold px-1 rounded-lg border border-[var(--color-accent)]/20">$1</span>`)
    }

    return html
  }, [story, chapterVocab])

  if (!story) {
    return (
      <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col items-center justify-center">
          <span className="text-4xl mb-3">📖</span>
          <h2 className="text-base font-black text-[var(--color-text-1)] mb-1">Cerita Belum Tersedia</h2>
          <p className="text-xs font-semibold text-[var(--color-text-2)] text-center mb-6 max-w-xs">
            Tidak ditemukan cerita naratif untuk bab "{chapter}". Pastikan Anda telah menyinkronkan data Google Sheets terbaru.
          </p>
          <button 
            onClick={() => { playTap(); router.back() }}
            className="rounded-xl px-5 py-2.5 text-xs font-black text-white bg-[var(--color-accent)] active:scale-95 transition-transform"
          >
            ← Kembali ke Bab
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col justify-between" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-sm md:max-w-2xl mx-auto w-full px-4 pt-12 pb-24 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8 anim-up">
          <button 
            onClick={() => {
              playTap()
              router.back()
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold bg-white dark:bg-[#1a1d24] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-transform shrink-0 cursor-pointer"
          >
            ←
          </button>
          <div>
            <h1 className="text-sm font-black text-[var(--color-text-2)] leading-none uppercase tracking-wider mb-1">{chapter}</h1>
            <h2 className="text-lg font-black text-[var(--color-text-1)] leading-tight">{story.title}</h2>
          </div>
        </header>

        <main className="space-y-6">
          {/* Japanese Story Card */}
          <div className="rounded-[28px] p-6 md:p-8 bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] shadow-sm anim-up relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-[var(--color-accent-light)]/20 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            {/* Story Content */}
            <div className="relative z-10">
              <p 
                className="jp text-base md:text-lg leading-relaxed text-[var(--color-text-1)] text-justify"
                style={{ letterSpacing: '0.04em' }}
                dangerouslySetInnerHTML={{ __html: highlightedStoryHtml }}
              />
            </div>

            {/* TTS Action Bar */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 relative z-10">
              <button 
                onClick={() => { playTap(); speakJapanese(story.storyJapanese, true) }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-95 transition-all cursor-pointer"
              >
                🐢 Lambat
              </button>
              <button 
                onClick={() => { playTap(); speakJapanese(story.storyJapanese, false) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 active:scale-95 transition-all cursor-pointer"
              >
                <VolumeIcon size={12} /> Dengarkan
              </button>
            </div>
          </div>

          {/* Accordion Indonesian Translation */}
          <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-white dark:bg-[#1a1d24] shadow-sm anim-up d1">
            <button
              onClick={() => { playTap(); setShowTranslation(!showTranslation) }}
              className="w-full flex items-center justify-between p-4 font-extrabold text-xs text-[var(--color-text-1)] cursor-pointer hover:bg-[var(--color-bg)] transition-colors"
            >
              <span>🇲🇨 Tampilkan Terjemahan</span>
              <span className={`transform transition-transform duration-200 text-xs text-[var(--color-text-2)]`}>
                {showTranslation ? '▲' : '▼'}
              </span>
            </button>
            
            <div className={`transition-all duration-300 overflow-hidden ${showTranslation ? 'max-h-96 border-t border-[var(--color-border)]' : 'max-h-0'}`}>
              <div className="p-4 text-xs font-semibold text-[var(--color-text-2)] leading-relaxed text-justify">
                {story.storyIndonesian}
              </div>
            </div>
          </div>

          {/* Highlighted Vocabulary List */}
          <div className="space-y-3 pt-2 anim-up d2">
            <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-[var(--color-text-3)]">
              Kosakata Bab Ini:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chapterVocab.map((v) => {
                const isKanji = v.kanji !== v.hiragana && v.kanji !== ''
                return (
                  <div 
                    key={v.id} 
                    className="p-3 rounded-2xl bg-white dark:bg-[#1a1d24] border border-[var(--color-border)] flex items-center justify-between shadow-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="jp text-sm font-bold text-[var(--color-text-1)] truncate">
                        {isKanji ? (
                          <ruby>
                            {v.kanji}
                            <rt className="font-semibold text-[var(--color-text-3)] dark:text-gray-400 select-none tracking-normal opacity-85" style={{ fontSize: '0.38em' }}>
                              {v.hiragana}
                            </rt>
                          </ruby>
                        ) : (
                          v.hiragana
                        )}
                      </p>
                      <p className="text-[10px] font-semibold text-[var(--color-text-2)] truncate mt-0.5">
                        {v.arti}
                      </p>
                    </div>

                    <button 
                      onClick={() => { playTap(); speakJapanese(v.hiragana || v.kanji) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-bg)] hover:bg-[var(--color-subtle)] text-[var(--color-text-2)] border border-[var(--color-border)] active:scale-90 transition-all shrink-0 cursor-pointer"
                    >
                      <VolumeIcon size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function VolumeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
  )
}
