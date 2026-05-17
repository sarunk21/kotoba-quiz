export type Category = 'Kata Benda' | 'Kata Kerja' | 'Kata Sifat' | 'Ungkapan'

export interface VocabItem {
  id: string
  hiragana: string
  kanji: string
  arti: string
  category: Category
}

export function parseCSVToVocab(csvText: string): VocabItem[] {
  const lines = csvText.trim().split('\n')
  const items: VocabItem[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    // Minimal: kategori (cols[0]) + arti (cols[3]) harus ada
    if (cols.length >= 4 && cols[0] && cols[3]) {
      const hiragana = cols[1] || ''
      const kanji    = cols[2] || ''
      items.push({
        id: String(i),
        category: (cols[0] as Category) || 'Kata Benda',
        hiragana,
        kanji: kanji || hiragana, // fallback ke hiragana kalau kanji kosong
        arti: cols[3],
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
