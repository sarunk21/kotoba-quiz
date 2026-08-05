const fs = require('fs');
const path = require('path');

// 1. Load Vocab Database
const vocabPath = path.join(__dirname, '../public/data/vocab-default.json');
const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

// Build dictionary maps
const jpToIdMap = new Map();
vocabData.forEach(v => {
  if (v.hiragana) jpToIdMap.set(v.hiragana.trim(), v.arti.trim());
  if (v.kanji) jpToIdMap.set(v.kanji.trim(), v.arti.trim());
});

// Additional Common Grammar Mappings
const grammarMap = [
  // Pronouns & Demonstratives
  { jp: "わたし", id: "saya" },
  { jp: "あなた", id: "anda" },
  { jp: "あなた", id: "kamu" },
  { jp: "あのひと", id: "dia" },
  { jp: "あのかた", id: "beliau" },
  { jp: "これ", id: "ini" },
  { jp: "それ", id: "itu" },
  { jp: "あれ", id: "itu" },
  { jp: "この", id: "ini" },
  { jp: "その", id: "itu" },
  { jp: "あの", id: "itu" },
  { jp: "ここ", id: "di sini" },
  { jp: "そこ", id: "di situ" },
  { jp: "あそこ", id: "di sana" },
  { jp: "どこ", id: "dimana" },
  { jp: "どこ", id: "di mana" },
  { jp: "こちら", id: "sebelah sini" },
  { jp: "そちら", id: "sebelah situ" },
  { jp: "あちら", id: "sebelah sana" },
  { jp: "どちら", id: "yang mana" },

  // Particles & Endings
  { jp: "じゃ ありません", id: "bukan" },
  { jp: "じゃありません", id: "bukan" },
  { jp: "では ありません", id: "bukan" },
  { jp: "ではありません", id: "bukan" },
  { jp: "ありません", id: "tidak ada" },
  { jp: "いません", id: "tidak ada" },
  { jp: "です", id: "adalah" },
  { jp: "も", id: "juga" },
  { jp: "から", id: "dari" },
  { jp: "まで", id: "sampai" },
  { jp: "と", id: "dan" },
  { jp: "へ", id: "ke" },
  { jp: "で", id: "menggunakan" },
  { jp: "で", id: "di" },
  { jp: "に", id: "pada" },
  { jp: "に", id: "ke" },
  { jp: "に", id: "di" },

  // Days & Time
  { jp: "なんじ", id: "pukul berapa" },
  { jp: "なんようび", id: "hari apa" },
  { jp: "げつようび", id: "senin" },
  { jp: "かようび", id: "selasa" },
  { jp: "すいようび", id: "rabu" },
  { jp: "もくようび", id: "kamis" },
  { jp: "きんようび", id: "jumat" },
  { jp: "どようび", id: "sabtu" },
  { jp: "にちようび", id: "minggu" },
  { jp: "ひるやすみ", id: "istirahat siang" },
  { jp: "やすみ", id: "libur" },

  // Countries / Nationalities / Occupations
  { jp: "じん", id: "orang" },
  { jp: "ちゅうごくじん", id: "orang cina" },
  { jp: "にほんじん", id: "orang jepang" },
  { jp: "アメリカじん", id: "orang amerika" },
  { jp: "かんこくじん", id: "orang korea" },
  { jp: "かいしゃいん", id: "pegawai perusahaan" },
  { jp: "ぎんこういん", id: "pegawai bank" },
  { jp: "いしゃ", id: "dokter" },
  { jp: "せんせい", id: "guru" },
  { jp: "がくせい", id: "pelajar" },
  { jp: "がくせい", id: "siswa" }
];

// Read practice questions
const practicePath = path.join(__dirname, '../public/data/practice-default.json');
const practiceData = JSON.parse(fs.readFileSync(practicePath, 'utf-8'));

function scoreChoice(title, choice) {
  let score = 0;

  const titleClean = title.trim();
  const choiceClean = choice.trim();

  // If question has an Indonesian hint after colon:
  // e.g. "あした、（　　　　）だったら、ゴルフをしませんか。: Besok kalau cuacanya bagus, mau main golf ngga?"
  if (titleClean.includes(':')) {
    const parts = titleClean.split(':');
    const jpPart = parts[0].trim();
    const idHint = parts[1].trim().toLowerCase();

    const normChoice = choiceClean.toLowerCase();

    // Direct overlap with Indonesian hint
    if (idHint.includes(normChoice) || normChoice.includes(idHint)) {
      score += 50;
    }

    // Check vocabulary match
    for (const v of vocabData) {
      if (!v.arti) continue;
      const idArti = v.arti.trim().toLowerCase();

      if (idHint.includes(idArti)) {
        if (v.hiragana && normChoice.includes(v.hiragana.trim().toLowerCase())) score += 30;
        if (v.kanji && normChoice.includes(v.kanji.trim().toLowerCase())) score += 30;
        if (normChoice.includes(idArti)) score += 30;
      }
    }
  }

  // Grammar particle & negation alignment (positive vs negative)
  const isJpNegative = /じゃ\s*ありません|では\s*ありません|ありません|いません|くない|ない|ません/.test(titleClean);
  const isChoiceNegative = /bukan|tidak|belum|jangan/.test(choiceClean.toLowerCase());

  if (isJpNegative === isChoiceNegative) score += 20;
  else score -= 30;

  // Question mark alignment (is Question vs Statement)
  const isJpQuestion = titleClean.includes('ですか') || titleClean.includes('？') || titleClean.includes('?');
  const isChoiceQuestion = choiceClean.includes('?') || choiceClean.includes('Apakah') || choiceClean.includes('kemana') || choiceClean.includes('siapa') || choiceClean.includes('berapa') || choiceClean.includes('apa');

  if (isJpQuestion === isChoiceQuestion) score += 15;

  // Particle 'mo' (juga) alignment
  const hasJpMo = /\sも\s|\bも\b/.test(titleClean);
  const hasIdJuga = choiceClean.toLowerCase().includes('juga');
  if (hasJpMo === hasIdJuga) score += 20;

  // Demonstrative alignment (kore=ini, sore/are=itu)
  if (titleClean.includes('これ') && choiceClean.toLowerCase().includes('ini')) score += 25;
  if ((titleClean.includes('それ') || titleClean.includes('あれ')) && choiceClean.toLowerCase().includes('itu')) score += 25;
  if (titleClean.includes('ここ') && choiceClean.toLowerCase().includes('sini')) score += 25;
  if ((titleClean.includes('そこ') || titleClean.includes('あそこ')) && (choiceClean.toLowerCase().includes('situ') || choiceClean.toLowerCase().includes('sana'))) score += 25;

  return score;
}

let changedCount = 0;
let totalCount = 0;

practiceData.forEach((babItem) => {
  babItem.questions.forEach((q) => {
    totalCount++;
    const scores = q.choices.map(c => scoreChoice(q.title, c));

    // Find highest scoring choice
    let bestIdx = 0;
    let maxScore = scores[0];
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        bestIdx = i;
      }
    }

    const chosen = q.choices[bestIdx];
    if (chosen !== q.correctAnswer) {
      changedCount++;
      q.correctAnswer = chosen;
    }
  });
});

console.log(`Evaluated ${totalCount} questions.`);
console.log(`Updated correct answers for ${changedCount} questions.`);
