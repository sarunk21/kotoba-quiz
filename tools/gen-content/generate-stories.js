import Groq from "groq-sdk";
import Papa from "papaparse";
import fs from "fs";
import "dotenv/config";

if (!process.env.GROQ_API_KEY) {
  console.error("Error: GROQ_API_KEY tidak diset di .env");
  console.error("Dapetin key gratis di: https://console.groq.com → API Keys");
  process.exit(1);
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_INSTRUCTION = `Kamu adalah pembuat cerita pendek bahasa Jepang untuk pelajar bahasa Jepang.
Aturan:
- Buat cerita terdiri dari 3-4 scene/kalimat pendek, level JLPT N5, natural dan nyambung sebagai satu alur cerita singkat.
- WAJIB memakai kata-kata yang diberikan sesering mungkin.
- Balas HANYA dalam format JSON object, tanpa teks tambahan, tanpa markdown code fence.
- Format respons:
  {"judul": "judul cerita dalam bahasa Indonesia", "scenes": [{"order": 1, "cerita_jepang": "kalimat Jepang", "cerita_indo": "terjemahan Indonesia", "image_prompt": "singkat deskripsi visual scene dalam bahasa Inggris untuk generate ilustrasi anime"}]}
- image_prompt harus spesifik: siapa yang ada, apa yang mereka lakukan, setting lokasinya.
- Teks kalimat jepang tidak perlu furigana (hanya kanji dan hiragana standar).`;

async function generateStoryForChapter(chapter, vocabItems) {
  const wordsText = vocabItems
    .map(v => `${v.Kanji || v.Hiragana || v.kanji || v.hiragana} (${v.Arti || v.arti})`)
    .join(", ");

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: `Buat cerita pendek 3-4 scene untuk bab "${chapter}" menggunakan kosakata berikut:\n${wordsText}` },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

async function main() {
  if (!fs.existsSync("input")) fs.mkdirSync("input");
  if (!fs.existsSync("output")) fs.mkdirSync("output");

  if (!fs.existsSync("input/vocab.csv")) {
    console.error("Error: input/vocab.csv tidak ditemukan. Harap ekspor tab kosakata dari Google Sheets.");
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

  const legacyRows = [];
  const sceneRows = [];

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    console.log(`Generating story for Chapter "${ch}" (${i + 1}/${chapters.length})...`);
    try {
      const story = await generateStoryForChapter(ch, chaptersMap[ch]);
      const scenes = story.scenes || [];

      // Legacy per-chapter row (backward compat → tab "Stories")
      legacyRows.push({
        Bab: ch,
        Judul: story.judul || `Cerita ${ch}`,
        CeritaJepang: scenes.map(s => s.cerita_jepang).join(""),
        CeritaIndonesia: scenes.map(s => s.cerita_indo).join(" "),
      });

      // Per-scene rows (→ tab "StoriesV2")
      scenes.forEach((scene, idx) => {
        sceneRows.push({
          Bab: ch,
          JudulCerita: story.judul || `Cerita ${ch}`,
          UrutanScene: scene.order || idx + 1,
          KalimatJepang: scene.cerita_jepang || "",
          KalimatIndonesia: scene.cerita_indo || "",
          ImagePrompt: scene.image_prompt || "",
          ImageUrl: `stories/bab${ch}/scene${scene.order || idx + 1}.png`,
        });
      });

      console.log(`  → ${scenes.length} scenes`);
    } catch (e) {
      console.error(`Gagal bab "${ch}":`, e.message || e);
    }
    // 1 detik antar bab — Groq free tier cukup besar
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync("output/stories.csv", Papa.unparse(legacyRows));
  console.log(`\nstories.csv → ${legacyRows.length} bab. Paste ke tab "Stories".`);

  fs.writeFileSync("output/stories-scenes.csv", Papa.unparse(sceneRows));
  console.log(`stories-scenes.csv → ${sceneRows.length} scene. Paste ke tab "StoriesV2".`);

  console.log("\nLangkah selanjutnya: node generate-images.js");
}

main().catch(console.error);
