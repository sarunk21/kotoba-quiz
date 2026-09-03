export type Category = 'Kata Benda' | 'Kata Kerja' | 'Kata Sifat' | 'Ungkapan' | 'Angka' | 'Hari' | 'Uang' | 'Tubuh' | 'Keluarga'

export interface VocabItem {
  id: string
  hiragana: string
  kanji: string
  arti: string
  category: Category
  chapter?: string
  contohKalimat?: string
  contohKalimatArti?: string
  source?: 'standard' | 'custom'
}
