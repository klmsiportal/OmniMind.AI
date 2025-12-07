export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export enum Role {
  USER = 'user',
  MODEL = 'assistant', // OpenAI uses 'assistant' usually, but we map strictly in service
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
  FLASH = 'gpt-4o-mini',
  PRO = 'gpt-4o',
  IMAGE = 'dall-e-3', 
  SEARCH = 'gpt-4o-search', // Conceptual internal mapping
}

export interface AppState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  isSidebarOpen: boolean;
  selectedModel: ModelType;
  isSearchEnabled: boolean; // Toggle for "Perplexity mode"
}