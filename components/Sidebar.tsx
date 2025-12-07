import React from 'react';
import { Plus, MessageSquare, LogOut, Settings, User as UserIcon } from './Icons';
import { ChatSession, User } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  currentUser: User | null;
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onSignOut: () => void;
  onLogin: () => void;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  sessions,
  currentUser,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onSignOut,
  onLogin,
  toggleSidebar
}) => {
  return (
    <div 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 flex flex-col`}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          OmniMind
        </h1>
        <button onClick={toggleSidebar} className="md:hidden text-gray-400">
           ✕
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <Plus size={20} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">Recent</div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition-colors ${
              currentSessionId === session.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            <span className="truncate">{session.title}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        {currentUser ? (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 overflow-hidden">
                {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">{currentUser.displayName?.charAt(0) || 'U'}</div>
                )}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
             </div>
          </div>
        ) : (
           <button 
             onClick={onLogin}
             className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg"
           >
              <UserIcon size={18} />
              <span>Sign In</span>
           </button>
        )}
        
        {currentUser && (
            <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
            <LogOut size={18} />
            <span>Sign Out</span>
            </button>
        )}
        
        <div className="px-3 pt-2 text-xs text-gray-600 text-center">
            Created by Akin S. Sokpah
        </div>
      </div>
    </div>
  );
};

export default Sidebar;