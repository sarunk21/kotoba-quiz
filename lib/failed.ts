'use client'

/** Save a word ID to the failed words list in localStorage */
export function recordFailedWord(wordId: string) {
  if (typeof window === 'undefined') return
  try {
    const saved = localStorage.getItem('kotoba_failed_words')
    let list: string[] = saved ? JSON.parse(saved) : []
    
    // Move it to the end (newest) if it's already there
    list = list.filter(id => id !== wordId)
    list.push(wordId)
    
    // Cap at 50 recently failed words
    if (list.length > 50) {
      list.shift()
    }
    
    localStorage.setItem('kotoba_failed_words', JSON.stringify(list))
  } catch (e) {
    console.error('[FailedWords] Error writing failed word:', e)
  }
}

/** Remove a word ID from the failed words list (e.g. answered correctly) */
export function removeFailedWord(wordId: string) {
  if (typeof window === 'undefined') return
  try {
    const saved = localStorage.getItem('kotoba_failed_words')
    if (!saved) return
    let list: string[] = JSON.parse(saved)
    
    const originalLen = list.length
    list = list.filter(id => id !== wordId)
    
    if (list.length !== originalLen) {
      localStorage.setItem('kotoba_failed_words', JSON.stringify(list))
    }
  } catch (e) {
    console.error('[FailedWords] Error removing failed word:', e)
  }
}

/** Get the list of recently failed word IDs */
export function getFailedWords(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem('kotoba_failed_words')
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.error('[FailedWords] Error loading failed words:', e)
    return []
  }
}
