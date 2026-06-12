import { type VocabItem } from './vocab'

export interface ConjugationForm {
  kanji: string
  hiragana: string
}

export interface VerbConjugations {
  dictionary: ConjugationForm
  polite: ConjugationForm
  te: ConjugationForm
  ta: ConjugationForm
  nai: ConjugationForm
  group: 'Group 1 (Godan)' | 'Group 2 (Ichidan)' | 'Group 3 (Irregular)'
}

// Hiragana Row Maps
const E_ROW = new Set(['え', 'け', 'げ', 'せ', 'ぜ', 'て', 'で', 'ね', 'へ', 'べ', 'め', 'れ'])
const I_ROW = new Set(['い', 'き', 'ぎ', 'し', 'じ', 'ち', 'ぢ', 'に', 'ひ', 'び', 'み', 'り'])

const I_TO_U: Record<string, string> = {
  'い': 'う', 'き': 'く', 'ぎ': 'ぐ', 'し': 'す', 'ち': 'つ', 'に': 'ぬ', 'び': 'ぶ', 'み': 'む', 'り': 'る'
}

const I_TO_A: Record<string, string> = {
  'い': 'わ', 'き': 'か', 'ぎ': 'が', 'し': 'さ', 'ち': 'た', 'に': 'な', 'び': 'ば', 'み': 'ま', 'り': 'ら'
}

const U_TO_I: Record<string, string> = {
  'う': 'い', 'く': 'き', 'ぐ': 'ぎ', 'す': 'し', 'つ': 'ち', 'ぬ': 'に', 'ぶ': 'び', 'む': 'み', 'る': 'り'
}

const U_TO_A: Record<string, string> = {
  'う': 'わ', 'く': 'か', 'ぐ': 'が', 'す': 'さ', 'つ': 'た', 'ぬ': 'な', 'ぶ': 'ば', 'む': 'ま', 'る': 'ら'
}

// Group 2 (Ichidan) verbs that end in an i-row sound before 'ます'
const GROUP2_I_ROW_VERBS = new Set([
  'みます', '見ます',
  'おきます', '起きます', // wake up / get up
  'おりる', 'おります', '降りる', '降ります', // get down / off
  'かります', '借ります', // borrow
  'あびます', '浴びます', // bathe / shower
  'できます', '出来ます', // can do
  'おちます', '落ちます', // fall
  'しんじます', '信じます', // believe
  'とじます', '閉じます', // close
  'にます', '似ます', '煮ます', // resemble, boil
  'います', '居ます', // exist (animate)
  'かんじます', '感じます', // feel
  'いきる', '生きます', // live
  'しんじる', '信じる',
  'おきる', '起きる',
  'あびる', '浴びる',
  'おりる', '降りる',
  'おちる', '落ちる',
  'とじる', '閉じる',
  'にる', '似る', '煮る',
  'いる', '居る'
])

// Group 2 endings in Polite form
const GROUP2_I_ROW_POLITE_ENDINGS = [
  'みます', '見ます',
  'おきます', '起きます',
  'おりる', 'おります', '降りる', '降ります',
  'かります', '借ります',
  'あびます', '浴びます',
  'できます', '出来ます',
  'おちます', '落ちます',
  'しんじます', '信じます',
  'とじます', '閉じます',
  'にます', '似ます', '煮ます',
  'います', '居ます',
  'かんじます', '感じます',
  'いきる', '生きます'
]

// Group 1 (Godan) exceptions that end in 'いる' or 'える' in dictionary form
const GODAN_RU_EXCEPTIONS = new Set([
  'かえる', '帰る', // return
  'はいる', '入る', // enter
  'はしる', '走る', // run
  'しる', '知る', // know
  'きる', '切る', // cut
  'いる', '要る', // need
  'へる', '減る', // decrease
  'すべる', '滑る', // slide / slip
  'にぎる', '握る', // grasp
  'ちる', '散る', // scatter
  'まいる', '参る', // go/come (humble)
  'しゃべる', '喋る', // chat
  'しめる', '湿る' // be damp
])

/** Helper to strip a suffix from both kanji and hiragana if present */
function stripSuffix(text: string, suffixH: string, suffixK: string): string {
  if (text.endsWith(suffixK)) {
    return text.slice(0, -suffixK.length)
  }
  if (text.endsWith(suffixH)) {
    return text.slice(0, -suffixH.length)
  }
  return text
}

export function conjugateVerb(vocab: VocabItem): VerbConjugations | null {
  // Verify it's a verb
  const catLower = (vocab.category || '').toLowerCase()
  const isVerb = catLower.includes('kerja') || catLower === 'verb'
  if (!isVerb) return null

  const h = vocab.hiragana.trim()
  const k = (vocab.kanji || vocab.hiragana).trim()

  // 1. Check Group 3: 来る (kuru / to come)
  const isKuru = 
    h === 'くる' || h === 'きます' || k === '来る' || k === '来ます' ||
    h.endsWith('てくる') || h.endsWith('でくる') ||
    h.endsWith('てきます') || h.endsWith('できます') ||
    k.endsWith('て来る') || k.endsWith('で来る') ||
    k.endsWith('て来ます') || k.endsWith('で来ます')

  if (isKuru) {
    let stemH = ''
    let stemK = ''
    if (h.endsWith('きます') || h.endsWith('くる')) {
      const suffixH = h.endsWith('きます') ? 'きます' : 'くる'
      const suffixK = k.endsWith('来ます') ? '来ます' : (k.endsWith('きます') ? 'きます' : (k.endsWith('来る') ? '来る' : 'くる'))
      stemH = stripSuffix(h, suffixH, suffixK)
      stemK = stripSuffix(k, suffixH, suffixK)
    } else {
      // Fallback
      stemH = h.replace(/きます$|くる$/, '')
      stemK = k.replace(/来ます$|きます$|来る$|くる$/, '')
    }

    return {
      dictionary: { kanji: stemK + '来る', hiragana: stemH + 'くる' },
      polite: { kanji: stemK + '来ます', hiragana: stemH + 'きます' },
      te: { kanji: stemK + '来て', hiragana: stemH + 'きて' },
      ta: { kanji: stemK + '来た', hiragana: stemH + 'きた' },
      nai: { kanji: stemK + '来ない', hiragana: stemH + 'こない' },
      group: 'Group 3 (Irregular)'
    }
  }

  // 2. Check Group 3: する (suru / to do) & compounds
  const isSuru = h.endsWith('する') || h.endsWith('します')
  if (isSuru) {
    const isMasu = h.endsWith('します')
    const suffixH = isMasu ? 'します' : 'する'
    const suffixK = isMasu ? 'します' : 'する'
    const stemH = stripSuffix(h, suffixH, suffixK)
    const stemK = stripSuffix(k, suffixH, suffixK)

    return {
      dictionary: { kanji: stemK + 'する', hiragana: stemH + 'する' },
      polite: { kanji: stemK + 'します', hiragana: stemH + 'します' },
      te: { kanji: stemK + 'して', hiragana: stemH + 'して' },
      ta: { kanji: stemK + 'した', hiragana: stemH + 'した' },
      nai: { kanji: stemK + 'しない', hiragana: stemH + 'しない' },
      group: 'Group 3 (Irregular)'
    }
  }

  // 3. Regular Verbs
  const isMasu = h.endsWith('ます')

  if (isMasu) {
    // Conjugating from polite masu-form
    const stemH = h.slice(0, -2)
    const stemK = k.slice(0, -2)
    const lastCharH = stemH.slice(-1)

    // Check Group 2 (Ichidan) by e-row or exception list
    const isGroup2 = E_ROW.has(lastCharH) || 
                     GROUP2_I_ROW_VERBS.has(h) || 
                     GROUP2_I_ROW_VERBS.has(k) ||
                     GROUP2_I_ROW_POLITE_ENDINGS.some(ending => h.endsWith(ending) || k.endsWith(ending))

    if (isGroup2) {
      return {
        dictionary: { kanji: stemK + 'る', hiragana: stemH + 'る' },
        polite: { kanji: k, hiragana: h },
        te: { kanji: stemK + 'て', hiragana: stemH + 'て' },
        ta: { kanji: stemK + 'た', hiragana: stemH + 'た' },
        nai: { kanji: stemK + 'ない', hiragana: stemH + 'ない' },
        group: 'Group 2 (Ichidan)'
      }
    } else {
      // Group 1 (Godan)
      const uCharH = I_TO_U[lastCharH] || 'う'
      const aCharH = I_TO_A[lastCharH] || 'わ'

      // Base elements
      const baseH = stemH.slice(0, -1)
      const baseK = stemK.slice(0, -1)

      // Handle 'ある' / 'あります' exception for Negative Form
      const isAru = h === 'あります' || k === 'あります' || h === 'ある' || k === 'ある'
      const naiForm = isAru 
        ? { kanji: 'ない', hiragana: 'ない' }
        : { kanji: baseK + aCharH + 'ない', hiragana: baseH + aCharH + 'ない' }

      // Te and Ta Form logic based on ending syllable
      let teEnding = ''
      let taEnding = ''

      if (['い', 'ち', 'り'].includes(lastCharH)) {
        teEnding = 'って'
        taEnding = 'った'
      } else if (['み', 'び', 'に'].includes(lastCharH)) {
        teEnding = 'んで'
        taEnding = 'んだ'
      } else if (lastCharH === 'き') {
        // Exception: 行く (iku / to go) -> 行って / 行った
        const isIku = h === 'いきます' || k === '行きます' || h === 'いく' || k === '行く'
        if (isIku) {
          teEnding = 'って'
          taEnding = 'った'
        } else {
          teEnding = 'いて'
          taEnding = 'いた'
        }
      } else if (lastCharH === 'ぎ') {
        teEnding = 'いで'
        taEnding = 'いだ'
      } else if (lastCharH === 'し') {
        teEnding = 'して'
        taEnding = 'した'
      } else {
        teEnding = 'て'
        taEnding = 'た'
      }

      return {
        dictionary: { kanji: baseK + uCharH, hiragana: baseH + uCharH },
        polite: { kanji: k, hiragana: h },
        te: { kanji: baseK + teEnding, hiragana: baseH + teEnding },
        ta: { kanji: baseK + taEnding, hiragana: baseH + taEnding },
        nai: naiForm,
        group: 'Group 1 (Godan)'
      }
    }
  } else {
    // Conjugating from dictionary form
    const lastCharH = h.slice(-1)

    if (lastCharH !== 'る') {
      // Must be Group 1 (Godan)
      const iCharH = U_TO_I[lastCharH] || 'い'
      const aCharH = U_TO_A[lastCharH] || 'わ'

      const baseH = h.slice(0, -1)
      const baseK = k.slice(0, -1)

      let teEnding = ''
      let taEnding = ''

      if (['う', 'つ'].includes(lastCharH)) {
        teEnding = 'って'
        taEnding = 'った'
      } else if (['む', 'ぶ', 'ぬ'].includes(lastCharH)) {
        teEnding = 'んで'
        taEnding = 'んだ'
      } else if (lastCharH === 'く') {
        const isIku = h === 'いく' || k === '行く'
        if (isIku) {
          teEnding = 'って'
          taEnding = 'った'
        } else {
          teEnding = 'いて'
          taEnding = 'いた'
        }
      } else if (lastCharH === 'ぐ') {
        teEnding = 'いで'
        taEnding = 'いだ'
      } else if (lastCharH === 'す') {
        teEnding = 'して'
        taEnding = 'した'
      } else {
        teEnding = 'て'
        taEnding = 'た'
      }

      return {
        dictionary: { kanji: k, hiragana: h },
        polite: { kanji: baseK + iCharH + 'ます', hiragana: baseH + iCharH + 'ます' },
        te: { kanji: baseK + teEnding, hiragana: baseH + teEnding },
        ta: { kanji: baseK + taEnding, hiragana: baseH + taEnding },
        nai: { kanji: baseK + aCharH + 'ない', hiragana: baseH + aCharH + 'ない' },
        group: 'Group 1 (Godan)'
      }
    } else {
      // Ends in 'る'
      const charBeforeRu = h.slice(-2, -1)
      const isGroup1 = !I_ROW.has(charBeforeRu) && !E_ROW.has(charBeforeRu) || 
                       GODAN_RU_EXCEPTIONS.has(h) || 
                       GODAN_RU_EXCEPTIONS.has(k)

      const baseH = h.slice(0, -1)
      const baseK = k.slice(0, -1)

      if (isGroup1) {
        // Group 1 ending in 'る'
        const isAru = h === 'ある' || k === 'ある'
        const naiForm = isAru 
          ? { kanji: 'ない', hiragana: 'ない' }
          : { kanji: baseK + 'らない', hiragana: baseH + 'らない' }

        return {
          dictionary: { kanji: k, hiragana: h },
          polite: { kanji: baseK + 'ります', hiragana: baseH + 'ります' },
          te: { kanji: baseK + 'って', hiragana: baseH + 'って' },
          ta: { kanji: baseK + 'った', hiragana: baseH + 'った' },
          nai: naiForm,
          group: 'Group 1 (Godan)'
        }
      } else {
        // Group 2 (Ichidan)
        return {
          dictionary: { kanji: k, hiragana: h },
          polite: { kanji: baseK + 'ます', hiragana: baseH + 'ます' },
          te: { kanji: baseK + 'て', hiragana: baseH + 'て' },
          ta: { kanji: baseK + 'た', hiragana: baseH + 'た' },
          nai: { kanji: baseK + 'ない', hiragana: baseH + 'ない' },
          group: 'Group 2 (Ichidan)'
        }
      }
    }
  }
}
