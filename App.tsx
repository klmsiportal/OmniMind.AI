import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGoogle, logOut, useAuth } from './services/firebase';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { AppState, ChatSession, Message, ModelType, User, UserSettings } from './types';
import { Menu } from './components/Icons';
import { AGENTS_LIBRARY } from './constants';
import AgentLibrary from './components/AgentLibrary';
import SettingsModal from './components/SettingsModal';
import { SecureStorage } from './services/secureStorage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App State with Persistence
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
      isAppLockEnabled: false,
      blurOnInactive: true,
      theme: 'dark',
      saveHistory: true
  });
  
  // Default to first agent
  const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENTS_LIBRARY[0].id);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  // Security: Privacy Blur
  const [isBlurred, setIsBlurred] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    // 1. Load Settings
    const loadedSettings = SecureStorage.loadSettings();
    setSettings(loadedSettings);

    // 2. Load History if enabled
    if (loadedSettings.saveHistory) {
        const loadedSessions = SecureStorage.loadSessions();
        if (loadedSessions.length > 0) {
            setSessions(loadedSessions);
            // Don't auto-set current session to avoid jumping into old chats immediately, let user choose
            // or create new one if none exist.
        } else {
            createNewSession();
        }
    } else {
        createNewSession();
    }

    // Auth
    const unsubscribe = useAuth((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save Sessions whenever they change
  useEffect(() => {
    if (settings.saveHistory && sessions.length > 0) {
        SecureStorage.saveSessions(sessions);
    }
  }, [sessions, settings.saveHistory]);

  // Privacy Blur Logic
  useEffect(() => {
    if (!settings.blurOnInactive) return;

    const handleVisibilityChange = () => {
        if (document.hidden) {
            setIsBlurred(true);
        } else {
            setIsBlurred(false);
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [settings.blurOnInactive]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now(),
      agentId: selectedAgentId
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const updateCurrentSession = (updatedSession: ChatSession) => {
    if (updatedSession.messages.length === 2 && updatedSession.title === 'New Chat') {
       const firstMsg = updatedSession.messages[0].content;
       updatedSession.title = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? '...' : '');
    }

    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const getCurrentSession = () => {
    return sessions.find(s => s.id === currentSessionId) || sessions[0];
  };

  return (
    <div className={`flex h-screen bg-[#0b0c0e] text-white overflow-hidden font-sans selection:bg-blue-500/30 ${isBlurred ? 'blur-xl scale-105 opacity-50 transition-all duration-500' : 'transition-all duration-300'}`}>
      
      <AgentLibrary 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(agent) => {
            setSelectedAgentId(agent.id);
        }}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <Sidebar 
        isOpen={isSidebarOpen}
        sessions={sessions}
        currentUser={currentUser}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => {
            setCurrentSessionId(id);
            const sess = sessions.find(s => s.id === id);
            if (sess && sess.agentId) setSelectedAgentId(sess.agentId);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onSignOut={logOut}
        onLogin={signInWithGoogle}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#0b0c0e]">
           <div className="flex items-center gap-3">
               <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300">
                 <Menu size={24} />
               </button>
               <span className="font-semibold text-white">OmniMind</span>
           </div>
           <button onClick={() => setIsLibraryOpen(true)} className="text-gray-300">
             <span className="text-xl">🧠</span>
           </button>
        </div>

        <main className="flex-1 h-full overflow-hidden relative">
            {getCurrentSession() ? (
                <ChatInterface 
                    currentSession={getCurrentSession()}
                    onUpdateSession={updateCurrentSession}
                    selectedAgentId={selectedAgentId}
                    setSelectedAgentId={setSelectedAgentId}
                    isSearchEnabled={isSearchEnabled}
                    setIsSearchEnabled={setIsSearchEnabled}
                />
            ) : (
                <div className="flex items-center justify-center h-full flex-col">
                    <button onClick={createNewSession} className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition font-medium">Start New Chat</button>
                </div>
            )}
        </main>
      </div>

      {/* Security Privacy Overlay */}
      {isBlurred && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="bg-black/80 px-8 py-4 rounded-2xl flex items-center gap-4 border border-gray-700">
                <span className="text-4xl">🛡️</span>
                <div>
                    <h3 className="text-xl font-bold">Privacy Shield Active</h3>
                    <p className="text-gray-400">Content hidden for security</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;