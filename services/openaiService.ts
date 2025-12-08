import OpenAI from 'openai';
import { GroundingSource, ModelType } from "../types";

// --- API Key Detection Strategy for Vercel/Browser ---
const getEnvVar = (key: string): string => {
  // 1. Check process.env (Standard Node/CRA/Webpack/Next.js)
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

// Check all possible Vercel/Framework permutations
const apiKey = getEnvVar('OPENAI_API_KEY') || 
               getEnvVar('REACT_APP_OPENAI_API_KEY') || 
               getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY') || 
               getEnvVar('VITE_OPENAI_API_KEY');

// Initialize OpenAI client
// We allow browser usage because this is a client-side demo. 
// In production, you might proxy this through an Edge Function.
const openai = new OpenAI({
  apiKey: apiKey || 'dummy-key', 
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
    const errorMsg = "CRITICAL ERROR: OpenAI API Key missing. Please set 'OPENAI_API_KEY' in your Vercel Environment Variables.";
    onChunk(errorMsg);
    throw new Error(errorMsg);
  }

  const actualModel = resolveModelName(model);
  let finalSystemPrompt = systemInstruction || "You are a helpful assistant.";

  // DEEP SEARCH SIMULATION (Perplexity-style)
  if (useSearch) {
    finalSystemPrompt += `\n\n[SYSTEM: SEARCH_MODE_ACTIVATED]
You are a highly advanced search agent. 
1. Your knowledge cutoff is current. Simulate real-time data access by using your internal knowledge base exhaustively.
2. Structure answers with clear headers.
3. Cite sources using [1](url) format if you reference specific domains.
4. Be extremely detailed and factual.`;
  }

  // Build the message payload
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
    console.error("OpenAI Service Error:", error);
    let errorMsg = "Connection terminated by remote host.";
    if (error?.status === 401) errorMsg = "SECURITY ALERT: Invalid API Key provided. Access Denied.";
    if (error?.status === 429) errorMsg = "TRAFFIC ALERT: Rate limit exceeded. Please wait.";
    if (error?.status === 500) errorMsg = "SERVER ERROR: OpenAI systems are currently down.";
    
    throw new Error(errorMsg);
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    if (!apiKey || apiKey === 'dummy-key') {
        throw new Error("API Key Missing");
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
        throw new Error("Image generation returned empty data.");
    } catch (error: any) {
        console.error("OpenAI Image Error:", error);
        throw new Error("Failed to generate secure image asset.");
    }
}