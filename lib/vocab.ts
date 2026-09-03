// Barrel — split god file lib/vocab.ts (393) → vocab.types / vocab-id / vocab-parser / vocab-store / vocab-furigana
// Ponytail split: parser (PapaParse), store (localStorage + cache), furigana (dict + ruby)
// Semua import lama `from '@/lib/vocab'` tetap work via re-export.

export * from './vocab.types'
export * from './vocab-id'
export * from './vocab-parser'
export * from './vocab-store'
export * from './vocab-furigana'
