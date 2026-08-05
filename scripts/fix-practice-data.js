const fs = require('fs');
const path = require('path');

const practicePath = path.join(__dirname, '../public/data/practice-default.json');
const vocabPath = path.join(__dirname, '../public/data/vocab-default.json');

const practiceData = JSON.parse(fs.readFileSync(practicePath, 'utf-8'));
const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

// Build lookup dictionary
const dict = {};
vocabData.forEach(v => {
  if (v.hiragana && v.arti) dict[v.hiragana.trim()] = v.arti.trim();
  if (v.kanji && v.arti) dict[v.kanji.trim()] = v.arti.trim();
});

// Custom grammar & translation overrides
const exactRules = [
  // Bab 1
  { titleContains: "わたし は マイク・ミラー です", correct: "Saya Mike Miller" },
  { titleContains: "わたし は かいしゃいん です", correct: "Saya adalah pegawai perusahaan" },
  { titleContains: "ワンさん は ちゅうごくじん です", correct: "Sdr. Wang adalah orang Cina" },
  { titleContains: "ワンさん は いしゃ です", correct: "Sdr. Wang adalah dokter" },
  { titleContains: "わたし は カール・シュミット じゃ ありません", correct: "Saya bukan Carl Schmidt" },
  { titleContains: "わたし は  きょうし では ありません", correct: "Saya bukan wali kelas" },
  { titleContains: "イーさん は  アメリカ人 じゃ ありません", correct: "Sdr. Ii bukan orang Amerika" },
  { titleContains: "イーさん は  がくせい では ありません", correct: "Sdr. Ii bukan pelajar" },
  { titleContains: "あの ひと は きむらさん ですか", correct: "Apakah orang itu Sdr. Kimura?" },
  { titleContains: "あの ひと は マリアさん ですか", correct: "Apakah orang itu Sdri. Maria" },
  { titleContains: "あの ひと は だれ（どなた） ですか", correct: "Siapakah orang itu?" },
  { titleContains: "わたし は IMC の しゃいん です", correct: "Saya adalah pegawai IMC" },
  { titleContains: "カリナさん は ふじだいがく の がくせい です", correct: "Sdri. Karina adalah mahasiswi Universitas Fuji" },
  { titleContains: "ワットさん は さくらだいがく の せんせい です", correct: "Sdr. Watt adalah guru Universitas Sakura" },
  { titleContains: "サントスさんは ブラジル人 です", correct: "Sdr. Santos adalah orang Brazil" },
];

function solveQuestion(q) {
  const title = q.title.trim();
  const choices = q.choices;

  // 1. Check exact manual rules
  for (const rule of exactRules) {
    if (title.includes(rule.titleContains)) {
      const matchedChoice = choices.find(c => c.trim() === rule.correct.trim() || c.trim().toLowerCase() === rule.correct.trim().toLowerCase());
      if (matchedChoice) return matchedChoice;
    }
  }

  // 2. If question title contains Indonesian hint after colon ':'
  // e.g. "あした、（　　　　）だったら、ゴルフをしませんか。: Besok kalau cuacanya bagus, mau main golf ngga?"
  if (title.includes(':')) {
    const parts = title.split(':');
    const idHint = parts[1].trim().toLowerCase();

    // Find choice that best matches the hint or grammar
    let maxMatchScore = -100;
    let bestChoice = choices[0];

    choices.forEach(c => {
      let score = 0;
      const normC = c.trim().toLowerCase();

      if (idHint === normC) score += 100;
      else if (idHint.includes(normC)) score += 50;
      else if (normC.includes(idHint)) score += 40;

      // Match vocabulary words from dictionary
      for (const [jpKey, idVal] of Object.entries(dict)) {
        const normVal = idVal.toLowerCase();
        if (idHint.includes(normVal) && normC.includes(normVal)) score += 20;
      }

      if (score > maxMatchScore) {
        maxMatchScore = score;
        bestChoice = c;
      }
    });

    if (maxMatchScore > 0) return bestChoice;
  }

  // 3. Heuristic matching based on pronouns, negations, particles, and keywords
  let bestScore = -999;
  let selectedChoice = choices[0];

  choices.forEach(c => {
    let score = 0;
    const cNorm = c.trim().toLowerCase();

    // Check negation match
    const isJpNeg = /じゃ\s*ありません|では\s*ありません|ありません|いません|くない|ない|ません/.test(title);
    const isCNeg = /bukan|tidak|belum|jangan/.test(cNorm);
    if (isJpNeg === isCNeg) score += 30;
    else score -= 40;

    // Check question match
    const isJpQ = /ですか|ですか\？|？|\?/.test(title);
    const isCQ = /\?|apakah|siapa|kemana|di mana|berapa|apa/.test(cNorm);
    if (isJpQ === isCQ) score += 20;

    // Check demonstratives
    if (title.includes('これ') && cNorm.includes('ini')) score += 25;
    if ((title.includes('それ') || title.includes('あれ')) && cNorm.includes('itu')) score += 25;
    if (title.includes('ここ') && cNorm.includes('di sini')) score += 30;
    if (title.includes('そこ') && cNorm.includes('di situ')) score += 30;
    if (title.includes('あそこ') && cNorm.includes('di sana')) score += 30;

    // Match keywords from dictionary
    for (const [jpKey, idVal] of Object.entries(dict)) {
      if (title.includes(jpKey) && cNorm.includes(idVal.toLowerCase())) {
        score += 15;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      selectedChoice = c;
    }
  });

  return selectedChoice;
}

let fixedCount = 0;
practiceData.forEach(ch => {
  ch.questions.forEach(q => {
    const solved = solveQuestion(q);
    if (solved !== q.correctAnswer) {
      q.correctAnswer = solved;
      fixedCount++;
    }
  });
});

fs.writeFileSync(practicePath, JSON.stringify(practiceData, null, 2), 'utf-8');
console.log(`Successfully updated ${fixedCount} questions in public/data/practice-default.json`);
