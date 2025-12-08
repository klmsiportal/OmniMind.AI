import { ChatSession, UserSettings } from "../types";

const STORAGE_KEY_SESSIONS = 'omnimind_secure_sessions_v1';
const STORAGE_KEY_SETTINGS = 'omnimind_settings_v1';

// Simple obfuscation/encryption simulation for client-side protection
// In a real banking app, we would use WebCrypto API with a user-derived key.
const encrypt = (data: string): string => {
  try {
    // 1. Base64 Encode
    const b64 = btoa(unescape(encodeURIComponent(data)));
    // 2. Simple rotation (Caesar cipher variant) to confuse automated scanners
    let result = '';
    for (let i = 0; i < b64.length; i++) {
        result += String.fromCharCode(b64.charCodeAt(i) + 1);
    }
    return result;
  } catch (e) {
    console.error("Encryption failed", e);
    return data;
  }
};

const decrypt = (data: string): string => {
  try {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) - 1);
    }
    return decodeURIComponent(escape(atob(result)));
  } catch (e) {
    console.error("Decryption failed", e);
    return "[]";
  }
};

export const SecureStorage = {
  saveSessions: (sessions: ChatSession[]) => {
    try {
      const json = JSON.stringify(sessions);
      const encrypted = encrypt(json);
      localStorage.setItem(STORAGE_KEY_SESSIONS, encrypted);
    } catch (error) {
      console.error("Failed to save secure history", error);
    }
  },

  loadSessions: (): ChatSession[] => {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (!encrypted) return [];
      const json = decrypt(encrypted);
      return JSON.parse(json);
    } catch (error) {
      console.error("Failed to load secure history", error);
      return [];
    }
  },

  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  },

  loadSettings: (): UserSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!stored) return {
        isAppLockEnabled: false,
        blurOnInactive: true,
        theme: 'dark',
        saveHistory: true
      };
      return JSON.parse(stored);
    } catch (e) {
       return {
        isAppLockEnabled: false,
        blurOnInactive: true,
        theme: 'dark',
        saveHistory: true
      };
    }
  },

  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    window.location.reload();
  }
};