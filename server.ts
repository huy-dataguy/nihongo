import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini on server
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for parsing Japanese input
  app.post("/api/parse-study-data", async (req, res) => {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Missing or invalid rawText parameter" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server. Please check your Secrets in AI Studio Settings." });
    }

    try {
      const prompt = `Phân tích dữ liệu học tiếng Nhật N5 sau đây và chuyển đổi nó thành cấu trúc JSON chuẩn. Hãy đọc kỹ, trích xuất tất cả các từ vựng (vocabulary), ngữ pháp (grammar), Chữ Hán (kanji) và tự động tạo ra ít nhất 3-5 câu hỏi trắc nghiệm liên quan (quizzes) về các nội dung này. Nếu thông tin nào bị thiếu (ví dụ: thiếu Onyomi, Kunyomi cho Kanji hay thiếu ví dụ câu cho từ vựng), hãy sử dụng kiến thức N5 của bạn để tự sinh bổ sung đầy đủ cách đọc Hiragana, Romaji và nghĩa tiếng Việt sao cho chính xác nhất.

Dữ liệu đầu vào từ người dùng:
"""
${rawText}
"""`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một giáo sư tiếng Nhật N5 người Việt, có chuyên môn sâu sắc về giảng dạy Hiragana, Katakana, Kanji, từ vựng và ngữ pháp cho người Việt Nam. Nhiệm vụ của bạn là nhận thông tin bài học thô từ người dùng, làm sạch, bổ sung Furigana/Hiragana, tạo câu ví dụ đầy đủ (kèm cách đọc và nghĩa tiếng Việt), phân tách cấu trúc ngữ pháp rõ ràng và đặt các câu hỏi trắc nghiệm ôn tập thông minh (quizzes). Luôn trả về dữ liệu đúng định dạng JSON được định nghĩa sẵn.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING, description: "Từ tiếng Nhật (Kanji/Kana, ví dụ: 食べる, 学生)" },
                    reading: { type: Type.STRING, description: "Cách đọc bằng Hiragana/Katakana (ví dụ: たべる, がくせい)" },
                    romaji: { type: Type.STRING, description: "Cách đọc Romaji (ví dụ: taberu, gakusei)" },
                    meaning: { type: Type.STRING, description: "Nghĩa tiếng Việt" },
                    category: { type: Type.STRING, description: "Chủ đề hoặc phân loại của từ này" },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          japanese: { type: Type.STRING, description: "Câu ví dụ tiếng Nhật" },
                          reading: { type: Type.STRING, description: "Cách đọc câu ví dụ bằng Hiragana/Furigana" },
                          meaning: { type: Type.STRING, description: "Nghĩa tiếng Việt câu ví dụ" }
                        },
                        required: ["japanese", "reading", "meaning"]
                      }
                    }
                  },
                  required: ["word", "reading", "meaning"]
                }
              },
              grammar: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    structure: { type: Type.STRING, description: "Cấu trúc ngữ pháp (ví dụ: 〜てください, 〜ています)" },
                    meaning: { type: Type.STRING, description: "Ý nghĩa ngữ pháp bằng tiếng Việt" },
                    explanation: { type: Type.STRING, description: "Giải thích chi tiết cách dùng, kết hợp ngữ pháp" },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          japanese: { type: Type.STRING, description: "Câu ví dụ áp dụng ngữ pháp này" },
                          reading: { type: Type.STRING, description: "Cách đọc câu ví dụ bằng Hiragana" },
                          meaning: { type: Type.STRING, description: "Nghĩa tiếng Việt câu ví dụ" }
                        },
                        required: ["japanese", "reading", "meaning"]
                      }
                    }
                  },
                  required: ["structure", "meaning", "explanation"]
                }
              },
              kanjiList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    character: { type: Type.STRING, description: "Chữ Hán (ví dụ: 食, 水)" },
                    onyomi: { type: Type.STRING, description: "Onyomi âm On (ví dụ: ショク, スイ)" },
                    kunyomi: { type: Type.STRING, description: "Kunyomi âm Kun (ví dụ: た-べる, みず)" },
                    meaning: { type: Type.STRING, description: "Ý nghĩa Hán Việt và nghĩa từ (ví dụ: Thực - ăn)" },
                    examples: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING, description: "Từ ghép ví dụ chứa chữ Hán này" },
                          reading: { type: Type.STRING, description: "Cách đọc bằng Hiragana" },
                          meaning: { type: Type.STRING, description: "Nghĩa tiếng Việt" }
                        },
                        required: ["word", "reading", "meaning"]
                      }
                    }
                  },
                  required: ["character", "meaning"]
                }
              },
              quizzes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "Nội dung câu hỏi trắc nghiệm bằng tiếng Việt" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Danh sách 4 lựa chọn (đáp án)"
                    },
                    answerIndex: { type: Type.INTEGER, description: "Vị trí trong mảng chọn đúng (0-3)" },
                    explanation: { type: Type.STRING, description: "Giải thích tại sao đáp án đó đúng" },
                    type: { type: Type.STRING, description: "Loại câu hỏi: 'vocabulary', 'grammar', 'kanji'" }
                  },
                  required: ["question", "options", "answerIndex", "explanation", "type"]
                }
              }
            }
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (error) {
      console.error("Gemini Parsing error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware setup in development, catch-all static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
