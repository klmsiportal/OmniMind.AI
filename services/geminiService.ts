import OpenAI from "openai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GroundingSource, ModelType } from "../types";

/* ---------------------------------------------------
   ENVIRONMENT VARIABLE FIX FOR VERCEL + VITE
---------------------------------------------------- */

const apiKey =
  // 1. Vercel + Vite (THIS is the correct source)
  import.meta.env.VITE_OPENAI_API_KEY ||
  // 2. Fallback for local dev
  process.env.OPENAI_API_KEY ||
  "";

// Initialize client (browser allowed)
const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

// ---------------------------------------------------
// Types
// ---------------------------------------------------

interface GenerateParams {
  model: string;
  prompt: string;
  history?: { role: string; parts: { text: string }[] }[];
  images?: string[];
  useSearch?: boolean;
}

const getSystemPrompt = (modelId: string, useSearch: boolean): string => {
  let basePrompt = SYSTEM_INSTRUCTION;

  if (useSearch) {
    basePrompt += `
[MODE: DEEP SEARCH]
Perform deep, structured research.
Return verifiable, clean information.
Format with headers and clarity.
    `;
  }

  switch (modelId) {
    case ModelType.CODER:
      return (
        basePrompt +
        "\n\n[MODE: SENIOR ENGINEER] Write clean, efficient professional code with explanations."
      );
    case ModelType.WRITER:
      return (
        basePrompt +
        "\n\n[MODE: CREATIVE WRITER] Produce engaging, persuasive writing with creativity."
      );
    default:
      return basePrompt;
  }
};

const resolveModelName = (modelId: string): string => {
  if (modelId === ModelType.CODER || modelId === ModelType.WRITER)
    return "gpt-4o";
  return modelId;
};

// ---------------------------------------------------
// STREAM RESPONSE
// ---------------------------------------------------

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
): Promise<string> => {
  const { model, prompt, images, useSearch } = params;

  if (!apiKey) {
    const errorMsg =
      "Configuration Error: Missing API Key.\nFix: Add VITE_OPENAI_API_KEY in Vercel.";
    onChunk(errorMsg);
    throw new Error(errorMsg);
  }

  const actualModel = resolveModelName(model);
  const systemPrompt = getSystemPrompt(model, !!useSearch);

  const messages: any[] = [
    { role: "system", content: systemPrompt },
  ];

  const userContent: any[] = [{ type: "text", text: prompt }];

  if (images?.length) {
    images.forEach((img) =>
      userContent.push({
        type: "image_url",
        image_url: { url: img, detail: "high" },
      })
    );
  }

  messages.push({ role: "user", content: userContent });

  try {
    const stream = await openai.chat.completions.create({
      model: actualModel,
      messages,
      stream: true,
      max_tokens: 4096,
      temperature: model === ModelType.CODER ? 0.2 : 0.7,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || "";
      if (content) {
        fullText += content;
        onChunk(fullText);
      }
    }

    return fullText;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    let msg = "OpenAI request failed.";

    if (error?.status === 401) msg = "Invalid API Key.";
    if (error?.status === 429) msg = "Rate limit exceeded.";
    if (error?.status === 500) msg = "OpenAI server error.";

    throw new Error(msg);
  }
};

// ---------------------------------------------------
// IMAGE GENERATION
// ---------------------------------------------------

export const generateImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("Missing OpenAI API Key");

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      n: 1,
      response_format: "b64_json",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");

    return `data:image/png;base64,${b64}`;
  } catch (err: any) {
    console.error("Image Error:", err);
    throw new Error("Image generation failed.");
  }
};
