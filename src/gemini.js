import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
} else {
    console.warn("Gemini API Key is missing!");
}

export const analyzeImage = async (base64Image, mimeType = "image/jpeg") => {
    if (!model) {
        throw new Error("Gemini API is not configured. Please check your .env file.");
    }

    const prompt = `
  このレシート画像を解析し、以下の情報をJSON形式で抽出してください:
  - date: 購入日 (YYYY-MM-DD)
  - merchant: 店舗名 (日本語で)
  - totalAmount: 合計金額 (数値)
  - category: レシート全体のカテゴリ (例: 食費, 日用品, 交通費, 医療費, 交際費, その他)
  - items: 購入品目のリスト。各品目について:
    - name: 商品名 (日本語で)
    - price: 価格 (数値)
    - category: 品目ごとのカテゴリ

  Output ONLY valid JSON.
  `;

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };

    try {
        console.log("Calling Gemini API with mimeType:", mimeType);
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error analyzing receipt:", error);
        console.error("Error details:", error.message, error.status, error.statusInfo);
        // Re-throw with more context
        const errorMessage = error.message || "Unknown error";
        throw new Error(`Gemini API Error: ${errorMessage}`);
    }
};
