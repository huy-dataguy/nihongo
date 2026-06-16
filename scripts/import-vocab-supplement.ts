/**
 * Nạp các file vocab BỔ SUNG (*_supplement.json) vào Supabase.
 *   - Đọc mọi file resources/vocab/*_supplement.json
 *   - Mỗi item -> 1 row trong bảng `vocabulary` với id `vocab-b{lesson}-sup-{stt}`
 *   - Upsert theo id => chạy lại nhiều lần không bị trùng, cập nhật nội dung mới nhất.
 *
 * Usage:  npx tsx scripts/import-vocab-supplement.ts
 *
 * Yêu cầu .env có SUPABASE_URL (hoặc VITE_SUPABASE_URL) và SUPABASE_ANON_KEY.
 *
 * Lưu ý: chỉ thêm/sửa (upsert). Muốn xóa sạch vocab bổ sung theo id, xem lệnh SQL ở cuối log.
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
  console.error("❌ Thiếu SUPABASE_URL / SUPABASE_ANON_KEY trong .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const vocabDir = path.resolve(__dirname, "../resources/vocab");

async function main() {
  const files = fs
    .readdirSync(vocabDir)
    .filter((f) => f.endsWith("_supplement.json"))
    .sort();

  if (files.length === 0) {
    console.log("⚠️  Không tìm thấy file *_supplement.json nào trong resources/vocab.");
    return;
  }

  console.log(`🚀 Nạp ${files.length} file vocab bổ sung...\n`);

  const rows: any[] = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(vocabDir, file), "utf-8"));
    const items: any[] = Array.isArray(data.items) ? data.items : [];
    for (const item of items) {
      const lesson = Number(item.lesson) || 0;
      const stt = item.stt ?? rows.length;
      rows.push({
        id: `vocab-b${lesson}-sup-${stt}`,
        word: item.word || "",
        reading: item.reading || item.word || "",
        romaji: item.romaji || "",
        meaning: item.meaning || "",
        category: `Bài ${lesson} - Bổ sung - ${item.category || "Từ vựng"}`,
        lesson,
        examples: [],
        is_custom: false,
      });
    }
    console.log(`  📄 ${file}: ${items.length} mục`);
  }

  console.log(`\n📖 Tổng cộng: ${rows.length} mục vocab bổ sung`);
  console.log("\n📤 Đang upsert vào Supabase...\n");

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("vocabulary").upsert(batch);
    if (error) console.error(`  ❌ Batch ${i / 50 + 1}:`, error.message);
    else console.log(`  ✅ Batch ${i / 50 + 1} (${batch.length} mục)`);
  }

  console.log("\n🎉 Xong!");
  console.log("   Muốn xem/xóa vocab bổ sung, chạy SQL trong Supabase SQL Editor:");
  console.log("   SELECT * FROM vocabulary WHERE id LIKE 'vocab-b%-sup-%';");
  console.log("   DELETE FROM vocabulary WHERE id LIKE 'vocab-b%-sup-%';");
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message || err);
  process.exit(1);
});
