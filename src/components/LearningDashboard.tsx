import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  Check,
  ChevronRight,
  Flame,
  Languages,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import type { CSSProperties } from "react";
import { QuizQuestion } from "../types";

type Destination = "kana" | "vocabulary" | "kanji" | "grammar" | "practice";

interface LearningDashboardProps {
  vocabularyCount: number;
  grammarCount: number;
  kanjiCount: number;
  favoritesCount: number;
  completedSessions: number;
  averageAccuracy: number;
  questions: QuizQuestion[];
  onNavigate: (destination: Destination, practiceType?: QuizQuestion["type"] | "all") => void;
}

const todayLabel = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "long",
}).format(new Date());

export default function LearningDashboard({
  vocabularyCount,
  grammarCount,
  kanjiCount,
  favoritesCount,
  completedSessions,
  averageAccuracy,
  questions,
  onNavigate,
}: LearningDashboardProps) {
  const typeCount = (type: QuizQuestion["type"]) => questions.filter((question) => question.type === type).length;
  const goalProgress = completedSessions === 0 ? 12 : Math.min(100, 28 + completedSessions * 8);

  const dailyPlan = [
    {
      eyebrow: "Khởi động",
      title: "Ôn từ theo trí nhớ",
      meta: `${Math.min(12, Math.max(5, favoritesCount || 10))} thẻ · khoảng 5 phút`,
      destination: "vocabulary" as const,
      icon: BrainCircuit,
      tone: "coral",
    },
    {
      eyebrow: "Hiểu sâu",
      title: "Một điểm ngữ pháp",
      meta: `${grammarCount} mẫu câu để tra cứu`,
      destination: "grammar" as const,
      icon: BookOpenText,
      tone: "indigo",
    },
    {
      eyebrow: "Gợi nhớ chủ động",
      title: "Kiểm tra tổng hợp",
      meta: `10 câu · phản hồi ngay`,
      destination: "practice" as const,
      icon: Target,
      tone: "mint",
    },
  ];

  return (
    <div className="dashboard-stack animate-fade">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow eyebrow-light"><Sparkles size={13} /> Kế hoạch hôm nay</span>
          <p className="hero-date">{todayLabel}</p>
          <h1>少しずつ、<br />確実に。</h1>
          <p className="hero-subtitle">Mỗi ngày một chút, nhưng nhớ thật chắc. Bắt đầu bằng một phiên học ngắn được cân bằng giữa học mới và gợi nhớ.</p>
          <button className="hero-action" onClick={() => onNavigate("practice", "all")}>
            <Play size={17} fill="currentColor" /> Bắt đầu phiên 15 phút
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="hero-progress" aria-label={`Tiến độ mục tiêu ${goalProgress}%`}>
          <div className="progress-orbit" style={{ "--progress": `${goalProgress * 3.6}deg` } as CSSProperties}>
            <div className="progress-orbit-inner">
              <strong>{goalProgress}%</strong>
              <span>mục tiêu tuần</span>
            </div>
          </div>
          <div className="hero-streak"><Flame size={16} /> {Math.max(1, Math.min(completedSessions, 7))} ngày nhịp học</div>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Lộ trình ngắn</span>
            <h2>Ba bước cho hôm nay</h2>
          </div>
          <span className="quiet-label">≈ 15 phút</span>
        </div>

        <div className="daily-plan-grid">
          {dailyPlan.map((item, index) => {
            const Icon = item.icon;
            return (
              <button key={item.title} className={`plan-card plan-${item.tone}`} onClick={() => onNavigate(item.destination)}>
                <span className="plan-step">0{index + 1}</span>
                <span className="plan-icon"><Icon size={20} /></span>
                <span className="plan-content">
                  <small>{item.eyebrow}</small>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </span>
                <ChevronRight className="plan-arrow" size={18} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Kho học liệu</span>
              <h2>Học theo kỹ năng</h2>
            </div>
          </div>
          <div className="skill-grid">
            <button onClick={() => onNavigate("kana")}>
              <span className="skill-jp">あ</span><span><strong>Kana</strong><small>{typeCount("kana")} câu luyện</small></span>
            </button>
            <button onClick={() => onNavigate("vocabulary")}>
              <span className="skill-jp">語</span><span><strong>Từ vựng</strong><small>{vocabularyCount} mục</small></span>
            </button>
            <button onClick={() => onNavigate("kanji")}>
              <span className="skill-jp">漢</span><span><strong>Kanji</strong><small>{kanjiCount} chữ</small></span>
            </button>
            <button onClick={() => onNavigate("grammar")}>
              <span className="skill-jp">文</span><span><strong>Ngữ pháp</strong><small>{grammarCount} cấu trúc</small></span>
            </button>
          </div>
        </div>

        <aside className="dashboard-panel insight-panel">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Phản hồi</span>
              <h2>Nhịp học của bạn</h2>
            </div>
          </div>
          <div className="accuracy-row">
            <div className="mini-ring" style={{ "--progress": `${averageAccuracy * 3.6}deg` } as CSSProperties}>
              <span>{averageAccuracy}%</span>
            </div>
            <div><strong>Độ chính xác</strong><span>Từ {completedSessions} phiên đã hoàn thành</span></div>
          </div>
          <div className="insight-note">
            <Check size={15} />
            <p>{completedSessions === 0 ? "Hoàn thành bài kiểm tra đầu tiên để hệ thống bắt đầu chỉ ra phần cần ôn." : averageAccuracy >= 80 ? "Nền tảng đang tốt. Hãy tăng độ khó bằng bài tổng hợp." : "Ưu tiên xem lại câu sai trước khi học thêm nội dung mới."}</p>
          </div>
          <button className="text-action" onClick={() => onNavigate("practice", "all")}>Mở trung tâm luyện tập <ArrowRight size={14} /></button>
        </aside>
      </section>

      <div className="method-note">
        <Languages size={20} />
        <div><strong>Nhịp học đề xuất: Học → Gợi nhớ → Sửa lỗi → Ôn cách quãng</strong><span>Đừng chỉ lật thẻ để đọc. Hãy đoán trước, rồi tự chấm mức độ nhớ để lần ôn sau được lên lịch phù hợp.</span></div>
      </div>
    </div>
  );
}
