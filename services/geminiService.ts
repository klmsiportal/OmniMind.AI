import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION } from "../constants";
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

// Try all common naming conventions
const apiKey = getEnvVar('OPENAI_API_KEY') || 
               getEnvVar('REACT_APP_OPENAI_API_KEY') || 
               getEnvVar('NEXT_PUBLIC_OPENAI_API_KEY') || 
               getEnvVar('VITE_OPENAI_API_KEY');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

interface GenerateParams {
  model: string;
  prompt: string;
  history?: { role: string; parts: { text: string }[] }[]; 
  images?: string[]; // base64
  useSearch?: boolean; 
}

const getSystemPrompt = (modelId: string, useSearch: boolean): string => {
  let basePrompt = SYSTEM_INSTRUCTION;

  if (useSearch) {
    basePrompt += `\n\n[MODE: DEEP SEARCH / PERPLEXITY STYLE]
You are acting as a deep search engine. 
1. Provide comprehensive, fact-checked information.
2. Analyze the user's query from multiple angles.
3. If specific data is requested, act as if you have retrieved it from reliable sources.
4. Structure your response clearly with headers.
5. You MUST act as an expert researcher.`;
  }

  switch (modelId) {
    case ModelType.CODER:
      return basePrompt + "\n\n[MODE: SENIOR SOFTWARE ENGINEER]\nYou are an expert coder. Prioritize clean, efficient, and well-documented code. Always explain your technical choices. Use TypeScript/Python best practices unless specified otherwise.";
    case ModelType.WRITER:
      return basePrompt + "\n\n[MODE: CREATIVE WRITER]\nYou are a best-selling author and copywriter. Focus on engaging, evocative, and persuasive language. Adapt tone to the user's request.";
    default:
      return basePrompt;
  }
};

const resolveModelName = (modelId: string): string => {
  // Map internal IDs to actual OpenAI model names
  if (modelId === ModelType.CODER || modelId === ModelType.WRITER) return 'gpt-4o';
  return modelId; // FLASH is gpt-4o-mini, PRO is gpt-4o
};

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
): Promise<string> => {
  const { model, prompt, images, useSearch } = params;

  if (!apiKey) {
    const errorMsg = "Configuration Error: OpenAI API Key is missing. Please check your Vercel environment variables (OPENAI_API_KEY).";
    onChunk(errorMsg);
    throw new Error(errorMsg);
  }

  const actualModel = resolveModelName(model);
  const systemPrompt = getSystemPrompt(model, !!useSearch);

  // System message
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];

  // User message construction (Text + Images)
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

  messages.push({ role: 'user', content: userContent });

  try {
    const stream = await openai.chat.completions.create({
      model: actualModel,
      messages: messages,
      stream: true,
      max_tokens: 4096, // High limit for deep tasks
      temperature: model === ModelType.CODER ? 0.2 : 0.7, // Lower temp for code
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
    if (error?.status === 401) errorMsg = "Authentication Failed: Invalid API Key. Please check your settings.";
    if (error?.status === 429) errorMsg = "Rate Limit Exceeded: You have sent too many requests.";
    if (error?.status === 500) errorMsg = "OpenAI Server Error. Please try again later.";
    
    // Pass specific error to UI if possible, or rethrow
    throw new Error(errorMsg);
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    if (!apiKey) {
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