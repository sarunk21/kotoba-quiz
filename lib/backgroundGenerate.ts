/**
 * Background story generator — module-level singleton.
 * Runs independently of React component lifecycle.
 * Navigate away freely; generation continues until done.
 */

import { getGroqApiKey } from '@/lib/gemini'
import { generateStoryForChapter } from '@/lib/gemini'
import { type ChapterStory } from '@/lib/stories'

export interface GenerateProgress {
  isRunning: boolean
  done: number
  total: number
  currentChapter: string
  lastError: string
}

// Module-level state — persists across route changes
let _isRunning = false
let _progress: GenerateProgress = {
  isRunning: false,
  done: 0,
  total: 0,
  currentChapter: '',
  lastError: '',
}

// Subscribers — components that want live updates
const _listeners = new Set<(p: GenerateProgress) => void>()

export function subscribeProgress(cb: (p: GenerateProgress) => void): () => void {
  _listeners.add(cb)
  cb({ ..._progress }) // immediately emit current state
  return () => _listeners.delete(cb)
}

function emit() {
  _listeners.forEach(cb => cb({ ..._progress }))
}

export function getProgress(): GenerateProgress {
  return { ..._progress }
}

export function isGenerating(): boolean {
  return _isRunning
}

/**
 * Start background generation. Safe to call multiple times — ignores if already running.
 * chaptersToSkip: set of chapter names that already have stories (to avoid re-generating).
 */
export async function startBackgroundGenerate(
  chaptersMap: Map<string, { kanji: string; hiragana: string; arti: string }[]>,
  chaptersToSkip: Set<string> = new Set()
): Promise<void> {
  if (_isRunning) return

  const chapters = Array.from(chaptersMap.keys()).filter(ch => !chaptersToSkip.has(ch))
  if (chapters.length === 0) return

  _isRunning = true
  _progress = { isRunning: true, done: 0, total: chapters.length, currentChapter: '', lastError: '' }
  emit()

  // Load existing stories from localStorage
  let stories: ChapterStory[] = []
  try {
    const stored = localStorage.getItem('kotoba_stories')
    if (stored) stories = JSON.parse(stored)
  } catch { /* ignore */ }

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i]
    _progress.currentChapter = ch
    emit()

    try {
      const result = await generateStoryForChapter(ch, chaptersMap.get(ch)!)

      const story: ChapterStory = {
        chapter: ch,
        title: result.judul,
        storyJapanese: result.scenes.map(s => s.cerita_jepang).join(''),
        storyIndonesian: result.scenes.map(s => s.cerita_indo).join(' '),
        scenes: result.scenes.map(s => ({
          chapter: ch,
          sceneOrder: s.order,
          imageUrl: '', // default empty, maybe replaced by user
          sentenceJapanese: s.cerita_jepang,
          sentenceIndonesian: s.cerita_indo,
          chunks: s.chunks,
        })),
      }

      // Replace or insert
      const idx = stories.findIndex(s => s.chapter === ch)
      if (idx >= 0) stories[idx] = story
      else stories.push(story)

      // Save progressively
      localStorage.setItem('kotoba_stories', JSON.stringify(stories))

      _progress.done = i + 1
      _progress.lastError = ''
      emit()

      // 5s delay to respect free tier rate limits
      if (i < chapters.length - 1) {
        await new Promise(r => setTimeout(r, 5000))
      }
    } catch (e: any) {
      _progress.lastError = `Gagal "${ch}": ${e.message}`
      _progress.done = i + 1
      emit()
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  _isRunning = false
  _progress = { ..._progress, isRunning: false, currentChapter: '' }
  emit()
}
