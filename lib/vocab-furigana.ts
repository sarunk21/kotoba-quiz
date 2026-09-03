import type { VocabItem } from './vocab.types'
import { getGlobalVocab, loadLocalVocab } from './vocab-store'

export const FURIGANA_DICT: Record<string, string> = {
  '留学生': 'りゅうがくせい',
  '郵便局': 'ゆうびんきょく',
  '月曜日': 'げつようび',
  '金曜日': 'きんようび',
  '日曜日': 'にちようび',
  '土曜日': 'どようび',
  'お父さん': 'おとうさん',
  'お母さん': 'おかあさん',
  '大学生': 'だいがくせい',
  '日本語': 'にほんご',
  '図書館': 'としょかん',
  '自転車': 'じてんしゃ',
  '買い物': 'かいもの',
  '毎日': 'まいにち',
  '毎週': 'まいしゅう',
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
  '部屋': 'へや',
  '妹': 'いもうと',
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

let PRE_SORTED_FURIGANA_KEYS: string[] | null = null

function getSortedFuriganaKeys(): string[] {
  if (!PRE_SORTED_FURIGANA_KEYS) {
    PRE_SORTED_FURIGANA_KEYS = Object.keys(FURIGANA_DICT).sort((a, b) => b.length - a.length)
  }
  return PRE_SORTED_FURIGANA_KEYS
}

const furiganaCache = new Map<string, string>()

function escapeHtmlBasic(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

export function addFuriganaToSentence(sentence: string): string {
  if (!sentence) return ''
  if (furiganaCache.has(sentence)) {
    return furiganaCache.get(sentence)!
  }
  let html = escapeHtmlBasic(sentence)
  const sortedKeys = getSortedFuriganaKeys()
  html = html.replace('___', '___TEMP___')
  for (const key of sortedKeys) {
    if (html.includes(key)) {
      const reading = FURIGANA_DICT[key]
      const rubyHtml = `<ruby>${key}<rt style="font-size: 0.38em" class="font-semibold text-[var(--color-text-3)] dark:text-gray-400 select-none tracking-normal opacity-85">${reading}</rt></ruby>`
      html = html.split(key).join(rubyHtml)
    }
  }
  html = html.split('___TEMP___').join('___')
  if (furiganaCache.size > 500) furiganaCache.clear()
  furiganaCache.set(sentence, html)
  return html
}

const vocabRefCache = new Map<string, { kanji: string; hiragana: string; arti: string; chapter: string }[]>()

export function extractVocabRefFromSentence(sentence: string, vocabList?: VocabItem[]): { kanji: string; hiragana: string; arti: string; chapter: string }[] {
  if (!sentence) return []
  if (vocabRefCache.has(sentence)) {
    return vocabRefCache.get(sentence)!
  }
  const list = vocabList || getGlobalVocab() || loadLocalVocab()
  if (!list || list.length === 0) return []
  const matches: { kanji: string; hiragana: string; arti: string; chapter: string }[] = []
  const cleanSentence = sentence.replace(/___/g, '')
  for (const item of list) {
    const kanjiMatch = item.kanji && item.kanji.length >= 2 && cleanSentence.includes(item.kanji)
    const hiraganaMatch = item.hiragana && item.hiragana.length >= 3 && cleanSentence.includes(item.hiragana)
    if (kanjiMatch || hiraganaMatch) {
      const matchWord = item.kanji || item.hiragana
      if (!matches.some(m => m.kanji === matchWord)) {
        matches.push({
          kanji: matchWord,
          hiragana: item.hiragana,
          arti: item.arti,
          chapter: item.chapter || 'Bab 1'
        })
      }
    }
  }
  if (vocabRefCache.size > 500) vocabRefCache.clear()
  vocabRefCache.set(sentence, matches)
  return matches
}
