import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Eye, EyeOff } from "lucide-react";

interface KanjiStrokeViewerProps {
  character: string;
  size?: number;
  speed?: number; // duration per stroke in seconds (default 0.8)
  autoPlay?: boolean;
  showNumbers?: boolean;
  activeColor?: string;
  completedColor?: string;
  ghostColor?: string;
  gridColor?: string;
  showStepBreakdown?: boolean;
  className?: string;
  onStrokeChange?: (current: number, total: number) => void;
}

interface StrokeData {
  id: string;
  d: string;
  type?: string;
}

interface NumberData {
  text: string;
  x: number;
  y: number;
}

interface KanjiSvgData {
  strokes: StrokeData[];
  numbers: NumberData[];
}

// In-memory cache for fetched SVG data
const svgCache = new Map<string, KanjiSvgData | null>();

/**
 * Get zero-padded 5-digit hex code point for KanjiVG URL
 * e.g., '日' -> '065e5'
 */
function getKanjiVgCode(char: string): string {
  const code = char.codePointAt(0);
  if (!code) return "";
  return code.toString(16).toLowerCase().padStart(5, "0");
}

export const KanjiStrokeViewer: React.FC<KanjiStrokeViewerProps> = ({
  character,
  size = 280,
  speed = 0.8,
  autoPlay = true,
  showNumbers = true,
  activeColor = "#e11d48", // Rose red
  completedColor = "#1e293b", // Dark slate
  ghostColor = "#e2e8f0", // Faint gray
  gridColor = "#cbd5e1", // Grid line
  showStepBreakdown = true,
  className = "",
  onStrokeChange,
}) => {
  const [svgData, setSvgData] = useState<KanjiSvgData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 = not started, N = finished up to stroke N
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [displayNumbers, setDisplayNumbers] = useState<boolean>(showNumbers);

  const strokePathsRef = useRef<(SVGPathElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch KanjiVG SVG data
  useEffect(() => {
    let isMounted = true;
    const code = getKanjiVgCode(character);

    if (!code) {
      setError(true);
      setLoading(false);
      return;
    }

    if (svgCache.has(code)) {
      const cached = svgCache.get(code);
      if (cached) {
        setSvgData(cached);
        setCurrentStep(autoPlay ? 1 : cached.strokes.length);
        setError(false);
      } else {
        setError(true);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const url = `https://cdn.jsdelivr.net/gh/kanjivg/kanjivg@master/kanji/${code}.svg`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("KanjiVG SVG not found");
        return res.text();
      })
      .then((xmlText) => {
        if (!isMounted) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "image/svg+xml");

        // Extract strokes
        const strokeElements = Array.from(doc.querySelectorAll("g[id^='kvg:StrokePaths'] path, path[id*='-s']"));
        const strokes: StrokeData[] = strokeElements.map((el, i) => ({
          id: el.getAttribute("id") || `stroke-${i}`,
          d: el.getAttribute("d") || "",
          type: el.getAttribute("kvg:type") || undefined,
        })).filter((s) => s.d);

        // Extract stroke number text coordinates
        const numberElements = Array.from(doc.querySelectorAll("g[id^='kvg:StrokeNumbers'] text"));
        const numbers: NumberData[] = numberElements.map((el) => {
          const text = el.textContent || "";
          const transform = el.getAttribute("transform");
          let x = 0;
          let y = 0;
          if (transform) {
            // e.g. matrix(1 0 0 1 23.25 28.63)
            const match = transform.match(/matrix\([^)]*?\s+([-\d.]+)\s+([-\d.]+)\)/);
            if (match) {
              x = parseFloat(match[1]);
              y = parseFloat(match[2]);
            }
          }
          if (!x) x = parseFloat(el.getAttribute("x") || "0");
          if (!y) y = parseFloat(el.getAttribute("y") || "0");

          return { text, x, y };
        }).filter((n) => n.text);

        const data: KanjiSvgData = { strokes, numbers };
        svgCache.set(code, data);
        setSvgData(data);
        setCurrentStep(autoPlay ? 1 : strokes.length);
        setIsPlaying(autoPlay);
      })
      .catch(() => {
        if (!isMounted) return;
        svgCache.set(code, null);
        setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [character, autoPlay]);

  const totalStrokes = svgData?.strokes.length || 0;

  // Handle animation playback
  useEffect(() => {
    if (!isPlaying || !totalStrokes) return;

    timerRef.current = setTimeout(() => {
      setCurrentStep((prev) => {
        if (prev >= totalStrokes) {
          setIsPlaying(false);
          return totalStrokes;
        }
        return prev + 1;
      });
    }, speed * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, totalStrokes, speed]);

  useEffect(() => {
    if (onStrokeChange && totalStrokes > 0) {
      onStrokeChange(currentStep, totalStrokes);
    }
  }, [currentStep, totalStrokes, onStrokeChange]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= totalStrokes) {
      setCurrentStep(1);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStep, totalStrokes]);

  const handleReplay = useCallback(() => {
    setCurrentStep(1);
    setIsPlaying(true);
  }, []);

  const handleStepClick = useCallback((step: number) => {
    setIsPlaying(false);
    setCurrentStep(step);
  }, []);

  const handlePrevStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(totalStrokes, prev + 1));
  }, [totalStrokes]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Main Drawing Canvas Container */}
      <div
        className="relative rounded-2xl bg-white/90 shadow-md border border-slate-200/80 p-4 flex flex-col items-center transition-all duration-300 hover:shadow-lg"
        style={{ width: size + 32, height: size + 32 }}
      >
        {/* Genkouyoushi Japanese Kanji Grid Lines */}
        <svg
          viewBox="0 0 109 109"
          width={size}
          height={size}
          className="absolute inset-4 pointer-events-none"
        >
          {/* Outer Box */}
          <rect x="2" y="2" width="105" height="105" fill="none" stroke={gridColor} strokeWidth="1.5" rx="4" />
          {/* Dashed Center Cross */}
          <line x1="54.5" y1="2" x2="54.5" y2="107" stroke={gridColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <line x1="2" y1="54.5" x2="107" y2="54.5" stroke={gridColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          {/* Dashed Diagonals */}
          <line x1="2" y1="2" x2="107" y2="107" stroke={gridColor} strokeWidth="0.75" strokeDasharray="2 4" opacity="0.3" />
          <line x1="107" y1="2" x2="2" y2="107" stroke={gridColor} strokeWidth="0.75" strokeDasharray="2 4" opacity="0.3" />
        </svg>

        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 font-medium">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Đang tải nét vẽ...</span>
          </div>
        ) : error || !svgData ? (
          /* Fallback when SVG path is unavailable */
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <span className="text-8xl font-serif text-slate-800 tracking-tight">{character}</span>
            <span className="text-[11px] text-slate-400 mt-2">Font chữ chuẩn Kanji</span>
          </div>
        ) : (
          /* SVG Render Canvas */
          <svg
            viewBox="0 0 109 109"
            width={size}
            height={size}
            className="relative z-10 overflow-visible"
          >
            {/* 1. Ghost Strokes (Faint background outline) */}
            <g stroke={ghostColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {svgData.strokes.map((stroke) => (
                <path key={`ghost-${stroke.id}`} d={stroke.d} />
              ))}
            </g>

            {/* 2. Completed Strokes (Strokes prior to currentStep) */}
            <g stroke={completedColor} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {svgData.strokes.slice(0, Math.max(0, currentStep - 1)).map((stroke) => (
                <path key={`completed-${stroke.id}`} d={stroke.d} />
              ))}
            </g>

            {/* 3. Active Current Stroke (Animated drawing) */}
            {currentStep > 0 && currentStep <= svgData.strokes.length && (
              <g stroke={activeColor} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path
                  key={`active-${svgData.strokes[currentStep - 1].id}-${currentStep}`}
                  ref={(el) => { strokePathsRef.current[currentStep - 1] = el; }}
                  d={svgData.strokes[currentStep - 1].d}
                  className="transition-all duration-300"
                  style={{
                    strokeDasharray: 200,
                    strokeDashoffset: isPlaying ? 0 : 0,
                    animation: isPlaying ? `drawStroke ${speed}s ease-in-out forwards` : "none",
                  }}
                />
              </g>
            )}

            {/* 4. Stroke Numbers Overlay */}
            {displayNumbers && (
              <g className="select-none font-bold font-mono text-[9px] pointer-events-none">
                {svgData.numbers.map((num, idx) => {
                  const stepNum = idx + 1;
                  const isPast = stepNum < currentStep;
                  const isCurrent = stepNum === currentStep;
                  return (
                    <g key={`num-${idx}`} transform={`translate(${num.x}, ${num.y})`}>
                      <circle
                        r="4"
                        fill={isCurrent ? activeColor : isPast ? completedColor : "#94a3b8"}
                        opacity={isCurrent ? 1 : isPast ? 0.8 : 0.4}
                      />
                      <text
                        x="0"
                        y="1.2"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#ffffff"
                        fontSize="5"
                        fontWeight="bold"
                      >
                        {num.text}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        )}

        {/* Step Badge */}
        {totalStrokes > 0 && (
          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full shadow-xs">
            Nét {currentStep} / {totalStrokes}
          </div>
        )}
      </div>

      {/* Primary Control Bar */}
      {totalStrokes > 0 && (
        <div className="flex items-center gap-2 mt-4 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-md border border-slate-800">
          <button
            onClick={handleReplay}
            title="Xem lại từ nét đầu"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={handlePrevStep}
            disabled={currentStep <= 1}
            title="Nét trước"
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={handlePlayPause}
            title={isPlaying ? "Tạm dừng" : "Phát chuyển nét"}
            className="p-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-1 text-xs px-3"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? "Dừng" : "Chạy nét"}</span>
          </button>

          <button
            onClick={handleNextStep}
            disabled={currentStep >= totalStrokes}
            title="Nét tiếp theo"
            className="p-1.5 hover:bg-slate-800 disabled:opacity-30 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <SkipForward size={16} />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={() => setDisplayNumbers(!displayNumbers)}
            title={displayNumbers ? "Ẩn số thứ tự nét" : "Hiện số thứ tự nét"}
            className={`p-1.5 rounded-lg transition-colors ${
              displayNumbers ? "bg-slate-800 text-rose-400" : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            {displayNumbers ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      )}

      {/* Step-by-Step Breakdown Grid (Textbook Stroke Order Diagrams) */}
      {showStepBreakdown && svgData && totalStrokes > 0 && (
        <div className="w-full mt-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
              Thứ tự từng nét vẽ ({totalStrokes} nét)
            </span>
            <span className="text-[11px] text-slate-400">Click nét để xem</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-w-xl">
            {Array.from({ length: totalStrokes }).map((_, idx) => {
              const step = idx + 1;
              const isCurrent = step === currentStep;
              return (
                <button
                  key={`step-btn-${step}`}
                  onClick={() => handleStepClick(step)}
                  className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-rose-50 border-rose-400 shadow-sm scale-105"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <svg viewBox="0 0 109 109" width={42} height={42} className="overflow-visible">
                    {/* Background grid */}
                    <rect x="2" y="2" width="105" height="105" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="54.5" y1="2" x2="54.5" y2="107" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1="2" y1="54.5" x2="107" y2="54.5" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="2 2" />

                    {/* Faint target outline */}
                    <g stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                      {svgData.strokes.map((s) => (
                        <path key={`tb-bg-${s.id}`} d={s.d} />
                      ))}
                    </g>

                    {/* Previous strokes */}
                    <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
                      {svgData.strokes.slice(0, step - 1).map((s) => (
                        <path key={`tb-prev-${s.id}`} d={s.d} />
                      ))}
                    </g>

                    {/* Active stroke in red */}
                    <g stroke={activeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                      <path d={svgData.strokes[step - 1].d} />
                    </g>
                  </svg>
                  <span className={`text-[10px] font-mono mt-1 font-semibold ${isCurrent ? "text-rose-600" : "text-slate-500"}`}>
                    Nét {step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyframe animation for stroke path drawing */}
      <style>{`
        @keyframes drawStroke {
          0% {
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default KanjiStrokeViewer;
