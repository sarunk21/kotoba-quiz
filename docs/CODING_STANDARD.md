# Standar Koding — Kotoba Quiz (言葉カード)

> **Sumber kebenaran turunan:** `AGENTS.md` + `DESIGN_SYSTEM.md` + `GEMINI.md` + `PRD.md`  
> **Stack:** Next.js 16.2.6 (App Router) + React 19.2.4 + Tailwind v4 + Capacitor 8 + Firebase/Firestore + NextAuth v5 + PapaParse  
> **Bahasa dokumen:** Indonesia (UI copy wajib Indonesia, istilah Jepang tetap kanji/kana)

---

## Daftar Isi
1. [Prinsip Utama](#1-prinsip-utama)
2. [Tech Stack & Versi](#2-tech-stack--versi)
3. [Struktur Folder & Konvensi File](#3-struktur-folder--konvensi-file)
4. [Next.js 16 — Aturan Khusus](#4-nextjs-16--aturan-khusus)
5. [Standar Quiz Engine (Wajib)](#5-standar-quiz-engine-wajib)
6. [SRS & ID Prefix Convention](#6-srs--id-prefix-convention)
7. [Skema localStorage — Jangan Diubah](#7-skema-localstorage--jangan-diubah)
8. [TypeScript & Penamaan](#8-typescript--penamaan)
9. [State, Hooks & Side Effects](#9-state-hooks--side-effects)
10. [API Routes & Data Fetching](#10-api-routes--data-fetching)
11. [Styling — Token Wajib](#11-styling--token-wajib)
12. [Aksesibilitas & UX](#12-aksesibilitas--ux)
13. [Error Handling & Logging](#13-error-handling--logging)
14. [Performa & Optimasi](#14-performa--optimasi)
15. [Git, Commit & Branch](#15-git-commit--branch)
16. [Testing, Lint & Build](#16-testing-lint--build)
17. [Capacitor & Native](#17-capacitor--native)
18. [Common Pitfalls (Jangan Diulangi)](#18-common-pitfalls-jangan-diulangi)
19. [Template & Contoh Lengkap](#19-template--contoh-lengkap)
20. [Checklist Sebelum Commit / PR](#20-checklist-sebelum-commit--pr)

---

## 1. Prinsip Utama

| Prinsip | Penjelasan |
|---|---|
| **Offline-first** | `localStorage` adalah sumber kebenaran. Firestore hanya mirror via sync. Semua fitur harus jalan tanpa internet. |
| **Single Quiz Engine** | Semua kuis pakai `useQuizEngine` di `lib/quiz-engine.ts:21`. Dilarang bikin state machine sendiri. |
| **Token, bukan hex** | Semua warna via `var(--color-*)` di `app/globals.css:5`. Hardcode hex = pelanggaran. |
| **Skema stabil** | Key `kotoba_*` di `localStorage` tidak diubah demi kompatibilitas data user lama. |
| **Indonesia-first** | Copy UI Bahasa Indonesia. Feedback: `Bener!`, `Benar! 正解！`, `Salah!`, `Kurang Tepat`. |
| **Mobile-first** | Desain untuk 375px dulu, baru scale ke tablet. Touch target ≥44px. |

> **Rujukan:** `AGENTS.md:5`, `PRD.md:16`, `GEMINI.md:1`

---

## 2. Tech Stack & Versi

| Layer | Teknologi | Versi | Catatan |
|---|---|---|---|
| Framework | Next.js (App Router) | `16.2.6` | Turbopack `next.config.ts:4`, baca `node_modules/next/dist/docs/` sebelum API baru |
| UI | React | `19.2.4` | `react-jsx` di `tsconfig.json:13` |
| Styling | Tailwind CSS | `^4` | `@import "tailwindcss"` + `@theme` di `app/globals.css:3-5` |
| Mobile | Capacitor | `^8.4.0` | `capacitor.config.ts:28`, `appId com.kotobaquiz.app` |
| Auth | NextAuth | `5.0.0-beta.31` | `auth.ts:77`, provider Google + `google-native` |
| DB | Firebase Admin | `13.10.0` | `lib/firebase-admin.ts:30`, env `FIREBASE_*` |
| CSV | PapaParse | `5.5.3` | `lib/vocab.ts:1` |
| OTA | Groq API | `llama-3.3-70b-versatile` | `lib/gemini.ts:4` client-side, key `kotoba_groq_key` |
| Icons | Inline SVG | — | `components/ui/icons.tsx`, stroke 1.8–2.2px |

**Path alias:** `@/*` → `./*` (`tsconfig.json:24`). Selalu `import { useQuizEngine } from '@/lib/quiz-engine'` bukan relative `../../../lib`.

---

## 3. Struktur Folder & Konvensi File

```
kotoba-quiz/
├── app/
│   ├── layout.tsx              # Root layout, SW register, theme script
│   ├── globals.css             # Design tokens (SINGLE SOURCE OF TRUTH)
│   ├── page.tsx                # Beranda (pull-to-refresh, heatmap, WOTD)
│   ├── api/{sync,sheets,audio,import-form,auth}/route.ts
│   ├── kana/{page.tsx, quiz/page.tsx}
│   ├── particles/{page.tsx, guide/page.tsx}
│   ├── sentences/page.tsx
│   ├── story/[chapter]/page.tsx
│   ├── quiz/{page.tsx, chapters/page.tsx, jlpt/page.tsx, kanji/page.tsx, special/page.tsx, custom/page.tsx}
│   ├── progress/page.tsx
│   ├── vocab/page.tsx
│   └── settings/page.tsx
├── components/
│   ├── ui/icons.tsx            # 19 ikon SVG named export
│   ├── quiz/{QuizHeader,FeedbackSheet,ResultScreen,ExitConfirmModal}.tsx
│   ├── BottomNav.tsx
│   ├── StreakWidget.tsx
│   └── AppInitializer.tsx
├── lib/
│   ├── quiz-engine.ts          # useQuizEngine (jantung kuis)
│   ├── session.ts              # finishSession — persistensi terpusat
│   ├── srs.ts                  # SRS Level 0-6, buildQueue, LEVEL_WEIGHTS
│   ├── stats.ts                # GameStats, streak, heatmap
│   ├── cloud.ts                # syncToCloud / pullFromCloud (pull-merge-push)
│   ├── vocab.ts                # VocabItem, parseCSVToVocab, furigana
│   ├── kana.ts                 # KANA[131], confusable groups
│   ├── particles-data.ts       # PARTICLE_QUESTIONS ~100
│   ├── sentences-data.ts       # SentenceQuestion 15 blocks
│   └── sounds.ts / notifications.ts / dateUtils.ts / ...
├── types/next-auth.d.ts
├── public/{data,icons,screenshots,sw.js,manifest.json}
├── docs/{CODING_STANDARD,UI_THEME,DATA_FLOW,ARCHITECTURE}.md
└── DESIGN_SYSTEM.md / AGENTS.md / PRD.md / GEMINI.md
```

### Aturan Penamaan File

| Jenis | Konvensi | Contoh | Lokasi |
|---|---|---|---|
| Komponen shared | `PascalCase.tsx` | `BottomNav.tsx` | `components/` |
| Komponen quiz | `PascalCase.tsx` | `QuizHeader.tsx` | `components/quiz/` |
| Hook / logic | `camelCase.ts` | `quiz-engine.ts` | `lib/` |
| Ikon | `icons.tsx` (named export) | `export function IconHome()` | `components/ui/icons.tsx` |
| Halaman | `page.tsx` (default export) | `export default function QuizPage()` | `app/{route}/page.tsx` |
| API | `route.ts` | `export async function GET()` | `app/api/*/route.ts` |
| Tipe | `*.d.ts` | `next-auth.d.ts` | `types/` |

**Larangan:**
- ❌ `kebab-case` untuk komponen (`quiz-header.tsx`)
- ❌ `index.tsx` sebagai entry halaman (pakai `page.tsx`)
- ❌ Duplikasi file `utils.ts` di `app/` — semua util di `lib/`

---

## 4. Next.js 16 — Aturan Khusus

> `AGENTS.md:10` — *"Ini bukan Next.js yang kamu kenal."*

1. **Baca docs internal** sebelum API baru: `node_modules/next/dist/docs/` + perhatikan deprecation notice.
2. **`'use client'` wajib** untuk komponen yang pakai `useState/useEffect/localStorage/window`. Semua halaman kuis & `app/page.tsx:1` sudah `use client`.
3. **`useSearchParams` harus dibungkus `Suspense`** — lihat `app/quiz/page.tsx:76-90`.
   ```tsx
   // ✅ Benar
   export default function QuizPage() {
     return <Suspense fallback={<Loading />}><QuizContent /></Suspense>
   }
   function QuizContent() { const params = useSearchParams(); ... }
   // ❌ Salah: useSearchParams langsung di page tanpa Suspense
   ```
4. **`force-dynamic` untuk API proxy** — `app/api/sheets/route.ts:1`, `app/api/audio/route.ts:1` pakai `export const dynamic = 'force-dynamic'`.
5. **Turbopack:** `next.config.ts:3-5` `turbopack.root = process.cwd()`. Jangan ubah tanpa tes build.
6. **Metadata & viewport:** `app/layout.tsx` pakai `export const metadata` + `viewport themeColor #f2f4f7`.
7. **Service Worker:** Register di `app/layout.tsx` via `navigator.serviceWorker.register('/sw.js')`, bukan di komponen.
8. **No `getServerSideProps` / `getStaticProps`** — era Pages Router sudah lewat. Pakai Server Component atau `fetch` dengan `next.revalidate`.

---

## 5. Standar Quiz Engine (Wajib)

### 5.1 Semua Quiz WAJIB `useQuizEngine`

```tsx
// app/quiz/page.tsx:180 — contoh kanonik
import { useQuizEngine } from '@/lib/quiz-engine'

const engine = useQuizEngine<VocabItem>({
  queue,                          // VocabItem[] hasil buildQueue, max 10
  srsEnabled: true,               // false untuk mode tanpa SRS (jarang)
  getSrsId: item => item.id,     // prefix sesuai konten (lihat §6)
  checkAnswer: (item, choice) => choice === item.arti,
  onAnswered: (item, ok) => { /* optional: recordFailedWord */ },
  onFinish: (correct, total, store) => { /* optional analytics */ },
})
```

**API hook** (`lib/quiz-engine.ts:21-175`):

| Field | Tipe | Deskripsi |
|---|---|---|
| `phase` | `'question' \| 'feedback' \| 'result'` | Fase sesi |
| `current` | `number` | Index soal aktif |
| `currentItem` | `T` | Item aktif (`queue[current]`) |
| `progress` | `number` | `(current/queue.length)*100` |
| `lives` | `number` | 3 awal, via `loadLivesEnabled()` |
| `livesEnabled` | `boolean` | Dari `kotoba_lives_enabled` |
| `sessionCorrect/Answered` | `number` | Akumulasi sesi |
| `roundStreak` | `number` | Streak beruntun sesi |
| `selected/isCorrect` | `string\|null / boolean\|null` | Jawaban terakhir |
| `cardKey` | `number` | Key animasi card |
| `showExitConfirm` | `boolean` | Guard back button |
| `answer(choice)` | `fn` | Jawab → cek, SRS, sound |
| `next()` | `fn` | Soal berikutnya atau `finish()` |
| `finish()` | `fn` | `playFinish` + `finishSession` |
| `reset()` | `fn` | Reset state untuk retry |
| `getProgress(id)` | `fn` | Level SRS live |
| `getSrsStore()` | `fn` | Akses `SRSStore` mentah |

### 5.2 Larangan Keras

| ❌ Jangan | ✅ Lakukan |
|---|---|
| Bikin state `lives/streak/phase` sendiri | Pakai `engine.lives`, `engine.phase` |
| `saveSRS()` + `updateAfterSession()` + `pushToCloud()` manual | Pakai `finishSession(store, correct, total)` dari `lib/session.ts:12` |
| Modal exit custom | Pakai `ExitConfirmModal` dari `components/quiz/ExitConfirmModal.tsx` |
| Hardcode `10` di komponen | Import `TOTAL_QUESTIONS` dari `lib/quiz-engine.ts:8` |
| Duplikasi `popstate` listener | Engine sudah handle `lib/quiz-engine.ts:45-54` |

### 5.3 Komponen Quiz Wajib

Semua halaman kuis render 4 komponen shared (`AGENTS.md:104`):

```tsx
import QuizHeader from '@/components/quiz/QuizHeader'
import FeedbackSheet from '@/components/quiz/FeedbackSheet'
import ResultScreen from '@/components/quiz/ResultScreen'
import ExitConfirmModal from '@/components/quiz/ExitConfirmModal'

// Header: progress + lives + close
<QuizHeader progress={engine.progress} lives={engine.lives} livesEnabled={engine.livesEnabled} onClose={() => engine.setShowExitConfirm(true)} badges={<Badge />} />
// Card soal + grid choices 2 kolom
// Feedback: fixed bottom rounded-t-[32px]
{engine.selected && <FeedbackSheet isCorrect={engine.isCorrect} onNext={engine.next} />}
// Result
{engine.phase === 'result' && <ResultScreen correct={engine.sessionCorrect} total={engine.sessionAnswered} onRetry={() => { rebuild(); engine.reset() }} onHome={() => router.replace('/')} />}
// Guard
<ExitConfirmModal open={engine.showExitConfirm} onCancel={() => engine.setShowExitConfirm(false)} onExit={() => router.replace('/')} />
```

### 5.4 Alur Jawab → Lanjut → Selesai

```
User tap pilihan → engine.answer(choice)
  ├─ checkAnswer() → boolean
  ├─ onAnswered() (mis. recordFailedWord)
  ├─ SRS: srsRef.current = onCorrect/onWrong(srsRef.current, srsId)
  ├─ Sound: playCorrect / playWrong / playStreak (≥3) / playLevelUp (lv≥5) / playLoseHeart
  └─ setPhase('feedback')

User tap Lanjut → engine.next()
  ├─ if (livesEnabled && lives <=0) || current+1 >= queue.length → engine.finish()
  │     ├─ playFinish()
  │     └─ finishSession(srsRef.current, sessionCorrect, sessionAnswered)
  │           ├─ saveSRS()
  │           ├─ updateAfterSession() → stats + heatmap
  │           ├─ rescheduleDailyReminderIfNeeded()
  │           └─ pushToCloud() jika auto-sync
  └─ else current+1, reset selected/isCorrect, cardKey++, phase='question' (+ speakJapanese)
```

---

## 6. SRS & ID Prefix Convention

### 6.1 Level & Interval (`lib/srs.ts:7`)

| Level | Arti | Interval | Berikutnya |
|---|---|---|---|
| 0 | Baru | 0 hari | Hari ini |
| 1 | Lv.1 | 1 hari | Besok |
| 2 | Lv.2 | 3 hari | 3 hari lagi |
| 3 | Lv.3 | 7 hari | Minggu depan |
| 4 | Lv.4 | 14 hari | 2 minggu |
| 5 | Hafal | 30 hari | Sebulan |
| 6 | Master | 90 hari | 3 bulan |

`MASTERED_LEVEL = 5`, `MAX_LEVEL = 6`. Salah → `max(level-1, 0)` + `nextReview = hari ini` (`lib/srs.ts:85`).

### 6.2 Prefix ID (`AGENTS.md:45`)

| Konten | Format ID | Contoh | File |
|---|---|---|---|
| Vocab | `{vocab_id}` langsung | `a1b2c3...` (hash `category|hiragana|kanji|arti`) | `lib/vocab.ts:88` |
| Kana | `kana_{hiragana|katakana}_{kana_id}` | `kana_hiragana_a` | `lib/kana.ts` |
| Partikel | `particle_{question_id}` | `particle_12` | `lib/particles-data.ts` |
| Kalimat | `sentence_{question_id}` | `sentence_7` | `lib/sentences-data.ts` |
| Kana summary | `getKanaSummary(KANA, store)` | — | `lib/srs.ts:251` |

**Penting:** ID vocab **tidak** mengandung chapter agar progress tidak hilang saat kata pindah bab (`GEMINI.md:6`).

### 6.3 Pembuatan Queue

```ts
// lib/srs.ts:109 — prioritas 5 bucket
const { dueIds, newIds, refreshIds } = buildQueue(vocabIds, store, 10)
// 1. Due belum hafal (lv1-4 due today)
// 2. Kata baru (lv0)
// 3. Future belum hafal (lv1-4 not due)
// 4. Due hafal (lv5 due)
// 5. Future hafal (lv5-6)
const allIds = [...dueIds, ...newIds, ...refreshIds].slice(0, 10)
```

### 6.4 Bobot Progress

```ts
// lib/srs.ts:175
LEVEL_WEIGHTS = [0, 0.25, 0.45, 0.65, 0.85, 0.95, 1.0]
calculateChapterProgress(ids, store) // pct = totalWeight/ids.length *100
getSRSSummary(ids, store) // due/new/mastered/learning/pct/accuracyPct
```

---

## 7. Skema localStorage — Jangan Diubah

> `AGENTS.md:53` — skema dipertahankan demi kompatibilitas user.

| Key | Tipe | Modul Akses | Deskripsi |
|---|---|---|---|
| `kotoba_srs` | `SRSStore` | `lib/srs.ts:loadSRS/saveSRS` | `{ [id]: WordProgress{level,nextReview,correctCount,wrongCount,lastSeen} }` |
| `kotoba_stats` | `GameStats` | `lib/stats.ts` | `{currentStreak,longestStreak,lastPlayedDate,totalSessions,totalCorrect,totalAnswered,updatedAt}` |
| `kotoba_vocab` | `VocabItem[]` | `lib/vocab.ts` | Daftar kosakata, seed `public/data/vocab-default.json` (958) |
| `kotoba_vocab_updated_at` | `ISO string` | `lib/cloud.ts` | Timestamp vocab |
| `kotoba_study_history` | `Record<string,number>` | `lib/stats.ts:recordStudyHistory` | Heatmap `YYYY-MM-DD → count` |
| `kotoba_failed_words` | `string[]` | `lib/failed.ts` | Max 50, move-to-end |
| `kotoba_sync_mode` | `'auto'|'manual'` | `lib/session.ts:19` | Default auto |
| `kotoba_lives_enabled` | `'true'|'false'` | `lib/session.ts:30` | Default true |
| `kotoba_show_furigana` | `'true'|'false'` | `app/quiz/page.tsx:125` | Default true |
| `kotoba_theme` | `'light'|'dark'|'system'` | `app/layout.tsx` | Inline script `.dark` |
| `kotoba_reminder_enabled/time` | `bool/string` | `lib/notifications.ts` | Daily reminder |
| `kotoba_last_user` | `email` | `app/page.tsx:283` | Isolasi akun |
| `kotoba_groq_key` (+ legacy `kotoba_gemini_key`) | `string` | `lib/gemini.ts` | API key Groq |
| `kotoba_sheets_url` | `string` | `app/page.tsx:31` | CSV URL |
| `kotoba_stories` | `ChapterStory[]` | `lib/stories.ts` | Cache cerita |

**Aturan:**
- Akses HANYA via `lib/*`. Jangan `localStorage.getItem('kotoba_*')` langsung di komponen.
- Hydration: load di `useEffect`, bukan saat render pertama (hindari mismatch).
- `cachedSRSStore` & `cachedVocab` adalah cache in-memory — jangan diakses langsung.

---

## 8. TypeScript & Penamaan

### 8.1 Konfigurasi (`tsconfig.json`)

- `strict: true`, `noEmit: true`, `allowJs: true`, `target: ES2017`, `jsx: react-jsx`
- `paths: @/* → ./*`, `typeRoots: ./types + @types`

### 8.2 Konvensi Penamaan

| Elemen | Gaya | Contoh |
|---|---|---|
| Interface / Type | `PascalCase` | `VocabItem`, `WordProgress`, `GameStats`, `SRSStore`, `QuizPhase` |
| Komponen | `PascalCase` | `QuizHeader`, `ResultScreen`, `BottomNav` |
| Hook | `camelCase` + `use` | `useQuizEngine`, `useSession` |
| Fungsi util | `camelCase` | `loadSRS`, `buildQueue`, `parseCSVToVocab`, `speakJapanese` |
| Konstanta | `SCREAMING_SNAKE` | `TOTAL_QUESTIONS`, `SRS_INTERVALS`, `MAX_LEVEL`, `MASTERED_LEVEL` |
| File lib | `camelCase` | `quiz-engine.ts`, `dateUtils.ts` |
| Enum implisit | `string` union | `Category = 'Kata Benda' \| 'Kata Kerja' \| ...` |

### 8.3 Aturan Style

- Selalu `type` untuk data shape, `interface` untuk opsi/props yang mungkin di-extend.
- Props komponen: destructure + default value, bukan `props.xxx`.
- Hindari `any` — pakai `unknown` + guard atau generik `<T>` (`useQuizEngine<T>`).
- Export named untuk ikon (`export function IconHome`), default export untuk page (`export default function Page()`).

---

## 9. State, Hooks & Side Effects

- **Hydration:** Semua akses `localStorage/window` di `useEffect`, set state awal `null`/kosong untuk SSR match.
  ```tsx
  const [showFurigana, setShowFurigana] = useState(true)
  useEffect(() => { const v = localStorage.getItem('kotoba_show_furigana'); if(v!==null) setShowFurigana(v!=='false') }, [])
  ```
- **Ref untuk SRS:** `srsRef = useRef<SRSStore>({})` load sekali di `useEffect:40`, mutasi sync tanpa re-render.
- **Queue build:** `useCallback(buildAndSetQueue)` dengan deps kosong, panggil saat filter berubah.
- **Audio:** `speakJapanese` hanya setelah user interaction (tap "Mulai" / tap pilihan) — jangan autoplay di mount tanpa interaksi.
- **Popstate:** Jangan tambah listener baru — engine sudah handle.
- **Global cache:** `getGlobalVocab()/setGlobalVocab()` untuk hindari parse ulang.

---

## 10. API Routes & Data Fetching

| Route | Method | Auth | Fungsi |
|---|---|---|---|
| `app/api/sync/route.ts:116` | `GET/POST/DELETE` | `auth()` email | Firestore `users/{email}` + `vocab/data`, batch merge |
| `app/api/sync/import-drive/route.ts:67` | `GET` | `accessToken` | `appDataFolder/kotoba_data.json` dari Google Drive |
| `app/api/sheets/route.ts:34` | `GET` | — | Proxy CSV `?url=docs.google.com/spreadsheets` + `&t=` buster |
| `app/api/audio/route.ts:66` | `GET` | — | TTS Google `translate_tts` → fallback Youdao, cache 1 tahun |
| `app/api/import-form/route.ts:149` | `GET` | — | Scrape `FB_PUBLIC_LOAD_DATA_` dari Forms |
| `app/api/auth/[...nextauth]/route.ts:2` | `GET/POST` | — | `handlers` NextAuth |
| `app/api/auth/google-client-id/route.ts:7` | `GET` | — | Expose `GOOGLE_CLIENT_ID` untuk native |

**Aturan:**
- Selalu `cache: 'no-store'` + `t=Date.now()` untuk sync.
- Validasi `url` param mengandung `docs.google.com` sebelum fetch (Sheets/Forms).
- Error response JSON `{error: string}` dengan status 401/400/500.
- Client sync: `syncToCloud()` = pull-merge-push aman dipanggil berkali-kali (race-safe).

---

## 11. Styling — Token Wajib

> **Detail lengkap:** `docs/UI_THEME.md`. Ringkasan aturan keras:

- **Jangan hardcode hex.** Pakai `var(--color-accent)` dll. dari `app/globals.css:9-58`.
  ```tsx
  // ✅
  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-1)] rounded-[var(--radius-lg)] shadow-card" />
  // ❌
  <div className="bg-[#fffdf8] border-[#e5ddd0]" style={{color:'#2c2620'}} />
  ```
- **Dark mode** via `.dark` class di `<html>` — semua token `*-light` otomatis jadi `rgba(...,0.12)`.
- **Ikon:** Hanya `components/ui/icons.tsx` (19 ikon, stroke 1.8–2.2). Emoji hanya ekspresif (🔥🎉🐢) bukan navigasi.
- **Animasi:** `anim-up/down/pop/shake/correct` + `d1-d4` stagger.

---

## 12. Aksesibilitas & UX

- Touch target ≥44px (`w-8 h-8` ikon diberi `p-2` atau `hitSlop`).
- Kontras teks ≥4.5:1 light & dark (token sudah memenuhi).
- Feedback sheet `rounded-t-[32px]` + backdrop + `shadow-float`, tombol `Lanjut →` full-width.
- Haptik/audial: `playCorrect/Wrong/Streak/LevelUp` tepat waktu, `playTap` untuk hint/furigana toggle.
- Empty state: selalu ada (mis. `app/page.tsx:557` "Belum ada kosakata!" + CTA ke `/vocab`).

---

## 13. Error Handling & Logging

- `try/catch` untuk semua `JSON.parse(localStorage)`, `fetch`, `Papa.parse`. Log `console.error('[Vocab] ...', e)` jangan silent swallow.
- API: `throw new Error('auth_required')` → handler map ke 401 dengan pesan Indonesia.
- Cloud sync: `finishSession` catch `pushToCloud` agar kuis tetap selesai walau offline (`lib/session.ts:22`).
- Validasi input: CSV minimal 2 kolom, `arti && (hiragana||kanji)` baru push (`lib/vocab.ts:86`).

---

## 14. Performa & Optimasi

- **Furigana & vocabRef cache** `Map` size 500 (`lib/vocab.ts:324,356`) — `clear()` saat penuh.
- **Audio cache** `caches kotoba-audio-cache` + `preloadJapaneseAudio` untuk soal berikutnya.
- **SRS `cachedSRSStore`** & `cachedVocab` hindari parse ulang.
- **Throttle Sheets sync** 1 jam (`app/page.tsx:164` `THROTTLE_TIME=3600000`).
- **Shuffle** via `sort(() => Math.random()-0.5)` — cukup untuk 10 soal, jangan over-engineer.
- **SW:** `public/sw.js:72` stale-while-revalidate, skip `/api/` & `/_next/webpack-hmr`.

---

## 15. Git, Commit & Branch

- **Branch:** `feat/nama-fitur`, `fix/nama-bug`, `docs/nama-dok`, `chore/*`
- **Commit:** Conventional Commits `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`. Subject ≤50 char, body jelaskan *why* jika tidak obvious.
- **Sebelum commit:** `npm run build` WAJIB pass (`AGENTS.md:73`), `npm run lint` bersih.
- **PR:** sertakan screenshot untuk perubahan UI, link ke `DESIGN_SYSTEM.md` jika tambah token.
- **Jangan:** `git push --force` ke `main`, commit secret (`.env.local`), atau ubah `capacitor.config.ts` URL tanpa konfirmasi.

---

## 16. Testing, Lint & Build

```bash
npm run dev     # http://localhost:3000
npm run build   # production build — wajib pass sebelum commit
npm run lint    # ESLint (eslint.config.mjs = nextVitals + nextTs)
npx cap sync    # sync web build ke native
npx cap open android / ios
```

- **ESLint:** `eslint.config.mjs` `defineConfig([...nextVitals, ...nextTs], ignore .next/out/build)`.
- **Type check:** `tsc --noEmit` implisit via `next build`.
- **Manual QA checklist:** kuis 10 soal full, lives 0 → ResultScreen, back button → ExitConfirmModal, furigana toggle persist, dark mode toggle, offline reload.

---

## 17. Capacitor & Native

- Cek `Capacitor.isNativePlatform()` sebelum pakai `GoogleSignIn`, `LocalNotifications` (`PRD.md:122`).
- OAuth native via `Credentials provider google-native` (`auth.ts:77`) — validasi `tokeninfo?id_token=` + `iss` + `email_verified`.
- `capacitor.config.ts:28` `server.url https://kotoba-quiz-gilt.vercel.app`, `allowNavigation [accounts.google.com, *.googleusercontent.com]`, UA override untuk bypass WebView blocking.
- Dev emulator: ubah `server.url` ke `http://10.0.2.2:3000` sementara, jangan commit.

---

## 18. Common Pitfalls (Jangan Diulangi)

| # | Pitfall | Solusi |
|---|---|---|
| 1 | Hydration mismatch localStorage | Load di `useEffect`, render awal `null`/loading |
| 2 | Back button duplikat | Jangan tambah `popstate` — engine sudah handle |
| 3 | Audio autoplay diblokir | Panggil `speakJapanese` hanya setelah user tap |
| 4 | Cloud race condition | Pakai `pushToCloud = syncToCloud` (pull-merge-push) |
| 5 | Hardcode hex | Pakai `var(--color-*)` |
| 6 | ID vocab pakai chapter | Hash `category|hiragana|kanji|arti` saja |
| 7 | Emoji untuk navigasi | Pakai `components/ui/icons.tsx` |
| 8 | Lupa `Suspense` untuk `useSearchParams` | Bungkus `QuizContent` di `Suspense` |
| 9 | Furigana `___` hilang | `lib/vocab.ts:336` protect `___TEMP___` sebelum replace |
| 10 | Streak reset salah | `lib/stats.ts:27` cek `yesterdayStr`, bukan selisih hari mentah |

---

## 19. Template & Contoh Lengkap

### Template Halaman Kuis Baru (Copy-Paste Aman)

```tsx
'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizEngine, TOTAL_QUESTIONS } from '@/lib/quiz-engine'
import { loadSRS, buildQueue, SRS_INTERVALS, MASTERED_LEVEL } from '@/lib/srs'
import { speakJapanese } from '@/lib/sounds'
import QuizHeader from '@/components/quiz/QuizHeader'
import FeedbackSheet from '@/components/quiz/FeedbackSheet'
import ResultScreen from '@/components/quiz/ResultScreen'
import ExitConfirmModal from '@/components/quiz/ExitConfirmModal'

interface MyQ { id: string; question: string; correct: string; options: string[] }

export default function MyQuizPage() {
  return <Suspense fallback={<div className="jp text-center p-8">読み込み中</div>}><MyQuizContent /></Suspense>
}

function MyQuizContent() {
  const router = useRouter()
  const [pool, setPool] = useState<MyQ[]>([])
  const [queue, setQueue] = useState<MyQ[]>([])
  const [choices, setChoices] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  const build = useCallback((items: MyQ[], store: any) => {
    const { dueIds, newIds, refreshIds } = buildQueue(items.map(i=>i.id), store, TOTAL_QUESTIONS)
    const ids = [...dueIds, ...newIds, ...refreshIds].slice(0, TOTAL_QUESTIONS)
    const map = Object.fromEntries(items.map(i=>[i.id,i]))
    const q = ids.map(id=>map[id]).filter(Boolean)
    setQueue(q)
    if(q[0]) setChoices([...q[0].options].sort(()=>Math.random()-0.5))
  }, [])

  useEffect(() => {
    const store = loadSRS()
    const items: MyQ[] = [] // TODO: load dari lib/xxx-data.ts
    setPool(items); build(items, store); setReady(true)
  }, [build])

  const engine = useQuizEngine<MyQ>({
    queue, srsEnabled: true,
    getSrsId: q => `myquiz_${q.id}`,
    checkAnswer: (q, choice) => choice === q.correct,
  })

  useEffect(() => { if(engine.currentItem) setChoices([...engine.currentItem.options].sort(()=>Math.random()-0.5)) }, [engine.current])
  useEffect(() => { if(engine.phase==='question' && engine.currentItem) speakJapanese(engine.currentItem.question) }, [engine.phase, engine.currentItem])

  if(!ready) return <div>Loading...</div>
  if(queue.length===0 || engine.phase==='result') return <ResultScreen correct={engine.sessionCorrect} total={engine.sessionAnswered} emoji="🎉" title="Sesi Selesai!" onRetry={()=>{build(pool, loadSRS()); engine.reset()}} onHome={()=>router.replace('/')} />
  const q = engine.currentItem!
  return (
    <div className="flex flex-col min-h-dvh max-w-sm md:max-w-2xl mx-auto bg-[var(--color-bg)]">
      <QuizHeader progress={engine.progress} lives={engine.lives} livesEnabled={engine.livesEnabled} onClose={()=>engine.setShowExitConfirm(true)} />
      <div className="flex-1 px-4">
        <p className="text-sm font-bold text-[var(--color-text-3)]">{engine.current+1}/{queue.length}</p>
        <p className="jp text-3xl font-bold my-6 text-center">{q.question}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {choices.map(c => <button key={c} onClick={()=>engine.answer(c)} disabled={!!engine.selected} className="rounded-[var(--radius-md)] px-3.5 py-4 text-sm font-bold border bg-[var(--color-surface)]">{c}</button>)}
        </div>
      </div>
      {engine.selected && <FeedbackSheet isCorrect={engine.isCorrect!} statusText={engine.isCorrect?'Bener!':'Salah!'} detail={engine.isCorrect?`Review ${SRS_INTERVALS[Math.min(engine.getProgress(q.id)+1,6)]} hari lagi`:q.correct} onNext={engine.next} />}
      <ExitConfirmModal open={engine.showExitConfirm} onCancel={()=>engine.setShowExitConfirm(false)} onExit={()=>router.replace('/')} />
    </div>
  )
}
```

### Checklist Penamaan Baru

- Tambah kategori vocab? Update `Category` di `lib/vocab.ts:4`, `CAT` di `app/quiz/page.tsx:35`, `badge-*` di `app/globals.css:183`, dan `SPECIALIZED_DATA` jika perlu.
- Tambah mode kuis? Daftar di `PRD.md:41` + prefix di §6.

---

## 20. Checklist Sebelum Commit / PR

- [ ] `npm run build` pass (no TS error)
- [ ] `npm run lint` bersih
- [ ] Tidak ada `localStorage.getItem('kotoba_*')` di komponen (pakai `lib/*`)
- [ ] Tidak ada hardcode hex (grep `#[0-9a-fA-F]{3,6}` di `app/` & `components/`)
- [ ] Semua kuis pakai `useQuizEngine` + 4 komponen quiz
- [ ] Dark mode diuji (toggle `.dark`)
- [ ] Hydration: load localStorage di `useEffect`
- [ ] Back button → `ExitConfirmModal` (jangan custom)
- [ ] `TOTAL_QUESTIONS` di-import, bukan hardcode `10`
- [ ] Copy Indonesia, feedback `Bener!`/`Salah!`
- [ ] Ikon dari `components/ui/icons.tsx`, bukan emoji untuk navigasi
- [ ] `finishSession` dipakai, bukan manual `saveSRS+updateAfterSession`
- [ ] Jika tambah token warna, update `app/globals.css` + `DESIGN_SYSTEM.md`

---

*Dokumen ini adalah turunan detail `AGENTS.md` + `DESIGN_SYSTEM.md`. Jika konflik, `AGENTS.md` sebagai sumber kebenaran utama untuk aturan kritikal.*
