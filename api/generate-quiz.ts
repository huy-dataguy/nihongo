import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { lesson, type, count, vocabularyData } = req.body;
  if (!vocabularyData || !Array.isArray(vocabularyData)) {
    return res.status(400).json({ error: "Missing vocabularyData array" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const numQuestions = Math.min(count || 10, 30);

  const prompt = `Bạn là một giáo viên tiếng Nhật N5. Từ danh sách từ vựng/ngữ pháp dưới đây, hãy tạo ra ${numQuestions} câu hỏi trắc nghiệm đa dạng và thú vị.

Yêu cầu:
- Đa dạng dạng câu hỏi: điền chỗ trống, chọn nghĩa đúng, chọn từ phù hợp với ngữ cảnh, nghe chọn đáp án, sửa lỗi sai...
- Mỗi câu có đúng 4 lựa chọn (A, B, C, D)
- Đánh dấu đáp án đúng
- Giải thích ngắn gọn tại sao đáp án đó đúng
- Trộn lộn xộn mức độ dễ/khó
- Tất cả bằng tiếng Việt, phần tiếng Nhật giữ nguyên

Dữ liệu bài học (${type || "tổng hợp"}${lesson ? `, Bài ${lesson}` : ""}):
${JSON.stringify(vocabularyData.slice(0, 60), null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "Bạn là AI tạo câu hỏi trắc nghiệm tiếng Nhật N5 thông minh. Luôn trả về JSON hợp lệ.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizzes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "Câu hỏi trắc nghiệm bằng tiếng Việt" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "4 lựa chọn đáp án",
                  },
                  answerIndex: { type: Type.INTEGER, description: "Index đáp án đúng (0-3)" },
                  explanation: { type: Type.STRING, description: "Giải thích ngắn gọn" },
                  type: { type: Type.STRING, description: "Loại: vocabulary, grammar, kanji" },
                  difficulty: { type: Type.STRING, description: "Mức độ: easy, medium, hard" },
                },
                required: ["question", "options", "answerIndex", "explanation", "type"],
              },
            },
          },
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return res.json(data);
  } catch (error) {
    console.error("AI Quiz generation error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
