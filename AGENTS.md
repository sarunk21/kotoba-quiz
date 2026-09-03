# AGENTS.md

Panduan untuk AI agents dan developer yang mengerjakan Kotoba Quiz.

## Project Overview
Next.js 16 (App Router) + React 19 + Tailwind v4 + Capacitor 8. Offline-first Japanese learning app dengan SRS.

## Critical Rules

### 1. Next.js Version Warning
**Ini bukan Next.js yang kamu kenal.** Baca `node_modules/next/dist/docs/` sebelum menulis kode API baru. Heed deprecation notices.

### 2. Design System — Washi & Torii
- **WAJIB baca** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) sebelum styling.
- Gunakan token dari `app/globals.css` (misal: `var(--color-accent)`), **JANGAN hardcode hex**.
- Emoji hanya untuk konten ekspresif. UI icons → `components/ui/icons.tsx`.
- Dark mode wajib support via `.dark` class di `<html>`.

### 3. Quiz Engine — Jangan Duplikasi Logic
Semua quiz WAJIB pakai `useQuizEngine` dari `lib/quiz-engine.ts`:

```tsx
import { useQuizEngine } from '@/lib/quiz-engine'

const engine = useQuizEngine<MyQuestionType>({
  queue,                          // array soal
  srsEnabled: true,
  getSrsId: q => q.id,            // prefix sesuai mode
  checkAnswer: (q, choice) => choice === q.correct,
})

// Render:
// <QuizHeader /> dari components/quiz/QuizHeader.tsx
// <FeedbackSheet /> dari components/quiz/FeedbackSheet.tsx
// <ResultScreen /> dari components/quiz/ResultScreen.tsx
// <ExitConfirmModal /> dari components/quiz/ExitConfirmModal.tsx
```

**Larangan:**
- ❌ Membuat state machine quiz sendiri (lives/streak/phase)
- ❌ Memanggil `saveSRS` + `updateAfterSession` + `pushToCloud` manual → gunakan `finishSession()` dari `lib/session.ts`
- ❌ Menulis modal konfirmasi exit sendiri
- ❌ Hardcode jumlah soal selain konstanta di engine (10)

### 4. SRS ID Prefix Convention
| Konten | Format |
|---|---|
| Vocab | `{vocab_id}` langsung |
| Kana | `kana_{hiragana\|katakana}_{kana_id}` |
| Partikel | `particle_{question_id}` |
| Kalimat | `sentence_{question_id}` |

### 5. localStorage Schema — JANGAN Diubah
Skema existing dipertahankan demi kompatibilitas data user:
- `kotoba_srs` — SRS store
- `kotoba_stats` — streak/sesi global
- `kotoba_vocab`, `kotoba_study_history`, `kotoba_failed_words`
- `kotoba_sync_mode`, `kotoba_lives_enabled` (settings)
- dst.

Akses localStorage HANYA melalui modul `lib/*` (`srs.ts`, `stats.ts`, `cloud.ts`, `session.ts`). Jangan panggil `localStorage.getItem('kotoba_*')` langsung di komponen.

### 6. File Conventions
- Komponen shared: `components/` (PascalCase file)
- Komponen quiz: `components/quiz/`
- Icons: `components/ui/icons.tsx` (export named function)
- Hooks/logic: `lib/` (camelCase file)
- Pages: `app/{route}/page.tsx` (default export)

### 7. Commands
```bash
npm run dev      # dev server
npm run build    # production build (WAJIB pass sebelum commit)
npm run lint     # ESLint
```

### 8. Bahasa & Copy
- UI copy: **Bahasa Indonesia**
- Istilah Jepang: tetap dalam kanji/kana asli
- Feedback positif: "Bener!", "Benar! 正解！"
- Feedback negatif: "Salah!", "Kurang Tepat"

---

## Architecture Notes

### Data Flow Quiz Session
```
User jawab → engine.answer(choice)
  ├─ checkAnswer() → boolean
  ├─ onAnswered() callback (opsional, misal recordFailedWord)
  ├─ SRS update: onCorrect/onWrong → srsRef
  └─ Sound: playCorrect/playWrong/playStreak/playLevelUp

engine.next()
  ├─ Cek lives / akhir queue
  └─ finishSession(store, correct, total)   ← lib/session.ts
      ├─ saveSRS()
      ├─ updateAfterSession()               ← stats + study history
      ├─ rescheduleDailyReminderIfNeeded()
      └─ pushToCloud() jika auto-sync
```

### Shared Components Map
| Component | Lokasi | Dipakai di |
|---|---|---|
| `QuizHeader` | components/quiz | Semua halaman kuis |
| `FeedbackSheet` | components/quiz | Semua halaman kuis |
| `ResultScreen` | components/quiz | Semua halaman kuis |
| `ExitConfirmModal` | components/quiz | Semua halaman kuis |
| `BottomNav` | components | Beranda, Kosakata, dsb |

---

## Common Pitfalls

1. **Hydration mismatch** dengan localStorage → selalu load di `useEffect`, jangan saat render pertama.
2. **Back button di quiz** → sudah ditangani engine via popstate listener; jangan tambah duplikat.
3. **Audio autoplay** → hanya boleh setelah user interaction (browser policy). Engine memicu `speakJapanese` saat phase berubah ke 'question' setelah tap "Mulai".
4. **Cloud sync race condition** → `pushToCloud` = `syncToCloud` (pull-merge-push). Aman dipanggil berkali-kali.
5. **Capacitor vs Web** → cek `Capacitor.isNativePlatform()` sebelum pakai native API (GoogleSignIn, notifications).
