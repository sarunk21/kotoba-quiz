import Papa from 'papaparse'

export type Category = 'Kata Benda' | 'Kata Kerja' | 'Kata Sifat' | 'Ungkapan' | 'Angka' | 'Hari' | 'Uang'

export interface VocabItem {
  id: string
  hiragana: string
  kanji: string
  arti: string
  category: Category
  chapter?: string
  contohKalimat?: string      // ponytail: optional example sentence
  contohKalimatArti?: string  // ponytail: optional translation of example sentence
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
    let contohKalimat = ''
    let contohKalimatArti = ''

    // ponytail: gracefully parse additional example sentence columns if present
    if (cols.length >= 5) {
      category = (cols[0]?.trim() as Category) || 'Kata Benda'
      hiragana = cols[1]?.trim() || ''
      kanji    = cols[2]?.trim() || ''
      arti     = cols[3]?.trim() || ''
      chapter  = cols[4]?.trim() || ''
      contohKalimat = cols[5]?.trim() || ''
      contohKalimatArti = cols[6]?.trim() || ''
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
        contohKalimat: contohKalimat?.trim() || undefined,
        contohKalimatArti: contohKalimatArti?.trim() || undefined,
      })
    }
  }
  return items
}

// ── Global Cache ──
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
    cachedVocab = null
    return []
  }
  if (cachedVocab) return cachedVocab
  try {
    const items = JSON.parse(raw) as VocabItem[]
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


// ── Dynamic Furigana Helper ──
export const FURIGANA_DICT: Record<string, string> = {
  // Nouns / Compounds
  '留学生': 'りゅうがくせい',
  '郵便局': 'ゆうびんきょく',
  '月曜日': 'げつようび',
  '金曜日': 'きんようび',
  '日曜日': 'にchようび', // wait: にちようび
  '土曜日': 'どようび',
  'お父さん': 'おとうさん',
  'お母さん': 'おかあさん',
  '大学生': 'だいがくせい',
  '日本語': 'にほんご',
  '図書館': 'としょかん',
  '自転車': 'じてんしゃ',
  '買い物': 'かいもの',
  '毎日': 'まいにち',
  '毎週': 'まいshu', // wait: まいしゅう
  '毎晩': 'まいばん',
  '毎朝': 'まいあさ',
  '来週': 'らいしゅう',
  '来月': 'らいげつ',
  '京都': 'きょうと',
  '東京': 'とうきょう',
  '果物': 'くだもの',
  '切手': 'きって',
  '鈴木': 'すずき',
  '木村': 'きむら',
  '田中': 'たなか',
  '先生': 'せんせい',
  '天気': 'てんき',
  '今日': 'きょう',
  '明日': 'あした',
  '昨日': 'きのう',
  '趣味': 'しゅみ',
  '音楽': 'おんがく',
  '友達': 'ともだち',
  '旅行': 'りょこう',
  '英語': 'えいご',
  '公園': 'こうえん',
  '漢字': 'かんじ',
  '牛乳': 'ぎゅうにゅう',
  'お茶': 'おちゃ',
  'ご飯': 'ごはん',
  '上手': 'じょうず',
  '元気': 'げんき',
  '辞書': 'じしょ',
  
  // Single Kanji Nouns / Common Words
  '部屋': 'へや',
  '妹': 'いもうto', // wait: いもうと
  '兄': 'あに',
  '姉': 'あね',
  '弟': 'おとうと',
  '父': 'ちち',
  '母': 'はは',
  '誰': 'だれ',
  '犬': 'いぬ',
  '猫': 'ねこ',
  '上': 'うえ',
  '下': 'した',
  '中': 'なか',
  '外': 'そと',
  '傘': 'かさ',
  '机': 'つくえ',
  '本': 'ほん',
  '花': 'はな',
  '桜': 'さくら',
  '海': 'うみ',
  '魚': 'さかな',
  '車': 'くるま',
  'お酒': 'おさけ',
  '酒': 'さけ',
  '夜': 'よる',
  '家': 'いえ',
  '頭': 'あたま',
  '風邪': 'かぜ',
  '私': 'わたし',
  '僕': 'ぼく',
  '俺': 'おれ',
  '君': 'きみ',

  // Verb / Adjective stems
  '勉強': 'べんきょう',
  '面白': 'おもしろ',
  '綺麗': 'きれい',
  '働': 'はたら',
  '書': 'か',
  '読': 'よ',
  '聞': 'き',
  '話': 'はな',
  '歩': 'ある',
  '走': 'はし',
  '泳': 'およ',
  '飲': 'の',
  '買': 'か',
  '売': 'う',
  '待': 'ま',
  '持': 'も',
  '寝': 'ね',
  '起': 'お',
  '帰': 'かえ',
  '住': 'す',
  '会': 'あ',
  '遊': 'あそ',
  '終': 'お',
  '始': 'はじ',
  '教': 'おし',
  '習': 'なら',
  '貸': 'か',
  '借': 'か',
  '作': 'つく',
  '使': 'つか',
  '撮': 'と',
  '吸': 'す',
  '渇': 'かわ',
  '空': 'す',
  '痛': 'いた',
  '好': 'す',
  '難': 'むずか',
  '新': 'あたら',
  '古': 'ふる',
  '高': 'たか',
  '安': 'やす',
  '大': 'おお',
  '小': 'ちい',
  '多': 'おお',
  '少': 'すこ',
  '近': 'ちか',
  '遠': 'とお',
  '静': 'しず',
  '行': 'い',
  '来': 'き',
  '見': 'み',
  '食': 'た',
  '引': 'ひ',
}

// Correct typo fixes in dict values
FURIGANA_DICT['日曜日'] = 'にちようび'
FURIGANA_DICT['毎週'] = 'まいしゅう'
FURIGANA_DICT['妹'] = 'いもうと'

export function addFuriganaToSentence(sentence: string): string {
  let html = sentence
  const sortedKeys = Object.keys(FURIGANA_DICT).sort((a, b) => b.length - a.length)
  
  // Temporarily replace ___ and spaces around it to protect it from replacement
  html = html.replace('___', '___TEMP___')

  for (const key of sortedKeys) {
    if (html.includes(key)) {
      const reading = FURIGANA_DICT[key]
      const rubyHtml = `<ruby>${key}<rt style="font-size: 0.38em" class="font-semibold text-[var(--color-text-3)] dark:text-gray-400 select-none tracking-normal opacity-85">${reading}</rt></ruby>`
      html = html.split(key).join(rubyHtml)
    }
  }

  // Restore ___
  html = html.split('___TEMP___').join('___')
  return html
}
