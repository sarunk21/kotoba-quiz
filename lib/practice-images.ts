import practiceImages from '@/public/data/practice-images.json'

type PracticeImageEntry = {
  slotKey: string
  halaman: string
  gambar: string
  babList: string
  count: number
  sampleTitle: string
  imagePrompt: string
  imageUrl: string
}

const slotMap = new Map<string, PracticeImageEntry>()
for (const e of practiceImages as PracticeImageEntry[]) {
  slotMap.set(e.slotKey, e)
}

// Map question id -> imageUrl via slotKey derived from description/title
export function getPracticeImageUrl(question: { id: string; title: string; description?: string; bab: string }): string | undefined {
  const combined = (question.title || '') + ' ' + (question.description || '')
  let halaman: string | null = null
  let gambar: string | null = null
  const mH = combined.match(/Halaman\s*(\d+)/i)
  const mG = combined.match(/Gambar\s*(\d+)/i)
  if (mH) halaman = mH[1]
  if (mG) gambar = mG[1]
  let slotKey: string | null = null
  if (halaman || gambar) {
    slotKey = 'h' + (halaman || '0') + '-g' + (gambar || '0')
  } else if (question.title.includes('Gambar')) {
    const mG2 = question.title.match(/Gambar\s*(\d+)/i)
    const g2 = mG2 ? mG2[1] : '1'
    slotKey = 'bab' + question.bab.replace('Bab ', '') + '-g' + g2
    // fallback to h0-g for Bab1
    if (question.bab === 'Bab 1' && !slotMap.has(slotKey)) {
      slotKey = 'h0-g' + g2
    }
  }
  if (slotKey && slotMap.has(slotKey)) {
    return slotMap.get(slotKey)!.imageUrl
  }
  return undefined
}
