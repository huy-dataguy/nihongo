/**
 * Generate vocabulary quizzes from existing vocab data in Supabase
 * Creates 2 question types per word:
 *   1. "Từ X nghĩa là gì?" (word → meaning)
 *   2. "Nghĩa Y là từ nào?" (meaning → word)
 * Usage: npx tsx scripts/generate-vocab-quizzes.ts
 */
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

// Shuffle helper
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick N random distractors (wrong answers) from a pool, excluding the correct one
function pickDistractors(pool: string[], correct: string, n: number): string[] {
  const filtered = pool.filter(p => p !== correct && p.length > 0);
  return shuffle(filtered).slice(0, n);
}

async function main() {
  console.log("📝 Generating vocabulary quizzes...\n");

  // Fetch all vocabulary
  const { data: vocab, error } = await supabase
    .from("vocabulary")
    .select("*")
    .order("lesson", { ascending: true });

  if (error || !vocab) {
    console.error("❌ Failed to fetch vocabulary:", error?.message);
    process.exit(1);
  }

  console.log(`📖 Loaded ${vocab.length} vocabulary items\n`);

  // Group by lesson for topic-based questions
  const byLesson: Record<number, typeof vocab> = {};
  for (const v of vocab) {
    const l = v.lesson || 0;
    if (!byLesson[l]) byLesson[l] = [];
    byLesson[l].push(v);
  }

  // Create pools for distractor selection
  const allMeanings = vocab.map(v => v.meaning).filter(Boolean);
  const allWords = vocab.map(v => v.word).filter(Boolean);

  const quizzes: any[] = [];

  for (const v of vocab) {
    const lesson = v.lesson || 0;
    const lessonVocab = byLesson[lesson] || vocab;

    // === Question Type 1: Word → Meaning ===
    // "Từ 'わたし' (watashi) nghĩa là gì?"
    const meaningOptions = [v.meaning];
    const meaningDistractors = pickDistractors(
      lessonVocab.map(lv => lv.meaning),
      v.meaning,
      3
    );
    // If not enough from same lesson, fill from all
    if (meaningDistractors.length < 3) {
      const extra = pickDistractors(allMeanings, v.meaning, 3 - meaningDistractors.length);
      meaningDistractors.push(...extra);
    }
    meaningOptions.push(...meaningDistractors.slice(0, 3));

    const shuffledMeaningOptions = shuffle(meaningOptions);
    const meaningAnswerIndex = shuffledMeaningOptions.indexOf(v.meaning);

    quizzes.push({
      id: `vocab-quiz-meaning-${v.id}`,
      question: `Từ '${v.word}'${v.reading !== v.word ? ` (${v.reading})` : ''} nghĩa là gì?`,
      options: shuffledMeaningOptions,
      answer_index: meaningAnswerIndex,
      explanation: `${v.word} (${v.reading}${v.romaji ? ` / ${v.romaji}` : ''}) nghĩa là: ${v.meaning}. ${v.category ? `Thuộc ${v.category}.` : ''}`,
      type: "vocabulary",
      lesson: lesson,
      is_custom: false,
    });

    // === Question Type 2: Meaning → Word ===
    // "'Tôi' trong tiếng Nhật là từ nào?"
    const wordOptions = [v.word];
    const wordDistractors = pickDistractors(
      lessonVocab.map(lv => lv.word),
      v.word,
      3
    );
    if (wordDistractors.length < 3) {
      const extra = pickDistractors(allWords, v.word, 3 - wordDistractors.length);
      wordDistractors.push(...extra);
    }
    wordOptions.push(...wordDistractors.slice(0, 3));

    const shuffledWordOptions = shuffle(wordOptions);
    const wordAnswerIndex = shuffledWordOptions.indexOf(v.word);

    quizzes.push({
      id: `vocab-quiz-word-${v.id}`,
      question: `'${v.meaning}' trong tiếng Nhật là từ nào?`,
      options: shuffledWordOptions,
      answer_index: wordAnswerIndex,
      explanation: `Đáp án đúng là ${v.word} (${v.reading}) = ${v.meaning}.`,
      type: "vocabulary",
      lesson: lesson,
      is_custom: false,
    });
  }

  console.log(`📊 Generated ${quizzes.length} quiz questions\n`);

  // Insert in batches
  for (let i = 0; i < quizzes.length; i += 50) {
    const batch = quizzes.slice(i, i + 50);
    const { error: insertError } = await supabase.from("quizzes").upsert(batch);
    if (insertError) {
      console.error(`  ❌ Batch ${i / 50 + 1} error:`, insertError.message);
    } else {
      console.log(`  ✅ Batch ${i / 50 + 1} (${batch.length} questions)`);
    }
  }

  // Summary
  const byLessonCount: Record<number, number> = {};
  for (const q of quizzes) {
    byLessonCount[q.lesson] = (byLessonCount[q.lesson] || 0) + 1;
  }

  console.log("\n📋 Quiz summary by lesson:");
  for (const [lesson, count] of Object.entries(byLessonCount).sort((a, b) => +a[0] - +b[0])) {
    console.log(`  Bài ${lesson}: ${count} questions`);
  }
  console.log(`\n🎉 Total: ${quizzes.length} vocabulary quizzes imported!`);
}

main().catch(console.error);
