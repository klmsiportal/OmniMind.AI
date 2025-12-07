import { ModelType } from "./types";

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC5hFB3ICxzyMrlvtnQl-n-2Dkr2RFsmqc",
  authDomain: "fir-9b1f8.firebaseapp.com",
  projectId: "fir-9b1f8",
  storageBucket: "fir-9b1f8.firebasestorage.app",
  messagingSenderId: "539772525700",
  appId: "1:539772525700:web:25b5a686877ddbf6d176d1",
  measurementId: "G-7FWY3QB5MY"
};

export const MODEL_OPTIONS = [
  { id: ModelType.FLASH, name: "Omni Mini", description: "Fast, everyday tasks (GPT-4o Mini).", icon: "⚡" },
  { id: ModelType.PRO, name: "Omni Pro", description: "Reasoning & Coding (GPT-4o).", icon: "🧠" },
  { id: ModelType.IMAGE, name: "Omni Vision", description: "DALL-E 3 Image Generation.", icon: "🎨" },
];

export const SYSTEM_INSTRUCTION = `You are OmniMind, a world-class AI assistant created by Akin S. Sokpah from Liberia.
You are powered by OpenAI's advanced models.
You are helpful, harmless, and honest.
Structure your answers using Markdown.
If generating code, use proper syntax highlighting.
Be concise but comprehensive.`;