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

const SYSTEM_INSTRUCTION = `Kamu adalah generator kalimat contoh untuk aplikasi belajar bahasa Jepang.
Aturan:
- Level bahasa: sesuai JLPT N5-N3, kalimat pendek dan natural.
- Setiap kalimat WAJIB memakai kata yang diberikan.
- Balas HANYA dalam format JSON array, tanpa teks tambahan.
- Format tiap item: {"id": "...", "kalimat_jepang": "...", "arti_indo": "..."}`;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function generateBatch(batch) {
  const payload = batch.map(v => ({ id: v.id, kanji: v.Kanji || v.Hiragana, arti: v.Arti }));

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Buatkan 1 kalimat contoh untuk setiap kata berikut:\n${JSON.stringify(payload)}`,
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

  const needsSentence = rows.filter(r => !r.ContohKalimat || r.ContohKalimat.trim() === "");
  console.log(`Total kata: ${rows.length}, butuh kalimat: ${needsSentence.length}`);

  if (needsSentence.length === 0) {
    console.log("Semua kosakata sudah memiliki contoh kalimat!");
    return;
  }

  const batches = chunk(needsSentence, 20);
  const results = {};

  for (let i = 0; i < batches.length; i++) {
    console.log(`Batch ${i + 1}/${batches.length}...`);
    try {
      const batchResult = await generateBatch(batches[i]);
      for (const item of batchResult) {
        results[item.id] = item;
      }
    } catch (err) {
      console.error(`Gagal memproses batch ${i + 1}:`, err.message || err);
    }
    // jeda kecil biar aman dari rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  const merged = rows.map(r => {
    const gen = results[r.id];
    return {
      ...r,
      ContohKalimat: r.ContohKalimat || gen?.kalimat_jepang || "",
      ContohKalimatArti: r.ContohKalimatArti || gen?.arti_indo || "",
    };
  });

  const outCsv = Papa.unparse(merged);
  fs.writeFileSync("output/vocab-with-sentences.csv", outCsv);
  console.log("Selesai. Hasil disimpan di output/vocab-with-sentences.csv");
}

main().catch(console.error);
