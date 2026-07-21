# nihonGo — JLPT N5 learning companion

Ứng dụng học tiếng Nhật N5 dành cho người Việt, xây dựng bằng React 19, TypeScript, Vite, Express và Supabase.

## Learning loop

nihonGo tổ chức việc học theo vòng lặp ngắn:

1. **Học có ngữ cảnh** — tra cứu Kana, từ vựng, Kanji và ngữ pháp theo bài.
2. **Gợi nhớ chủ động** — trả lời trước khi lật thẻ hoặc xem lời giải.
3. **Phản hồi tức thì** — biết đáp án đúng, cách đọc và lý do ngay sau mỗi câu.
4. **Error loop** — câu sai được lưu thành một bộ ôn riêng.
5. **Ôn cách quãng** — từ vựng được lên lịch lại theo bốn mức: Học lại, Khó, Nhớ, Rất dễ.

## Tính năng chính

- Dashboard “Hôm nay” với phiên học đề xuất khoảng 15 phút.
- Bảng Hiragana/Katakana có âm thanh, ẩn Romaji và bài kiểm tra nhận diện.
- Từ điển N5, tìm bằng Nhật/romaji/tiếng Việt, yêu thích, flashcard và spaced repetition.
- Kanji theo bài với âm On, âm Kun, Hán Việt, từ ghép và flashcard.
- Ngữ pháp có tìm kiếm, bảng chia, ví dụ, phát âm và highlight trợ từ/từ để hỏi.
- Trung tâm luyện tập cho Kana, từ vựng, Kanji, ngữ pháp hoặc đề tổng hợp.
- Tự tạo câu luyện từ học liệu hiện có; câu biên soạn trong Supabase luôn được ưu tiên.
- Lịch sử làm bài, thời gian, độ chính xác, danh sách câu sai và phím tắt `1–4` / `Enter`.
- Giao diện desktop/mobile responsive và lazy-load theo từng khu vực học.

## Chạy local

Yêu cầu Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

Mở `http://localhost:3000`. Khi Supabase chưa được cấu hình hoặc tạm thời không truy cập được, ứng dụng dùng bộ starter data và vẫn lưu tiến độ ôn từ vựng trong trình duyệt.

## Kiểm tra chất lượng

```bash
npm test        # kiểm tra bộ sinh câu hỏi và ưu tiên câu biên soạn
npm run lint    # TypeScript typecheck
npm run build   # production build
```

## Biến môi trường

Xem [.env.example](.env.example). Các biến chính:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` cho các API AI phía server

## Dữ liệu

Luồng dữ liệu chuẩn:

```text
resources/*.json → scripts/import-*.ts → Supabase → React UI
```

Không chạy import tự động. Sau khi kiểm tra resource, người duy trì dự án tự chạy script phù hợp, ví dụ:

```bash
npx tsx scripts/import-to-supabase.ts
npx tsx scripts/import-vocab-supplement.ts
```

Chi tiết schema nằm tại [supabase/schema.sql](supabase/schema.sql); quy trình bổ sung từ vựng từ ngữ pháp nằm tại [resources/gramma/VOCAB_FROM_GRAMMAR.md](resources/gramma/VOCAB_FROM_GRAMMAR.md).
