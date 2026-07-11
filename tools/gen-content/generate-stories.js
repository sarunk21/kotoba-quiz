import { GoogleGenAI } from "@google/genai";
import Papa from "papaparse";
import fs from "fs";
import "dotenv/config";

// ponytail: check if key is set
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY tidak diset di .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Kamu adalah pembuat cerita pendek bahasa Jepang untuk pelajar bahasa Jepang.
Aturan:
- Buat cerita pendek (3-6 kalimat) dalam bahasa Jepang.
- Cerita harus memakai kata-kata yang diberikan dan relevan untuk bab tersebut.
- Level bahasa Jepang: sesuaikan dengan N5-N3.
- Pecah cerita menjadi 3 adegan (scenes).
- Balas HANYA dalam format JSON object dengan key:
  "judul": "...",
  "scenes": [
    { "cerita_jepang": "...", "cerita_indo": "...", "image_prompt": "..." },
    ...
  ]
- Teks cerita jepang tidak perlu furigana (hanya kanji dan hiragana standar).
- JANGAN berikan teks tambahan atau format markdown.`;

async function generateStoryForChapter(chapter, vocabItems) {
  const wordsText = vocabItems.map(v => `${v.Kanji || v.Hiragana || v.kanji || v.hiragana} (${v.Arti || v.arti})`).join(", ");
  const prompt = `Buat cerita untuk bab "${chapter}" menggunakan kosakata berikut:\n${wordsText}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
}

async function main() {
  // Ensure directories exist
  if (!fs.existsSync("input")) fs.mkdirSync("input");
  if (!fs.existsSync("output")) fs.mkdirSync("output");

  if (!fs.existsSync("input/vocab.csv")) {
    console.error("Error: input/vocab.csv tidak ditemukan. Harap ekspor tab kosakata dari Google Sheets Anda ke file tersebut.");
    process.exit(1);
  }

  const csvRaw = fs.readFileSync("input/vocab.csv", "utf8");
  const { data: rows } = Papa.parse(csvRaw, { header: true });

  // Group by chapter
  const chaptersMap = {};
  for (const r of rows) {
    const ch = r.Bab || r.chapter || "Tanpa Bab";
    if (!chaptersMap[ch]) chaptersMap[ch] = [];
    chaptersMap[ch].push(r);
  }

  const chapters = Object.keys(chaptersMap).filter(ch => ch.trim() !== "");
  console.log(`Total bab ditemukan: ${chapters.length}`);

  const results = [];
  const sceneResults = [];

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    console.log(`Generating story for Chapter "${ch}" (${i + 1}/${chapters.length})...`);
    try {
      const story = await generateStoryForChapter(ch, chaptersMap[ch]);
      
      // Keep backward compat summary output
      results.push({
        Bab: ch,
        Judul: story.judul || `Cerita ${ch}`,
        CeritaJepang: story.scenes.map(s => s.cerita_jepang).join(" "),
        CeritaIndonesia: story.scenes.map(s => s.cerita_indo).join(" "),
      });

      // New detailed output
      story.scenes.forEach((scene, index) => {
        sceneResults.push({
          Bab: ch,
          Scene: index + 1,
          Judul: story.judul,
          CeritaJepang: scene.cerita_jepang,
          CeritaIndonesia: scene.cerita_indo,
          ImagePrompt: scene.image_prompt
        });
      });
    } catch (e) {
      console.error(`Gagal membuat cerita untuk bab "${ch}":`, e.message || e);
    }
    // jeda kecil biar aman dari rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  fs.writeFileSync("output/stories.csv", Papa.unparse(results));
  fs.writeFileSync("output/stories-scenes.csv", Papa.unparse(sceneResults));
  console.log("Selesai. Hasil cerita disimpan di output/stories.csv dan output/stories-scenes.csv");
}

main().catch(console.error);
