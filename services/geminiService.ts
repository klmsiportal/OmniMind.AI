import OpenAI from "openai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GroundingSource, ModelType } from "../types";

/* ---------------------------------------------
   API KEY FOR VERCEL + VITE
---------------------------------------------- */

const apiKey =
  import.meta.env.VITE_OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  "";

export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true,
});

/* ---------------------------------------------
   TYPES
---------------------------------------------- */

interface GenerateParams {
  model: string;
  prompt: string;
  images?: string[];
  useSearch?: boolean;
}

const resolveModel = (modelId: string): string => {
  switch (modelId) {
    case ModelType.CODER:
    case ModelType.WRITER:
      return "gpt-4.1"; // Better & cheaper than 4o
    default:
      return "gpt-4o"; // Default model
  }
};

const buildSystemPrompt = (modelId: string, useSearch: boolean): string => {
  let base = SYSTEM_INSTRUCTION;

  if (useSearch) {
    base += `
[WEB_SEARCH_MODE]
Search the internet for updated information.
Always cite sources when possible.
Return clean, structured results.
`;
  }

  if (modelId === ModelType.CODER) {
    base += `
[CODER_MODE]
Write clean, optimized, senior-level production code.
Explain decisions briefly.
`;
  }

  if (modelId === ModelType.WRITER) {
    base += `
[WRITER_MODE]
Write creatively, persuasively, and with human tone.
`;
  }

  return base;
};

/* ---------------------------------------------
   STREAM RESPONSE (NEW OPENAI SDK)
---------------------------------------------- */

export const streamResponse = async (
  params: GenerateParams,
  onChunk: (text: string, grounding?: GroundingSource[]) => void
) => {
  const { model, prompt, images, useSearch } = params;

  if (!apiKey) {
    const msg = "Missing API key. Add VITE_OPENAI_API_KEY in Vercel.";
    onChunk(msg);
    throw new Error(msg);
  }

  const modelName = resolveModel(model);
  const systemPrompt = buildSystemPrompt(model, !!useSearch);

  // Build user content
  const userParts: any[] = [{ type: "input_text", text: prompt }];

  if (images?.length) {
    images.forEach((img) => {
      userParts.push({
        type: "input_image",
        image_url: img,
      });
    });
  }

  try {
    // NEW SDK FORMAT
    const response = await openai.responses.create({
      model: modelName,
      reasoning: { effort: "medium" },
      input: [
        {
          role: "system",
          content: [{ type: "text", text: systemPrompt }],
        },
        {
          role: "user",
          content: userParts,
        },
      ],
      stream: true,
    });

    let buffer = "";

    for await (const event of response) {
      const text = event?.output_text || "";
      if (text) {
        buffer = text; // stream replaces, not appends
        onChunk(buffer);
      }
    }

    return buffer;
  } catch (err: any) {
    console.error("Stream Error:", err);

    if (err?.status === 401) {
      throw new Error("Invalid API Key.");
    }
    if (err?.status === 429) {
      throw new Error("Rate limit exceeded.");
    }
    if (err?.status >= 500) {
      throw new Error("OpenAI server error.");
    }

    throw new Error("Failed to generate response.");
  }
};

/* ---------------------------------------------
   IMAGE GENERATION (FIXED FOR NEW SDK)
---------------------------------------------- */

export const generateImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("Missing API key.");

  try {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("Failed to generate image");

    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.error("Image error:", err);
    throw new Error("Image generation failed.");
  }
};
