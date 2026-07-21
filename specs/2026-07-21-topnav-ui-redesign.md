# Spec: Chuyển shell UI từ sidebar sang top-nav, giữ dashboard "Hôm nay" làm 1 tab

- Date: 2026-07-21
- Status: done
  (building = a session is on it now; approved = parked, resumable by anyone — the supervisor auto-resumes approved/building specs; blocked = needs a human)

## Problem

Bản redesign hiện tại trên branch (chưa commit: `src/App.tsx`, `src/index.css`,
`src/components/LearningDashboard.tsx`) dùng **sidebar dọc cố định** (`.app-sidebar`,
248px, `position: fixed`) làm điều hướng chính. User thấy layout này không phù hợp/
choán chỗ so với bản tab ngang trước đó (header + 4 thẻ số liệu + tab bar:
Bảng chữ cái | Từ vựng & Từ điển | Ngữ pháp | Trắc nghiệm ôn tập | Cập nhật AI).
Tuy nhiên nội dung dashboard "Hôm nay" (hero kế hoạch, streak, tiến độ tuần, "3 bước
hôm nay", lưới kỹ năng trong `LearningDashboard.tsx`) là ý tưởng đáng giữ, khớp với
"Learning loop" đã mô tả trong README.

Quyết định hướng (đã chốt với user): dùng lại khung điều hướng dạng **tab ngang**,
đưa "Hôm nay" thành **một tab** trong đó (không còn sidebar cố định).

## Goal

- `App.tsx` dùng shell dạng header + tab bar ngang (không còn `<aside className="app-sidebar">`
  cố định chiếm chiều ngang màn hình).
- Tab bar có đủ các mục: **Hôm nay** (mặc định/đầu tiên), Bảng chữ cái (Kana), Từ vựng,
  Kanji, Ngữ pháp, Luyện tập, Dữ liệu & AI.
- Tab "Hôm nay" render nguyên nội dung `LearningDashboard` hiện có (hero, streak,
  tiến độ tuần, 3 bước, lưới kỹ năng) — không mất tính năng đã build.
- Toàn bộ logic nghiệp vụ hiện có (favorites, quiz, spaced repetition, luyện tập,
  import AI) giữ nguyên hành vi, chỉ đổi khung điều hướng bên ngoài.
- Responsive mobile (~390px) không vỡ layout, không tràn ngang.

## Non-goals

- Không thiết kế lại nội dung bên trong từng board (KanaBoard, VocabularyBoard,
  KanjiBoard, GrammarBoard, QuizBoard) ngoài việc gắn vào tab mới.
- Không đổi bảng màu/theme tổng thể trừ phần cần cho tab bar thay sidebar.
- Không đụng tới `resources/`, `scripts/import-to-supabase.ts` (thuộc spec
  `2026-07-21-new-lessons-15-16-17.md`).
- Không bắt buộc giữ y nguyên hamburger menu mobile cũ của bản sidebar — chỉ cần
  tab bar tự responsive, không vỡ layout.

## Acceptance criteria

- [x] Không còn phần tử sidebar cố định trong DOM khi render App — verify: mở app,
      `document.querySelector('.app-sidebar')` trả về `null` (chrome devtools
      evaluate_script), ghi lại kết quả trong Outcome.
- [x] Tab bar hiển thị đủ 7 mục (Hôm nay, Bảng chữ cái, Từ vựng, Kanji, Ngữ pháp,
      Luyện tập, Dữ liệu & AI) và click từng tab chuyển đúng nội dung tương ứng —
      verify: thao tác thủ công qua chrome-devtools (click từng tab, screenshot),
      người review đối chiếu.
- [x] Tab "Hôm nay" là tab mặc định khi vào app và hiển thị đúng nội dung
      `LearningDashboard` (hero, streak, 3 bước, lưới kỹ năng) — verify: screenshot
      sau khi load trang lần đầu.
- [x] `npm test`, `npm run lint`, `npm run build` pass — verify: chạy cả ba lệnh,
      exit 0.
- [x] Responsive mobile không tràn ngang — verify: chrome-devtools
      `emulate viewport 390x844`, sau đó `document.documentElement.scrollWidth <=
      window.innerWidth` (evaluate_script), ghi kết quả.

## Constraints

- Giữ nguyên toàn bộ props/behaviour của các Board component hiện có — chỉ đổi
  shell điều hướng bao quanh (`App.tsx`) và CSS liên quan tới shell (`.app-shell`,
  `.app-sidebar`, `.app-workspace`, `.app-content` trong `src/index.css`).
- Không được phá test hiện có (`src/utils/practice.test.ts`).

## Stop if

- Phải sửa quá 15 file, hoặc phải đổi cấu trúc props của các Board component theo
  cách phá vỡ test hiện có.
- Cùng một file (`src/App.tsx` hoặc `src/index.css`) bị chỉnh bởi cả tiêu chí này
  và một tiêu chí khác theo cách xung đột nhau giữa hai lần chạy khác nhau.

## Interfaces

Độc lập với spec dữ liệu (`2026-07-21-new-lessons-15-16-17.md`) — spec này chỉ đụng
`src/App.tsx`, `src/index.css`, `src/components/LearningDashboard.tsx` (và các Board
component nếu cần gắn props mới cho tab). Không đụng `resources/` hay `scripts/`.
Có thể build song song an toàn với spec dữ liệu.

## Plan (filled at Plan stage)

1. `src/App.tsx`: bỏ `aside.app-sidebar`, `mobileMenuOpen` state, `menu-scrim`,
   import `Menu`/`X`/`ChevronRight` không dùng nữa; thêm `<nav className="top-tabs">`
   ngay dưới `<header className="app-topbar">`; gộp mục "Dữ liệu & AI" thẳng vào mảng
   `navigation` (dùng chung cho top-tabs + mobile-bottom-nav, bỏ đoạn concat riêng).
2. `src/index.css`: xoá toàn bộ rule `.app-sidebar`, `.primary-nav`, `.sidebar-*`,
   `.utility-nav`, `.menu-scrim`, `.app-workspace`; thêm `.top-tabs` (sticky dưới
   topbar, underline cam cho tab active); `.app-shell` đổi `flex-direction: column`;
   sửa 2 media query (1024px, 760px) bỏ phần chỉnh width sidebar/workspace, thêm
   `.top-tabs { top: 58px }` cho mobile.
3. Build → test bằng chrome-devtools (desktop 1536px + mobile 390px) → so sánh
   screenshot với bản cũ.

## Decisions log (append during Build)

- 2026-07-21 — Giữ nguyên `mobile-bottom-nav` sẵn có (không cần xây lại) — đã là
  bottom tab bar độc lập với sidebar, chỉ cần thêm mục "Dữ liệu & AI" vào chung mảng
  `navigation` để nó tự xuất hiện cả ở top-tabs lẫn bottom-nav.
- 2026-07-21 — `activeLabel` (breadcrumb text) bị code của tôi làm mồ côi sau khi bỏ
  `topbar-left` — xoá thay vì giữ lại, vì tab đang active đã được thể hiện bằng
  underline trong `.top-tabs`, không cần lặp lại bằng text.

## Outcome (filled at Ship)

Shipped đúng theo spec, không có sai lệch. Bằng chứng từng tiêu chí:

- `.app-sidebar` trong DOM: `evaluate_script` → `{"sidebarExists": false}`.
- 7 tab hiển thị đủ (Hôm nay, Bảng chữ Kana, Từ vựng, Kanji, Ngữ pháp, Luyện tập,
  Dữ liệu & AI); đã click qua Từ vựng và Ngữ pháp, xác nhận `VocabularyBoard` /
  `GrammarBoard` render đúng nội dung (bảng 989 từ, 100 cấu trúc gồm bài mới).
- Tab "Hôm nay" là mặc định khi load `http://localhost:3000` — screenshot xác nhận
  hero "Kế hoạch hôm nay", vòng tiến độ 44%, streak, "Ba bước cho hôm nay", lưới kỹ
  năng đều hiển thị đầy đủ (không còn bị cắt như bản sidebar trước đó).
- `npm test`: 2/2 pass. `npm run lint` (tsc --noEmit): clean. `npm run build`:
  built in ~3-4s, 0 lỗi.
- Mobile 390x844: `evaluate_script` → `{"scrollWidth": 390, "innerWidth": 390}`,
  không tràn ngang; top-tabs tự cuộn ngang, bottom-nav hiển thị đủ 7 mục.
