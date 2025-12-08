import React from 'react';
import { X, Shield, Trash, Download, Lock, Eye, Save } from './Icons';
import { UserSettings } from '../types';
import { SecureStorage } from '../services/secureStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (s: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handleToggle = (key: keyof UserSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    onUpdateSettings(newSettings);
    SecureStorage.saveSettings(newSettings);
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure? This will permanently delete all encrypted chat history. This action cannot be undone.")) {
        SecureStorage.clearAllData();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111315] w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="text-green-500" />
                Security & Settings
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-8">
            
            {/* Security Section */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Lock size={12} />
                    Cyber Security & Privacy
                </h3>
                
                <div className="bg-[#16181c] rounded-xl p-1 space-y-1">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-800/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Eye size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-200">Privacy Blur</div>
                                <div className="text-xs text-gray-500">Blur content when switching tabs to prevent spying.</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.blurOnInactive} onChange={() => handleToggle('blurOnInactive')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 hover:bg-gray-800/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Save size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-200">Persistent History</div>
                                <div className="text-xs text-gray-500">Save encrypted chats to device storage.</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.saveHistory} onChange={() => handleToggle('saveHistory')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Data Section */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Save size={12} />
                    Data Sovereignty
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button className="flex items-center gap-3 p-4 bg-[#16181c] hover:bg-gray-800 rounded-xl transition-all text-left border border-gray-800 hover:border-gray-600 group">
                        <Download className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="font-medium text-gray-200">Export Encrypted Data</div>
                            <div className="text-[10px] text-gray-500">Download your history as JSON.</div>
                        </div>
                    </button>

                    <button 
                        onClick={handleClearHistory}
                        className="flex items-center gap-3 p-4 bg-[#16181c] hover:bg-red-900/10 rounded-xl transition-all text-left border border-gray-800 hover:border-red-900/50 group"
                    >
                        <Trash className="text-red-500 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="font-medium text-red-400">Nuke All Data</div>
                            <div className="text-[10px] text-gray-500">Permanently delete everything.</div>
                        </div>
                    </button>
                </div>
            </section>

            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                <Shield className="text-green-500 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-green-200/80">
                    <span className="font-bold text-green-400 block mb-1">Secure Environment Active</span>
                    Your data is encrypted using AES-256 equivalent logic before being stored locally. No chat data is sent to our servers for storage. OpenAI processes data ephemerally.
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;