'use client'

import type { VocabItem } from './vocab'
import { SRS_INTERVALS } from './srs'

// Shuffle helper terpusat — menggantikan duplikat di app/quiz/page.tsx:18, app/kana/quiz/page.tsx:22, app/sentences/page.tsx:14, lib/srs.ts:150
export const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

// Vocab choices: sameCategoryPool → otherPool → shuffle — bank data terpusat
export function getVocabChoices(correct: VocabItem, pool: VocabItem[]): string[] {
  if ((correct as any).choices && Array.isArray((correct as any).choices) && (correct as any).choices.length >= 4) {
    return shuffle([...(correct as any).choices])
  }
  const sameCategoryPool = pool.filter(v => v.id !== correct.id && v.category === correct.category)
  let wrongs: VocabItem[] = []
  if (sameCategoryPool.length >= 3) {
    wrongs = shuffle(sameCategoryPool).slice(0, 3)
  } else {
    const otherPool = pool.filter(v => v.id !== correct.id && v.category !== correct.category)
    wrongs = [...sameCategoryPool, ...shuffle(otherPool).slice(0, 3 - sameCategoryPool.length)]
  }
  return shuffle([correct.arti, ...wrongs.map(v => v.arti)])
}

// Label next review untuk FeedbackSheet
export function getNextReviewLabel(level: number): string {
  const next = Math.min(level + 1, 6)
  const days = SRS_INTERVALS[next] ?? 90
  if (days === 0) return 'review hari ini'
  if (days === 1) return 'review besok'
  return `review ${days} hari lagi`
}

// Category style terpusat — dari app/quiz/page.tsx:35 CAT
const CAT: Record<string, { color: string; bg: string }> = {
  'Kata Benda': { color: 'var(--color-cat-noun)', bg: 'var(--color-cat-noun-bg)' },
  'Kata Kerja': { color: 'var(--color-cat-verb)', bg: 'var(--color-cat-verb-bg)' },
  'Kata Sifat': { color: 'var(--color-cat-adj)',  bg: 'var(--color-cat-adj-bg)' },
}

export function getCategoryStyle(category: string) {
  if (!category) return CAT['Kata Benda']
  if (CAT[category]) return CAT[category]
  const catLower = category.toLowerCase()
  if (catLower.includes('benda')) return CAT['Kata Benda']
  if (catLower.includes('kerja')) return CAT['Kata Kerja']
  if (catLower.includes('sifat')) return CAT['Kata Sifat']
  if (catLower.includes('ungkapan')) return { color: '#d97706', bg: 'rgba(217,119,6,0.12)' }
  if (catLower.includes('keterangan')) return { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' }
  if (catLower.includes('partikel')) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' }
  if (catLower.includes('angka')) return { color: 'var(--color-amber)', bg: 'var(--color-amber-light)' }
  if (catLower.includes('hari')) return { color: 'var(--color-red)', bg: 'var(--color-red-light)' }
  if (catLower.includes('uang')) return { color: 'var(--color-accent)', bg: 'var(--color-accent-light)' }
  return { color: 'var(--color-text-2)', bg: 'var(--color-surface)' }
}
