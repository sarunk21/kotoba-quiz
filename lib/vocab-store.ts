import defaultVocabData from '@/public/data/vocab-default.json'
import type { VocabItem } from './vocab.types'

let cachedVocab: VocabItem[] | null = null

export function getGlobalVocab(): VocabItem[] | null {
  return cachedVocab
}

export function setGlobalVocab(items: VocabItem[]) {
  cachedVocab = items
}

export function getDisplayText(item: VocabItem): { main: string; sub: string } {
  const hasKanji = item.kanji !== item.hiragana && item.kanji !== ''
  return {
    main: item.kanji || item.hiragana,
    sub: hasKanji ? item.hiragana : '',
  }
}

export function loadLocalVocab(): VocabItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem('kotoba_vocab')
  if (!raw) {
    const initialItems = defaultVocabData as VocabItem[]
    saveLocalVocab(initialItems)
    return initialItems
  }
  if (cachedVocab) return cachedVocab
  try {
    const items = JSON.parse(raw) as VocabItem[]
    const hasCorruptedChapters = items.some(
      item => item.chapter && !item.chapter.startsWith('Bab ') && item.chapter !== 'Tanpa Bab'
    )
    if (hasCorruptedChapters) {
      const cleanItems = defaultVocabData as VocabItem[]
      saveLocalVocab(cleanItems)
      return cleanItems
    }
    setGlobalVocab(items)
    return items
  } catch (e) {
    console.error('[Vocab] Error loading from localStorage:', e)
  }
  return []
}

export function saveLocalVocab(items: VocabItem[]) {
  setGlobalVocab(items)
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('kotoba_vocab', JSON.stringify(items))
  } catch (e) {
    console.error('[Vocab] Error saving to localStorage:', e)
  }
}
