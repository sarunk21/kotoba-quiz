# Tema UI — Washi & Torii (和紙と鳥居)

> **Identitas visual:** kertas tradisional Jepang (washi) yang tenang + merah torii yang bersemangat.  
> **Sumber token:** `app/globals.css:5-185` (single source of truth)  
> **Prinsip:** `AGENTS.md:13` & `DESIGN_SYSTEM.md:1-180` — token via `var(--color-*)`, jangan hardcode hex, dark via `.dark` di `<html>`.

---

## Daftar Isi
1. [Filosofi & Brand Voice](#1-filosofi--brand-voice)
2. [Arsitektur Token 3 Layer](#2-arsitektur-token-3-layer)
3. [Primitive Tokens](#3-primitive-tokens)
4. [Semantic Tokens](#4-semantic-tokens)
5. [Component Tokens](#5-component-tokens)
6. [Tipografi](#6-tipografi)
7. [Spacing & Layout (8px Grid)](#7-spacing--layout-8px-grid)
8. [Radius & Shadow](#8-radius--shadow)
9. [Warna Lengkap & Palet](#9-warna-lengkap--palet)
10. [Dark Mode](#10-dark-mode)
11. [Ikonografi](#11-ikonografi)
12. [Animasi & Motion](#12-animasi--motion)
13. [Pola Komponen (Specs)](#13-pola-komponen-specs)
14. [Quiz Screen Patterns](#14-quiz-screen-patterns)
15. [State & Variant](#15-state--variant)
16. [Aksesibilitas Kontras](#16-aksesibilitas-kontras)
17. [Tailwind v4 Integration](#17-tailwind-v4-integration)
18. [Anti-Pattern](#18-anti-pattern)
19. [Checklist UI Sebelum Merge](#19-checklist-ui-sebelum-merge)

---

## 1. Filosofi & Brand Voice

| Aspek | Nilai |
|---|---|
| **Nama** | Kotoba Quiz — 言葉カード (Kartu Kata) |
| **Essence** | Tenang (washi) + Fokus (torii) — belajar yang mindful, bukan ngebut |
| **Mood** | Warm, paper-textured, zen tapi ada energi merah torii untuk CTA & streak |
| **Voice** | Ramah, santai, Bahasa Indonesia sehari-hari: *"Bener! 正解！"*, *"Kurang Tepat"*, *"Yuk lanjut!"* — istilah Jepang tetap kanji/kana asli |
| **Audience** | Pelajar Minna no Nihongo Bab 1-25, pemula-menengah, mobile-first |

**Referensi brand** (`brand` skill): warna torii `#d64541` sebagai hero, washi `#f5f0e8` sebagai kanvas. Jangan pakai warna neon/tebal yang tabrak filosofi.

---

## 2. Arsitektur Token 3 Layer

Mengikuti `design-system` skill — **Primitive → Semantic → Component**:

```
Primitive (nilai mentah, brand-agnostic)
    ↓ alias
Semantic (makna: bg, surface, text-1, accent, ... )
    ↓ alias
Component (spesifik komponen: card-bg, button-bg, badge-*)
```

**Kenapa 3 layer?**
- Ganti primitive (mis. torii red) → seluruh semantic ikut tanpa ubah komponen.
- Semantic enable theme switch (light/dark) tanpa sentuh komponen.
- Component token enable kustom per komponen (mis. `cat-noun-bg`).

**Implementasi saat ini:** `app/globals.css:5` pakai `@theme` (Tailwind v4) yang langsung expose semantic sebagai CSS variable. Primitive implisit di nilai hex awal. Component token via utilitas `.badge-noun` dll. (`app/globals.css:183`).

---

## 3. Primitive Tokens

Warna mentah (hex) — **jangan pakai langsung di komponen**, selalu lewat semantic.

| Primitive | Hex | Penggunaan awal |
|---|---|---|
| `washi-50` | `#fffdf8` | surface light |
| `washi-100` | `#f5f0e8` | bg light |
| `washi-200` | `#ece6da` | border-light |
| `washi-300` | `#e5ddd0` | border |
| `ink-900` | `#2c2620` | text-1 light |
| `ink-500` | `#7a7267` | text-2 |
| `ink-300` | `#b5ab9e` | text-3 |
| `torii-500` | `#d64541` | accent / red |
| `torii-600` | `#c03a36` | accent-hover / red-dark |
| `torii-50` | `#fbeaea` | accent-light / red-light |
| `forest-600` | `#2d8f5a` | green |
| `forest-50` | `#e6f7ee` | green-light |
| `forest-700` | `#227347` | green-dark |
| `amber-600` | `#c77f1b` | amber |
| `amber-50` | `#fef3dc` | amber-light |
| `indigo-600` | `#4f46a5` | indigo |
| `indigo-50` | `#eceafe` | indigo-light |
| `purple-600` | `#7c3daa` | purple |
| `purple-50` | `#f5ecfc` | purple-light |

---

## 4. Semantic Tokens

Didefinisikan di `app/globals.css:9-58` dalam `@theme`. Pakai ini di komponen.

### Light Mode

| Token | Nilai | Fungsi |
|---|---|---|
| `--color-bg` | `#f5f0e8` | Latar utama (washi) |
| `--color-surface` | `#fffdf8` | Card, modal, sheet |
| `--color-surface-hover` | `#f9f5ed` | Hover card |
| `--color-border` | `#e5ddd0` | Garis pemisah |
| `--color-border-light` | `#ece6da` | Border halus card |
| `--color-text-1` | `#2c2620` | Judul, teks utama |
| `--color-text-2` | `#7a7267` | Deskripsi, sekunder |
| `--color-text-3` | `#b5ab9e` | Counter, disabled |
| `--color-accent` | `#d64541` | CTA, link aktif, progress |
| `--color-accent-hover` | `#c03a36` | Hover CTA |
| `--color-accent-light` | `#fbeaea` | BG badge, highlight |
| `--color-accent-glow` | `rgba(214,69,65,0.18)` | Glow CTA |
| `--color-green` | `#2d8f5a` | Benar, sukses |
| `--color-green-light` | `#e6f7ee` | BG feedback benar |
| `--color-green-dark` | `#227347` | Teks hijau tegas |
| `--color-red` | `#d64541` | Salah, error (sama accent) |
| `--color-red-light` | `#fbeaea` | BG feedback salah |
| `--color-red-dark` | `#c03a36` | Teks merah tegas |
| `--color-amber` | `#c77f1b` | Streak, warning |
| `--color-amber-light` | `#fef3dc` | BG streak |
| `--color-amber-dark` | `#a36616` | Teks amber tegas |
| `--color-indigo` | `#4f46a5` | Link, info |
| `--color-indigo-light` | `#eceafe` | BG indigo |
| `--color-purple` | `#7c3daa` | Varian |
| `--color-purple-light` | `#f5ecfc` | BG purple |

### Kategori Kosakata

| Token | Warna | BG | Kategori |
|---|---|---|---|
| `--color-cat-noun` / `-bg` | `#4f46a5` | `#eceafe` | Kata Benda |
| `--color-cat-verb` / `-bg` | `#2d8f5a` | `#e6f7ee` | Kata Kerja |
| `--color-cat-adj` / `-bg` | `#d64541` | `#fbeaea` | Kata Sifat |

> Ekstensi kategori (angka/hari/uang dll.) di `app/quiz/page.tsx:48-54` pakai `rgba` inline — pertimbangkan promosikan ke token jika sering dipakai.

---

## 5. Component Tokens

Utilitas & kelas komponen di `app/globals.css:150-185`:

```css
/* app/globals.css:154-185 */
.bg-surface       { background: var(--color-surface); }
.bg-accent-light { background: var(--color-accent-light); }
.text-accent     { color: var(--color-accent); }
.border-app      { border-color: var(--color-border); }
.rounded-lg      { border-radius: var(--radius-lg); }
.badge-noun      { background: var(--color-cat-noun-bg); color: var(--color-cat-noun); }
.badge-verb      { background: var(--color-cat-verb-bg); color: var(--color-cat-verb); }
.badge-adj       { background: var(--color-cat-adj-bg);  color: var(--color-cat-adj); }
```

**Rekomendasi 3-layer murni (jika migrasi):**

```css
/* Primitive (sudah ada) */
/* Semantic (sudah ada — di @theme) */
/* Component — tambahkan jika butuh varian khusus */
--card-bg: var(--color-surface);
--card-border: var(--color-border-light);
--card-radius: var(--radius-lg);
--card-shadow: var(--shadow-card);

--button-primary-bg: var(--color-accent);
--button-primary-bg-hover: var(--color-accent-hover);
--button-primary-text: #fff;

--badge-noun-bg: var(--color-cat-noun-bg);
--badge-noun-text: var(--color-cat-noun);
```

---

## 6. Tipografi

### Font Stack

```css
/* app/globals.css:1-7 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Noto+Serif+JP:wght@400;500;700;900&display=swap');
--font-sans: 'Noto Sans JP', -apple-system, "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif;
--font-serif: 'Noto Serif JP', serif;
```

| Stack | Penggunaan |
|---|---|
| `Noto Sans JP` (`.jp`) | UI umum, hiragana, romaji, body |
| `Noto Serif JP` (`.jp-serif`) | Kanji display artistik, judul hero |

> `GEMINI.md:8` menyebut `Plus Jakarta Sans` sebagai fallback historis — kini `Noto Sans JP` yang aktif. Jangan campur tanpa alasan.

### Skala Ukuran

| Token | Ukuran | Penggunaan |
|---|---|---|
| `text-[10px]` | 10px, `font-black uppercase tracking-wider` | Badge, label section (`Grafik Aktivitas`, `KATA HARI INI`) |
| `text-xs` (12px) | 12px | Body kecil, arti, deskripsi |
| `text-sm` (14px) | 14px | Card title, pilihan jawaban |
| `text-base` (16px) | 16px | Pertanyaan `Artinya apa?` |
| `text-lg/xl/2xl` | 18–24px | Heading halaman |
| Kanji display | `2.2rem–3.5rem` responsif | `app/quiz/page.tsx:341` `main.length>6?2.2rem:>3?2.8rem:3.5rem` |
| Emoji result | 80px | `ResultScreen` |

**Berat:** `400` normal, `600` semibold, `700` bold, `800` extrabold, `900` black (`font-black` untuk label uppercase).

---

## 7. Spacing & Layout (8px Grid)

`DESIGN_SYSTEM.md:113`:

| Jarak | Nilai | Penggunaan |
|---|---|---|
| XS | 4px | Badge padding, gap kecil |
| S | 8px | Gap grid, `gap-2` |
| M | 12px | Padding card internal `p-3` |
| L | 16px | Padding section `p-4` |
| XL | 24px | Spasi antar section `gap-6`, `mb-6` |
| 2XL | 32px | Page padding `px-4 pt-12`, card utama |

**Container:** `max-w-sm md:max-w-2xl mx-auto px-4` — mobile 384px, tablet 672px. Selalu `mx-auto` + `px-4` agar tidak mepet notch.

**Safe area:** `overscroll-behavior: none`, `min-height: 100dvh` (`app/globals.css:96-102`). Header & BottomNav respect `env(safe-area-inset-*)` jika perlu (saat ini via padding).

---

## 8. Radius & Shadow

### Radius (`app/globals.css:54-57`)

| Token | Nilai | Penggunaan |
|---|---|---|
| `--radius-sm` | 12px | Badge, small button |
| `--radius-md` | 16px | Button pilihan, input |
| `--radius-lg` | 24px | Card utama, modal |
| `--radius-xl` | 32px | Quiz card, panel besar, bottom sheet (`rounded-t-[32px]`) |

### Shadow (`app/globals.css:50-52`)

| Token | Nilai | Penggunaan |
|---|---|---|
| `--shadow-card` | `0 1px 4px rgba(44,38,32,0.06)` | Card elevation rendah |
| `--shadow-elevated` | `0 6px 24px rgba(44,38,32,0.09)` | Floating, bottom nav |
| `--shadow-float` | `0 12px 40px rgba(44,38,32,0.13)` | Modal, feedback sheet |

Kelas utilitas: `.shadow-card`, `.shadow-elevated`, `.shadow-float` (`app/globals.css:109`).

---

## 9. Warna Lengkap & Palet

### Palet Utama (Washi & Torii)

```
Washi (warm neutrals)  : #f5f0e8  #fffdf8  #ece6da  #e5ddd0  #b5ab9e  #7a7267  #2c2620
Torii (hero)           : #d64541  #c03a36  #fbeaea  rgba(214,69,65,0.18)
Forest (success)       : #2d8f5a  #227347  #e6f7ee
Amber (streak)         : #c77f1b  #a36616  #fef3dc
Indigo (info)          : #4f46a5          #eceafe
Purple (varian)        : #7c3daa          #f5ecfc
```

### Penggunaan per Konteks

| Konteks | Warna | Contoh |
|---|---|---|
| CTA primer | `accent #d64541` + `text-white` | Tombol `Berlatih`, progress bar |
| Sukses | `green #2d8f5a` / `green-light` | Feedback benar, badge Hafal |
| Error | `red #d64541` / `red-light` | Feedback salah, hapus |
| Streak | `amber #c77f1b` / `amber-light` | 🔥 badge 3x |
| Info | `indigo #4f46a5` | Link, penjelasan grammar |
| Kategori | `cat-*` | Pill kategori di card soal |

### Kontras (WCAG)

Semua pasangan teks di atas background memenuhi ≥4.5:1 untuk `text-1` dan ≥3:1 untuk `text-2` di light mode. Dark mode (`#f0ebe3` di `#1e1b17` ≈ 13:1). Selalu tes dengan tool kontras sebelum tambah warna baru.

---

## 10. Dark Mode

Aktif via class `.dark` di `<html>` (`app/layout.tsx` inline script baca `kotoba_theme` atau `prefers-color-scheme`).

```css
/* app/globals.css:60-88 */
.dark {
  --color-bg: #141210;
  --color-surface: #1e1b17;
  --color-surface-hover: #28251f;
  --color-border: #302b24;
  --color-border-light: #26221c;
  --color-text-1: #f0ebe3;
  --color-text-2: #a09888;
  --color-text-3: #6b6258;
  --color-accent-light: rgba(214,69,65,0.15);
  --color-green-light: rgba(45,143,90,0.12);
  /* ... semua *-light jadi rgba(...,0.12) */
  --shadow-card: 0 1px 4px rgba(0,0,0,0.25);
}
```

**Aturan:**
- Jangan hardcode `bg-white` / `bg-[#1a1d24]` — pakai `bg-[var(--color-surface)]` yang otomatis switch.
- Jika perlu override dark, pakai `dark:bg-[#1a1d24]` hanya untuk legacy — usahakan token.
- Variant Tailwind: `@variant dark (&:where(.dark, .dark *));` (`app/globals.css:60`).

---

## 11. Ikonografi

**Tidak ada library eksternal.** Semua ikon SVG inline di `components/ui/icons.tsx` (19 ikon):

```
IconHome, IconBook, IconBolt, IconSettings, IconTarget,
IconClose (16), IconBack (18), IconChevronRight,
IconVolume, IconSlowMo (volume+clock),
IconHeartFilled, IconCheckCircle, IconXCircle, IconWarning,
IconPlus, IconSearch, IconLightbulb, IconEye, IconEyeOff
```

**Spesifikasi:**
- Stroke 1.8–2.2px, `stroke="currentColor"`, `fill="none"` (line icon), `currentColor` inherit.
- Ukuran default 16–20px, prop `size?: number`.
- **Emoji hanya untuk ekspresif:** 🔥 streak, 🎉 result, 🐢 slow-mo. **Jangan** untuk navigasi/tombol/status (`DESIGN_SYSTEM.md:69`, `AGENTS.md:15`).

**Contoh pakai:**

```tsx
import { IconVolume, IconHeartFilled } from '@/components/ui/icons'
<button className="w-8 h-8 rounded-xl flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-2)]">
  <IconVolume size={14} />
</button>
```

---

## 12. Animasi & Motion

Didefinisikan `app/globals.css:113-142`:

| Class | Durasi | Easing | Penggunaan |
|---|---|---|---|
| `anim-up` | 0.32s | `cubic-bezier(0.22,1,0.36,1)` slideY 16px | Card soal, heatmap, section |
| `anim-down` | 0.28s | sama | Dropdown, header |
| `anim-pop` | 0.4s | `cubic-bezier(0.34,1.56,0.64,1)` scale 0.88→1.04→1 | Modal, feedback bounce |
| `anim-shake` | 0.38s | `ease` translateX ±7px | Jawaban salah |
| `anim-correct` | 0.3s | `ease` scale 1.03 | Jawaban benar |
| `.d1-.d4` | +0.05–0.2s delay | — | Stagger beranda (`anim-up d1`) |

**Aturan motion:**
- Micro-interaction 150–300ms (`ui-ux-pro-max` guideline). `anim-pop` 400ms max untuk modal.
- `active:scale-95` untuk tombol (feedback tap 80–150ms).
- Hormati `prefers-reduced-motion` jika user aktif (opsional: `@media (prefers-reduced-motion: reduce) { .anim-* { animation:none } }`).

---

## 13. Pola Komponen (Specs)

### Card Standar

```tsx
<div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-lg)] shadow-card p-4">
  {/* content */}
</div>
```

| State | Token |
|---|---|
| Default | `bg surface`, `border-light`, `shadow-card`, `radius-lg` |
| Hover | `bg surface-hover` |
| Pressed | `scale-95`, `shadow-card` tetap |

### Button Primary (CTA)

```tsx
<button className="rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white px-6 py-3.5 text-sm font-extrabold active:scale-95 transition-all shadow-elevated hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:pointer-events-none">
  {label}
</button>
```

| State | Background | Text | Shadow |
|---|---|---|---|
| Default | `accent #d64541` | `#fff` | `elevated` |
| Hover | `accent-hover #c03a36` | `#fff` | `elevated` |
| Active | `accent-hover` + `scale-95` | `#fff` | `none` |
| Disabled | `accent` `opacity-40` | `#fff` | `none` |

### Button Ghost / Secondary

```tsx
<button className="rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-text-2)] px-6 py-3.5 text-sm font-bold border border-[var(--color-border)] active:scale-95">
  Batal
</button>
```

### Badge

```tsx
<span className="badge bg-[var(--color-accent-light)] text-[var(--color-accent)]">Bab 3</span>
<span className="badge badge-noun">Kata Benda</span>
<span className="badge badge-verb">Kata Kerja</span>
<span className="badge badge-adj">Kata Sifat</span>
```
`.badge` base: `text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full` (definisi di komponen).

### Bottom Sheet (Feedback)

```tsx
<div className="fixed bottom-0 left-0 right-0 z-[160] rounded-t-[32px] border-t bg-[var(--color-green-light)] dark:bg-[var(--color-green-light)] shadow-float backdrop-blur anim-up">
  {/* lihat FeedbackSheet.tsx */}
</div>
```

### Modal (Exit Confirm)

Overlay `bg-black/50 backdrop-blur-sm z-[170]`, card `bg-[var(--color-surface)] rounded-[28px] p-8 shadow-float anim-pop` (`components/quiz/ExitConfirmModal.tsx`).

---

## 14. Quiz Screen Patterns

> `DESIGN_SYSTEM.md:137`

### Header (`components/quiz/QuizHeader.tsx`)

- Close: `w-9 h-9 (36px) rounded-xl border bg-surface` → `IconClose size 16`
- Progress: `h-2.5 rounded-full border-light overflow-hidden`, fill `bg-[var(--color-accent)]` width `{progress}%`
- Hearts: `IconHeartFilled` ×3, opacity 100/30 sesuai `lives`, hide jika `livesEnabled=false`
- Badges: kanan, `chapter`, `refresh`, `🔥 streak`

### Card Soal

- `rounded-[var(--radius-xl)] p-6 sm:p-8`, radial gradient `cat.bg` di `50% 0%` transparan 65% (`app/quiz/page.tsx:279`)
- Kanji: `font-bold jp` size responsif 2.2–3.5rem, furigana `<ruby><rt style="font-size:0.38em">`
- Level pill: `rounded-full px-3 py-1 bg-bg border-light` + dot warna (green accent amber gray)
- Actions kanan atas: `あ` furigana toggle, `🐢` slow, `IconVolume` normal (w-8 h-8 rounded-xl)

### Choices (MCQ)

- Grid `grid-cols-2 gap-2.5`
- Default: `bg surface border 1.5px border` `shadow-card`
- Selected benar: `bg green-light border 2px green text green-dark anim-correct`
- Selected salah: `bg red-light border 2px red text red-dark anim-shake`
- Lainnya saat answered: `opacity 30%`, `shadow none`
- `onPointerDown playTap()` untuk feedback sebelum `answer()`

### Feedback Sheet (`components/quiz/FeedbackSheet.tsx`)

- Fixed bottom `z-[160] rounded-t-[32px] border-t shadow-float anim-up`
- BG `green-light` jika benar, `red-light` jika salah (border `green`/`red`)
- Status: `Bener!` / `🔥 3x Streak!` / `Salah!` (`app/quiz/page.tsx:403`)
- Detail: `Naik level → review N hari lagi` atau `Jawaban tepat: <arti>`
- Contoh kalimat (jika ada `contohKalimat`): `addFuriganaToSentence()` + 2 tombol audio `Kata Saja` / `Kalimat Penuh`
- Tombol `Lanjut →` full-width `bg green` atau `bg red` (`FeedbackSheet` prop `nextLabel`)

### Result Screen (`components/quiz/ResultScreen.tsx`)

- Emoji 80px (`🎉` jika ≥80% else `💪`), judul `Sesi Selesai!`, subjudul
- Stat grid 3: `Benar/Sesi/Akurasi` dengan ikon `Target/Bolt/%`
- Tombol `Berlatih Lagi` primary + `Kembali` ghost

---

## 15. State & Variant

| Komponen | Default | Hover | Active | Disabled | Selected-Correct | Selected-Wrong |
|---|---|---|---|---|---|---|
| Card | `surface` | `surface-hover` | `scale-95` | — | — | — |
| Button Primary | `accent` | `accent-hover` | `scale-95` | `opacity-40` | — | — |
| Choice | `surface` `border` | `surface-hover` | `scale-95` | `opacity-30` (after answer) | `green-light` `border-green` | `red-light` `border-red` |
| Badge | `accent-light` | — | — | — | `green-light` | `amber-light` |

Semua transition `transition-all` 150–300ms, `active:scale-95`.

---

## 16. Aksesibilitas Kontras

- **Light:** `text-1 #2c2620` di `surface #fffdf8` ≈ 14:1 ✅, `text-2 #7a7267` di `bg #f5f0e8` ≈ 4.8:1 ✅
- **Dark:** `text-1 #f0ebe3` di `surface #1e1b17` ≈ 13:1 ✅, `text-2 #a09888` di `bg #141210` ≈ 6:1 ✅
- Border light `#ece6da` di `surface` terlihat tapi tidak mengganggu; di dark `rgba` tetap visible.
- Jangan andalkan warna saja — feedback benar/salah juga beda ikon (`CheckCircle` vs `XCircle`) dan teks.

---

## 17. Tailwind v4 Integration

```css
/* app/globals.css:3-5 */
@import "tailwindcss";
@theme {
  --color-bg: #f5f0e8;
  /* ... semua token */
}
@variant dark (&:where(.dark, .dark *));
```

- `@theme` otomatis jadi utility `bg-[var(--color-bg)]` dll.
- Arbitrary value: `bg-[var(--color-surface)]` adalah pola kanonik (bukan `bg-surface` tanpa var).
- `rounded-[var(--radius-lg)]`, `shadow-card` via `.shadow-card` class.
- Jangan pakai `tailwind.config.js` — Tailwind v4 pakai CSS-first (`postcss.config.mjs: @tailwindcss/postcss`).

**Contoh lengkap:**

```tsx
<div className="bg-[var(--color-bg)] min-h-dvh">
  <div className="max-w-sm md:max-w-2xl mx-auto px-4 pt-12 pb-36">
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-[var(--radius-xl)] shadow-elevated p-6 anim-up">
      <h2 className="text-2xl font-extrabold text-[var(--color-text-1)] jp-serif">こんにちは</h2>
      <p className="text-sm text-[var(--color-text-2)] mt-2">Halo — sapaan sehari-hari</p>
      <span className="badge badge-noun mt-3 inline-block">Kata Benda • Bab 1</span>
    </div>
    <button className="mt-4 w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white py-3.5 font-extrabold shadow-elevated active:scale-95">Mulai Belajar →</button>
  </div>
</div>
```

---

## 18. Anti-Pattern

| ❌ Jangan | ✅ Lakukan | Kenapa |
|---|---|---|
| `style={{background:'#fffdf8'}}` | `className="bg-[var(--color-surface)]"` | Dark mode rusak, tidak konsisten |
| `bg-white` hardcode | `bg-[var(--color-surface)]` | Token switch otomatis |
| Emoji untuk close/back/settings | `IconClose/IconBack/IconSettings` | Inkonsisten, tidak ikut `currentColor` |
| `text-gray-500` random | `text-[var(--color-text-2)]` | Palet washi terkontrol |
| `rounded-2xl` arbitrary | `rounded-[var(--radius-lg)]` | Radius sistem 12/16/24/32 |
| `shadow-lg` Tailwind default | `shadow-card/elevated/float` | Shadow washi punya warna `rgba(44,38,32,...)` |
| Animasi >500ms | `anim-up 0.32s` / `anim-pop 0.4s` | Terlalu lambat, UX lemot |

Validasi bisa pakai `scripts/validate-tokens.cjs --dir app/ --dir components/` (dari `design-system` skill) untuk cari hardcode hex.

---

## 19. Checklist UI Sebelum Merge

- [ ] Tidak ada hex hardcode (`#` di `className/style`) — grep `#[0-9a-fA-F]{3,6}` kosong
- [ ] Semua warna via `var(--color-*)`
- [ ] Dark mode diuji (toggle `kotoba_theme` + `prefers-color-scheme`)
- [ ] Ikon dari `components/ui/icons.tsx`, bukan emoji untuk aksi
- [ ] Radius pakai `var(--radius-*)`, shadow pakai `shadow-*`
- [ ] Animasi pakai `anim-*` + `d1-d4` jika stagger
- [ ] Touch target ≥44px, spacing 8px grid
- [ ] Card/Modal/BottomSheet ikut pola `DESIGN_SYSTEM.md:81-109`
- [ ] Tipografi: `jp` untuk kana/kanji, `jp-serif` hanya untuk display artistik
- [ ] Kontras teks ≥4.5:1 di kedua tema

---

*Token adalah kontrak. Ubah `app/globals.css` → update `DESIGN_SYSTEM.md` + `docs/UI_THEME.md` + screenshot perbandingan light/dark.*
