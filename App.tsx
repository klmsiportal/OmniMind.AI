import React, { useState, useEffect, useRef } from 'react';
import { signInWithGoogle, logOut, useAuth } from './services/firebase';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Hub from './components/Hub';
import LiveInterface from './components/LiveInterface';
import AgentLibrary from './components/AgentLibrary';
import SettingsModal from './components/SettingsModal';
import { SecureStorage } from './services/secureStorage';

import { AGENTS_LIBRARY } from './constants';
import { ChatSession, User, UserSettings } from './types';
import { Menu } from './components/Icons';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<'hub' | 'chat' | 'live'>('hub');

  // Safety: Prevent crash if AGENTS_LIBRARY is empty
  const defaultAgentId = AGENTS_LIBRARY?.[0]?.id ?? "default-agent";

  const [selectedAgentId, setSelectedAgentId] = useState<string>(defaultAgentId);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    isAppLockEnabled: false,
    blurOnInactive: true,
    theme: "dark",
    saveHistory: true
  });

  const [isBlurred, setIsBlurred] = useState(false);

  const sessionsRef = useRef(sessions);
  const settingsRef = useRef(settings);

  useEffect(() => {
    sessionsRef.current = sessions;
    settingsRef.current = settings;
  }, [sessions, settings]);

  // Load persistent data
  useEffect(() => {
    try {
      const loadedSettings = SecureStorage.loadSettings();
      setSettings(loadedSettings);

      if (loadedSettings.saveHistory) {
        const loadedSessions = SecureStorage.loadSessions();
        if (loadedSessions.length > 0) {
          setSessions(loadedSessions);
        }
      }
    } catch (err) {
      console.error("Error loading saved data:", err);
    }

    // Auth listener
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

  // Auto-save on change
  useEffect(() => {
    if (settings.saveHistory) {
      SecureStorage.saveSessions(sessions);
    }
  }, [sessions, settings.saveHistory]);

  // Save before closing tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (settingsRef.current.saveHistory) {
        SecureStorage.saveSessions(sessionsRef.current);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Blur when inactive
  useEffect(() => {
    if (!settings.blurOnInactive) return;

    const handleVisibility = () => setIsBlurred(document.hidden);

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [settings.blurOnInactive]);

  // Create chat session
  const createNewSession = (agentId?: string) => {
    const newAgentId = agentId || selectedAgentId;

    const newSession: ChatSession = {
      id: `${Date.now()}`,
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
      agentId: newAgentId
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedAgentId(newAgentId);
    setCurrentView("chat");

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const updateCurrentSession = (updated: ChatSession) => {
    if (updated.messages.length === 2 && updated.title === "New Chat") {
      const first = updated.messages[0].content;
      updated.title = first.slice(0, 30) + (first.length > 30 ? "..." : "");
    }

    setSessions(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const getCurrentSession = () =>
    sessions.find(s => s.id === currentSessionId) || null;

  // Content rendering
  const renderContent = () => {
    if (currentView === "live") {
      return <LiveInterface onEndCall={() => setCurrentView("hub")} />;
    }

    if (currentView === "hub") {
      return (
        <Hub
          currentUser={currentUser}
          onSelectAgent={(id) => createNewSession(id)}
          onNewChat={() => createNewSession()}
        />
      );
    }

    const session = getCurrentSession();
    if (!session) {
      return (
        <div className="flex items-center justify-center h-full">
          <button
            className="px-6 py-3 bg-blue-600 rounded-xl"
            onClick={() => createNewSession()}
          >
            Start Chat
          </button>
        </div>
      );
    }

    return (
      <ChatInterface
        currentSession={session}
        onUpdateSession={updateCurrentSession}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        isSearchEnabled={isSearchEnabled}
        setIsSearchEnabled={setIsSearchEnabled}
      />
    );
  };

  return (
    <div className={`flex h-screen bg-[#0b0c0e] text-white overflow-hidden font-sans`}>
      
      <AgentLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(agent) => {
          setSelectedAgentId(agent.id);
          if (currentView === "hub") createNewSession(agent.id);
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
        currentView={currentView}
        onNewChat={() => createNewSession()}
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          const sess = sessions.find(s => s.id === id);
          if (sess?.agentId) setSelectedAgentId(sess.agentId);
          setCurrentView("chat");
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onNavigateHome={() => setCurrentView("hub")}
        onNavigateLive={() => setCurrentView("live")}
        onSignOut={logOut}
        onLogin={signInWithGoogle}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-[#0b0c0e]">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <button onClick={() => setIsLibraryOpen(true)}>🧠</button>
        </div>

        <main className="flex-1 overflow-hidden relative">
          {renderContent()}
        </main>
      </div>

      {/* Privacy Blur */}
      {isBlurred && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center">
            <div className="text-4xl mb-2">🛡️</div>
            <p className="text-white text-lg">Content Hidden for Privacy</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
