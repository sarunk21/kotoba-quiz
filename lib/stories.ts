import Papa from 'papaparse'

export interface ChapterStory {
  chapter: string
  title: string
  storyJapanese: string
  storyIndonesian: string
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
