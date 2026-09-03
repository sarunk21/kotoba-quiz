export const CHAPTER_IMAGES: Record<string, string> = {
  'Bab 1': '/stories/bab1/cover.png',
  'Bab 2': '/stories/bab2/cover.png',
  'Bab 3': '/stories/bab3/cover.png',
  'Bab 4': '/stories/bab4/cover.png',
  'Bab 5': '/stories/bab5/cover.png',
  'Bab 6': '/stories/bab6/cover.png',
  'Bab 7': '/stories/bab7/cover.png',
  'Bab 8': '/stories/bab8/cover.png',
  'Bab 9': '/stories/bab9/cover.png',
  'Bab 10': '/stories/bab10/cover.png',
}

export function getChapterImage(chapter: string): string | undefined {
  // OTA override via localStorage (Bab 11-25 future via Firebase)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('kotoba_chapter_images')
      if (raw) {
        const ota = JSON.parse(raw) as Record<string, string>
        if (ota[chapter]) return ota[chapter]
      }
    } catch {}
  }
  return CHAPTER_IMAGES[chapter]
}

export function getChapterImageWithFallback(chapter: string): string | null {
  const url = getChapterImage(chapter)
  if (url) return url
  return null
}
