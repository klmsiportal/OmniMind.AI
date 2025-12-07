// services/openaiService.ts

import OpenAI from "openai";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ Missing VITE_OPENAI_API_KEY in environment variables!");
}

const client = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Required for frontend calls
});

export async function askOpenAI(prompt: string): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Fast + cheap + high quality
      messages: [
        {
          role: "system",
          content: "You are OmniMind, an advanced AI created by Akin S. Sokpah."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "No response received.";

  } catch (error: any) {
    console.error("OPENAI ERROR:", error);

    if (error?.error?.message) {
      return `Error: ${error.error.message}`;
    }

    return "Sorry, I encountered an error processing your request.";
  }
}
