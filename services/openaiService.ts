// services/openaiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

if (!apiKey) {
  throw new Error("Missing Gemini API Key. Add NEXT_PUBLIC_GEMINI_API_KEY in Vercel.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function askAI(prompt: string) {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "❌ AI Error: Unable to generate a response right now.";
  }
}
