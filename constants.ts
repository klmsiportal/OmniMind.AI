import { ModelType } from "./types";

// Firebase Configuration from user request
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
  { id: ModelType.FLASH, name: "Omni Flash", description: "Fast, versatile, efficient.", icon: "⚡" },
  { id: ModelType.PRO, name: "Omni Pro", description: "Complex reasoning & coding.", icon: "🧠" },
  { id: ModelType.IMAGE, name: "Omni Vision", description: "State-of-the-art Image Generation.", icon: "🎨" },
];

export const SYSTEM_INSTRUCTION = `You are OmniMind, a world-class AI assistant created by Akin S. Sokpah from Liberia. 
You are helpful, harmless, and honest. 
You have access to real-time information when the user enables search.
Structure your answers using Markdown. 
If generating code, use proper syntax highlighting.
Be concise but comprehensive.`;
