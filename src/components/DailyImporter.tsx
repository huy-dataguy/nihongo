import React, { useState } from "react";
import { Sparkles, Loader2, ClipboardCheck, ArrowUpRight, Save, Trash2, Download, Upload } from "lucide-react";
import { DailyImportLog } from "../types";

interface DailyImporterProps {
  onDataImported: (parsedData: any) => void;
  importLogs: DailyImportLog[];
  clearAllCustomData: () => void;
  exportBackup: () => void;
  importBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DailyImporter({
  onDataImported,
  importLogs,
  clearAllCustomData,
  exportBackup,
  importBackup,
}: DailyImporterProps) {
  const [rawText, setRawText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    vocab: number;
    grammar: number;
    kanji: number;
    quizzes: number;
  } | null>(null);

  const handleParse = async () => {
    if (!rawText.trim()) {
      setErrorMsg("Vui lòng nhập nội dung bài học thô cần AI xử lý.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessInfo(null);

    try {
      const response = await fetch("/api/parse-study-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Không thể phân tích dữ liệu.");
      }

      const data = await response.json();
      
      // Execute the callback to append data to parent state
      onDataImported({
        ...data,
        rawText,
      });

      // Show success statistics
      setSuccessInfo({
        vocab: data.vocabulary?.length || 0,
        grammar: data.grammar?.length || 0,
        kanji: data.kanjiList?.length || 0,
        quizzes: data.quizzes?.length || 0,
      });
      
      setRawText(""); // clear input on success

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi gọi dịch vụ AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleText = () => {
    setRawText(`TUẦN 4 - GIA ĐÌNH VÀ NHÀ CỬA
Từ vựng:
- 家族 (かぞく) - Gia đình (Romaji: kazoku)
- 家 (いえ) - Nhà (Romaji: ie)
- 父 (ちち) - Bố tôi (Romaji: chichi). Ví dụ: 父は会社員です (Bố tôi là nhân viên văn phòng).
- 母 (はは) - Mẹ tôi, đọc là haha.

Ngữ pháp:
Cấu trúc: ～ています (Đang làm gì đó)
Nghĩa: Diễn tả hành động đang diễn ra tại thời điểm nói hoặc trạng thái kéo dài.
Ví dụ: 音楽を聞いています (Tôi đang nghe nhạc). 

Chữ Hán:
- 家: Âm On là カ (ka) hoặc ケ (ke). Âm Kun là いえ (ie) hoặc や (ya). Nghĩa là Gia trong gia đình, ngôi nhà.`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">AI Cập nhật bài học hàng ngày</h2>
          <p className="text-sm text-gray-500 mt-1">Dán bất kỳ bài học thô nào, AI sẽ phân tách, làm sạch, và tự động đồng bộ hóa</p>
        </div>

        {/* Export/Import/Reset Utilities */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportBackup}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            title="Tải backup dữ liệu về máy"
          >
            <Download size={13} />
            Sao lưu JSON
          </button>

          <label className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <Upload size={13} />
            Nhập file backup
            <input
              type="file"
              accept=".json"
              onChange={importBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm("Hành động này sẽ xóa tất cả các bài học và quizzes bạn tự thêm. Bạn có chắc chắn muốn khôi phục về ban đầu?")) {
                clearAllCustomData();
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
            title="Khôi phục trạng thái ban đầu"
          >
            <Trash2 size={13} />
            Reset bài học tự thêm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main input area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Dữ liệu thô dán vào hằng ngày</span>
            <button
              onClick={loadSampleText}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium underline underline-offset-2"
            >
              Xem dòng dữ liệu mẫu
            </button>
          </div>

          <textarea
            rows={10}
            placeholder="Ví dụ dán:&#10;Hôm nay học được từ : 傘 (かさ) - nghĩa là ô che mưa.&#10;Ngữ pháp học chủ đề rủ rê : ～ましょう (Cùng làm gì đó nhé). Ví dụ: 買いましょう (Cùng mua đi)..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={isLoading}
            className="w-full p-4 text-sm bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-amber-300 focus:outline-none rounded-xl transition-all font-sans leading-relaxed"
          ></textarea>

          {errorMsg && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700 leading-relaxed font-medium">
              ⚠️ Lỗi: {errorMsg}
            </div>
          )}

          {successInfo && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-2 animate-fade">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ClipboardCheck size={16} />
                Đã phân tích và cộng dồn bài học thành công!
              </div>
              <p className="font-medium text-emerald-700">Dữ liệu mới được AI làm sạch và nạp vào hằng ngày:</p>
              <ul className="grid grid-cols-2 gap-2 text-[11px] font-mono mt-1 pt-1 border-t border-emerald-100">
                <li>• Từ vựng: +{successInfo.vocab} từ mới</li>
                <li>• Ngữ pháp: +{successInfo.grammar} cấu trúc</li>
                <li>• Chữ Hán: +{successInfo.kanji} chữ</li>
                <li>• Câu hỏi trắc nghiệm: +{successInfo.quizzes} câu ôn tập</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleParse}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang phân tích cấu trúc...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI phân tích & cập nhật hệ thống
                </>
              )}
            </button>
          </div>
        </div>

        {/* Study logging & History */}
        <div className="bg-gray-50/50 border border-gray-150 rounded-2xl p-5 shadow-inner flex flex-col min-h-[300px]">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono block mb-3">Lịch sử cập nhật của bạn</span>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[340px] pr-1">
            {importLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <ArrowUpRight className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-semibold">Chưa có bản ghi nạp bài nào.</p>
                <p className="text-[10px] text-gray-400 mt-1">Dữ liệu thô bạn dán học hằng ngày sẽ được lưu tại đây.</p>
              </div>
            ) : (
              importLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-3 rounded-xl border border-gray-150 space-y-2 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                    <span className="font-bold text-gray-800 font-mono text-[10px]">{log.date}</span>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">Nạp thành công</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-gray-600">
                    <div>Vocab: <span className="font-semibold text-gray-800">+{log.parsedItemCount.vocabulary}</span></div>
                    <div>Grammar: <span className="font-semibold text-gray-800">+{log.parsedItemCount.grammar}</span></div>
                    <div>Kanji: <span className="font-semibold text-gray-800">+{log.parsedItemCount.kanji}</span></div>
                    <div>Quizzes: <span className="font-semibold text-gray-800">+{log.parsedItemCount.quizzes}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
