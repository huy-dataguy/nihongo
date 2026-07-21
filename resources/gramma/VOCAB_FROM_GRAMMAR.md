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

## Bảng từ vựng đã trích (cập nhật 2026-07-21 — 60 từ: 45 trích từ grammar + 15 gap-fill)

| Bài | Số | Từ |
|---|---|---|
| 1-3 *(gap-fill trừ `はたち`)* | 15 | `だれ`, `どなた`, `なんさい`, `おいくつ`, `さい`, `とし`, `どちら`, `なに`, `どこ`, `どれ`, `どう`, `なぜ`, `いくつ`, `いくら`, `はたち` |
| 4-6 | 11 | `まいにち`, `まいあさ`, `まいばん`, `きっさてん`, `じてんしゃ`, `ふたり`, `バナナ`, `ばんごはん`, `いちば`, `それから`, `すみません` |
| 7 | 4 | `レポート`, `こいびと`, `こんにちは`, `フォー` |
| 8 | 4 | `とても`, `そして`, `よる`, `どんな` |
| 9 | 9 | `よく`, `だいたい`, `すこし`, `あまり`, `ぜんぜん`, `たくさん`, `どうして`, `ひるごはん`, `かたかな` |
| 10 | 3 | `え`, `何も`, `だれも` |
| 11 | 3 | `だけ`, `ぐらい`, `どのくらい` |
| 12 | 3 | `くうこう`, `りんご`, `どちらも` |
| 13 | 5 | `何か`, `どこか`, `だれか`, `どこも`, `なつ休み` |
| 14 | 2 | `もう一ど`, `かた` |
| 15-16 | 1 | `どうやって` |

> **Bài 1-3 (gap-fill, 2026-06-27):** các câu ví dụ ngữ pháp bài 1-3 dùng toàn từ cơ bản đã có nên chưa trích được từ grammar. Tuy nhiên user phát hiện **bộ từ để hỏi + tuổi tác + where/what đang thiếu** trong vocab (`だれ`, `どこ`, `なに`, `なんさい`, `おいくつ`…) → bổ sung riêng vào `n5_online_vocab_lessons_1_3_supplement.json`. Đây là **gap-fill theo yêu cầu**, không phải trích từ câu ví dụ grammar.

> **Bài 11-14 (2026-07-18):** trích từ `resources/gramma/n5_online_grammar_lesson_{11,12,13,14}.json` (mới thêm cùng lúc, xem PDF gốc trong `03 - Learning/JLPT/Gramma/`). Ghi vào `n5_online_vocab_lessons_11_14_supplement.json`. Đối chiếu với toàn bộ `resources/vocab/*.json` hiện có trước khi chọn — nhiều từ tưởng thiếu (`先月/せんげつ`, `一ばん/いちばん`, `たんじょう日/たんじょうび`) hoá ra đã có dưới dạng chính tả khác nên bị loại.

> **Rà soát lại toàn bộ bài 1-10 (2026-07-18, theo yêu cầu user "check các bài ngữ pháp còn từ vựng nào vocab chưa có"):** đọc lại **tất cả** các file `resources/gramma/*.json` (kể cả các bài đã "xong" trước đó) và đối chiếu bằng script Python (so khớp chính xác, có tách từ dạng `漢字 (かな)` thành cả 2 dạng để tránh báo thiếu giả). Phát hiện thêm 8 từ bị bỏ sót: `はたち` (bài 1, 20 tuổi — đọc đặc biệt), `ふたり` (bài 5, 2 người — đọc đặc biệt), `すみません` (bài 6), `こんにちは`/`フォー` (bài 7), `よる`/`どんな` (bài 8), `かたかな` (bài 9). Ghi thêm vào các file supplement **đã có sẵn** của từng bài (không tạo file mới) để giữ nguyên quy ước 1 bài = 1 file supplement.
> Riêng bài 10 trước đó **chưa từng được xử lý** (không có dòng trong bảng này) — đã trích 3 từ (`え`, `何も`, `だれも`) vào file mới `n5_online_vocab_lesson_10_supplement.json`. Do đó `何も`/`だれも` được **chuyển từ bài 13 về bài 10** (nơi xuất hiện đầu tiên thực sự, theo đúng quy tắc "gán vào bài xuất hiện đầu") trong `n5_online_vocab_lessons_11_14_supplement.json`.

> **Bài 15-16 (2026-07-21):** trích từ `resources/gramma/n5_online_grammar_lesson_{15,16}.json`
> (PDF gốc: `NGU_PHAP_BAI_15.pdf`, `NGU_PHAP_BAI_16.pdf` trong `03 - Learning/JLPT/Gramma/`).
> Rà soát toàn bộ từ trong câu ví dụ, đối chiếu `resources/vocab/*.json` — phần lớn từ đã có sẵn
> (nhiều từ trùng với vocab bài 15/16/17: つくります・うります・しります・すみます・りょう・せいひん…).
> Chỉ 1 từ thực sự mới: `どうやって` (bằng cách nào), ghi vào `n5_online_vocab_lesson_16_supplement.json`.
> Loại `アメリカ人` (danh từ riêng dùng làm ví dụ, theo quy tắc loại trừ) và `電気せいひん` (ghép từ
> 2 từ đã biết: `電気` + `せいひん`).

> Khi trích thêm các bài sau (N4, bài 18+…), dùng đúng quy trình trên và **cập nhật bảng này** để session sau biết đâu đã làm.

## Ghi chú: import grammar bài 9-16

Grammar bài 9, 11-13, 15-16 dùng chung schema `{ bai_hoc, noi_dung_ngu_phap: [{cau_truc, y_nghia, vi_du}] }`
(bài 10 là mảng phẳng không có `bai_hoc`). Cả 8 bài (9, 11-13, 15-16 qua vòng lặp chung; 10 riêng)
đã được parse trong `scripts/import-to-supabase.ts` → các row `grammar`, id `grammar-b{lesson}-{stt}`.
Riêng bài 14 có thêm bảng chia động từ 3 nhóm (じしょけい + てけい, trích từ ảnh trong PDF gốc)
lưu ở field `bang_chia_dong_tu` của file JSON, gắn vào `conjugation_tables` của điểm ngữ pháp đầu tiên khi import.

Đồng bộ toàn bộ grammar bài 1-16 bằng:

```
npx tsx scripts/import-to-supabase.ts
```

## Lệnh dùng chung

| Mục đích | Lệnh |
|---|---|
| Nạp vocab bổ sung | `npx tsx scripts/import-vocab-supplement.ts` |
| Đồng bộ toàn bộ (vocab 1-17 + kanji + grammar 1-16) | `npx tsx scripts/import-to-supabase.ts` |
| Xem vocab bổ sung | `SELECT id, word, meaning FROM vocabulary WHERE id LIKE 'vocab-b%-sup-%';` |
| Xem grammar bài 11-16 | `SELECT id, structure, meaning FROM grammar WHERE lesson IN (11,12,13,14,15,16);` |
| Gỡ vocab bổ sung | `DELETE FROM vocabulary WHERE id LIKE 'vocab-b%-sup-%';` |
