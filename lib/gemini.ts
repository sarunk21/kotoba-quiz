/**
 * Thin browser-safe wrapper for Gemini API (REST, no SDK needed).
 * API key stored in localStorage key: kotoba_gemini_key
 */

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export function getGeminiApiKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('kotoba_gemini_key') || ''
}

export function saveGeminiApiKey(key: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('kotoba_gemini_key', key.trim())
}

interface GeminiRequest {
  systemInstruction: string
  userPrompt: string
}

async function callGemini(req: GeminiRequest): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Gemini API key belum diset. Isi di Pengaturan.')

  const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body = {
    system_instruction: {
      parts: [{ text: req.systemInstruction }],
    },
    contents: [
      {
        parts: [{ text: req.userPrompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as any)?.error?.message || `HTTP ${res.status}`
    throw new Error(`Gemini API error: ${msg}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

// ── Story Generation ──

const STORY_SYSTEM_INSTRUCTION = `Kamu adalah pembuat cerita pendek bahasa Jepang untuk pelajar bahasa Jepang.
Aturan:
- Buat cerita terdiri dari 3-4 kalimat pendek, level JLPT N5, natural dan nyambung sebagai satu alur cerita singkat.
- WAJIB memakai kata-kata yang diberikan sesering mungkin.
- Balas HANYA dalam format JSON object, tanpa teks tambahan.
- Format respons:
  {"judul": "...", "cerita_jepang": "...", "cerita_indo": "..."}
- Teks kalimat jepang tidak perlu furigana (hanya kanji dan hiragana standar).`

export interface GeneratedStory {
  judul: string
  cerita_jepang: string
  cerita_indo: string
}

export async function generateStoryForChapter(
  chapter: string,
  vocabList: { kanji: string; hiragana: string; arti: string }[]
): Promise<GeneratedStory> {
  const wordsText = vocabList
    .map(v => `${v.kanji || v.hiragana} (${v.arti})`)
    .join(', ')

  const userPrompt = `Buat cerita pendek untuk bab "${chapter}" menggunakan kosakata berikut:\n${wordsText}`

  const raw = await callGemini({ systemInstruction: STORY_SYSTEM_INSTRUCTION, userPrompt })
  const parsed = JSON.parse(raw)

  return {
    judul: parsed.judul || `Cerita ${chapter}`,
    cerita_jepang: parsed.cerita_jepang || '',
    cerita_indo: parsed.cerita_indo || '',
  }
}

// ── Sentence Example Generation ──

const SENTENCE_SYSTEM_INSTRUCTION = `Kamu adalah generator kalimat contoh untuk aplikasi belajar bahasa Jepang.
Aturan:
- Level bahasa: sesuai JLPT N5-N3, kalimat pendek dan natural.
- Setiap kalimat WAJIB memakai kata yang diberikan.
- Balas HANYA dalam format JSON array, tanpa teks tambahan.
- Format tiap item: {"id": "...", "kalimat_jepang": "...", "arti_indo": "..."}`

export async function generateSentenceBatch(
  batch: { id: string; kanji: string; arti: string }[]
): Promise<{ id: string; kalimat_jepang: string; arti_indo: string }[]> {
  const userPrompt = `Buatkan 1 kalimat contoh untuk setiap kata berikut:\n${JSON.stringify(batch)}`
  const raw = await callGemini({ systemInstruction: SENTENCE_SYSTEM_INSTRUCTION, userPrompt })
  return JSON.parse(raw)
}
