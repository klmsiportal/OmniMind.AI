export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  groundingSources?: GroundingSource[];
  images?: string[]; // Base64 strings
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-3-pro-image-preview', // High quality image gen
  SEARCH = 'gemini-2.5-flash-search', // Conceptually using tools
}

export interface AppState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  isSidebarOpen: boolean;
  selectedModel: ModelType;
  isSearchEnabled: boolean; // Toggle for "Perplexity mode"
}