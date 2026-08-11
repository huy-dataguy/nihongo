import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";

interface LessonFilterDropdownProps {
  /** Danh sách số bài, đã sắp xếp tăng dần, không trùng lặp. */
  lessons: number[];
  selected: number | "all";
  onSelect: (lesson: number | "all") => void;
  /** Số lượng mục cho 1 bài (hoặc "all"), hiển thị bên phải mỗi dòng nếu có. */
  countFor?: (lesson: number | "all") => number;
  /** Chủ đề phụ của 1 bài, vd "Thứ trong tuần & Ngũ hành". */
  topicFor?: (lesson: number) => string | undefined;
  allLabel?: string;
  className?: string;
}

/**
 * Bộ lọc "Bài" dùng chung cho Từ vựng / Ngữ pháp / Kanji — luôn sắp xếp theo
 * đúng số thứ tự bài học (không phụ thuộc thứ tự category string trong dữ liệu gốc).
 */
export default function LessonFilterDropdown({
  lessons,
  selected,
  onSelect,
  countFor,
  topicFor,
  allLabel = "Tất cả các bài",
  className = "",
}: LessonFilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full md:w-auto inline-flex items-center justify-between md:justify-start gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100/80 hover:border-amber-300 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-all"
      >
        <span className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-400 shrink-0" />
          {selected === "all" ? "Tất cả bài" : `Bài ${selected}`}
        </span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 md:left-auto md:right-0 mt-1.5 w-full md:w-64 max-h-80 overflow-y-auto rounded-xl bg-white border border-gray-150 shadow-lg py-1.5 z-50 animate-fade">
            <button
              onClick={() => { onSelect("all"); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                selected === "all" ? "bg-amber-50/60 text-amber-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{allLabel}</span>
              {countFor && <span className="text-gray-400 font-mono text-[10px] shrink-0">{countFor("all")}</span>}
            </button>
            {lessons.map((n) => (
              <button
                key={n}
                onClick={() => { onSelect(n); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                  selected === n ? "bg-amber-50/60 text-amber-900 font-semibold" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="truncate">
                  Bài {n}
                  {topicFor?.(n) ? <span className="text-gray-400"> — {topicFor(n)}</span> : null}
                </span>
                {countFor && <span className="text-gray-400 font-mono text-[10px] shrink-0">{countFor(n)}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
