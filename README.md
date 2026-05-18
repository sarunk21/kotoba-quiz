# 言葉カード — Kotoba Quiz

Flashcard kosakata Jepang bergaya Duolingo, dibangun dengan Next.js. Connect ke Google Sheets biar vocab auto-update.

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Google Sheets CSV sebagai data source

## Fitur
- Multiple choice quiz (4 pilihan) bergaya Duolingo
- Streak system
- Lives (3 nyawa)
- Data dari Google Sheets (auto-update)
- Stats persistent (localStorage)
- Daily reminder (browser notification)
- Full mobile-optimized, dark theme

## Setup Google Sheets

Format kolom di Sheet lo:
| kategori | hiragana | kanji | arti |
|---|---|---|---|
| Kata Benda | わたし | 私 | Saya |
| Kata Kerja | ねます | 寝ます | Tidur |

Lalu:
1. File → Share → Publish to web
2. Pilih sheet → CSV → Publish
3. Copy URL → paste di settings app

## Deploy ke Vercel

```bash
git init
git add .
git commit -m "init kotoba quiz"
git remote add origin https://github.com/USERNAME/kotoba-quiz.git
git push -u origin main
```

Lalu import di vercel.com → New Project → pilih repo → Deploy

## Local dev

```bash
npm install
npm run dev
```
