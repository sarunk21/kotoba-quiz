export type Category = 'Kata Benda' | 'Kata Kerja' | 'Kata Sifat'

export interface VocabItem {
  id: string
  hiragana: string
  kanji: string
  arti: string
  category: Category
}

export const DEFAULT_VOCAB: VocabItem[] = [
  { id: '1', hiragana: 'わたし', kanji: '私', arti: 'Saya', category: 'Kata Benda' },
  { id: '2', hiragana: 'これ', kanji: 'これ', arti: 'Ini (deket pembicara)', category: 'Kata Benda' },
  { id: '3', hiragana: 'がくせい', kanji: '学生', arti: 'Pelajar / murid', category: 'Kata Benda' },
  { id: '4', hiragana: 'けんきゅうしゃ', kanji: '研究者', arti: 'Peneliti', category: 'Kata Benda' },
  { id: '5', hiragana: 'はな', kanji: '花', arti: 'Bunga', category: 'Kata Benda' },
  { id: '6', hiragana: 'はなし', kanji: '話', arti: 'Cerita', category: 'Kata Benda' },
  { id: '7', hiragana: 'しつれい', kanji: '失礼', arti: 'Ga sopan', category: 'Kata Benda' },
  { id: '8', hiragana: 'おきます', kanji: '起きます', arti: 'Bangun', category: 'Kata Kerja' },
  { id: '9', hiragana: 'ねます', kanji: '寝ます', arti: 'Tidur', category: 'Kata Kerja' },
  { id: '10', hiragana: 'はたらきます', kanji: '働きます', arti: 'Bekerja', category: 'Kata Kerja' },
  { id: '11', hiragana: 'やすみます', kanji: '休みます', arti: 'Beristirahat', category: 'Kata Kerja' },
  { id: '12', hiragana: 'べんきょうします', kanji: '勉強します', arti: 'Belajar', category: 'Kata Kerja' },
  { id: '13', hiragana: 'おわります', kanji: '終わります', arti: 'Selesai', category: 'Kata Kerja' },
]

export function parseCSVToVocab(csvText: string): VocabItem[] {
  const lines = csvText.trim().split('\n')
  const items: VocabItem[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    // minimal: kategori (cols[0]) + arti (cols[3]) harus ada
    // hiragana (cols[1]) dan kanji (cols[2]) boleh kosong
    if (cols.length >= 4 && cols[0] && cols[3]) {
      const hiragana = cols[1] || ''
      const kanji = cols[2] || ''
      items.push({
        id: String(i),
        category: (cols[0] as Category) || 'Kata Benda',
        hiragana,
        // kalau kanji kosong, fallback ke hiragana biar card ga kosong
        kanji: kanji || hiragana,
        arti: cols[3],
      })
    }
  }
  return items.length > 0 ? items : DEFAULT_VOCAB
}

/** Helper: kata yang tampil di card — kanji kalau ada, otherwise hiragana */
export function getDisplayText(item: VocabItem): { main: string; sub: string } {
  const hasKanji = item.kanji !== item.hiragana && item.kanji !== ''
  return {
    main: item.kanji || item.hiragana,
    sub: hasKanji ? item.hiragana : '', // kalau ga ada kanji, hiragana udah jadi main, sub kosong
  }
}
