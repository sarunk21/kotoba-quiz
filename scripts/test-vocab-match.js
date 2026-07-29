const fs = require('fs');
const path = require('path');
const vocabData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/vocab-default.json'), 'utf-8'));

const romajiMap = {
  "わたし": "watashi",
  "あなた": "anata",
  "あのひと": "anohito",
  "あのかた": "anokata",
  "さん": "san",
  "ちゃん": "chan",
  "じん": "jin",
  "せんせい": "sensei",
  "きょうし": "kyoushi",
  "がくせい": "gakusei",
  "かいしゃいん": "kaishain",
  "しゃいん": "shain",
  "ぎnこういん": "ginkoin",
  "いしゃ": "isha",
  "けんきゅうしゃ": "kenkyuusha",
  "だいがく": "daigaku",
  "びょういん": "byouin",
  "だれ": "dare",
  "どなた": "donata",
  "さい": "sai",
  "なんさい": "nansai",
  "おいくつ": "oikutsu",
  "はい": "hai",
  "いいえ": "iie"
};

function determineVocabCorrectAnswer(title, choices) {
  if (!choices || choices.length === 0) return choices[0] || '';

  const cleanTitle = title.replace(/（[^）]+）|\([^\)]+\)/g, '').trim();
  const parts = cleanTitle.split(/[:：]/).map(p => p.trim());
  const mainText = parts[0] || '';
  const subText = parts[1] || '';

  let matchItem = null;
  for (const v of vocabData) {
    if (v.kanji && v.kanji.trim() === mainText) { matchItem = v; break; }
    if (v.hiragana && v.hiragana.trim() === mainText) { matchItem = v; break; }
  }

  if (!matchItem && subText) {
    for (const v of vocabData) {
      if (v.arti && (v.arti.trim().toLowerCase() === subText.toLowerCase())) {
        matchItem = v; break;
      }
    }
  }

  console.log("Matched item for title:", title, "=>", matchItem);

  if (matchItem) {
    const expectedRomaji = romajiMap[matchItem.hiragana.trim()] || '';
    console.log("Expected Romaji:", expectedRomaji);
    for (const c of choices) {
      const cleanC = c.trim();
      const normC = cleanC.toLowerCase().replace(/\s+/g, '');
      console.log("   Check choice:", c, "normC:", normC);
      if (cleanC === matchItem.hiragana.trim()) return c;
      if (cleanC === matchItem.kanji.trim()) return c;
      if (cleanC.toLowerCase() === matchItem.arti.trim().toLowerCase()) return c;
      if (expectedRomaji && normC === expectedRomaji) return c;
    }
  }

  return choices[0];
}

const choices = ["O Na Ta", "O Na Da", "A Na Ta", "A Na Da"];
console.log("Final Result:", determineVocabCorrectAnswer("あなた  (KB) : Kamu / Anda", choices));
