import Papa from 'papaparse'
import type { Category, VocabItem } from './vocab.types'
import { generateVocabId } from './vocab-id'

export function parseCSVToVocab(csvText: string, defaultSource: 'standard' | 'custom' = 'custom'): VocabItem[] {
  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  })

  const items: VocabItem[] = []
  const data = parsed.data as string[][]

  let startIdx = 1
  if (data[0] && (
    data[0][0]?.toLowerCase().includes('kategori') || 
    data[0][3]?.toLowerCase().includes('arti') ||
    data[0][4]?.toLowerCase().includes('bab')
  )) {
    startIdx = 1
  } else {
    startIdx = 0
  }

  for (let i = startIdx; i < data.length; i++) {
    const cols = data[i]
    if (!cols || cols.length < 2) continue

    let category: Category = 'Kata Benda'
    let hiragana = ''
    let kanji = ''
    let arti = ''
    let chapter = ''
    let contohKalimat = ''
    let contohKalimatArti = ''

    if (cols.length >= 5) {
      category = (cols[0]?.trim() as Category) || 'Kata Benda'
      hiragana = cols[1]?.trim() || ''
      kanji    = cols[2]?.trim() || ''
      arti     = cols[3]?.trim() || ''
      chapter  = cols[4]?.trim().replace(/^["']|["']$/g, '') || ''
      if (/^\d+$/.test(chapter)) {
        chapter = `Bab ${chapter}`
      }
      contohKalimat = cols[5]?.trim() || ''
      contohKalimatArti = cols[6]?.trim() || ''
    } else if (cols.length === 4) {
      category = (cols[0]?.trim() as Category) || 'Kata Benda'
      hiragana = cols[1]?.trim() || ''
      kanji    = cols[2]?.trim() || ''
      arti     = cols[3]?.trim() || ''
    } else if (cols.length === 3) {
      hiragana = cols[0]?.trim() || ''
      kanji    = cols[1]?.trim() || ''
      arti     = cols[2]?.trim() || ''
    } else if (cols.length === 2) {
      hiragana = cols[0]?.trim() || ''
      arti     = cols[1]?.trim() || ''
    }

    if (arti && (hiragana || kanji)) {
      const id = generateVocabId(category, hiragana, kanji, arti)
      items.push({
        id,
        category,
        hiragana,
        kanji: kanji || hiragana,
        arti,
        chapter: chapter || undefined,
        contohKalimat: contohKalimat?.trim() || undefined,
        contohKalimatArti: contohKalimatArti?.trim() || undefined,
        source: defaultSource,
      })
    }
  }
  return items
}
