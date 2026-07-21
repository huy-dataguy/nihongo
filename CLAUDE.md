# CLAUDE.md — nihonGo (JLPT N5)

App học tiếng Nhật N5. Vite + React + TypeScript, backend Express (`server.ts`),
lưu trữ Supabase. Chi tiết chạy app xem `README.md` (`npm run dev` → `tsx server.ts`).

## Environment (agent-factory)

Dự án chạy trên agent-factory. Các chuẩn nền được import bên dưới; phần riêng của
dự án mở rộng thêm, chỉ được override khi nói rõ.

@../agent-factory/standards/workflow.md
@../agent-factory/standards/definition-of-done.md
@../agent-factory/standards/engineering.md
@../agent-factory/standards/ground-truth.md
@../agent-factory/standards/memory.md
@../agent-factory/standards/debugging.md

## Stack

Vite 6 + React 19 + TypeScript, Tailwind v4. Backend Express (`server.ts`, chạy qua
`tsx`, kiêm Vite middleware dev-server + endpoint `/api/parse-study-data` gọi
Gemini). Lưu trữ Supabase (Postgres). Deploy Vercel (`vercel.json`, `api/`).

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

## Commands

- setup: `npm install`
- build: `npm run build`
- test: `npm test`
- lint: `npm run lint`
- run: `npm run dev`
- đồng bộ vocab 1-12 + kanji + grammar 1-10: `npx tsx scripts/import-to-supabase.ts`
- nạp vocab bổ sung (`*_supplement.json`): `npx tsx scripts/import-vocab-supplement.ts`

Yêu cầu `.env` có `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (xem `.env.example`).
Mọi script `scripts/*.ts` đều ghi thẳng Supabase → **AI không tự chạy** (xem quy tắc 1); đưa lệnh cho user tự `npx tsx scripts/...`.

## Definition of Done — project additions

- Mọi file `resources/**/*.json` vừa sửa phải parse được, ví dụ: `node -e "JSON.parse(require('fs').readFileSync('<file>','utf8'))"`.

## Gotchas / trapdoors

- Xem "Quy tắc BẮT BUỘC" ở trên — đó là các trapdoor đã biết (ghi Supabase trực tiếp, schema đổi theo bài, vocab thiếu trong gramma).
- `npm test` chạy `node --import tsx --test src/**/*.test.ts` qua `/bin/sh` (npm mặc định), pattern này **không bắt được test lồng từ 2 cấp thư mục trở lên** (đã kiểm chứng: `src/utils/nested/probe.test.ts` bị bỏ sót lặng lẽ, không lỗi). Test file mới nên đặt ngay dưới `src/<thư-mục>/*.test.ts`.
- `dist/` là build output, nằm trong `.gitignore` — không sửa tay, chỉ sinh lại bằng `npm run build`.
- **Supabase `.select("*")` mặc định cắt ở 1000 dòng** (giới hạn PostgREST). `src/App.tsx` `loadData()` đã fix bằng `fetchAllRows()` phân trang `.range()` cho `vocabulary`/`grammar`/`kanji`/`quizzes` — nếu thêm truy vấn Supabase mới đọc toàn bảng, nhớ dùng lại helper này, đừng `.select("*")` trần. (Phát hiện 2026-07-21: bài 17 hiện thiếu từ trên web dù JSON đúng 100%, vì tổng vocab vượt 1000 dòng.)
