# Arsitektur — Kotoba Quiz (言葉カード)

> **Versi:** 0.1.2 | **Stack:** Next.js 16 (App Router) + React 19 + Tailwind v4 + Capacitor 8 | **Sifat:** Offline-first, SRS, PWA + Native

---

## Daftar Isi
1. [Ringkasan & Prinsip](#1-ringkasan--prinsip)
2. [Tech Stack Mendalam](#2-tech-stack-mendalam)
3. [Struktur Folder Lengkap](#3-struktur-folder-lengkap)
4. [Lapisan Arsitektur](#4-lapisan-arsitektur)
5. [Data Layer — Offline-First](#5-data-layer--offline-first)
6. [Sync & Cloud](#6-sync--cloud)
7. [Auth & Keamanan](#7-auth--keamanan)
8. [Quiz Engine — Jantung Aplikasi](#8-quiz-engine--jantung-aplikasi)
9. [Routing & Navigasi](#9-routing--navigasi)
10. [PWA & Service Worker](#10-pwa--service-worker)
11. [Capacitor Native](#11-capacitor-native)
12. [AI & Generasi Konten](#12-ai--generasi-konten)
13. [Styling & Design System](#13-styling--design-system)
14. [Lingkungan & Konfigurasi](#14-lingkungan--konfigurasi)
15. [Build, Deploy & Release](#15-build-deploy--release)
16. [Observabilitas & Batasan](#16-observabilitas--batasan)
17. [Roadmap Teknis](#17-roadmap-teknis)

---

## 1. Ringkasan & Prinsip

**Kotoba Quiz** adalah aplikasi belajar kosakata & tata bahasa Jepang untuk pengguna **Minna no Nihongo Bab 1–25** + JLPT + Kana, dengan **SRS Level 0–6** sebagai inti retensi.

**Prinsip arsitektur:**

| Prinsip | Implementasi |
|---|---|
| **Offline-first** | `localStorage` sumber kebenaran; Firestore mirror via `syncToCloud` pull-merge-push |
| **Single Engine** | Semua kuis lewat `lib/quiz-engine.ts:21` + 4 komponen `components/quiz/*` |
| **Token-driven UI** | `app/globals.css:5` Washi & Torii, dark via `.dark` |
| **Stable schema** | Key `kotoba_*` tidak diubah demi kompatibilitas (`AGENTS.md:53`) |
| **Mobile-first** | `max-w-sm md:max-w-2xl`, PWA `standalone`, Capacitor `com.kotobaquiz.app` |

**Diagram konteks:**

```mermaid
flowchart TB
    U[User<br/>Pelajar JP] --> PWA[PWA / Capacitor App<br/>Next.js 16 + React 19]
    PWA --> LS[(localStorage<br/>kotoba_*)]
    PWA --> API[Next.js API<br/>/api/*]
    PWA --> AI[Groq API<br/>llama-3.3-70b]
    API --> FS[(Firestore<br/>users/{email})]
    API --> GDrive[(Google Drive<br/>appDataFolder)]
    API --> GSheets[(Google Sheets<br/>CSV)]
    API --> TTS[(Google TTS / Youdao)]
    PWA --> Auth[NextAuth v5<br/>Google OAuth]
    Auth --> Google[Google Accounts]
```

---

## 2. Tech Stack Mendalam

| Layer | Detail | File Kunci |
|---|---|---|
| **Framework** | Next.js `16.2.6` App Router, Turbopack `root:process.cwd()` | `next.config.ts:3`, `app/layout.tsx` |
| **UI** | React `19.2.4` `react-jsx`, `useState/Effect/Ref/Callback/Memo` | `tsconfig.json:13` |
| **Styling** | Tailwind `^4` `@import "tailwindcss"` + `@theme` CSS vars, `@variant dark` | `app/globals.css:1-60`, `postcss.config.mjs` |
| **Mobile** | Capacitor `8.4.0` + `@capacitor/app,local-notifications` + `@capawesome/capacitor-google-sign-in 0.1.2` | `capacitor.config.ts` |
| **Auth** | NextAuth `5.0.0-beta.31` `@auth/core 0.41.2`, provider Google + Credentials `google-native` | `auth.ts:77`, `types/next-auth.d.ts` |
| **DB** | `firebase-admin 13.10.0` `admin.firestore()` | `lib/firebase-admin.ts:30` |
| **CSV** | `papaparse 5.5.3` + `@types/papaparse` | `lib/vocab.ts:1`, `lib/stories.ts` |
| **AI** | Groq `llama-3.3-70b-versatile` OpenAI-compat REST, key `kotoba_groq_key` di localStorage | `lib/gemini.ts:152`, `tools/gen-content/generate-stories.js` |
| **Notif** | Capacitor LocalNotifications / Web Notification + `public/sw.js` `notificationclick` | `lib/notifications.ts` |
| **Lint/TS** | `eslint 9` `eslint-config-next 16.2.6` `typescript 5` `strict:true` `target ES2017` | `eslint.config.mjs`, `tsconfig.json` |
| **Deploy** | Vercel `framework:nextjs` `buildCommand:npm run build` `output:.next` | `vercel.json` |

**Path alias:** `@/*` → `./*` (`tsconfig.json:24`), `typeRoots` `./types`.

---

## 3. Struktur Folder Lengkap

```
kotoba-quiz/
├── app/
│   ├── layout.tsx                # html lang=ja, theme script, SW register, SessionProvider
│   ├── globals.css               # TOKENS — Washi & Torii, shadows, animasi
│   ├── page.tsx                  # Beranda 864 baris: pull-refresh, streak, heatmap, WOTD, tabs
│   ├── api/
│   │   ├── sync/route.ts         # GET/POST/DELETE Firestore users/{email}
│   │   ├── sync/import-drive/route.ts # GET Drive appDataFolder
│   │   ├── sheets/route.ts       # GET proxy CSV (CORS bypass)
│   │   ├── audio/route.ts        # GET TTS Google→Youdao
│   │   ├── import-form/route.ts  # GET scrape FB_PUBLIC_LOAD_DATA_
│   │   └── auth/[...nextauth]/route.ts + google-client-id/route.ts
│   ├── kana/{page.tsx, quiz/page.tsx}  # 131 KANA, confusable, chart
│   ├── particles/{page.tsx, guide/page.tsx} # ~100 soal, furigana+vocabRef
│   ├── sentences/page.tsx        # 15 blocks susun kalimat
│   ├── story/[chapter]/page.tsx  # StoryPlayer + chunks
│   ├── quiz/{page.tsx, chapters, jlpt, kanji, special, custom/*}
│   ├── practice/page.tsx         # Soal per bab praktik
│   ├── vocab/page.tsx            # Kelola kosakata + import Sheets
│   ├── progress/page.tsx         # Status SRS + heatmap
│   └── settings/page.tsx         # Sync, lives, theme, reminder, reset
├── components/
│   ├── ui/icons.tsx              # 19 ikon stroke 1.8-2.2
│   ├── quiz/{QuizHeader,FeedbackSheet,ResultScreen,ExitConfirmModal}.tsx
│   ├── BottomNav.tsx, StreakWidget.tsx, StoryPlayer.tsx, ChunkedSubtitle.tsx,
│   │   GenerateProgressToast.tsx, AppInitializer.tsx
├── lib/
│   ├── quiz-engine.ts            # useQuizEngine hook — state machine kuis
│   ├── session.ts                # finishSession terpusat
│   ├── srs.ts                    # intervals, buildQueue, LEVEL_WEIGHTS, summaries
│   ├── stats.ts                  # GameStats, streak, heatmap
│   ├── cloud.ts                  # collect/merge/syncToCloud/pull/Drive
│   ├── vocab.ts                  # VocabItem, parseCSV, furigana, vocabRef, caches
│   ├── kana.ts                   # KANA[131], confusable groups
│   ├── particles-data.ts / particles-guide-data.ts
│   ├── sentences-data.ts (15) / jlpt.ts / specialized.ts (angka/hari/uang...)
│   ├── stories.ts                # Scene/Story, CSV parse, fetchStories
│   ├── sounds.ts                 # Web Audio + TTS cache
│   ├── notifications.ts          # streak_at_risk/lost, scheduleDaily
│   ├── streak-bridge.ts          # CustomEvent + native plugin
│   ├── dateUtils.ts              # getLocalDateString, addLocalDateDays
│   ├── conjugator.ts             # Godan/Ichidan/irregular te/ta/nai
│   ├── backgroundGenerate.ts     # singleton _isRunning + subscribeProgress
│   ├── gemini.ts                 # Groq wrapper (callGroq, generateStory/Sentence, explainGrammar)
│   └── firebase-admin.ts         # admin init, export db
├── types/next-auth.d.ts          # Session + JWT augmentation
├── public/
│   ├── data/{vocab-default.json (958), practice-default.json, ...}
│   ├── sw.js (72 baris) + manifest.json + icons + screenshots
├── scripts/*.js                  # build-accurate-forms, fix-practice-data, dll.
├── tools/gen-content/{generate-stories/sentences/images.js + package.json}
├── design/mockups.html           # Preview Washi & Torii
├── capacitor.config.ts + android/app/src/main/assets/capacitor.config.json
├── vercel.json, next.config.ts, tsconfig.json, eslint.config.mjs, postcss.config.mjs
└── docs/{CODING_STANDARD,UI_THEME,DATA_FLOW,ARCHITECTURE}.md
    + AGENTS.md + DESIGN_SYSTEM.md + PRD.md + GEMINI.md + README.md
```

---

## 4. Lapisan Arsitektur

```mermaid
flowchart TB
    subgraph Presentation[Presentation — app/ + components/]
        A[Beranda<br/>app/page.tsx<br/>Streak, Heatmap, WOTD, Tabs]
        B[Quiz Pages<br/>app/quiz/*, kana/quiz, particles, sentences]
        C[Shared Quiz UI<br/>QuizHeader, FeedbackSheet, ResultScreen, ExitConfirmModal]
        D[BottomNav, StreakWidget, StoryPlayer]
    end
    subgraph Logic[Logic — lib/]
        E[quiz-engine.ts<br/>useQuizEngine]
        F[srs.ts + stats.ts<br/>SRS & Streak]
        G[session.ts<br/>finishSession]
        H[cloud.ts<br/>syncToCloud]
        I[vocab.ts, kana.ts, particles/sentences-data.ts]
        J[sounds.ts, notifications.ts, dateUtils.ts]
    end
    subgraph Data[Data — Storage]
        K[(localStorage<br/>kotoba_*)]
        L[(Firestore<br/>users/{email})]
        M[(public/data<br/>vocab-default.json)]
    end
    subgraph Platform[Platform — API + Native]
        N[Next.js API<br/>sync/sheets/audio/import-form/auth]
        O[NextAuth v5<br/>Google + google-native]
        P[Capacitor<br/>App, LocalNotifications, GoogleSignIn]
        Q[Service Worker<br/>public/sw.js]
        R[Groq AI<br/>lib/gemini.ts]
    end

    A & B --> E & F & H
    E --> F --> G --> H
    B --> C --> E
    A --> F & I & J
    E & F & G & H & I --> K
    H <--> N <--> L
    N <--> M
    Q --- K
    P --- Auth
    R --- B
```

**Aliran dependensi:** `Presentation → Logic → Data → Platform`. Logic tidak import `app/*` — hanya `lib/*` saling import (`quiz-engine → srs/sounds/session`, `session → srs/stats/cloud/notifications`, `cloud → srs/stats/vocab`).

---

## 5. Data Layer — Offline-First

**Sumber kebenaran:** `localStorage` (sync). Firestore hanya **eventual consistent mirror**.

- **Seed:** `loadLocalVocab()` jika `kotoba_vocab` kosong → `public/data/vocab-default.json` (958, Bab 1–25) → `saveLocalVocab`.
- **Cache:** `cachedVocab` & `cachedSRSStore` in-memory, invalidasi via `save*`.
- **Migrasi:** Deteksi `chapter` korup (`!startsWith('Bab ')` & `!== 'Tanpa Bab'`) → auto-replace dengan `defaultData` (`lib/vocab.ts:143`).
- **Throttle:** Sheets silent sync `THROTTLE_TIME 1 jam` (`app/page.tsx:164`).
- **SW cache:** `kotoba-quiz-cache-v1` `CACHE_NAME`, precache `/, /manifest.json, /favicon.ico`, stale-while-revalidate, skip `/api/` & `/_next/webpack-hmr` (`public/sw.js:72`).

Lihat `docs/DATA_FLOW.md:3` untuk tabel `kotoba_*` lengkap.

---

## 6. Sync & Cloud

**Pola:** **Pull → Merge (pure) → Save lokal → Push** (`lib/cloud.ts:117`).

- **Merge SRS:** level tertinggi menang, tie-break `lastSeen` terbaru.
- **Merge Stats:** `total*` & `longestStreak` = `max`, `currentStreak/lastPlayedDate` = LWW (last write wins) dengan proteksi data kosong.
- **Merge Vocab:** `vocabUpdatedAt` terbaru menang.
- **Merge History:** `max` per tanggal, Failed = union.

**Trigger:**
- Auto `finishSession` jika `kotoba_sync_mode !== 'manual'` (`lib/session.ts:19`)
- Auto login `app/page.tsx:390` jika `session.email` & `isAuto`
- Manual pull-to-refresh `app/page.tsx:361` `doSync()`
- Isolasi akun: `kotoba_last_user` cek di `app/page.tsx:283` → `removeItem` + `reload` jika ganti user.

**Drive Import:** `GET /api/sync/import-drive` → `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='kotoba_data.json'` (`import-drive/route.ts:67`), lalu merge sebagai `cloudData`.

---

## 7. Auth & Keamanan

**NextAuth v5** `auth.ts:77`:

```ts
providers: [
  Google({ clientId, clientSecret }),
  Credentials({ id:'google-native', credentials:{idToken}, authorize: async ({idToken}) => {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    // cek iss ∈ {accounts.google.com, https://...}, email_verified true
    // return {id:sub, name, email, image:picture}
  }})
],
callbacks: { jwt: copy access_token → token.accessToken, session: copy → session.accessToken },
pages: { signIn: '/' }
```

- **Web:** `signIn('google')`
- **Native:** `Capacitor.isNativePlatform()` → `GET /api/auth/google-client-id` → `GoogleSignIn.initialize({clientId})` → `signIn()` → `signIn('google-native', {idToken})` (`app/page.tsx:304`)
- **Firestore guard:** `await auth()` cek `session?.user?.email` → 401, `if(!db)` → 500 (`app/api/sync/route.ts:116`)
- **Env:** `GOOGLE_CLIENT_ID/SECRET`, `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` (normalize `\n`, strip quotes `lib/firebase-admin.ts:30`). Contoh di `.env.local.example`.

**Isolasi:** `pullToCloud` tidak campur data antar akun — `kotoba_last_user` + `resetCloudData` DELETE.

---

## 8. Quiz Engine — Jantung Aplikasi

Detail di `docs/CODING_STANDARD.md:5` & `docs/DATA_FLOW.md:6`. Ringkas:

- **Hook:** `useQuizEngine<T>({queue, srsEnabled, getSrsId, checkAnswer, onAnswered, onFinish})` (`lib/quiz-engine.ts:21`)
- **State:** `phase/current/lives/livesEnabled/sessionCorrect/Answered/roundStreak/selected/isCorrect/cardKey/showExitConfirm/srsRef`
- **Guard:** `popstate` pushState loop saat `phase question|feedback`
- **Jumlah:** `TOTAL_QUESTIONS=10` konstan, jangan hardcode.
- **Mode 10+:** `vocab` (default adaptive), `kanji` (`kanji!==hiragana`), `failed` (filter `kotoba_failed_words`), `special` (`SPECIALIZED_DATA`), `jlpt` (`getWordJLPTLevel`), `listening` (hide kanji), `kana` (`kana_{type}_{id}`), `particle` (`particle_{id}`), `sentence` (`sentence_{id}`) — `PRD.md:41`.

---

## 9. Routing & Navigasi

| Route | File | Mode / Query |
|---|---|---|
| `/` | `app/page.tsx` | Beranda |
| `/quiz` | `app/quiz/page.tsx` | `?mode=kanji|failed|listening&chapter=Bab 1&level=N5&type=` |
| `/quiz/chapters` | `app/quiz/chapters/page.tsx` | Pilih bab |
| `/quiz/jlpt` | `app/quiz/jlpt/page.tsx` | Filter JLPT |
| `/quiz/kanji` | `app/quiz/kanji/page.tsx` | Kanji only |
| `/quiz/special` | `app/quiz/special/page.tsx` | `?type=angka|hari|...&chapter=` unlock ≥30% |
| `/quiz/custom` | `app/quiz/custom/page.tsx` | Import Forms/Sheets |
| `/kana` | `app/kana/page.tsx` | Tabs `hiragana|katakana|both`, chart vs practice |
| `/kana/quiz` | `app/kana/quiz/page.tsx` | `?type=&ids=` + confusable |
| `/particles` | `app/particles/page.tsx` | `?p=は|が|...|all` |
| `/particles/guide` | `app/particles/guide/page.tsx` | Panduan |
| `/sentences` | `app/sentences/page.tsx` | Blocks susun kalimat |
| `/story/[chapter]` | `app/story/[chapter]/page.tsx` | `StoryPlayer` chunks |
| `/practice` | `app/practice/page.tsx` | Soal per bab |
| `/vocab` | `app/vocab/page.tsx` | Kelola + import |
| `/progress` | `app/progress/page.tsx` | Dashboard SRS + heatmap |
| `/settings` | `app/settings/page.tsx` | Sync, lives, theme, reminder |

**Navigasi:** `BottomNav.tsx` (Beranda, Kosakata, Kana, Progress, Settings), `router.replace('/')` untuk exit quiz (hindari back stack), `Link` untuk internal.

---

## 10. PWA & Service Worker

**Manifest** `public/manifest.json:34`: `name 言葉カード — Kotoba Quiz`, `short_name Kotoba`, `start_url /`, `display standalone`, `background #f2f4f7` `theme #5b5ef4`, icons 192/512/maskable 1024.

**SW** `public/sw.js:72`:
- `install` → `cache.addAll(['/','/manifest.json','/favicon.ico'])` + `skipWaiting()`
- `activate` → delete old `kotoba-quiz-cache-v*` + `clients.claim()`
- `fetch` → skip `pathname /api/`/`/_next/webpack-hmr`/`localhost/_next/`/non-GET, stale-while-revalidate, cache `200` clone, fallback `cache.match` jika offline
- `notificationclick` → `close + clients.openWindow('/')`

**Register:** `app/layout.tsx` `window.load → navigator.serviceWorker.register('/sw.js')`.

**Update check (native):** `app/page.tsx:251` `fetch api.github.com/repos/sarunk21/kotoba-quiz/releases/latest`, compare `isNewerVersion(CURRENT_VERSION 0.1.2, tag_name)`, modal download `.apk`.

---

## 11. Capacitor Native

**Config** `capacitor.config.ts:28`:
```ts
{ appId:'com.kotobaquiz.app', appName:'Kotoba Quiz', webDir:'public',
  server:{ url:'https://kotoba-quiz-gilt.vercel.app', allowNavigation:['kotoba-quiz-gilt.vercel.app','accounts.google.com','*.googleusercontent.com'] },
  ios:{ overrideUserAgent:'Mozilla/5.0 (iPhone ...) Version/17.0 ...' },
  android:{ overrideUserAgent:'Mozilla/5.0 (Linux; Android 13; SM-S901B) ... Chrome/116 ...' } }
```
Mirror di `android/app/src/main/assets/capacitor.config.json`.

- **UA override** untuk bypass Google OAuth WebView blocking.
- **Dev:** `server.url = http://10.0.2.2:3000` untuk emulator, jangan commit.
- **Plugin:** `App`, `LocalNotifications`, `GoogleSignIn` — cek `Capacitor.isNativePlatform()` sebelum pakai.
- **Build:** `npm run build && npx cap sync && npx cap open android/ios`.

---

## 12. AI & Generasi Konten

**Client AI** `lib/gemini.ts:152` — Groq `llama-3.3-70b-versatile` `https://api.groq.com/openai/v1/chat/completions`:
- Key: `kotoba_groq_key` (|| `kotoba_gemini_key` legacy), helper `getGroqApiKey/saveGroqApiKey` + alias Gemini.
- `callGroq(messages, retries=3, forceJson=true)` → `response_format json_object`, retry 429 dengan `Retry-After+2`.
- `generateStoryForChapter(chapter, vocabList)` → `{judul, scenes:[{order,cerita_jepang,cerita_indo,chunks:[{text,reading,romaji}]}]}` via `STORY_SYSTEM_INSTRUCTION`
- `generateSentenceBatch(batch)` → `{id,kalimat_jepang,arti_indo}[]`
- `explainGrammar(japanese, indonesian)` → string santai 3–4 kalimat, `forceJson=false`

**Tools** `tools/gen-content/`:
- `generate-stories.js` — baca `input/vocab.csv` → call Groq per chapter (delay 5s) → `output/stories.csv` + `stories-scenes.csv` (`judul/scenes{order,cerita_jepang,cerita_indo,image_prompt,chunks}`)
- `generate-sentences.js`, `generate-images.js` (anime illustration dari `image_prompt`)

**Background generate** `lib/backgroundGenerate.ts`: singleton `_isRunning`, `_progress{isRunning,done,total,currentChapter,lastError}`, `subscribeProgress(cb)`, `startBackgroundGenerate(chaptersMap, toSkip)` loop 5s.

**Konjugator** `lib/conjugator.ts`: `conjugateVerb(vocab)` untuk te/ta/nai, handle Group3 `来る/する`, Group2 Ichidan `E_ROW/I_ROW` exception, Godan `い/ち/り→って` dll.

---

## 13. Styling & Design System

Detail di `docs/UI_THEME.md`. Ringkas:

- **Token:** `app/globals.css:5` `@theme` semantic, `.dark` dark, utilitas `.badge-*`, `.shadow-*`, `.rounded-*`, `.bg/text/border-*`
- **Font:** `Noto Sans JP` + `Noto Serif JP` Google Fonts, `.jp` / `.jp-serif`
- **Radius:** 12/16/24/32, Shadow `card 1x4 / elevated 6x24 / float 12x40`
- **Animasi:** `anim-up/down/pop/shake/correct` + `d1-d4` stagger
- **Ikon:** 19 inline SVG `components/ui/icons.tsx`, emoji hanya ekspresif
- **Pola:** Card `surface border-light radius-lg shadow-card`, Button `accent radius-md elevated active:scale-95`, Feedback `fixed bottom rounded-t-[32px] float`

---

## 14. Lingkungan & Konfigurasi

| File | Isi |
|---|---|
| `.env.local.example` | `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` (tanpa `GOOGLE_*` — tambah manual) |
| `next.config.ts:9` | `turbopack.root = cwd()` saja |
| `tsconfig.json:45` | `strict, target ES2017, jsx react-jsx, paths @/*, typeRoots types/` |
| `eslint.config.mjs` | `defineConfig([...nextVitals, ...nextTs], ignore .next/out/build)` |
| `postcss.config.mjs` | `{"@tailwindcss/postcss":{}}` |
| `vercel.json` | `framework:nextjs, build:npm run build, output:.next` |
| `capacitor.config.ts` | Lihat §11 |

**Env wajib runtime:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FIREBASE_*`. Tanpa Firebase, `db = null` → API `/api/sync` return 500 (`lib/firebase-admin.ts:30`).

---

## 15. Build, Deploy & Release

```bash
npm run dev          # http://localhost:3000 Turbopack
npm run build        # WAJIB pass sebelum commit (AGENTS.md:73)
npm run lint         # ESLint
npm run start        # preview production

# PWA
# SW otomatis dari public/sw.js, manifest: public/manifest.json

# Capacitor
npm run build && npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode
# atau native update check via GitHub Releases (app/page.tsx:251)

# Tools
node tools/gen-content/generate-stories.js   # butuh GROQ_API_KEY
node scripts/build-accurate-forms.js
```

**CI (Vercel):** push → `npm run build` → deploy `https://kotoba-quiz-gilt.vercel.app`. Ganti URL di `capacitor.config.ts` jika deploy baru.

**Version:** `CURRENT_VERSION = '0.1.2'` (`app/page.tsx:32`, `package.json:3`). Update di kedua tempat saat rilis + tag `v0.1.3` + attach `.apk` ke Release untuk native update detection.

---

## 16. Observabilitas & Batasan

- **Logging:** `console.log('[Sync] Merging...')`, `console.error('[Vocab] ...', e)`. Belum ada Sentry/LogRocket — pertimbangkan untuk produksi.
- **Cache:** `furiganaCache`, `vocabRefCache` Map 500 (`lib/vocab.ts:324`), `caches kotoba-audio-cache`, `cachedSRSStore/cachedVocab` in-memory.
- **Batasan:** `kotoba_failed_words` cap 50, queue max 10, heatmap 84 hari, Sheets throttle 1 jam, Groq retry 3×, Sync race-safe via pull-merge-push.
- **Non-goal v2** (`PRD.md:124`): multiplayer/leaderboard, AI on-device, voice input, premium.

---

## 17. Roadmap Teknis

| Area | Next Step |
|---|---|
| Testing | Vitest + React Testing Library untuk `srs.ts`/`quiz-engine.ts`/`conjugator.ts` |
| Token | Migrasi ke 3-layer murni + `validate-tokens.cjs` CI |
| A11y | Audit `prefers-reduced-motion`, `Dynamic Type`, screen reader |
| Perf | Virtualize list vocab >500, image lazy di `StoryPlayer` |
| Sync | Background Sync API + IndexedDB untuk data besar |
| AI | Pindah `callGroq` ke `app/api/ai/route.ts` agar key tidak di localStorage |

---

*Dokumen ini melengkapi `docs/CODING_STANDARD.md` (aturan), `docs/UI_THEME.md` (visual), `docs/DATA_FLOW.md` (alur). Sumber kebenaran kritikal tetap `AGENTS.md`.*
