# CLAUDE.md — nihonGo (JLPT N5)

App học tiếng Nhật N5. Vite + React + TypeScript, backend Express (`server.ts`),
lưu trữ Supabase. Chi tiết chạy app xem `README.md` (`npm run dev` → `tsx server.ts`).

## Cấu trúc dữ liệu

- `resources/gramma/*.json` — ngữ pháp N5 (chỉ chứa ngữ pháp, **không có mục từ vựng riêng**).
- `resources/vocab/*.json` — từ vựng N5. **Schema khác nhau từng bài** (1-3, 4-6, 7, 8, 9各有 cấu trúc riêng) → phải đọc file trước khi xử lý.
- `resources/test/*.html` — đề kiểm tra 5 phút ngữ pháp.
- `supabase/schema.sql` — schema DB: `vocabulary`, `grammar`, `kanji`, `quizzes`, `study_progress`, `vocab_study`.
- `scripts/import-*.ts` — các script nạp resource JSON → Supabase (upsert theo `id`).

Luồng dữ liệu: `resources/*.json` → `scripts/import-*.ts` → bảng Supabase.

## Quy tắc BẮT BUỘC

### 1. Không tự ghi Supabase
AI **không kết nối / ghi thẳng DB**. Khi cần đẩy dữ liệu lên web, **viết/điều chỉnh script import rồi đưa LỆNH cho user tự chạy** (vd `npx tsx scripts/import-*.ts`). Memory: `supabase-no-direct-ai-writes`.

### 2. Bổ sung vocab từ ngữ pháp
File gramma chỉ có ngữ pháp, nhưng **câu ví dụ ngữ pháp chứa nhiều từ vựng chưa có trong vocab**
(đặc biệt trạng từ mức độ/tần suất, liên từ, từ để hỏi). Khi cần thêm vocab từ gramma:
**LÀM THEO ĐÚNG quy trình trong `resources/gramma/VOCAB_FROM_GRAMMAR.md`**
(diff → chọn từ mới → ghi `*_supplement.json` → đưa lệnh import). Đã trích 21 từ (bài 4-9); xem bảng trong file đó để biết đâu đã làm.

### 3. Schema khác nhau từng bài
Cả `gramma/` lẫn `vocab/` đều **đổi schema theo bài** (bài 7 ≠ bài 8 ≠ bài 9). Trước khi parse/import một file mới, **luôn đọc cấu trúc thực tế của file đó** trước; đừng giả định theo bài khác.

## Lệnh thường dùng

```
npm run dev                              # chạy app (tsx server.ts)
npx tsx scripts/import-to-supabase.ts    # đồng bộ toàn bộ vocab 1-12 + kanji + grammar 1-10
npx tsx scripts/import-vocab-supplement.ts  # nạp vocab bổ sung (*_supplement.json)
```

Yêu cầu `.env` có `SUPABASE_URL` + `SUPABASE_ANON_KEY` (xem `.env.example`).
