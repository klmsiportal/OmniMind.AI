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
  agentId?: string; // Track which agent started this chat
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGE = 'gemini-2.5-flash-image', 
}

export type AgentCategory = 'General' | 'Coding' | 'Writing' | 'Productivity' | 'Data' | 'Lifestyle' | 'Academic' | 'Creative';

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AgentCategory;
  systemPrompt: string;
  model: ModelType; // Preferred model for this agent
}

export interface UserSettings {
  isAppLockEnabled: boolean;
  blurOnInactive: boolean;
  theme: 'dark' | 'light';
  saveHistory: boolean;
}

export interface AppState {
  currentSessionId: string | null;
  sessions: ChatSession[];
  isSidebarOpen: boolean;
  selectedAgentId: string;
  isSearchEnabled: boolean; 
  settings: UserSettings;
}