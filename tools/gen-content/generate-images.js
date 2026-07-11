import Papa from "papaparse";
import fs from "fs";
import https from "https";
import http from "http";
import { URL } from "url";

// Style suffix appended to every image_prompt for consistent anime aesthetic
const STYLE_SUFFIX = ", flat 2D anime illustration, simple, pastel colors, no text, clean background, Studio Ghibli style";

/**
 * Download image from URL with redirect support.
 */
function downloadImage(imageUrl, filepath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(imageUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.get(imageUrl, { timeout: 30000 }, (res) => {
      // Follow redirects (Pollinations uses them)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${imageUrl}`));
        return;
      }
      const stream = fs.createWriteStream(filepath);
      res.pipe(stream);
      stream.on("finish", () => { stream.close(); resolve(); });
      stream.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
  });
}

async function generateSceneImage(bab, sceneOrder, imagePrompt) {
  const fullPrompt = encodeURIComponent(imagePrompt + STYLE_SUFFIX);
  const url = `https://image.pollinations.ai/prompt/${fullPrompt}?width=800&height=450&nologo=true&seed=${bab}${sceneOrder}`;

  // Sanitize bab for directory name (handle "Bab 1", "1", etc.)
  const dirName = `bab${String(bab).replace(/\s+/g, "")}`;
  const dir = `output/images/${dirName}`;
  fs.mkdirSync(dir, { recursive: true });

  const filepath = `${dir}/scene${sceneOrder}.png`;

  if (fs.existsSync(filepath)) {
    console.log(`  Skip (already exists): ${filepath}`);
    return filepath;
  }

  await downloadImage(url, filepath);
  console.log(`  Saved: ${filepath}`);
  return filepath;
}

async function main() {
  const scenesPath = "output/stories-scenes.csv";
  if (!fs.existsSync(scenesPath)) {
    console.error(`Error: ${scenesPath} tidak ditemukan. Jalankan dulu: node generate-stories.js`);
    process.exit(1);
  }

  const csvRaw = fs.readFileSync(scenesPath, "utf8");
  const { data: rows } = Papa.parse(csvRaw, { header: true });

  const scenes = rows.filter(r => r.Bab && r.ImagePrompt && r.ImagePrompt.trim() !== "");
  console.log(`Total scenes to generate: ${scenes.length}`);

  let done = 0;
  let failed = 0;

  for (const scene of scenes) {
    const bab = scene.Bab;
    const order = scene.Scene || scene.UrutanScene;
    const prompt = scene.ImagePrompt;

    console.log(`[${done + failed + 1}/${scenes.length}] Bab "${bab}" Scene ${order}`);
    console.log(`  Prompt: ${prompt.substring(0, 80)}...`);

    try {
      await generateSceneImage(bab, order, prompt);
      done++;
    } catch (e) {
      console.error(`  GAGAL: ${e.message}`);
      failed++;
    }

    // Jeda sopan ke server Pollinations (gratis, jangan spam)
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nSelesai! ${done} berhasil, ${failed} gagal.`);
  console.log("Gambar tersimpan di output/images/");
  console.log("\nLangkah selanjutnya:");
  console.log("1. Copy isi output/images/ ke public/stories/ di project Next.js");
  console.log("2. Isi tab 'StoriesV2' di Google Sheets dengan output/stories-scenes.csv");
  console.log("3. Sync di app → Visual Novel Mode aktif otomatis");
}

main().catch(console.error);
