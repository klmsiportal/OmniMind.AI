import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

// Initialize Google GenAI client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GenerateParams {
  model: string;
  prompt: string;
  images?: string[]; 
  useSearch?: boolean; 
  systemInstruction?: string;
}

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
): Promise<string> => {
  const { model, prompt, images, useSearch, systemInstruction } = params;

  let contents: any = prompt;
  
  // Construct contents with images if present
  if (images && images.length > 0) {
    const parts = [];
    for (const img of images) {
        // Extract mimeType and base64 data from data URL
        const match = img.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            });
        }
    }
    parts.push({ text: prompt });
    contents = { parts };
  }

  const config: any = {
      systemInstruction: systemInstruction,
  };

  if (useSearch) {
      config.tools = [{ googleSearch: {} }];
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config
    });

    let fullText = "";
    
    for await (const chunk of responseStream) {
       const text = chunk.text;
       if (text) {
         fullText += text;
         
         // Extract grounding metadata if available
         let groundingSources: GroundingSource[] | undefined;
         if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
             const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
             groundingSources = chunks
                .map((c: any) => c.web ? { title: c.web.title, uri: c.web.uri } : null)
                .filter((c: any) => c !== null);
         }
         
         onChunk(fullText, groundingSources);
       }
    }
    return fullText;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        // Use gemini-2.5-flash-image for general image generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            // Do not set responseMimeType or responseSchema for nano banana series models
            config: {} 
        });
        
        // Iterate through parts to find the image
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image data returned from Gemini.");
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        throw error;
    }
}