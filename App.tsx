import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGoogle, logOut, useAuth } from './services/firebase';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { AppState, ChatSession, Message, ModelType, User } from './types';
import { Menu } from './components/Icons';
import { AGENTS_LIBRARY } from './constants';
import AgentLibrary from './components/AgentLibrary';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // App State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Default to first agent
  const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENTS_LIBRARY[0].id);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  useEffect(() => {
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

    createNewSession();

    return () => unsubscribe();
  }, []);

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
    <div className="flex h-screen bg-[#0b0c0e] text-white overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Agent Library Modal (Global Access) */}
      <AgentLibrary 
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(agent) => {
            setSelectedAgentId(agent.id);
            // Optionally start new chat with this agent immediately
            // createNewSession();
        }}
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
                <div className="flex items-center justify-center h-full">Loading...</div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;