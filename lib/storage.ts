'use client'

// Centralized localStorage access untuk semua key kotoba_*
// AGENTS.md #5: akses HANYA via lib/* — jangan localStorage.getItem('kotoba_*') di komponen.

const isBrowser = () => typeof window !== 'undefined'

// ── Generic helpers ──
function getItem(key: string): string | null {
  if (!isBrowser()) return null
  try { return localStorage.getItem(key) } catch { return null }
}
function setItem(key: string, value: string) {
  if (!isBrowser()) return
  try { localStorage.setItem(key, value) } catch (e) { console.error('[storage] setItem', key, e) }
}
function removeItem(key: string) {
  if (!isBrowser()) return
  try { localStorage.removeItem(key) } catch {}
}

// ── Sheets URL ──
const SHEETS_URL_KEY = 'kotoba_sheets_url'
export function getSheetsUrl(fallback: string): string {
  return getItem(SHEETS_URL_KEY) || fallback
}
export function setSheetsUrl(url: string) { setItem(SHEETS_URL_KEY, url) }

// Sheets sync timestamp (throttle)
const SHEETS_TS_KEY = 'kotoba_sheets_sync_timestamp'
export function getSheetsSyncTimestamp(): number | null {
  const v = getItem(SHEETS_TS_KEY)
  return v ? parseInt(v, 10) : null
}
export function setSheetsSyncTimestamp(ts: number) { setItem(SHEETS_TS_KEY, String(ts)) }

// ── Show Furigana ──
const FURI_KEY = 'kotoba_show_furigana'
export function getShowFurigana(): boolean {
  const v = getItem(FURI_KEY)
  return v === null ? true : v !== 'false'
}
export function setShowFurigana(v: boolean) { setItem(FURI_KEY, String(v)) }

// ── Theme ──
const THEME_KEY = 'kotoba_theme'
export function getTheme(): string | null { return getItem(THEME_KEY) }
export function setTheme(v: 'light' | 'dark' | 'system') { setItem(THEME_KEY, v) }

// ── Last user (account isolation) ──
const LAST_USER_KEY = 'kotoba_last_user'
export function getLastUser(): string | null { return getItem(LAST_USER_KEY) }
export function setLastUser(email: string) { setItem(LAST_USER_KEY, email) }
export function clearLastUser() { removeItem(LAST_USER_KEY) }

// ── Reminder ──
const REMINDER_ENABLED = 'kotoba_reminder_enabled'
const REMINDER_TIME = 'kotoba_reminder_time'
export function getReminderEnabled(): boolean { return getItem(REMINDER_ENABLED) !== 'false' }
export function setReminderEnabled(v: boolean) { setItem(REMINDER_ENABLED, String(v)) }
export function getReminderTime(): string { return getItem(REMINDER_TIME) || '20:00' }
export function setReminderTime(v: string) { setItem(REMINDER_TIME, v) }

// ── Stories cache ──
const STORIES_KEY = 'kotoba_stories'
export function getStoriesRaw(): string | null { return getItem(STORIES_KEY) }
export function setStoriesRaw(json: string) { setItem(STORIES_KEY, json) }

// ── Vocab updatedAt ──
const VOCAB_UPDATED_KEY = 'kotoba_vocab_updated_at'
export function getVocabUpdatedAt(): string | null { return getItem(VOCAB_UPDATED_KEY) }
export function setVocabUpdatedAt(iso: string) { setItem(VOCAB_UPDATED_KEY, iso) }

// ── Sync mode & lives (re-export safe wrappers) ──
const SYNC_MODE_KEY = 'kotoba_sync_mode'
export function getSyncMode(): 'auto' | 'manual' { return (getItem(SYNC_MODE_KEY) as 'auto' | 'manual') || 'auto' }
export function setSyncMode(v: 'auto' | 'manual') { setItem(SYNC_MODE_KEY, v) }
export function isAutoSync(): boolean { return getItem(SYNC_MODE_KEY) !== 'manual' }

const LIVES_KEY = 'kotoba_lives_enabled'
export function getLivesEnabledRaw(): boolean { return getItem(LIVES_KEY) !== 'false' }

// ── Study history & failed words (helpers) ──
const HISTORY_KEY = 'kotoba_study_history'
export function getHistoryRaw(): string | null { return getItem(HISTORY_KEY) }
export function setHistoryRaw(json: string) { setItem(HISTORY_KEY, json) }

const FAILED_KEY = 'kotoba_failed_words'
export function getFailedRaw(): string | null { return getItem(FAILED_KEY) }
export function setFailedRaw(json: string) { setItem(FAILED_KEY, json) }

// ── Groq key (legacy support) ──
const GROQ_KEY = 'kotoba_groq_key'
const GEMINI_KEY = 'kotoba_gemini_key'
export function getStoredGroqKey(): string | null { return getItem(GROQ_KEY) || getItem(GEMINI_KEY) }

// ── Bulk clear for account isolation / logout ──
const KOTOBA_PREFIX = 'kotoba_'
export function clearAllKotobaStorage() {
  if (!isBrowser()) return
  try {
    // Hapus semua key kotoba_* kecuali theme & sheets_url yang bisa dipertahankan? 
    // Untuk isolasi akun, hapus data user saja, pertahankan sheets_url & theme.
    const keep = new Set([THEME_KEY, SHEETS_URL_KEY])
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(KOTOBA_PREFIX) && !keep.has(k)) toRemove.push(k)
    }
    toRemove.forEach(k => localStorage.removeItem(k))
  } catch {}
}

export function clearAccountData() {
  if (!isBrowser()) return
  ;['kotoba_srs','kotoba_stats','kotoba_vocab','kotoba_vocab_updated_at','kotoba_study_history','kotoba_failed_words','kotoba_stories','kotoba_last_user','kotoba_sheets_sync_timestamp'].forEach(removeItem)
}
