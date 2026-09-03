export function generateVocabId(category: string, hiragana: string, kanji: string, arti: string): string {
  const rawId = `${category}|${hiragana}|${kanji}|${arti}`
  return Array.from(rawId).reduce((h, c) => (h = (h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36) +
         btoa(unescape(encodeURIComponent(rawId.substring(0, 10)))).substring(0, 8)
}
