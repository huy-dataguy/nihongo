import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (match) envVars[match[1]] = match[2];
}

const supabase = createClient(
  envVars.SUPABASE_URL || envVars.VITE_SUPABASE_URL || "",
  envVars.SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_ANON_KEY || ""
);

async function main() {
  const testData = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "test-data.json"), "utf-8")
  );

  console.log(`🧪 Importing ${testData.length} test questions...\n`);

  // Insert quizzes
  for (let i = 0; i < testData.length; i += 20) {
    const batch = testData.slice(i, i + 20);
    const { error } = await supabase.from("quizzes").upsert(batch);
    if (error) console.error(`  ❌ Batch error:`, error.message);
    else console.log(`  ✅ Quiz batch ${i / 20 + 1} (${batch.length} questions)`);
  }

  // Add test examples to grammar items per lesson
  console.log("\n📝 Adding test questions to grammar items...\n");

  const lessons = [...new Set(testData.map((q: any) => q.lesson))];

  for (const lesson of lessons) {
    const lessonTests = testData.filter((q: any) => q.lesson === lesson);

    const { data: grammarItems } = await supabase
      .from("grammar")
      .select("id, structure, examples")
      .eq("lesson", lesson);

    if (!grammarItems?.length) continue;

    for (let t = 0; t < lessonTests.length; t++) {
      const test = lessonTests[t];
      const testExample = {
        cau_hoi: test.question,
        options: test.options,
        source: `Kiểm tra 5 phút - Bài ${lesson}`,
      };

      const targetIndex = t % grammarItems.length;
      const target = grammarItems[targetIndex];
      const existing = target.examples || [];

      // Append test example (bỏ qua nếu đã có → idempotent khi chạy lại import)
      const alreadyExists = existing.some(
        (ex: any) => ex && ex.cau_hoi === testExample.cau_hoi
      );
      if (!alreadyExists) {
        grammarItems[targetIndex].examples = [...existing, testExample];
      }
    }

    // Batch update all grammar items for this lesson
    for (const g of grammarItems) {
      await supabase
        .from("grammar")
        .update({ examples: g.examples })
        .eq("id", g.id);
    }

    console.log(`  ✅ Bài ${lesson}: Added ${lessonTests.length} test examples across ${grammarItems.length} grammar items`);
  }

  console.log("\n🎉 Done!");
}

main().catch(console.error);
