'use client'

import { useEffect } from 'react'
import { speakJapanese, preloadJapaneseAudio } from '@/lib/sounds'

// Hook terpusat untuk TTS quiz — menggantikan duplikasi useEffect speakJapanese+preload di
// app/quiz/page.tsx:201, app/kana/quiz/page.tsx:121, app/particles/page.tsx:95, app/sentences/page.tsx:61
export function useQuizAudio<T>(
  phase: string,
  currentItem: T | null | undefined,
  getText: (item: T) => string,
  queue: T[],
  currentIndex: number,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return
    if (phase === 'question' && currentItem) {
      const text = getText(currentItem)
      if (text) speakJapanese(text)
      const nextItem = queue[currentIndex + 1]
      if (nextItem) {
        const nextText = getText(nextItem)
        if (nextText) preloadJapaneseAudio(nextText)
      }
    }
  }, [phase, currentItem, queue, currentIndex, getText, enabled])
}
