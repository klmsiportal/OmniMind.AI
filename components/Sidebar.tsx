import React from 'react';
import { Plus, MessageSquare, LogOut, Settings, User as UserIcon, Zap, Shield, LayoutGrid } from './Icons';
import { ChatSession, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentUser: User | null;
  currentSessionId: string | null;
  currentView: 'hub' | 'chat';
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onNavigateHome: () => void;
  onSignOut: () => void;
  onLogin: () => void;
  toggleSidebar: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  sessions,
  currentUser,
  currentSessionId,
  currentView,
  onNewChat,
  onSelectSession,
  onNavigateHome,
  onSignOut,
  onLogin,
  toggleSidebar,
  onOpenLibrary,
  onOpenSettings
}) => {
  return (
    <div 
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0b0c0e] border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 flex flex-col`}
    >
      <div className="p-5 flex items-center justify-between">
        <div 
            onClick={onNavigateHome}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Zap className="text-white" size={18} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
                OmniMind
            </h1>
        </div>
        <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
           ✕
        </button>
      </div>

      <div className="px-4 pb-2 space-y-2">
        <button
          onClick={onNavigateHome}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            currentView === 'hub' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <LayoutGrid size={20} />
          <span>Hub</span>
        </button>

        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-200 text-black rounded-xl transition-all font-medium shadow-md shadow-white/5 active:scale-95"
        >
          <Plus size={20} />
          <span>New Chat</span>
        </button>

        <button
          onClick={onOpenLibrary}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-blue-400 border border-blue-900/30 rounded-xl transition-all font-medium group"
        >
           <div className="group-hover:animate-pulse">🧠</div>
           <span>Explore Agents</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="flex items-center justify-between px-2 mb-3">
             <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">History</div>
             <div className="text-[10px] text-green-500 flex items-center gap-1 bg-green-900/10 px-1.5 py-0.5 rounded border border-green-900/20">
                <Shield size={8} />
                SECURE
             </div>
        </div>
        
        {sessions.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-sm">
                No history yet.
            </div>
        )}

        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-left transition-all duration-200 group relative ${
              currentSessionId === session.id && currentView === 'chat'
                ? 'bg-[#1c1f26] text-white shadow-sm border border-gray-800'
                : 'text-gray-400 hover:bg-[#16181c] hover:text-gray-200'
            }`}
          >
            <MessageSquare size={16} className={currentSessionId === session.id && currentView === 'chat' ? 'text-blue-500' : 'text-gray-600 group-hover:text-gray-400'} />
            <span className="truncate flex-1">{session.title}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800/50 space-y-1">
        
        {currentUser && (
          <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-gray-900/50 rounded-xl border border-gray-800/50">
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 overflow-hidden ring-2 ring-black">
                {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">{currentUser.displayName?.charAt(0) || 'U'}</div>
                )}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{currentUser.displayName}</p>
                <p className="text-xs text-gray-500 truncate font-mono">{currentUser.email}</p>
             </div>
          </div>
        )}

        <button 
           onClick={onOpenSettings}
           className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
            <Settings size={18} />
            <span>Settings & Security</span>
        </button>
        
        {currentUser ? (
            <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-red-900/20 rounded-lg transition-colors"
            >
            <LogOut size={16} />
            <span>Sign Out</span>
            </button>
        ) : (
           <button 
             onClick={onLogin}
             className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
           >
              <UserIcon size={16} />
              <span>Sign In</span>
           </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;