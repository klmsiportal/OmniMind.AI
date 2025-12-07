import OpenAI from 'openai';
import { GroundingSource, ModelType } from "../types";

// --- API Key Detection Strategy for Vercel/Browser ---
const getEnvVar = (key: string): string => {
  // 1. Check process.env (Standard Node/CRA/Webpack)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // 2. Check import.meta.env (Vite/Modern ESM)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
     // @ts-ignore
     return import.meta.env[key] as string;
  }

  return '';
};

// Robust Check
const apiKey = getEnvVar('OPENAI_API_KEY') || 
               getEnvVar('REACT_APP_OPENAI_API_KEY') || 
               getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY') || 
               getEnvVar('VITE_OPENAI_API_KEY');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', // Prevent crash on init, check later
  dangerouslyAllowBrowser: true 
});

interface GenerateParams {
  model: string;
  prompt: string;
  images?: string[]; 
  useSearch?: boolean; 
  systemInstruction?: string;
}

const resolveModelName = (modelId: string): string => {
  if (modelId === ModelType.FLASH) return 'gpt-4o-mini';
  if (modelId === ModelType.PRO) return 'gpt-4o';
  return 'gpt-4o'; // Default fallback
};

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
): Promise<string> => {
  const { model, prompt, images, useSearch, systemInstruction } = params;

  if (!apiKey || apiKey === 'dummy-key') {
    const errorMsg = "Configuration Error: OpenAI API Key is missing. Please ensure OPENAI_API_KEY is set in your Vercel Environment Variables.";
    onChunk(errorMsg);
    throw new Error(errorMsg);
  }

  const actualModel = resolveModelName(model);
  let finalSystemPrompt = systemInstruction || "You are a helpful assistant.";

  if (useSearch) {
    finalSystemPrompt += `\n\n[MODE: DEEP SEARCH]
You are a research engine. 
1. Assume you have access to real-time data (simulate based on latest training).
2. Cite sources in format [Source Title](url).
3. Be comprehensive and factual.`;
  }

  // User message construction
  const userContent: any[] = [{ type: "text", text: prompt }];

  if (images && images.length > 0) {
    images.forEach(img => {
      userContent.push({
        type: "image_url",
        image_url: {
          url: img,
          detail: "high"
        }
      });
    });
  }

  try {
    const stream = await openai.chat.completions.create({
      model: actualModel,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: userContent }
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        onChunk(fullText, undefined); 
      }
    }

    return fullText;

  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    let errorMsg = "Sorry, an error occurred with OpenAI.";
    if (error?.status === 401) errorMsg = "Authentication Failed: API Key is invalid or expired.";
    if (error?.status === 429) errorMsg = "Rate Limit Exceeded: You are sending requests too fast.";
    
    throw new Error(errorMsg);
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    if (!apiKey || apiKey === 'dummy-key') {
        throw new Error("Missing OpenAI API Key");
    }

    try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json", 
          quality: "hd"
        });

        const b64Json = response.data[0].b64_json;
        if (b64Json) {
          return `data:image/png;base64,${b64Json}`;
        }
        throw new Error("No image data returned.");
    } catch (error: any) {
        console.error("OpenAI Image Gen Error:", error);
        let errorMsg = "Image generation failed.";
        if (error?.error?.message) errorMsg += ` ${error.error.message}`;
        throw new Error(errorMsg);
    }
}