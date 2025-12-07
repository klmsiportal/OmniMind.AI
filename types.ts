export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export enum Role {
  USER = 'user',
  MODEL = 'assistant',
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
  CODER = 'gpt-4o-coder',
  WRITER = 'gpt-4o-writer',
  SEARCH = 'gpt-4o-search', // Internal mapping for search mode
}

export interface AppState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  isSidebarOpen: boolean;
  selectedModel: ModelType;
  isSearchEnabled: boolean; 
}