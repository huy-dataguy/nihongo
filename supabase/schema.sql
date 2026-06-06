-- ============================================
-- nihonGo N5 - Supabase Schema
-- Chạy file này trong Supabase SQL Editor
-- ============================================

-- 1. Từ vựng
CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  reading TEXT NOT NULL DEFAULT '',
  romaji TEXT DEFAULT '',
  meaning TEXT NOT NULL,
  category TEXT DEFAULT '',
  lesson INTEGER DEFAULT 0,
  examples JSONB DEFAULT '[]'::jsonb,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ngữ pháp
CREATE TABLE IF NOT EXISTS grammar (
  id TEXT PRIMARY KEY,
  structure TEXT NOT NULL,
  meaning TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  category TEXT DEFAULT '',
  lesson INTEGER DEFAULT 0,
  examples JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  conjugation_tables JSONB DEFAULT '{}'::jsonb,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Chữ Hán
CREATE TABLE IF NOT EXISTS kanji (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL,
  onyomi TEXT DEFAULT '',
  kunyomi TEXT DEFAULT '',
  meaning TEXT NOT NULL,
  lesson INTEGER DEFAULT 0,
  examples JSONB DEFAULT '[]'::jsonb,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Câu hỏi trắc nghiệm
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer_index INTEGER NOT NULL,
  explanation TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('vocabulary', 'grammar', 'kanji', 'kana')),
  lesson INTEGER DEFAULT 0,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Lịch sử import
CREATE TABLE IF NOT EXISTS import_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  raw_text TEXT DEFAULT '',
  parsed_item_count JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tiến độ học tập (1 row duy nhất)
CREATE TABLE IF NOT EXISTS study_progress (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  viewed_kana JSONB DEFAULT '[]'::jsonb,
  quiz_scores JSONB DEFAULT '{}'::jsonb,
  favorites JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tiến độ ôn từ vựng (Spaced Repetition - Leitner System)
-- Box 0 = mới chưa học, 1-5 = cấp độ ôn tập
-- next_review = ngày cần ôn lại tiếp theo
CREATE TABLE IF NOT EXISTS vocab_study (
  vocab_id TEXT PRIMARY KEY REFERENCES vocabulary(id) ON DELETE CASCADE,
  box INTEGER DEFAULT 0,
  next_review DATE DEFAULT CURRENT_DATE,
  last_reviewed TIMESTAMPTZ,
  correct_streak INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanji ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_study ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on vocabulary" ON vocabulary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on grammar" ON grammar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on kanji" ON kanji FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on quizzes" ON quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on import_logs" ON import_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on study_progress" ON study_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vocab_study" ON vocab_study FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Seed: Study Progress initial row
-- ============================================
INSERT INTO study_progress (id, viewed_kana, quiz_scores, favorites) VALUES
  (1, '[]'::jsonb, '{}'::jsonb, '[]'::jsonb);
