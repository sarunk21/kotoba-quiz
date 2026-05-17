export type KanaType = 'hiragana' | 'katakana'
export type KanaGroup = 'vowel' | 'k' | 's' | 't' | 'n' | 'h' | 'm' | 'y' | 'r' | 'w' | 'n-solo' | 'dakuten' | 'combo'

export interface KanaCard {
  id: string
  hiragana: string
  katakana: string
  romaji: string
  group: KanaGroup
  groupLabel: string
}

export const KANA: KanaCard[] = [
  // ── Vowels ──
  { id:'a',   hiragana:'あ', katakana:'ア', romaji:'a',   group:'vowel', groupLabel:'Vokal' },
  { id:'i',   hiragana:'い', katakana:'イ', romaji:'i',   group:'vowel', groupLabel:'Vokal' },
  { id:'u',   hiragana:'う', katakana:'ウ', romaji:'u',   group:'vowel', groupLabel:'Vokal' },
  { id:'e',   hiragana:'え', katakana:'エ', romaji:'e',   group:'vowel', groupLabel:'Vokal' },
  { id:'o',   hiragana:'お', katakana:'オ', romaji:'o',   group:'vowel', groupLabel:'Vokal' },
  // ── K ──
  { id:'ka',  hiragana:'か', katakana:'カ', romaji:'ka',  group:'k', groupLabel:'K-row' },
  { id:'ki',  hiragana:'き', katakana:'キ', romaji:'ki',  group:'k', groupLabel:'K-row' },
  { id:'ku',  hiragana:'く', katakana:'ク', romaji:'ku',  group:'k', groupLabel:'K-row' },
  { id:'ke',  hiragana:'け', katakana:'ケ', romaji:'ke',  group:'k', groupLabel:'K-row' },
  { id:'ko',  hiragana:'こ', katakana:'コ', romaji:'ko',  group:'k', groupLabel:'K-row' },
  // ── S ──
  { id:'sa',  hiragana:'さ', katakana:'サ', romaji:'sa',  group:'s', groupLabel:'S-row' },
  { id:'shi', hiragana:'し', katakana:'シ', romaji:'shi', group:'s', groupLabel:'S-row' },
  { id:'su',  hiragana:'す', katakana:'ス', romaji:'su',  group:'s', groupLabel:'S-row' },
  { id:'se',  hiragana:'せ', katakana:'セ', romaji:'se',  group:'s', groupLabel:'S-row' },
  { id:'so',  hiragana:'そ', katakana:'ソ', romaji:'so',  group:'s', groupLabel:'S-row' },
  // ── T ──
  { id:'ta',  hiragana:'た', katakana:'タ', romaji:'ta',  group:'t', groupLabel:'T-row' },
  { id:'chi', hiragana:'ち', katakana:'チ', romaji:'chi', group:'t', groupLabel:'T-row' },
  { id:'tsu', hiragana:'つ', katakana:'ツ', romaji:'tsu', group:'t', groupLabel:'T-row' },
  { id:'te',  hiragana:'て', katakana:'テ', romaji:'te',  group:'t', groupLabel:'T-row' },
  { id:'to',  hiragana:'と', katakana:'ト', romaji:'to',  group:'t', groupLabel:'T-row' },
  // ── N ──
  { id:'na',  hiragana:'な', katakana:'ナ', romaji:'na',  group:'n', groupLabel:'N-row' },
  { id:'ni',  hiragana:'に', katakana:'ニ', romaji:'ni',  group:'n', groupLabel:'N-row' },
  { id:'nu',  hiragana:'ぬ', katakana:'ヌ', romaji:'nu',  group:'n', groupLabel:'N-row' },
  { id:'ne',  hiragana:'ね', katakana:'ネ', romaji:'ne',  group:'n', groupLabel:'N-row' },
  { id:'no',  hiragana:'の', katakana:'ノ', romaji:'no',  group:'n', groupLabel:'N-row' },
  // ── H ──
  { id:'ha',  hiragana:'は', katakana:'ハ', romaji:'ha',  group:'h', groupLabel:'H-row' },
  { id:'hi',  hiragana:'ひ', katakana:'ヒ', romaji:'hi',  group:'h', groupLabel:'H-row' },
  { id:'fu',  hiragana:'ふ', katakana:'フ', romaji:'fu',  group:'h', groupLabel:'H-row' },
  { id:'he',  hiragana:'へ', katakana:'ヘ', romaji:'he',  group:'h', groupLabel:'H-row' },
  { id:'ho',  hiragana:'ほ', katakana:'ホ', romaji:'ho',  group:'h', groupLabel:'H-row' },
  // ── M ──
  { id:'ma',  hiragana:'ま', katakana:'マ', romaji:'ma',  group:'m', groupLabel:'M-row' },
  { id:'mi',  hiragana:'み', katakana:'ミ', romaji:'mi',  group:'m', groupLabel:'M-row' },
  { id:'mu',  hiragana:'む', katakana:'ム', romaji:'mu',  group:'m', groupLabel:'M-row' },
  { id:'me',  hiragana:'め', katakana:'メ', romaji:'me',  group:'m', groupLabel:'M-row' },
  { id:'mo',  hiragana:'も', katakana:'モ', romaji:'mo',  group:'m', groupLabel:'M-row' },
  // ── Y ──
  { id:'ya',  hiragana:'や', katakana:'ヤ', romaji:'ya',  group:'y', groupLabel:'Y-row' },
  { id:'yu',  hiragana:'ゆ', katakana:'ユ', romaji:'yu',  group:'y', groupLabel:'Y-row' },
  { id:'yo',  hiragana:'よ', katakana:'ヨ', romaji:'yo',  group:'y', groupLabel:'Y-row' },
  // ── R ──
  { id:'ra',  hiragana:'ら', katakana:'ラ', romaji:'ra',  group:'r', groupLabel:'R-row' },
  { id:'ri',  hiragana:'り', katakana:'リ', romaji:'ri',  group:'r', groupLabel:'R-row' },
  { id:'ru',  hiragana:'る', katakana:'ル', romaji:'ru',  group:'r', groupLabel:'R-row' },
  { id:'re',  hiragana:'れ', katakana:'レ', romaji:'re',  group:'r', groupLabel:'R-row' },
  { id:'ro',  hiragana:'ろ', katakana:'ロ', romaji:'ro',  group:'r', groupLabel:'R-row' },
  // ── W ──
  { id:'wa',  hiragana:'わ', katakana:'ワ', romaji:'wa',  group:'w', groupLabel:'W-row' },
  { id:'wo',  hiragana:'を', katakana:'ヲ', romaji:'wo',  group:'w', groupLabel:'W-row' },
  // ── N solo ──
  { id:'nn',  hiragana:'ん', katakana:'ン', romaji:'n',   group:'n-solo', groupLabel:'N' },
  // ── Dakuten (voiced) ──
  { id:'ga',  hiragana:'が', katakana:'ガ', romaji:'ga',  group:'dakuten', groupLabel:'Dakuten G' },
  { id:'gi',  hiragana:'ぎ', katakana:'ギ', romaji:'gi',  group:'dakuten', groupLabel:'Dakuten G' },
  { id:'gu',  hiragana:'ぐ', katakana:'グ', romaji:'gu',  group:'dakuten', groupLabel:'Dakuten G' },
  { id:'ge',  hiragana:'げ', katakana:'ゲ', romaji:'ge',  group:'dakuten', groupLabel:'Dakuten G' },
  { id:'go',  hiragana:'ご', katakana:'ゴ', romaji:'go',  group:'dakuten', groupLabel:'Dakuten G' },
  { id:'za',  hiragana:'ざ', katakana:'ザ', romaji:'za',  group:'dakuten', groupLabel:'Dakuten Z' },
  { id:'ji',  hiragana:'じ', katakana:'ジ', romaji:'ji',  group:'dakuten', groupLabel:'Dakuten Z' },
  { id:'zu',  hiragana:'ず', katakana:'ズ', romaji:'zu',  group:'dakuten', groupLabel:'Dakuten Z' },
  { id:'ze',  hiragana:'ぜ', katakana:'ゼ', romaji:'ze',  group:'dakuten', groupLabel:'Dakuten Z' },
  { id:'zo',  hiragana:'ぞ', katakana:'ゾ', romaji:'zo',  group:'dakuten', groupLabel:'Dakuten Z' },
  { id:'da',  hiragana:'だ', katakana:'ダ', romaji:'da',  group:'dakuten', groupLabel:'Dakuten D' },
  { id:'di',  hiragana:'ぢ', katakana:'ヂ', romaji:'di',  group:'dakuten', groupLabel:'Dakuten D' },
  { id:'du',  hiragana:'づ', katakana:'ヅ', romaji:'du',  group:'dakuten', groupLabel:'Dakuten D' },
  { id:'de',  hiragana:'で', katakana:'デ', romaji:'de',  group:'dakuten', groupLabel:'Dakuten D' },
  { id:'do',  hiragana:'ど', katakana:'ド', romaji:'do',  group:'dakuten', groupLabel:'Dakuten D' },
  { id:'ba',  hiragana:'ば', katakana:'バ', romaji:'ba',  group:'dakuten', groupLabel:'Dakuten B' },
  { id:'bi',  hiragana:'び', katakana:'ビ', romaji:'bi',  group:'dakuten', groupLabel:'Dakuten B' },
  { id:'bu',  hiragana:'ぶ', katakana:'ブ', romaji:'bu',  group:'dakuten', groupLabel:'Dakuten B' },
  { id:'be',  hiragana:'べ', katakana:'ベ', romaji:'be',  group:'dakuten', groupLabel:'Dakuten B' },
  { id:'bo',  hiragana:'ぼ', katakana:'ボ', romaji:'bo',  group:'dakuten', groupLabel:'Dakuten B' },
  { id:'pa',  hiragana:'ぱ', katakana:'パ', romaji:'pa',  group:'dakuten', groupLabel:'Handakuten P' },
  { id:'pi',  hiragana:'ぴ', katakana:'ピ', romaji:'pi',  group:'dakuten', groupLabel:'Handakuten P' },
  { id:'pu',  hiragana:'ぷ', katakana:'プ', romaji:'pu',  group:'dakuten', groupLabel:'Handakuten P' },
  { id:'pe',  hiragana:'ぺ', katakana:'ペ', romaji:'pe',  group:'dakuten', groupLabel:'Handakuten P' },
  { id:'po',  hiragana:'ぽ', katakana:'ポ', romaji:'po',  group:'dakuten', groupLabel:'Handakuten P' },
  // ── Combo ──
  { id:'kya', hiragana:'きゃ', katakana:'キャ', romaji:'kya', group:'combo', groupLabel:'Combo K' },
  { id:'kyu', hiragana:'きゅ', katakana:'キュ', romaji:'kyu', group:'combo', groupLabel:'Combo K' },
  { id:'kyo', hiragana:'きょ', katakana:'キョ', romaji:'kyo', group:'combo', groupLabel:'Combo K' },
  { id:'sha', hiragana:'しゃ', katakana:'シャ', romaji:'sha', group:'combo', groupLabel:'Combo S' },
  { id:'shu', hiragana:'しゅ', katakana:'シュ', romaji:'shu', group:'combo', groupLabel:'Combo S' },
  { id:'sho', hiragana:'しょ', katakana:'ショ', romaji:'sho', group:'combo', groupLabel:'Combo S' },
  { id:'cha', hiragana:'ちゃ', katakana:'チャ', romaji:'cha', group:'combo', groupLabel:'Combo T' },
  { id:'chu', hiragana:'ちゅ', katakana:'チュ', romaji:'chu', group:'combo', groupLabel:'Combo T' },
  { id:'cho', hiragana:'ちょ', katakana:'チョ', romaji:'cho', group:'combo', groupLabel:'Combo T' },
  { id:'nya', hiragana:'にゃ', katakana:'ニャ', romaji:'nya', group:'combo', groupLabel:'Combo N' },
  { id:'nyu', hiragana:'にゅ', katakana:'ニュ', romaji:'nyu', group:'combo', groupLabel:'Combo N' },
  { id:'nyo', hiragana:'にょ', katakana:'ニョ', romaji:'nyo', group:'combo', groupLabel:'Combo N' },
  { id:'hya', hiragana:'ひゃ', katakana:'ヒャ', romaji:'hya', group:'combo', groupLabel:'Combo H' },
  { id:'hyu', hiragana:'ひゅ', katakana:'ヒュ', romaji:'hyu', group:'combo', groupLabel:'Combo H' },
  { id:'hyo', hiragana:'ひょ', katakana:'ヒョ', romaji:'hyo', group:'combo', groupLabel:'Combo H' },
  { id:'mya', hiragana:'みゃ', katakana:'ミャ', romaji:'mya', group:'combo', groupLabel:'Combo M' },
  { id:'myu', hiragana:'みゅ', katakana:'ミュ', romaji:'myu', group:'combo', groupLabel:'Combo M' },
  { id:'myo', hiragana:'みょ', katakana:'ミョ', romaji:'myo', group:'combo', groupLabel:'Combo M' },
  { id:'rya', hiragana:'りゃ', katakana:'リャ', romaji:'rya', group:'combo', groupLabel:'Combo R' },
  { id:'ryu', hiragana:'りゅ', katakana:'リュ', romaji:'ryu', group:'combo', groupLabel:'Combo R' },
  { id:'ryo', hiragana:'りょ', katakana:'リョ', romaji:'ryo', group:'combo', groupLabel:'Combo R' },
  { id:'gya', hiragana:'ぎゃ', katakana:'ギャ', romaji:'gya', group:'combo', groupLabel:'Combo G' },
  { id:'gyu', hiragana:'ぎゅ', katakana:'ギュ', romaji:'gyu', group:'combo', groupLabel:'Combo G' },
  { id:'gyo', hiragana:'ぎょ', katakana:'ギョ', romaji:'gyo', group:'combo', groupLabel:'Combo G' },
  { id:'ja',  hiragana:'じゃ', katakana:'ジャ', romaji:'ja',  group:'combo', groupLabel:'Combo J' },
  { id:'ju',  hiragana:'じゅ', katakana:'ジュ', romaji:'ju',  group:'combo', groupLabel:'Combo J' },
  { id:'jo',  hiragana:'じょ', katakana:'ジョ', romaji:'jo',  group:'combo', groupLabel:'Combo J' },
  { id:'bya', hiragana:'びゃ', katakana:'ビャ', romaji:'bya', group:'combo', groupLabel:'Combo B' },
  { id:'byu', hiragana:'びゅ', katakana:'ビュ', romaji:'byu', group:'combo', groupLabel:'Combo B' },
  { id:'byo', hiragana:'びょ', katakana:'ビョ', romaji:'byo', group:'combo', groupLabel:'Combo B' },
  { id:'pya', hiragana:'ぴゃ', katakana:'ピャ', romaji:'pya', group:'combo', groupLabel:'Combo P' },
  { id:'pyu', hiragana:'ぴゅ', katakana:'ピュ', romaji:'pyu', group:'combo', groupLabel:'Combo P' },
  { id:'pyo', hiragana:'ぴょ', katakana:'ピョ', romaji:'pyo', group:'combo', groupLabel:'Combo P' },
]

// SRS key prefix untuk kana (biar ga bentrok sama vocab)
export function kanaId(id: string, type: KanaType) {
  return `kana_${type}_${id}`
}
