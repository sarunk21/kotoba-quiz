import Papa from 'papaparse'

export interface SentenceChunk {
  text: string
  reading: string
  romaji: string
}

export interface StoryScene {
  chapter: string
  sceneOrder: number
  imageUrl: string
  sentenceJapanese: string
  sentenceIndonesian: string
  vocabHighlight?: string[]
  chunks?: SentenceChunk[]
}

export interface ChapterStory {
  chapter: string
  title: string
  storyJapanese: string
  storyIndonesian: string
  scenes?: StoryScene[]   // visual novel mode — optional, backward compat
}

/**
 * Parse CSV from StoriesV2 tab (per-scene, 1 row = 1 scene).
 * Columns: Bab, JudulCerita, UrutanScene, KalimatJepang, KalimatIndonesia, ImageUrl, Chunks
 * Groups rows into ChapterStory[] with scenes[] populated.
 */
export function parseCSVToScenes(csvText: string): ChapterStory[] {
  const parsed = Papa.parse(csvText, {
    header: true, // Use header: true to handle named columns more robustly
    skipEmptyLines: true,
  })

  const data = parsed.data as any[]

  // Accumulate scenes per chapter
  const chapterMap = new Map<string, ChapterStory>()

  for (const row of data) {
    const chapter = (row.Bab || row.bab)?.trim() || ''
    const title = (row.JudulCerita || row.judul)?.trim() || ''
    const sceneOrder = parseInt((row.UrutanScene || row.urutan)?.trim() || '0', 10)
    const sentenceJapanese = (row.KalimatJepang || row.kalimatJepang)?.trim() || ''
    const sentenceIndonesian = (row.KalimatIndonesia || row.kalimatIndonesia)?.trim() || ''
    const imageUrl = (row.ImageUrl || row.imageUrl)?.trim() || ''

    if (!chapter || !sentenceJapanese) continue

    // Parse chunks if they exist (usually from Google Sheets as JSON string)
    let chunksData: SentenceChunk[] | undefined
    const rawChunks = row.Chunks || row.chunks
    if (rawChunks) {
      try {
        chunksData = JSON.parse(rawChunks)
      } catch { /* ignore invalid JSON */ }
    }

    if (!chapterMap.has(chapter)) {
      chapterMap.set(chapter, {
        chapter,
        title,
        storyJapanese: '',
        storyIndonesian: '',
        scenes: [],
      })
    }

    const story = chapterMap.get(chapter)!
    story.scenes!.push({ chapter, sceneOrder, imageUrl, sentenceJapanese, sentenceIndonesian, chunks: chunksData })

    // Also build flat fields for backward compat (used by existing static story page)
    story.storyJapanese += sentenceJapanese
    story.storyIndonesian += (story.storyIndonesian ? ' ' : '') + sentenceIndonesian
  }

  // Sort scenes within each chapter
  const result = Array.from(chapterMap.values())
  for (const story of result) {
    story.scenes!.sort((a, b) => a.sceneOrder - b.sceneOrder)
  }

  return result
}


/**
 * Parse CSV format of the Stories tab.
 * Columns: Bab, Judul, CeritaJepang, CeritaIndonesia
 */
export function parseCSVToStories(csvText: string): ChapterStory[] {
  // ponytail: parsing Stories CSV structure simply using PapaParse
  const parsed = Papa.parse(csvText, {
    header: false,
    skipEmptyLines: true,
  })

  const stories: ChapterStory[] = []
  const data = parsed.data as string[][]

  // Skip header if it exists
  let startIdx = 0
  if (data[0] && (
    data[0][0]?.toLowerCase().includes('bab') || 
    data[0][1]?.toLowerCase().includes('judul') ||
    data[0][2]?.toLowerCase().includes('cerita')
  )) {
    startIdx = 1
  }

  for (let i = startIdx; i < data.length; i++) {
    const cols = data[i]
    if (!cols || cols.length < 3) continue

    const chapter = cols[0]?.trim() || ''
    const title = cols[1]?.trim() || ''
    const storyJapanese = cols[2]?.trim() || ''
    const storyIndonesian = cols[3]?.trim() || ''

    if (chapter && storyJapanese) {
      stories.push({
        chapter,
        title,
        storyJapanese,
        storyIndonesian,
      })
    }
  }

  return stories
}

/**
 * Fetch the Stories tab from Google Sheets dynamically.
 * Standard Web-Published Google Sheets CSV links contain 'pub?gid=...'.
 * 1. If it's a web-published spreadsheet (/d/e/), it scrapes pubhtml to resolve the gid for the tab named "Stories".
 * 2. If it's a standard spreadsheet sharing link (/d/), it queries via Visualization API sheet=Stories.
 */
export async function fetchStories(sheetsUrl: string): Promise<ChapterStory[]> {
  if (!sheetsUrl) return []

  // Extract Spreadsheet ID
  const docMatch = sheetsUrl.match(/\/d\/([A-Za-z0-9_-]+)/)
  if (!docMatch) return []

  const docId = docMatch[1]
  const isWebPub = sheetsUrl.includes('/d/e/')
  const t = Date.now()

  let csvText = ''

  if (isWebPub) {
    // published web page HTML to parse tabs
    const pubhtmlUrl = `https://docs.google.com/spreadsheets/d/e/${docId}/pubhtml`
    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(pubhtmlUrl)}&t=${t}`)
      if (res.ok) {
        const html = await res.text()
        // search for "Stories" tab gid in the inline JS configs
        const match = html.match(/name:\s*"Stories"\s*,\s*pageUrl:.*?gid:\s*"(\d+)"/i)
        if (match && match[1]) {
          const gid = match[1]
          const storiesCsvUrl = `https://docs.google.com/spreadsheets/d/e/${docId}/pub?gid=${gid}&single=true&output=csv`
          const csvRes = await fetch(`/api/sheets?url=${encodeURIComponent(storiesCsvUrl)}&t=${t}`)
          if (csvRes.ok) {
            csvText = await csvRes.text()
          }
        } else {
          console.warn('[Stories Sync] Tab named "Stories" not found in pubhtml.')
        }
      }
    } catch (e) {
      console.error('[Stories Sync] Error fetching web published stories:', e)
    }
  } else {
    // visualization api for sharing spreadsheet link
    const storiesCsvUrl = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=Stories`
    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(storiesCsvUrl)}&t=${t}`)
      if (res.ok) {
        csvText = await res.text()
      }
    } catch (e) {
      console.error('[Stories Sync] Error fetching visualization stories:', e)
    }
  }

  if (csvText) {
    return parseCSVToStories(csvText)
  }

  return []
}

/**
 * Fetch StoriesV2 tab (per-scene format) from Google Sheets.
 * Same URL patterns as fetchStories but targets tab named "StoriesV2".
 */
export async function fetchScenesStories(sheetsUrl: string): Promise<ChapterStory[]> {
  if (!sheetsUrl) return []

  const docMatch = sheetsUrl.match(/\/d\/([A-Za-z0-9_-]+)/)
  if (!docMatch) return []

  const docId = docMatch[1]
  const isWebPub = sheetsUrl.includes('/d/e/')
  const t = Date.now()
  let csvText = ''

  if (isWebPub) {
    const pubhtmlUrl = `https://docs.google.com/spreadsheets/d/e/${docId}/pubhtml`
    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(pubhtmlUrl)}&t=${t}`)
      if (res.ok) {
        const html = await res.text()
        const match = html.match(/name:\s*"StoriesV2"\s*,\s*pageUrl:.*?gid:\s*"(\d+)"/i)
        if (match && match[1]) {
          const gid = match[1]
          const csvUrl = `https://docs.google.com/spreadsheets/d/e/${docId}/pub?gid=${gid}&single=true&output=csv`
          const csvRes = await fetch(`/api/sheets?url=${encodeURIComponent(csvUrl)}&t=${t}`)
          if (csvRes.ok) csvText = await csvRes.text()
        } else {
          console.warn('[StoriesV2 Sync] Tab "StoriesV2" not found — visual novel mode inactive.')
        }
      }
    } catch (e) {
      console.error('[StoriesV2 Sync] Error:', e)
    }
  } else {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&sheet=StoriesV2`
    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(csvUrl)}&t=${t}`)
      if (res.ok) csvText = await res.text()
    } catch (e) {
      console.error('[StoriesV2 Sync] Error:', e)
    }
  }

  if (csvText) {
    return parseCSVToScenes(csvText)
  }

  return []
}

/**
 * Merge flat ChapterStory[] (from Stories tab) with per-scene ChapterStory[] (from StoriesV2 tab).
 * StoriesV2 data takes precedence: if a chapter has scenes, scenes field is populated.
 * Chapters only in Stories (no scenes) are preserved as-is.
 */
export function mergeStoriesWithScenes(
  flat: ChapterStory[],
  withScenes: ChapterStory[]
): ChapterStory[] {
  const sceneMap = new Map(withScenes.map(s => [s.chapter, s]))

  return flat.map(story => {
    const sceneStory = sceneMap.get(story.chapter)
    if (sceneStory && sceneStory.scenes && sceneStory.scenes.length > 0) {
      return { ...story, scenes: sceneStory.scenes }
    }
    return story
  })
}

