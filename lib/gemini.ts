/**
 * Browser-safe AI wrapper using Groq API (OpenAI-compatible REST).
 * Free tier: https://console.groq.com — no credit card needed.
 * API key stored in localStorage key: kotoba_groq_key
 */

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export function getGroqApiKey(): string {
  if (typeof window === 'undefined') return ''
  // Support old key name for backward compat
  return localStorage.getItem('kotoba_groq_key') ||
         localStorage.getItem('kotoba_gemini_key') || ''
}

export function saveGroqApiKey(key: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('kotoba_groq_key', key.trim())
  // Clear old key if migrating
  localStorage.removeItem('kotoba_gemini_key')
}

// ── Keep old names as aliases so existing callers don't break ──
export const getGeminiApiKey = getGroqApiKey
export const saveGeminiApiKey = saveGroqApiKey

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

async function callGroq(messages: ChatMessage[], retries = 3): Promise<string> {
  const apiKey = getGroqApiKey()
  if (!apiKey) throw new Error('Groq API key belum diset. Isi di Pengaturan.')

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg: string = (err as any)?.error?.message || `HTTP ${res.status}`

    // Rate limit — Groq returns 429 with retry_after header
    if (res.status === 429 && retries > 0) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '10', 10)
      const waitMs = (retryAfter + 2) * 1000
      console.warn(`[Groq] Rate limited. Retrying in ${retryAfter + 2}s... (${retries} retries left)`)
      await new Promise(r => setTimeout(r, waitMs))
      return callGroq(messages, retries - 1)
    }

    throw new Error(`Groq API error: ${msg}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned empty response')
  return text
}

// ── Story Generation ──

const STORY_SYSTEM_INSTRUCTION = `Kamu adalah pembuat cerita pendek bahasa Jepang untuk pelajar bahasa Jepang.
Aturan:
- Buat cerita terdiri dari 3-4 kalimat pendek, level JLPT N5, natural dan nyambung sebagai satu alur cerita singkat.
- WAJIB memakai kata-kata yang diberikan sesering mungkin.
- Balas HANYA dalam format JSON object, tanpa teks tambahan.
- Format respons: {"judul": "...", "cerita_jepang": "...", "cerita_indo": "..."}
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

  const raw = await callGroq([
    { role: 'system', content: STORY_SYSTEM_INSTRUCTION },
    { role: 'user', content: `Buat cerita pendek untuk bab "${chapter}" menggunakan kosakata berikut:\n${wordsText}` },
  ])

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
- Balas HANYA dalam format JSON object dengan key "items" berisi array, tanpa teks tambahan.
- Format: {"items": [{"id": "...", "kalimat_jepang": "...", "arti_indo": "..."}]}`

export async function generateSentenceBatch(
  batch: { id: string; kanji: string; arti: string }[]
): Promise<{ id: string; kalimat_jepang: string; arti_indo: string }[]> {
  const raw = await callGroq([
    { role: 'system', content: SENTENCE_SYSTEM_INSTRUCTION },
    { role: 'user', content: `Buatkan 1 kalimat contoh untuk setiap kata berikut:\n${JSON.stringify(batch)}` },
  ])
  const parsed = JSON.parse(raw)
  return parsed.items || parsed
}
