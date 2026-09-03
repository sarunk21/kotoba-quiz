'use client'

// ── Single source of truth untuk URL Sheets default ──
// Diambil dari publish CSV Bab 1-25 (vocab-default). Jangan divergen antar page.
export const DEFAULT_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/1hLXaSIWZFBkqoGHFcqi3_g7YWoPl-xNvI8K2O2yY70s/export?format=csv'

// Throttle untuk silent sync Sheets (1 jam)
export const SHEETS_THROTTLE_MS = 1000 * 60 * 60

// Audio TTS
export const AUDIO_CACHE_NAME = 'kotoba-audio-cache'
export const MAX_AUDIO_TEXT_LENGTH = 200
export const AUDIO_CACHE_MAX_ENTRIES = 100

// Sync
export const SYNC_THROTTLE_MS = 30_000
export const CURRENT_VERSION = '0.1.2'
