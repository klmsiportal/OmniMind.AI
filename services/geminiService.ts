import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GroundingSource } from "../types";

// NOTE: In a real production app, never expose API keys on the client.
// However, per instructions, we access it via process.env.API_KEY.
// If process.env.API_KEY is not set (typical in client-side only demos without a build step injecting it),
// we might fail. The user is responsible for the environment.
const apiKey = process.env.API_KEY || ''; 

// We create a new instance per request to ensure fresh config if needed, 
// or use a singleton if the key is static.
const getAI = () => new GoogleGenAI({ apiKey });

interface GenerateParams {
  model: string;
  prompt: string;
  history?: { role: string; parts: { text: string }[] }[];
  images?: string[]; // base64
  useSearch?: boolean; // Perplexity mode
}

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
): Promise<string> => {
  const ai = getAI();
  const { model, prompt, images, useSearch } = params;

  // Configuration Setup
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
  };

  if (useSearch) {
    // Add Google Search Tool for "Perplexity" style
    config.tools = [{ googleSearch: {} }];
  }

  // Construct Content
  // If we have images, we can't easily use 'chats' state management from SDK seamlessly mixed with arbitrary tools in all cases,
  // so we will use generateContentStream with a constructed history if needed, or just single turn for simplicity in this demo structure.
  // For a robust chat, we usually maintain history.
  
  // To keep it compatible with "Perplexity" style which is often single-turn query focused or simpler context:
  const parts: any[] = [];
  
  if (images && images.length > 0) {
    images.forEach(img => {
      // Basic detection of mime type from base64 header if present, else assume png
      const mimeType = img.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/png';
      const data = img.replace(/^data:image\/[a-z]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    });
  }
  
  parts.push({ text: prompt });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: {
        role: 'user',
        parts: parts
      },
      config: config
    });

    let fullText = "";
    
    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      
      // Extract text
      const textChunk = c.text; 
      if (textChunk) {
        fullText += textChunk;
        // We pass empty grounding for now, will extract at end if needed, 
        // or during stream if available in chunks (usually in the final chunk or grounding chunk)
        onChunk(fullText, undefined); 
      }

      // Extract Grounding (Perplexity sources)
      // Note: Grounding usually comes in the final candidate or specific chunks.
      const groundingChunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        const sources: GroundingSource[] = groundingChunks
          .map((chunk: any) => {
            if (chunk.web) {
              return { title: chunk.web.title, uri: chunk.web.uri };
            }
            return null;
          })
          .filter((s: any) => s !== null);
          
        if (sources.length > 0) {
           onChunk(fullText, sources);
        }
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    // For image generation, we use generateImages with Imagen or generateContent with Gemini Image models.
    // System prompt prefers gemini-3-pro-image-preview for high quality.
    // However, generateContent on 'gemini-3-pro-image-preview' returns base64 inlineData.
    
    const ai = getAI();
    // Using the image preview model from instructions
    const model = 'gemini-3-pro-image-preview'; 
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: "1K"
                }
            }
        });

        // Find image part
        const candidates = response.candidates;
        if (candidates && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Image Gen Error:", error);
        throw error;
    }
}
