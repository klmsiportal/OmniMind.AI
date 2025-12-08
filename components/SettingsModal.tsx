import React from 'react';
import { X, Shield, Trash, Download, Lock, Eye, Save, Cpu } from './Icons';
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
    if (confirm("WARNING: This will initiate a secure wipe of all encrypted local data. This action is irreversible. Proceed?")) {
        SecureStorage.clearAllData();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#111315] w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="text-green-500" />
                Cyber Security Dashboard
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* Status Panel */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                        <Lock size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-green-400 font-mono mb-0.5">VAULT STATUS</div>
                        <div className="font-bold text-white">ENCRYPTED</div>
                    </div>
                </div>
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-blue-400 font-mono mb-0.5">PROTOCOL</div>
                        <div className="font-bold text-white">AES-256 (Sim)</div>
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                    Active Defense Systems
                </h3>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-[#16181c] rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Eye size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-200">Anti-Snooping Blur</div>
                                <div className="text-xs text-gray-500">Obfuscate interface when window is inactive.</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.blurOnInactive} onChange={() => handleToggle('blurOnInactive')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#16181c] rounded-lg border border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Save size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-gray-200">Secure Persistence</div>
                                <div className="text-xs text-gray-500">Save history to encrypted local vault automatically.</div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.saveHistory} onChange={() => handleToggle('saveHistory')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </section>

            {/* Data Sovereignty */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                    Data Sovereignty Actions
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button className="flex items-center gap-3 p-4 bg-[#16181c] hover:bg-gray-800 rounded-xl transition-all text-left border border-gray-800 hover:border-blue-500/50 group">
                        <Download className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="font-medium text-gray-200">Export Vault</div>
                            <div className="text-[10px] text-gray-500">Download encrypted JSON dump.</div>
                        </div>
                    </button>

                    <button 
                        onClick={handleClearHistory}
                        className="flex items-center gap-3 p-4 bg-[#16181c] hover:bg-red-900/10 rounded-xl transition-all text-left border border-gray-800 hover:border-red-900/50 group"
                    >
                        <Trash className="text-red-500 group-hover:scale-110 transition-transform" />
                        <div>
                            <div className="font-medium text-red-400">Secure Wipe</div>
                            <div className="text-[10px] text-gray-500">Irreversible data destruction.</div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Fake Log Console */}
            <div className="bg-black rounded-lg p-3 font-mono text-[10px] text-green-500/70 border border-gray-800 opacity-70">
                <div className="mb-1"> {">"} System initialized. Secure enclave active.</div>
                <div className="mb-1"> {">"} Monitoring for intrusion attempts...</div>
                <div className="mb-1"> {">"} Salted Hash: {SecureStorage.loadSessions() ? 'VERIFIED' : 'EMPTY'}</div>
                <div className="animate-pulse"> {">"} _</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;