import OpenAI from 'openai';
import { SYSTEM_INSTRUCTION } from "../constants";
import { GroundingSource } from "../types";

// Use the Vercel environment variable for OpenAI
const apiKey = process.env.OPENAI_API_KEY || '';

// Initialize OpenAI client
// dangerouslyAllowBrowser is required because we are running this client-side in React
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
});

interface GenerateParams {
  model: string;
  prompt: string;
  history?: { role: string; parts: { text: string }[] }[]; // Legacy signature from app structure
  images?: string[]; // base64
  useSearch?: boolean; 
}

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
): Promise<string> => {
  const { model, prompt, images, useSearch } = params;

  // Prepare messages for OpenAI
  // System message
  const messages: any[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION }
  ];

  // If search is enabled, we prompt the model to act as a search engine/researcher
  if (useSearch) {
    messages[0].content += "\n\nMODE: DEEP SEARCH. Provide extensive details, analyze multiple angles, and act like a search engine providing comprehensive information.";
  }

  // User message construction (Text + Images)
  const userContent: any[] = [{ type: "text", text: prompt }];

  if (images && images.length > 0) {
    images.forEach(img => {
      // Ensure we have the full data URI
      userContent.push({
        type: "image_url",
        image_url: {
          url: img, // OpenAI accepts base64 data URIs
          detail: "high"
        }
      });
    });
  }

  messages.push({ role: 'user', content: userContent });

  try {
    const stream = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      max_tokens: 4096,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        // OpenAI doesn't natively return structured grounding sources like Gemini.
        // We pass undefined for grounding.
        onChunk(fullText, undefined); 
      }
    }

    return fullText;

  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
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
    } catch (error) {
        console.error("OpenAI Image Gen Error:", error);
        throw error;
    }
}