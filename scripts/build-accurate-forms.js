const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Load vocab database for matching
const vocabPath = path.join(__dirname, '../public/data/vocab-default.json');
const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'));

// Build lookup map for vocab matching
const vocabMapByText = new Map();
vocabData.forEach(v => {
  if (v.kanji) vocabMapByText.set(v.kanji.trim(), v);
  if (v.hiragana) vocabMapByText.set(v.hiragana.trim(), v);
  if (v.arti) vocabMapByText.set(v.arti.trim().toLowerCase(), v);
});

// All 25 Latihan A, B, C Google Form URLs
const latihanUrls = [
  "https://docs.google.com/forms/d/e/1FAIpQLSc-n8g7QXy7DSxQQejQRd_pTNLBXWn_TP-xZ3bRZ5E8t1c3OA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSef4EcnvWHR60O_EIB7qIO0U0zUmcm3HrsjNcLetuThW5XG6w/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSd0bONUryHMIn76nGcqHCTaoK8PeeQPfOJJ-YuxCed9-raUyw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSejE0UfX09Cw3gCQZzwxlzMc4FWFPUTZZ09WEWsXhewIPM1RA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc_6hI8ebzYS4MJSEetGinqpI7I0Y8kfRXeXFAt1myVpB1cSA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdqe9f47Aj9DYUeGWh6YeHJdYsSBbtvsGqF-OhshkvmnkvgVQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScbwXaq9SddVloetw7TfBhDdER1qjlZX3gJQ5fJOr7YRFI64Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSd9gY3Ugw-Cuh409gZwSu481-jlKFzwgXoQcqson_KUMxgkSQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScvmx2Nj0KYCZnNG3NLJuDAq211755ovkpjVqDX9psyo8iWww/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSe5ZttCZ-xrpLIPQNttc5eBCKGdp-3-sD3_XAzhmU1ToSo-HA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfW8ofw_OgD6gSBH7QLJwcrSZu6OLXlpb3j8ijJAPqE1sLR1Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfNBYzjEyehuZJuLqgJqVf5IqrVpC9ZnHZn4Wk67pEBaEuqjg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSe3pSQHVwYnaH6bTlBm48DSqvD8yI4kD21T79hl3i9izwkX6g/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfqu_Uv1AlF2ZYwk3mPFSdI1UJHnz3U4C3xXYmwDd3IWZtD4g/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfPX91UrrzwLegxFG3iKniR2qejygspaAVuLTyg5-EFcxNmPw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdEqw92MzIH9xh0Cw1NNQMdsEga9ptzmMGgaN_NYyjivfTIvw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeWGCM_Weo85AZKJL5hFaAuttFWAA9cxjHgH6Xv_KRIpM_ThQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSd489-hU0hzpTIP5Yjb8CbIygqoKhs1mtaruPgDGO-x42ir0w/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScri7JmBFisJTpPb24Y5uI4pN4w7tth2LZq_1OCFPg155hAfQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdhE_fT4GyoXq-aUxNUA5tCFgR-Pn2u5F_SwbmhunQMez0Vpw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSddQh4DsfeVQg1BTCSWyAMQmpFjOe_1UuceDOmj7nErvM08XQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeIVhMkCXv6V6YpJMd6sWD_x041GB37FzCiaxtsTZCEx5ocIw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScBbusD352ruC8IlmONED3jcnOSaRU8NASi65C7JdA_3aeyHQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeKvbFoLoLQCLsfIrtdJNFjFIlNKclrZmWJja52DSVdwBaMXw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSevDCxpA2F9ugQQ36gVHAWaUYnpUgDZsDbRwRG5WQnnLZ8_RQ/viewform?authuser=0"
];

// All 25 Vocab Quiz Google Form URLs
const vocabQuizUrls = [
  "https://docs.google.com/forms/d/e/1FAIpQLScWxBvxgP4kHnPdH7jbKDz-p10v2-1mumYftDjkr04jFBAHhQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSewrJe2ENqYZmGr4W7Nl9A8zyHAHL0tpgwPXma8sgICCi2HmQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSebBD-sPw2qnod-0PUI76wIqt5m25AgfErpy-9ujJNReMFFpg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdcRGWYeejoRYwsnA0VT9Nrh-Ylg9AHKBAWUlwpS3tSQToXaw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdF7nNC0Q7KQQ8yYLKlz-2qoiQI704k_wvjlVskbBTGhpWb9A/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc9Vxh2exwIOYamWWnN1IDj7OAYa0YPsNGjonicW9UGzhANpw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfWiBE1FLY0AhAsbOw7q9Ddmm9Exm_D54_4CF014JKFTRsdWg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdSSFNFTJKzU2lEWV4zQdlJVa-uTs2pmLiPJBcaowp68WKWRg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfaMsRqYxBRoVpmoGFs5sClLeDrD8FUPA0HJlUn3mXdB_v12Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSehwoVr3WmKw4yilPfJ3x3aKaYcRsoW3qWDXdJbPmO_txxpmA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSebQXuWp27KlB73tbvRv9u6uLVtigga4iT8VtFMKdXgfyRqTQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeXuAuR-W11hwfWTQAF0K52UdevyYoidXMDkllO1mClDBaI1A/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc3GUVWPmGt6qTOvQRELcX2QlTHW8ItTekRrR5ZMipJ-aTxXA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSceNy55LI96FD02sCxrLxDHjbEPwyUfP1IJpI4lopx2dGFIsg/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdqgmWBSZ2mbQbH950Ok0ku63ZE_J9hvfFuYLdOvG5hbF0qDQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScYMCX7D7zLiRdPPwVus49E8y09ffyl0SDGGAuHm-KFArba2g/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSelm_D6IMbSxsbL1fKdq35jL4ODqDtQiqOz_eSJLe07L-AVNw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc03TuVMrHgeqHzQdm-JyAHGhkUn82GfEzxQ2hgX1YZSUF30Q/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSeYiD2cY6jjcDAts8O9-oZVZnX_bDDdlCpM2R91ooTQhbiiOw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfW_-udYAiw1vqhvQCoqRFrizJSRCQOvvtAkrWGSyJy1u1Kfw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScAUSb_V24ZlAm5OQsAWlOsZFD68tMhX1Fc4wkqZaFa3g0jcA/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSc0O2uXCO4hit4ec1MnXvf31FybkZNVQInP2hTmbIbDgnsgWw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSfdTo4pmiw0thl9zaBwGyiIUg_PLceoHkedu2Xq5M1BqlcFfw/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLScnG9MgAQECuM5Kvkr-2pzsFA6htmJNdzmtUFLRAnTqkJDekQ/viewform?authuser=0",
  "https://docs.google.com/forms/d/e/1FAIpQLSdeFmQZzxLfp-5SUjhnic_om4jIoKpLUcGUGMz1SMxKGpcJWA/viewform?authuser=0"
];

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
  "ぎんこういん": "ginkoin",
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

// Helper: Determine correct answer for Vocab Quiz question
function determineVocabCorrectAnswer(title, choices) {
  if (!choices || choices.length === 0) return choices[0] || '';

  // Clean title (remove Klp.1, Klp.2, etc.)
  const cleanTitle = title.replace(/（[^）]+）|\([^\)]+\)/g, '').trim();
  const parts = cleanTitle.split(/[:：]/).map(p => p.trim());
  const mainText = parts[0] || '';
  const subText = parts[1] || '';

  let matchItem = null;

  // 1. Try exact kanji or hiragana match on mainText
  for (const v of vocabData) {
    if (v.kanji && v.kanji.trim() === mainText) {
      matchItem = v; break;
    }
    if (v.hiragana && v.hiragana.trim() === mainText) {
      matchItem = v; break;
    }
  }

  // 2. Try subText arti match if no mainText match
  if (!matchItem && subText) {
    for (const v of vocabData) {
      if (v.arti && (v.arti.trim().toLowerCase() === subText.toLowerCase() || subText.toLowerCase().includes(v.arti.trim().toLowerCase()))) {
        matchItem = v; break;
      }
    }
  }

  if (matchItem) {
    const expectedRomaji = romajiMap[matchItem.hiragana.trim()] || '';
    for (const c of choices) {
      const cleanC = c.trim();
      const normC = cleanC.toLowerCase().replace(/\s+/g, '');
      if (cleanC === matchItem.hiragana.trim()) return c;
      if (cleanC === matchItem.kanji.trim()) return c;
      if (cleanC.toLowerCase() === matchItem.arti.trim().toLowerCase()) return c;
      if (expectedRomaji && normC === expectedRomaji) return c;
    }
  }

  // Fallback: search if any choice matches subText
  for (const c of choices) {
    if (subText && c.trim().toLowerCase() === subText.toLowerCase()) return c;
  }

  return choices[0];
}

// Helper: Determine correct answer for Latihan A, B, C question
function determineLatihanCorrectAnswer(title, choices) {
  if (!choices || choices.length === 0) return choices[0] || '';

  // Direct matching heuristics based on Japanese grammar patterns in Minna no Nihongo
  const titleClean = title.trim();

  // Pattern 1: Translation questions (e.g., あめが ふったら、行きません。)
  const directTranslations = {
    "あめが ふったら、行きません。": "Kalau turun hujan, tidak pergi.",
    "ミラーさんは  わたしに  ワインを  くれました。": "Sdr. Miller memberikan wine kepada saya",
    "みちを わたるとき、くるまに きをつけます。": "Saat menyebrang jalan, hati-hati terhadap mobil.",
    "こどもが  よむ  ほん。": "Buku yang dibaca oleh anak-anak",
    "わたしは あした あめが ふる とおもいます。": "Saya rasa besok akan hujan"
  };

  for (const [jp, id] of Object.entries(directTranslations)) {
    if (titleClean.includes(jp)) {
      const found = choices.find(c => c.trim().includes(id) || id.includes(c.trim()));
      if (found) return found;
    }
  }

  // If choices contain exact matches to title keywords or hiragana reading
  for (const c of choices) {
    if (titleClean.includes(c.trim()) && c.trim().length > 1) {
      return c;
    }
  }

  return choices[0];
}

async function parseForm(url, isVocab) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });

  const html = await res.text();
  const startPrefix = 'var FB_PUBLIC_LOAD_DATA_ = ';
  const startIdx = html.indexOf(startPrefix);
  if (startIdx === -1) throw new Error(`Could not parse ${url}`);

  const dataStart = startIdx + startPrefix.length;
  let bracketCount = 0, endIdx = -1;
  for (let i = dataStart; i < html.length; i++) {
    if (html[i] === '[') bracketCount++;
    else if (html[i] === ']') {
      bracketCount--;
      if (bracketCount === 0) { endIdx = i; break; }
    }
  }

  const parsed = JSON.parse(html.substring(dataStart, endIdx + 1));
  const formData = parsed[1];
  const formTitle = (parsed[3] || formData[8] || '');
  
  // Extract Bab Number from Form Title (e.g. "Latihan A,B,C Bab 25" -> 25)
  const babMatch = formTitle.match(/\d+/);
  const babNum = babMatch ? parseInt(babMatch[0], 10) : 1;
  const babLabel = `Bab ${babNum}`;

  const items = formData[1] || [];
  const questions = [];

  items.forEach((itemVal) => {
    if (!itemVal) return;
    const id = itemVal[0];
    const title = itemVal[1];
    const type = itemVal[3];
    const description = itemVal[2] || '';

    if (type === 2 || type === 3 || type === 4) {
      const questionInfo = itemVal[4];
      if (questionInfo && questionInfo[0]) {
        const innerInfo = questionInfo[0];
        const innerId = innerInfo[0] || id;
        const choicesInfo = innerInfo[1];
        const choices = choicesInfo ? choicesInfo.map((c) => c[0]) : [];

        if (choices.length > 0) {
          const qTitle = title ? title.trim() : '';
          const correctAns = isVocab 
            ? determineVocabCorrectAnswer(qTitle, choices)
            : determineLatihanCorrectAnswer(qTitle, choices);

          questions.push({
            id: (innerId || id).toString(),
            title: qTitle,
            description: description || '',
            choices: choices,
            correctAnswer: correctAns,
            bab: babLabel
          });
        }
      }
    }
  });

  return {
    babNum,
    bab: babLabel,
    title: formTitle,
    url: url,
    questionsCount: questions.length,
    questions: questions
  };
}

async function run() {
  console.log("=== Parsing & Sorting QUIZ Latihan A, B, C (Bab 1 - 25) ===");
  const latihanResult = [];
  for (let i = 0; i < latihanUrls.length; i++) {
    try {
      const chapterData = await parseForm(latihanUrls[i], false);
      latihanResult.push(chapterData);
      console.log(`Parsed ${chapterData.title} -> ${chapterData.bab} (${chapterData.questionsCount} soal)`);
    } catch (e) {
      console.error(`Error parsing Latihan URL ${i}:`, e.message);
    }
  }

  // Sort Bab 1 to Bab 25 numerically
  latihanResult.sort((a, b) => a.babNum - b.babNum);
  const latihanPath = path.join(__dirname, '../public/data/practice-default.json');
  fs.writeFileSync(latihanPath, JSON.stringify(latihanResult, null, 2), 'utf-8');
  console.log(`✓ Saved public/data/practice-default.json (${latihanResult.length} chapters sorted Bab 1 - 25).\n`);

  console.log("=== Parsing & Sorting QUIZ Kosakata (Bab 1 - 25) ===");
  const vocabResult = [];
  for (let i = 0; i < vocabQuizUrls.length; i++) {
    try {
      const chapterData = await parseForm(vocabQuizUrls[i], true);
      vocabResult.push(chapterData);
      console.log(`Parsed ${chapterData.title} -> ${chapterData.bab} (${chapterData.questionsCount} soal)`);
    } catch (e) {
      console.error(`Error parsing Vocab URL ${i}:`, e.message);
    }
  }

  // Sort Bab 1 to Bab 25 numerically
  vocabResult.sort((a, b) => a.babNum - b.babNum);
  const vocabPath = path.join(__dirname, '../public/data/vocab-practice-default.json');
  fs.writeFileSync(vocabPath, JSON.stringify(vocabResult, null, 2), 'utf-8');
  console.log(`✓ Saved public/data/vocab-practice-default.json (${vocabResult.length} chapters sorted Bab 1 - 25).\n`);
}

run();
