# Kotoba Quiz - Development Mandates

## Data Model & Spreadsheet Structure
- **Spreadsheet Format**: The application expects a Google Sheets CSV with 5 columns: `Kategori | Hiragana | Kanji | Arti | Bab`.
- **Chapter Support**: Always use the 5th column (`chapter` field in `VocabItem`) for grouping and filtering. If empty, default to "Tanpa Bab".
- **ID Generation**: Vocabulary IDs are generated based on `category|hiragana|kanji|arti`. **DO NOT** include the chapter in the ID hash to ensure SRS progress persists even if a word is moved to a different chapter.

## UI & Aesthetics
- **Typography**: Adhere to the Bunpo-inspired font stack: `Plus Jakarta Sans`, `-apple-system`, `Hiragino Kaku Gothic ProN`, `Hiragino Sans`, `Noto Sans JP`, `sans-serif`.
- **Progress Bars**: Chapter progress must be calculated using a granular, level-based weighted system (Level 0-6) to provide immediate visual feedback.

## Notifications & PWA
- **Notifications**: Uses a local reminder system managed in `lib/notifications.ts`.
- **Service Worker**: The app uses `public/sw.js` for PWA capabilities and notification handling. Registration occurs in `app/layout.tsx`.
- **Streak UI**: Visual states for streaks must reflect the current day's activity (e.g., dimming when not practiced).
