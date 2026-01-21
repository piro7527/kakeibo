import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
    console.warn("Gemini API Key is missing!");
}

export const analyzeImage = async (base64Image) => {
    if (!model) {
        throw new Error("Gemini API is not configured. Please check your .env file.");
    }

    const prompt = `
  Analyze this receipt image and extract the following information in JSON format:
  - date: The date of purchase (YYYY-MM-DD)
  - merchant: The name of the store
  - totalAmount: The total amount paid (number)
  - category: The best fitting category for the whole receipt (e.g., Food, Transport, Daily, Medical, Other)
  - items: An array of items purchased, each with:
    - name: Item name
    - price: Item price (number)
    - category: Item category

  Output ONLY valid JSON.
  `;

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: "image/jpeg", // Assuming JPEG for now, strictly speaking should detect
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Error analyzing receipt:", error);
        throw error;
    }
};
