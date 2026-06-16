# Trích từ vựng từ ngữ pháp (Grammar → Vocab)

> Tài liệu quy trình để bổ sung từ vựng "ẩn" trong các câu ví dụ ngữ pháp
> vào `resources/vocab/` và đẩy lên Supabase.

## Bối cảnh

- Các file trong `resources/gramma/` **chỉ chứa ngữ pháp** (cấu trúc + câu ví dụ + bảng chia thì). Không có mục "từ vựng" riêng.
- Nhưng trong các **câu ví dụ ngữ pháp** có nhiều từ vựng chưa có trong `resources/vocab/`, đặc biệt:
  - **Trạng từ mức độ**: `とても`, `よく`, `だいたい`, `すこし`, `あまり`, `ぜんぜん`, `たくさん`
  - **Trạng từ tần suất**: `まいにち`, `まいあさ`, `まいばん`
  - **Liên từ**: `そして`, `それから`
  - **Từ để hỏi**: `どうして`
  - **Danh từ lẻ**: `きっさてん`, `じてんしゃ`, `ばんごはん`, `いちば`, `レポート`, `こいびと`, `ひるごはん`, `バナナ`
- Nhiệm vụ: trích các từ này ra thành vocab bổ sung theo từng bài, rồi import lên Supabase.

## Quy trình (làm từng bài)

### 1. Lập danh sách từ đã có (để đối chiếu, tránh trùng)

```bash
python3 - <<'PY'
import json, glob
def collect(o, w):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ("japanese","hiragana","word","character") and isinstance(v, str): w.append(v.strip())
            else: collect(v, w)
    elif isinstance(o, list):
        for i in o: collect(i, w)
for f in sorted(glob.glob("resources/vocab/*.json")):
    w = []; collect(json.load(open(f)), w)
    print(f, len(w), "|".join(w))
PY
```

### 2. Duyệt câu ví dụ trong file gramma, chọn từ mới

Với mỗi câu ví dụ (có `tieng_nhat` + `tieng_viet`, hoặc `sentence` + `meaning`):
- Lấy nghĩa tiếng Việt ngay từ bản dịch kèm trong ví dụ.
- Chọn các từ **đáng học** và **chưa có** ở bước 1.

**Bao gồm:** trạng từ (mức độ / tần suất), liên từ, từ để hỏi, danh từ, động từ, tính từ, biểu hiện thông dụng.

**KHÔNG bao gồm:**
- Trợ từ ngữ pháp: `は が で に へ を も と か よ ね や の` (và `から/まで/より` khi đóng vai trò trợ từ).
- Danh từ riêng: tên người (`ヤマダ`, `ミラー`), tên công ty (`ホンダ`, `トヨタ`), tên nước chỉ làm ví dụ.
- Từ đã có trong bất kỳ file vocab nào.
- Bộ đếm/số đếm đã dạy (`〜歳`, `〜時`, `〜分`, `〜月`, `〜日`, `〜百/千/万`).

### 3. Quy tắc không trùng lặp

Mỗi từ chỉ xuất hiện **MỘT lần** trên toàn bộ bảng `vocabulary`. Nếu một từ gặp ở ví dụ nhiều bài
(vd `あまり`, `ぜんぜん` có ở cả bài 8 và bài 9) → gán vào **một** bài (chọn bài xuất hiện đầu / nổi bật nhất).
Trước khi thêm, đối chiếu cả các file `*_supplement.json` đã có.

### 4. Ghi vào file supplement (schema đồng nhất)

`resources/vocab/n5_online_vocab_lesson_<X>_supplement.json`:

```json
{
  "source": "Từ vựng bổ sung trích từ câu ví dụ ngữ pháp (grammar lesson X)",
  "lesson_range": "X",
  "items": [
    {
      "stt": 1, "lesson": 9,
      "word": "だいたい", "reading": "だいたい", "romaji": "daitai",
      "meaning": "Đại khái, phần lớn", "category": "Trạng từ mức độ"
    }
  ]
}
```

- `stt` đánh **liên tục theo từng lesson** (không trùng trong cùng lesson) → id `vocab-b{lesson}-sup-{stt}` là duy nhất.
- File gộp nhiều bài (vd `lessons_4_6`): mỗi item có `lesson` riêng, `stt` đánh lại từ 1 cho mỗi lesson.
- `category` gợi ý: `Trạng từ mức độ` / `Trạng từ tần suất` / `Liên từ` / `Từ để hỏi` / `Danh từ` / `Động từ` / `Tính từ`.
- `reading` = chính từ (đều là kana); katakana giữ nguyên katakana.

### 5. Import lên Supabase (USER tự chạy)

```
npx tsx scripts/import-vocab-supplement.ts
```

Script đọc mọi `resources/vocab/*_supplement.json`, upsert vào bảng `vocabulary`.
**AI không tự ghi DB** — chỉ đưa lệnh cho user (xem `CLAUDE.md`).

## Bảng từ vựng đã trích (cập nhật 2026-06-16 — 21 từ)

| Bài | Số | Từ |
|---|---|---|
| 4-6 | 9 | `まいにち`, `まいあさ`, `まいばん`, `きっさてん`, `じてんしゃ`, `バナナ`, `ばんごはん`, `いちば`, `それから` |
| 7 | 2 | `レポート`, `こいびと` |
| 8 | 2 | `とても`, `そして` |
| 9 | 8 | `よく`, `だいたい`, `すこし`, `あまり`, `ぜんぜん`, `たくさん`, `どうして`, `ひるごはん` |

Bài 1-3: ví dụ ngữ pháp dùng toàn từ cơ bản đã có → chưa có từ mới.

> Khi trích thêm các bài sau (N4, bài 10+…), dùng đúng quy trình trên và **cập nhật bảng này** để session sau biết đâu đã làm.

## Ghi chú: import grammar bài 9

Grammar bài 9 đã được thêm vào `scripts/import-to-supabase.ts`
(schema `noi_dung_ngu_phap` → các row `grammar`, id `grammar-b9-1..4`).
Đồng bộ grammar bài 1-9 bằng:

```
npx tsx scripts/import-to-supabase.ts
```

## Lệnh dùng chung

| Mục đích | Lệnh |
|---|---|
| Nạp vocab bổ sung | `npx tsx scripts/import-vocab-supplement.ts` |
| Đồng bộ toàn bộ (vocab 1-9 + kanji + grammar 1-9) | `npx tsx scripts/import-to-supabase.ts` |
| Xem vocab bổ sung | `SELECT id, word, meaning FROM vocabulary WHERE id LIKE 'vocab-b%-sup-%';` |
| Xem grammar bài 9 | `SELECT id, structure, meaning FROM grammar WHERE lesson = 9;` |
| Gỡ vocab bổ sung | `DELETE FROM vocabulary WHERE id LIKE 'vocab-b%-sup-%';` |
