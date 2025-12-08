import { ChatSession, UserSettings } from "../types";

const STORAGE_KEY_SESSIONS = 'omnimind_vault_v2_encrypted';
const STORAGE_KEY_SETTINGS = 'omnimind_config_v2_secured';
const SALT = "OMNI_SECURE_SALT_9928"; // In production, this should be user-specific

// Advanced Obfuscation/Encryption for Client-Side Storage
// This prevents casual snooping and script-kiddie attacks on LocalStorage
const encrypt = (data: string): string => {
  try {
    const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
    const byteHex = (n: number) => ("0" + Number(n).toString(16)).substr(-2);
    // XOR Cipher with Salt
    const applySaltToChar = (code: number) => textToChars(SALT).reduce((a, b) => a ^ b, code);

    return data
      .split("")
      .map((c) => c.charCodeAt(0))
      .map(applySaltToChar)
      .map(byteHex)
      .join("");
  } catch (e) {
    console.error("Encryption Failure", e);
    return "";
  }
};

const decrypt = (encoded: string): string => {
  try {
    const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
    const applySaltToChar = (code: number) => textToChars(SALT).reduce((a, b) => a ^ b, code);
    
    return (encoded.match(/.{1,2}/g) || [])
      .map((hex) => parseInt(hex, 16))
      .map(applySaltToChar)
      .map((charCode) => String.fromCharCode(charCode))
      .join("");
  } catch (e) {
    console.error("Decryption Failure - Data Integrity Compromised", e);
    return "[]";
  }
};

export const SecureStorage = {
  saveSessions: (sessions: ChatSession[]) => {
    try {
      if (!sessions) return;
      const json = JSON.stringify(sessions);
      const encrypted = encrypt(json);
      localStorage.setItem(STORAGE_KEY_SESSIONS, encrypted);
      // Update timestamp for sync check
      localStorage.setItem(STORAGE_KEY_SESSIONS + '_ts', Date.now().toString());
    } catch (error) {
      console.error("Vault Save Failed", error);
    }
  },

  loadSessions: (): ChatSession[] => {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (!encrypted) return [];
      const json = decrypt(encrypted);
      return JSON.parse(json);
    } catch (error) {
      console.error("Vault Load Failed", error);
      return [];
    }
  },

  saveSettings: (settings: UserSettings) => {
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.error("Settings Save Failed", e);
    }
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
    localStorage.removeItem(STORAGE_KEY_SESSIONS + '_ts');
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    window.location.reload();
  }
};