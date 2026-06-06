import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing question" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: question,
      config: {
        systemInstruction: `Bạn là nihonGO AI — trợ lý học tiếng Nhật N5 thân thiện. Người dùng là người Việt đang học tiếng Nhật.

Quy tắc:
- Trả lời ngắn gọn, rõ ràng, dễ hiểu
- Luôn kèm ví dụ câu tiếng Nhật + cách đọc + nghĩa tiếng Việt
- Nếu hỏi về từ vựng → cho nghĩa + cách đọc (romaji) + ví dụ câu
- Nếu hỏi về ngữ pháp → giải thích cấu trúc + ví dụ + cách chia
- Nếu hỏi về kanji → cho âm On, âm Kun, nghĩa Hán Việt, từ ghép
- Dùng biểu tượng cảm xúc cho thân thiện
- Trả lời bằng tiếng Việt, giữ nguyên tiếng Nhật`,
      },
    });

    return res.json({ answer: response.text || "Xin lỗi, tôi không thể trả lời câu hỏi này." });
  } catch (error) {
    console.error("Ask AI error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
