# Design System — Kotoba Quiz

## Visual Identity: Washi & Torii (和紙と鳥居)

Kombinasi estetika kertas tradisional Jepang (washi) dengan merah torii sebagai aksen utama. Terinspirasi dari atmosfer kuil Jepang yang tenang namun bersemangat.

---

## Design Tokens

### Warna

#### Light Mode
| Token | Nilai | Penggunaan |
|---|---|---|
| `--color-bg` | `#f5f0e8` | Latar utama, krem washi |
| `--color-surface` | `#fffdf8` | Card, modal, sheet |
| `--color-text-1` | `#2c2620` | Judul, teks utama |
| `--color-text-2` | `#7a7267` | Deskripsi, info sekunder |
| `--color-text-3` | `#b5ab9e` | Teks redup, counter |
| `--color-border` | `#e5ddd0` | Garis pemisah |
| `--color-accent` | `#d64541` | Tombol utama, CTA, aktif |
| `--color-green` | `#2d8f5a` | Jawaban benar, sukses |
| `--color-red` | `#d64541` | Jawaban salah, error |
| `--color-amber` | `#c77f1b` | Streak, warning |
| `--color-indigo` | `#4f46a5` | Link, info sekunder |

#### Dark Mode
| Token | Nilai |
|---|---|
| `--color-bg` | `#141210` |
| `--color-surface` | `#1e1b17` |
| `--color-text-1` | `#f0ebe3` |
| `--color-text-2` | `#a09888` |
| `--color-text-3` | `#6b6258` |
| `--color-border` | `#302b24` |
| `--color-accent` | `#d64541` (sama) |

### Typography

| Stack | Penggunaan |
|---|---|
| `Noto Sans JP` | UI teks umum, hiragana, kana display |
| `Noto Serif JP` | Kanji display, judul artistik (opsional) |

Ukuran: 10px (badge) → 12px (body) → 14px (card title) → 18-22px (heading) → 44-48px (kanji display)

### Radius

| Token | Nilai |
|---|---|
| `--radius-sm` | 12px (badge, small button) |
| `--radius-md` | 16px (button, input, card kecil) |
| `--radius-lg` | 24px (card utama, modal) |
| `--radius-xl` | 32px (quiz card, large panel) |

### Shadows

| Token | Token CSS | Penggunaan |
|---|---|---|
| Card | `var(--shadow-card)` | Elevation rendah: 1px 4px |
| Elevated | `var(--shadow-elevated)` | Floating elements: 6px 24px |
| Float | `var(--shadow-float)` | Modal, sheet: 12px 40px |

---

## Icons

**Tidak ada library external.** Semua ikon SVG inline di `components/ui/icons.tsx`, gaya:
- Stroke-width: 1.8-2.2px
- Style: stroke-only (line icons), tidak fill
- Warna: inherit via `currentColor`

Emoji hanya diperbolehkan untuk konten ekspresif (🔥 streak celebration, 🎉 hasil, 🐢 slow-mo). Tidak untuk:
- Navigasi
- Tombol aksi
- Status indicator

---

## Component Patterns

### Card
```tsx
<div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] shadow-card p-4">
  {/* content */}
</div>
```

### Button Primary
```tsx
<button className="rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white px-6 py-3.5 text-sm font-extrabold active:scale-95 transition-all shadow-elevated">
  {label}
</button>
```

### Badge
```tsx
<span className="badge bg-[var(--color-accent-light)] text-[var(--color-accent)]">Bab 3</span>
<span className="badge badge-noun">Kata Benda</span>
<span className="badge badge-verb">Kata Kerja</span>
```

### Bottom Sheet
```tsx
<div className="fixed bottom-0 left-0 right-0 z-[160] rounded-t-[32px] border-t bg-[var(--color-green-light)] shadow-float">
  {/* content */}
</div>
```

---

## Spacing

8px grid system:
- 4px  → gap kecil (badge padding)
- 8px  → gap antar item di grid
- 12px → padding card internal
- 16px → padding section
- 24px → spacing antar section
- 32px → spacing halaman, page padding

---

## Animasi

| Class | Durasi | Fungsi |
|---|---|---|
| `anim-up` | 0.32s | Slide dari bawah |
| `anim-down` | 0.28s | Slide dari atas |
| `anim-pop` | 0.4s | Scale up bounce (modal, feedback) |
| `anim-shake` | 0.38s | Salah |
| `anim-correct` | 0.3s | Bounce hijau |

---

## Quiz Screen Patterns

### Header
- Close button (32px, rounded-xl, border) → `IconClose`
- Progress bar: 8px height, rounded-full, `bg-[var(--color-accent)]`
- Hearts: `IconHeartFilled`, opacity per state

### Card Soal
- Background gradient radian dari `cat.bg`
- Kanji display: font-size responsif `2.2rem-3.5rem` tergantung jumlah karakter
- Level pill di bawah: status SRS (Baru / Lv.X / Hafal)

### Choices (MCQ)
- Grid 2 kolom
- Default: `bg-[var(--color-surface)]` + border
- Selected: `bg-[var(--color-green-light)]` atau `bg-[var(--color-red-light)]`
- Others: opacity 30%

### Feedback Sheet
- Fixed bottom, `rounded-t-[32px]`
- Backdrop blur + shadow
- Status text, detail text, optional example sentence
- Tombol "Lanjut →" full-width

### Result Screen
- Emoji besar (80px), judul, subjudul
- Grid 3 stat boxes (Benar, Sesi, Akurasi)
- Tombol "Berlatih Lagi" (primary) + "Kembali" (ghost)

---

## File Structure Referensi

```
app/globals.css          — Token warna, animasi, utility classes
components/ui/icons.tsx  — SVG icon set
components/quiz/
  QuizHeader.tsx         — Header kuis (close, progress, lives)
  FeedbackSheet.tsx      — Bottom sheet feedback
  ResultScreen.tsx       — Hasil kuis
  ExitConfirmModal.tsx   — Modal konfirmasi keluar
lib/quiz-engine.ts       — useQuizEngine hook (state machine)
lib/session.ts           — finishSession (persistensi terpusat)
```
