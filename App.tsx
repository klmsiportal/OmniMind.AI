import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGoogle, logOut, useAuth } from './services/firebase';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { AppState, ChatSession, Message, ModelType, User } from './types';
import { Menu } from './components/Icons';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  useEffect(() => {
    // Auth Listener
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

    // Initialize Default Session
    createNewSession();

    return () => unsubscribe();
  }, []);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const updateCurrentSession = (updatedSession: ChatSession) => {
    // Generate Title if it's the first user message
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
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen}
        sessions={sessions}
        currentUser={currentUser}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={(id) => {
            setCurrentSessionId(id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }}
        onSignOut={logOut}
        onLogin={signInWithGoogle}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-gray-800 bg-gray-950">
           <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300">
             <Menu size={24} />
           </button>
           <span className="ml-4 font-semibold">OmniMind</span>
        </div>

        <main className="flex-1 h-full overflow-hidden relative">
            {getCurrentSession() ? (
                <ChatInterface 
                    currentSession={getCurrentSession()}
                    onUpdateSession={updateCurrentSession}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    isSearchEnabled={isSearchEnabled}
                    setIsSearchEnabled={setIsSearchEnabled}
                />
            ) : (
                <div className="flex items-center justify-center h-full">Loading...</div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;