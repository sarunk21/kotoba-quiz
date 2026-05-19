import Papa from 'papaparse'

export type Category = 'Kata Benda' | 'Kata Kerja' | 'Kata Sifat' | 'Ungkapan'

export interface VocabItem {
  id: string
  hiragana: string
  kanji: string
  arti: string
  category: Category
  chapter?: string
}

/** 
 * Parse CSV robustly using PapaParse.
 * Columns expected: kategori, hiragana, kanji, arti, bab
 */
export function parseCSVToVocab(csvText: string): VocabItem[] {
  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  })

  const items: VocabItem[] = []
  const data = parsed.data as string[][]

  // Start from i=1 to skip header if it exists
  // Detect if first row is header
  let startIdx = 1
  if (data[0] && (
    data[0][0]?.toLowerCase().includes('kategori') || 
    data[0][3]?.toLowerCase().includes('arti') ||
    data[0][4]?.toLowerCase().includes('bab')
  )) {
    startIdx = 1
  } else {
    // If not header, start from 0
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

    if (cols.length >= 5) {
      category = (cols[0]?.trim() as Category) || 'Kata Benda'
      hiragana = cols[1]?.trim() || ''
      kanji    = cols[2]?.trim() || ''
      arti     = cols[3]?.trim() || ''
      chapter  = cols[4]?.trim() || ''
    } else if (cols.length === 4) {
      category = (cols[0]?.trim() as Category) || 'Kata Benda'
      hiragana = cols[1]?.trim() || ''
      kanji    = cols[2]?.trim() || ''
      arti     = cols[3]?.trim() || ''
    } else if (cols.length === 3) {
      // Guess: hiragana, kanji, arti
      hiragana = cols[0]?.trim() || ''
      kanji    = cols[1]?.trim() || ''
      arti     = cols[2]?.trim() || ''
    } else if (cols.length === 2) {
      // Guess: japanese, arti
      hiragana = cols[0]?.trim() || ''
      arti     = cols[1]?.trim() || ''
    }

    // Minimal requirement: Must have 'arti' and at least one Japanese form
    if (arti && (hiragana || kanji)) {
      // Generate stable ID based on content (Exclude chapter to keep progress if word moves chapters)
      const rawId = `${category}|${hiragana}|${kanji}|${arti}`
      // Simple hash to avoid non-ascii issues in some IDs
      const id = Array.from(rawId).reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36) + 
                 btoa(unescape(encodeURIComponent(rawId.substring(0, 10)))).substring(0, 8)

      items.push({
        id,
        category,
        hiragana,
        kanji: kanji || hiragana,
        arti,
        chapter: chapter || undefined,
      })
    }
  }
  return items
}

export function getDisplayText(item: VocabItem): { main: string; sub: string } {
  const hasKanji = item.kanji !== item.hiragana && item.kanji !== ''
  return {
    main: item.kanji || item.hiragana,
    sub: hasKanji ? item.hiragana : '',
  }
}
