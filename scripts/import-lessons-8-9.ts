/**
 * Chỉ nạp 2 file mới vào Supabase:
 *   - resources/vocab/n5_online_vocab_lesson_9.json   -> vocabulary (meishi/doushi/keiyoushi_na/hyougen) + kanji
 *   - resources/gramma/n5_online_grammar_lesson_8.json -> grammar
 *
 * Dùng upsert theo id => chạy lại nhiều lần không bị trùng.
 * Usage:  npx tsx scripts/import-lessons-8-9.ts
 *
 * Yêu cầu .env có VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load .env ---
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (match) envVars[match[1]] = match[2];
}

const supabaseUrl = envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY trong .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const resourcesDir = path.resolve(__dirname, "../resources");

// Lấy mẫu câu (pattern) trong 1 điểm ngữ pháp bài 8, bỏ qua meaning
function patternFromItem(item: any): string {
  for (const [key, val] of Object.entries(item)) {
    if (key !== "meaning" && typeof val === "string") return val;
  }
  return "";
}

// Lấy nhãn tiếng Việt từ title mục, vd "めいし(N): Danh từ" -> "Danh từ"
function labelFromTitle(title: any): string {
  if (!title || typeof title !== "string") return "";
  const parts = title.split(/[:：]/);
  return (parts[parts.length - 1] || title).trim();
}

async function main() {
  console.log("🚀 Nạp 2 file mới (vocab bài 9 + grammar bài 8)...\n");

  // ---------------- VOCAB + KANJI BÀI 9 ----------------
  // Cấu trúc: { lesson, sections: { meishi/doushi/keiyoushi_na/hyougen/kanji: { title, items } } }
  const file9 = JSON.parse(
    fs.readFileSync(path.join(resourcesDir, "vocab/n5_online_vocab_lesson_9.json"), "utf-8")
  );
  const lesson9 = parseInt((String(file9.lesson || "9").match(/\d+/) || ["9"])[0]) || 9;
  const sections9 = file9.sections || {};

  const vocabRows: any[] = [];
  for (const [secKey, secData] of Object.entries(sections9)) {
    const sec = secData as any;
    const items = sec.items;
    if (!Array.isArray(items)) continue;
    if (secKey === "kanji") continue; // kanji xử lý riêng bên dưới
    const label = labelFromTitle(sec.title) || secKey;
    for (const item of items) {
      vocabRows.push({
        id: `vocab-b${lesson9}-${secKey}-${item.stt || vocabRows.length}`,
        word: item.japanese || "",
        reading: item.japanese || "",
        romaji: "",
        meaning: item.vietnamese || "",
        category: `Bài ${lesson9} - ${label}`,
        lesson: lesson9,
        examples: [],
        is_custom: false,
      });
    }
  }
  console.log(`📖 Vocab bài 9: ${vocabRows.length} mục`);

  const kanjiRows: any[] = [];
  const kanji9 = (sections9.kanji && sections9.kanji.items) || [];
  for (const item of kanji9) {
    kanjiRows.push({
      id: `kanji-b9-${item.stt || kanjiRows.length}`,
      character: item.japanese || "",
      onyomi: "",
      kunyomi: item.reading_correct || item.reading || "",
      meaning: item.vietnamese || "",
      lesson: lesson9,
      examples: [],
      is_custom: false,
    });
  }
  console.log(`KANJI bài 9: ${kanjiRows.length} mục`);

  // ---------------- GRAMMAR BÀI 8 ----------------
  // Cấu trúc: { lesson, title, content: { catKey: { title, structure|structures, examples } } }
  const gram8 = JSON.parse(
    fs.readFileSync(path.join(resourcesDir, "gramma/n5_online_grammar_lesson_8.json"), "utf-8")
  );
  const lesson8 = gram8.lesson || 8;
  const grammarRows: any[] = [];
  for (const [catKey, catData] of Object.entries(gram8.content || {})) {
    const catObj = catData as any;
    const label = `Bài ${lesson8} - ${labelFromTitle(catObj.title) || catKey}`;
    const examples = Array.isArray(catObj.examples) ? catObj.examples : [];

    let structureItems: any[] = [];
    if (Array.isArray(catObj.structures)) structureItems = catObj.structures;
    else if (Array.isArray(catObj.structure)) structureItems = catObj.structure;
    else if (typeof catObj.structure === "string") structureItems = [{ pattern: catObj.structure, meaning: "" }];

    for (const item of structureItems) {
      grammarRows.push({
        id: `grammar-b${lesson8}-${catKey}-${grammarRows.length}`,
        structure: patternFromItem(item),
        meaning: item.meaning || label,
        explanation: "",
        notes: "",
        category: label,
        lesson: lesson8,
        examples,
        summary: {},
        conjugation_tables: {},
        is_custom: false,
      });
    }
  }
  console.log(`📝 Grammar bài 8: ${grammarRows.length} mục`);

  // ---------------- LÀM SẠCH DỮ LIỆU CŨ CỦA 2 BÀI NÀY ----------------
  // Cấu trúc file đã đổi => id cũng đổi. Nếu chỉ upsert, các row id cũ (vd vocab-b9-bieu_dat-*)
  // sẽ bị mồ côi => trùng lặp. Nên xoá sạch theo lesson trước khi nạp lại.
  console.log(`\n🧹 Xoá dữ liệu cũ: vocab+kanji bài ${lesson9}, grammar bài ${lesson8}...\n`);
  await supabase.from("vocabulary").delete().eq("lesson", lesson9);
  await supabase.from("kanji").delete().eq("lesson", lesson9);
  await supabase.from("grammar").delete().eq("lesson", lesson8);

  // ---------------- UPSERT VÀO SUPABASE ----------------
  console.log("📤 Đang upsert vào Supabase...\n");

  for (let i = 0; i < vocabRows.length; i += 50) {
    const batch = vocabRows.slice(i, i + 50);
    const { error } = await supabase.from("vocabulary").upsert(batch);
    if (error) console.error(`  ❌ Vocab batch ${i / 50 + 1}:`, error.message);
    else console.log(`  ✅ Vocab batch ${i / 50 + 1} (${batch.length} mục)`);
  }

  if (kanjiRows.length > 0) {
    const { error } = await supabase.from("kanji").upsert(kanjiRows);
    if (error) console.error("  ❌ Kanji:", error.message);
    else console.log(`  ✅ Kanji (${kanjiRows.length} mục)`);
  }

  for (let i = 0; i < grammarRows.length; i += 20) {
    const batch = grammarRows.slice(i, i + 20);
    const { error } = await supabase.from("grammar").upsert(batch);
    if (error) console.error(`  ❌ Grammar batch ${i / 20 + 1}:`, error.message);
    else console.log(`  ✅ Grammar batch ${i / 20 + 1} (${batch.length} mục)`);
  }

  console.log("\n🎉 Xong!");
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message || err);
  process.exit(1);
});
