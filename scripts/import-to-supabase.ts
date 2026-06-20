/**
 * Đồng bộ TOÀN BỘ resource JSON vào Supabase (vocab bài 1-11, grammar bài 1-9, kanji).
 * Dùng `upsert` theo `id` => CHẠY LẠI BAO NHIÊU LẦN CŨNG ĐƯỢC, không bị trùng.
 * Mỗi lần sửa/thêm file trong resources/, chỉ cần chạy lại lệnh này:
 *
 *   npx tsx scripts/import-to-supabase.ts
 *
 * Hành vi:
 *   - Thêm mới: item có trong file mà chưa có DB => insert.
 *   - Cập nhật: item đã có => ghi đè bằng nội dung mới nhất trong file.
 *   - KHÔNG tự xóa: item đã bị bỏ khỏi file vẫn còn trong DB (để an toàn).
 *
 * Yêu cầu .env có VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
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
  console.error("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const resourcesDir = path.resolve(__dirname, "../resources");

// ============================================
// Normalize & Import
// ============================================

async function main() {
  console.log("🚀 Starting import...\n");

  // --- VOCABULARY ---
  const vocabRows: any[] = [];

  // Bài 1-3
  const file13 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "vocab/n5_online_vocab_lessons_1_3.json"), "utf-8"));
  for (const [baiKey, baiData] of Object.entries(file13.bai_hoc)) {
    const lessonNum = parseInt(baiKey.replace("bai_", ""));
    const tuVung = baiData.tu_vựng || baiData.tu_vung || [];
    for (const item of tuVung) {
      vocabRows.push({
        id: `vocab-b${lessonNum}-${item.id}`,
        word: item.japanese || item.hiragana || "",
        reading: item.japanese || item.hiragana || "",
        romaji: item.romaji || "",
        meaning: item.vietnamese || item.tieng_viet || "",
        category: extractCategory(baiData.ten_bai || ""),
        lesson: lessonNum,
        examples: [],
        is_custom: false,
      });
    }
    // Handle bo_sung (supplementary: numbers, ages)
    const boSung = baiData.bo_sung;
    if (boSung) {
      for (const [cat, items] of Object.entries(boSung)) {
        if (Array.isArray(items)) {
          for (const item of items as string[]) {
            const parts = item.split(" (");
            const japanese = parts[0].trim();
            const meaning = parts[1] ? parts[1].replace(")", "").trim() : "";
            vocabRows.push({
              id: `vocab-b${lessonNum}-sup-${cat}-${vocabRows.length}`,
              word: japanese,
              reading: japanese,
              romaji: "",
              meaning: meaning || japanese,
              category: `Bài ${lessonNum} - Bổ sung (${cat})`,
              lesson: lessonNum,
              examples: [],
              is_custom: false,
            });
          }
        }
      }
    }
  }

  // Bài 4-6
  const file46 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "vocab/n5_online_vocab_lessons_4_6.json"), "utf-8"));
  for (const [baiKey, baiData] of Object.entries(file46.bai_hoc)) {
    const lessonNum = parseInt(baiKey.replace("bai_", ""));

    // Standard vocab
    const tuVung = baiData.tu_vung || baiData.tu_vựng || [];
    for (const item of tuVung) {
      vocabRows.push({
        id: `vocab-b${lessonNum}-${item.id}`,
        word: item.japanese || item.hiragana || "",
        reading: item.japanese || item.hiragana || "",
        romaji: item.romaji || "",
        meaning: item.vietnamese || item.tieng_viet || "",
        category: extractCategory(baiData.ten_bai || ""),
        lesson: lessonNum,
        examples: item.vi_du ? [item.vi_du] : [],
        is_custom: false,
      });
    }

    // Bài 5 special keys
    const b5keys: Record<string, string> = {
      tu_vung_chung_va_gia_dinh: "Từ vựng chung & Gia đình",
      danh_sach_thang: "Danh sách tháng",
      danh_sach_ngay: "Danh sách ngày",
    };
    for (const [cat, label] of Object.entries(b5keys)) {
      const items = baiData[cat];
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        vocabRows.push({
          id: `vocab-b${lessonNum}-${cat}-${item.id}`,
          word: item.japanese || item.hiragana || "",
          reading: item.japanese || item.hiragana || "",
          romaji: item.romaji || "",
          meaning: item.vietnamese || item.tieng_viet || "",
          category: `Bài ${lessonNum} - ${label}`,
          lesson: lessonNum,
          examples: [],
          is_custom: false,
        });
      }
    }
  }

  // Bài 7
  const file7 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "vocab/n5_online_vocab_lesson_7.json"), "utf-8"));
  const noiDung7 = file7.noi_dung;
  const lesson7Categories = ["danh_tu", "dong_tu", "cach_dien_dat_va_lien_tu", "tu_vung_chung_va_gia_dinh", "bo_sung"];
  for (const cat of lesson7Categories) {
    const items = noiDung7[cat];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      vocabRows.push({
        id: `vocab-b7-${cat}-${item.stt || item.id || vocabRows.length}`,
        word: item.hiragana || item.japanese || "",
        reading: item.hiragana || item.japanese || "",
        romaji: item.romaji || "",
        meaning: item.tieng_viet || item.vietnamese || "",
        category: `Bài 7 - ${formatCategory(cat)}`,
        lesson: 7,
        examples: item.vi_du || [],
        is_custom: false,
      });
    }
  }

  // Bài 8 — new danh_muc structure (meishi, keiyoushi_i, keiyoushi_na, kanji)
  const file8 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "vocab/n5_online_vocab_lesson_8.json"), "utf-8"));
  const lesson8 = file8.bai || 8;
  const danhMuc8 = file8.danh_muc || {};
  for (const [catKey, catData] of Object.entries(danhMuc8)) {
    const catObj = catData as any;
    if (!Array.isArray(catObj.tu_vung)) continue;
    // Skip kanji category here — handle separately below
    if (catKey === "kanji") continue;
    for (const item of catObj.tu_vung) {
      vocabRows.push({
        id: `vocab-b${lesson8}-${catKey}-${item.stt || vocabRows.length}`,
        word: item.hiragana || item.japanese || "",
        reading: item.hiragana || item.japanese || "",
        romaji: item.romaji || "",
        meaning: item.y_nghia || item.tieng_viet || "",
        category: `Bài ${lesson8} - ${catObj.loai || formatCategory(catKey)}`,
        lesson: lesson8,
        examples: [],
        is_custom: false,
      });
    }
  }

  // Bài 9 — cấu trúc mới: { sections: { meishi/doushi/keiyoushi_na/hyougen/kanji: { title, items } } }
  const file9 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "vocab/n5_online_vocab_lesson_9.json"), "utf-8"));
  const lesson9 = parseInt((String(file9.lesson || "9").match(/\d+/) || ["9"])[0]) || 9;
  const sections9 = file9.sections || {};
  for (const [secKey, secData] of Object.entries(sections9)) {
    const sec = secData as any;
    const items = sec.items;
    if (!Array.isArray(items)) continue;
    if (secKey === "kanji") continue; // kanji xử lý riêng ở phần KANJI bên dưới
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

  // Bài 10 & 11 — schema phẳng: mảng [{ stt, tu_vung, nghia }]
  // stt thường là số; khi stt là chuỗi ("Đơn vị đếm...", "Thời gian...", "Hán tự")
  // thì đó là tiêu đề mục -> gom category cho các mục đi sau.
  for (const lessonNum of [10, 11]) {
    const filePath = path.join(resourcesDir, `vocab/n5_online_vocab_lesson_${lessonNum}.json`);
    if (!fs.existsSync(filePath)) continue;
    const items: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let section = "Từ vựng chung";
    items.forEach((item, idx) => {
      if (typeof item.stt === "string" && item.stt.trim()) {
        // Bỏ phần trong ngoặc: "Đơn vị đếm (Đại)" -> "Đơn vị đếm"
        section = item.stt.trim().replace(/\s*[（(].*$/, "").trim();
      }
      const { word, reading } = splitWordReading(item.tu_vung || "");
      vocabRows.push({
        id: `vocab-b${lessonNum}-${idx + 1}`,
        word,
        reading,
        romaji: "",
        meaning: item.nghia || "",
        category: `Bài ${lessonNum} - ${section}`,
        lesson: lessonNum,
        examples: [],
        is_custom: false,
      });
    });
  }

  console.log(`📖 Vocabulary: ${vocabRows.length} items`);

  // --- KANJI from Bài 7 ---
  const kanjiRows: any[] = [];
  const kanji7 = noiDung7.kanji;
  if (Array.isArray(kanji7)) {
    for (const item of kanji7) {
      kanjiRows.push({
        id: `kanji-b7-${item.stt || kanjiRows.length}`,
        character: item.chu_han || item.character || "",
        onyomi: (item.onyomi_kunyomi || "").split("/")[0]?.trim() || item.onyomi || "",
        kunyomi: (item.onyomi_kunyomi || "").split("/")[1]?.trim() || item.kunyomi || "",
        meaning: item.tieng_viet || item.meaning || "",
        lesson: 7,
        examples: item.vi_du || [],
        is_custom: false,
      });
    }
  }
  // --- KANJI from Bài 8 ---
  const kanjiCat8 = danhMuc8.kanji;
  if (kanjiCat8 && Array.isArray(kanjiCat8.tu_vung)) {
    for (const item of kanjiCat8.tu_vung) {
      kanjiRows.push({
        id: `kanji-b8-${item.stt || kanjiRows.length}`,
        character: item.kanji || item.chu_han || "",
        onyomi: "",
        kunyomi: item.hiragana || "",
        meaning: item.y_nghia || item.tieng_viet || "",
        lesson: 8,
        examples: [],
        is_custom: false,
      });
    }
  }

  // --- KANJI from Bài 9 (sections.kanji.items: japanese/reading(+reading_correct)/vietnamese) ---
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

  console.log(`KANJI: ${kanjiRows.length} items`);

  // --- GRAMMAR ---
  const grammarRows: any[] = [];

  // Bài 1-3
  const gram13 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "gramma/n5_online_grammar_lessons_1_3.json"), "utf-8"));
  for (const [baiKey, baiData] of Object.entries(gram13.bai_hoc)) {
    const lessonNum = parseInt(baiKey.replace("bai_", ""));
    const cauTruc = baiData.cau_truc || [];
    for (const item of cauTruc) {
      grammarRows.push({
        id: `grammar-b${lessonNum}-${item.id}`,
        structure: item.bieu_thuc || "",
        meaning: item.y_nghia || "",
        explanation: "",
        notes: item.ghi_chu || "",
        category: baiData.ten_bai || "",
        lesson: lessonNum,
        examples: normalizeGrammarExamples(item.vi_du || []),
        summary: item.tom_tat || {},
        conjugation_tables: {
          ...item.bang_chia_thoi,
          ...item.bang_chia_dong_tu,
        },
        is_custom: false,
      });
    }
  }

  // Bài 4-6
  const gram46 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "gramma/n5_online_grammar_lessons_4_6.json"), "utf-8"));
  for (const [baiKey, baiData] of Object.entries(gram46.bai_hoc)) {
    const lessonNum = parseInt(baiKey.replace("bai_", ""));
    const cauTruc = baiData.cau_truc || [];
    for (const item of cauTruc) {
      grammarRows.push({
        id: `grammar-b${lessonNum}-${item.id}`,
        structure: item.bieu_thuc || "",
        meaning: item.y_nghia || "",
        explanation: "",
        notes: item.ghi_chu || "",
        category: baiData.ten_bai || "",
        lesson: lessonNum,
        examples: normalizeGrammarExamples(item.vi_du || []),
        summary: item.tom_tat || {},
        conjugation_tables: {
          ...item.bang_chia_thoi,
          ...item.bang_chia_dong_tu,
        },
        is_custom: false,
      });
    }
  }
  // Bài 7 — new structure: cau_truc_ngu_phap with mau_cau/giai_thich
  const gram7 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "gramma/n5_online_grammar_lesson_7.json"), "utf-8"));
  const lesson7Num = gram7.bai || 7;
  const cauTruc7 = gram7.cau_truc_ngu_phap || [];
  for (const item of cauTruc7) {
    grammarRows.push({
      id: `grammar-b${lesson7Num}-${item.stt || item.id || grammarRows.length}`,
      structure: item.mau_cau || "",
      meaning: item.y_nghia || "",
      explanation: item.giai_thich || "",
      notes: "",
      category: gram7.chu_de || `Bài ${lesson7Num}`,
      lesson: lesson7Num,
      examples: normalizeGrammarExamples(item.vi_du || []),
      summary: {},
      conjugation_tables: {},
      is_custom: false,
    });
  }

  // Bài 8 — cấu trúc mới: { lesson, title, content: { catKey: { title, structure|structures, examples } } }
  // structure: mảng [{khang_dinh|phu_dinh|pattern, meaning}] | chuỗi đơn lẻ; structures: mảng số nhiều
  const gram8 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "gramma/n5_online_grammar_lesson_8.json"), "utf-8"));
  const lesson8Num = gram8.lesson || 8;
  const gram8Content = gram8.content || {};
  for (const [catKey, catData] of Object.entries(gram8Content)) {
    const catObj = catData as any;
    const label = `Bài ${lesson8Num} - ${labelFromTitle(catObj.title) || catKey}`;
    const examples = Array.isArray(catObj.examples) ? catObj.examples : [];

    let structureItems: any[] = [];
    if (Array.isArray(catObj.structures)) structureItems = catObj.structures;
    else if (Array.isArray(catObj.structure)) structureItems = catObj.structure;
    else if (typeof catObj.structure === "string") structureItems = [{ pattern: catObj.structure, meaning: "" }];

    for (const item of structureItems) {
      grammarRows.push({
        id: `grammar-b${lesson8Num}-${catKey}-${grammarRows.length}`,
        structure: patternFromItem(item),
        meaning: item.meaning || label,
        explanation: "",
        notes: "",
        category: label,
        lesson: lesson8Num,
        examples,
        summary: {},
        conjugation_tables: {},
        is_custom: false,
      });
    }
  }

  // Bài 9 — cấu trúc: { bai_hoc, noi_dung_ngu_phap: [ { cau_truc, y_nghia, vi_du } ] }
  const gram9 = JSON.parse(fs.readFileSync(path.join(resourcesDir, "gramma/n5_online_grammar_lesson_9.json"), "utf-8"));
  const lesson9Num = 9;
  const cauTruc9 = gram9.noi_dung_ngu_phap || [];
  for (const [index, item] of cauTruc9.entries()) {
    grammarRows.push({
      id: `grammar-b${lesson9Num}-${index + 1}`,
      structure: item.cau_truc || "",
      meaning: item.y_nghia || "",
      explanation: "",
      notes: "",
      category: gram9.bai_hoc || `Bài ${lesson9Num}`,
      lesson: lesson9Num,
      examples: normalizeGrammarExamples(item.vi_du || []),
      summary: {},
      conjugation_tables: {},
      is_custom: false,
    });
  }

  console.log(`📝 Grammar: ${grammarRows.length} items`);

  // --- INSERT INTO SUPABASE ---
  console.log("\n📤 Inserting into Supabase...\n");

  // Insert vocabulary in batches of 50
  for (let i = 0; i < vocabRows.length; i += 50) {
    const batch = vocabRows.slice(i, i + 50);
    const { error } = await supabase.from("vocabulary").upsert(batch);
    if (error) {
      console.error(`  ❌ Vocab batch ${i / 50 + 1} error:`, error.message);
    } else {
      console.log(`  ✅ Vocab batch ${i / 50 + 1} (${batch.length} items)`);
    }
  }

  // Insert kanji
  if (kanjiRows.length > 0) {
    const { error } = await supabase.from("kanji").upsert(kanjiRows);
    if (error) console.error("  ❌ Kanji error:", error.message);
    else console.log(`  ✅ Kanji (${kanjiRows.length} items)`);
  }

  // Insert grammar
  for (let i = 0; i < grammarRows.length; i += 20) {
    const batch = grammarRows.slice(i, i + 20);
    const { error } = await supabase.from("grammar").upsert(batch);
    if (error) {
      console.error(`  ❌ Grammar batch ${i / 20 + 1} error:`, error.message);
    } else {
      console.log(`  ✅ Grammar batch ${i / 20 + 1} (${batch.length} items)`);
    }
  }

  console.log("\n🎉 Import complete!");
  console.log(`   Vocabulary: ${vocabRows.length}`);
  console.log(`   Kanji: ${kanjiRows.length}`);
  console.log(`   Grammar: ${grammarRows.length}`);
}

// ============================================
// Helpers
// ============================================

// Tách chữ Hán + cách đọc cho bài 10/11.
// "学校 (がっこう)"  -> word "学校", reading "がっこう"
// "（荷物）"          -> cả từ trong ngoặc: bỏ ngoặc, word = reading = "荷物"
function splitWordReading(tuVung: string): { word: string; reading: string } {
  const m = tuVung.match(/^(.+?)\s*[（(]\s*([^)）]+)\s*[)）]\s*$/);
  if (m) return { word: m[1].trim(), reading: m[2].trim() };
  const full = tuVung.match(/^[（(]\s*([^)）]+)\s*[)）]$/);
  if (full) {
    const inner = full[1].trim();
    return { word: inner, reading: inner };
  }
  return { word: tuVung, reading: tuVung };
}

function extractCategory(tenBai: string): string {
  const match = tenBai.match(/Bài\s*(\d+)/i);
  if (match) return `Bài ${match[1]}`;
  return tenBai;
}

function formatCategory(cat: string): string {
  const map: Record<string, string> = {
    danh_tu: "Danh từ",
    dong_tu: "Động từ",
    cach_dien_dat_va_lien_tu: "Cách diễn đạt & Liên từ",
    tu_vung_chung_va_gia_dinh: "Từ vựng chung & Gia đình",
    bo_sung: "Bổ sung",
  };
  return map[cat] || cat;
}

// Lấy mẫu câu (pattern) trong 1 điểm ngữ pháp bài 8
// (trường key biến thiên: khang_dinh / phu_dinh / pattern ...), bỏ qua meaning
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

function normalizeGrammarExamples(examples: any[]): any[] {
  return examples.map((ex) => {
    // Already has normalized fields or Q&A format — keep as-is
    if (ex.cau_hoi || ex.tieng_nhat || ex.japanese) return ex;
    return ex;
  });
}

main().catch(console.error);
