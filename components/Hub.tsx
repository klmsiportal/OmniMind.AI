import React from 'react';
import { AGENTS_LIBRARY } from '../constants';
import { Sparkles, Code, ImageIcon, ArrowRight, Zap, Globe, MessageSquare } from './Icons';
import { User } from '../types';
import { ModelType } from '../types';

interface HubProps {
  currentUser: User | null;
  onSelectAgent: (agentId: string) => void;
  onNewChat: () => void;
}

const Hub: React.FC<HubProps> = ({ currentUser, onSelectAgent, onNewChat }) => {
  
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const featuredAgents = AGENTS_LIBRARY.slice(0, 4);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0b0c0e] text-white p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="space-y-4 pt-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-gray-400">{getGreeting()},{currentUser ? ' ' + currentUser.displayName?.split(' ')[0] : ''}</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    How can I help you today?
                </span>
            </h1>
            <p className="text-gray-500 max-w-2xl text-lg">
                OmniMind is online and secure. Select a capability below to begin or start a general conversation.
            </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
                onClick={() => onSelectAgent('general-assistant')}
                className="group relative overflow-hidden p-6 rounded-3xl bg-[#16181c] border border-gray-800 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 text-left"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <MessageSquare size={100} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">New Chat</h3>
                    <p className="text-sm text-gray-400">Start a general conversation with OmniMind.</p>
                </div>
            </button>

            <button 
                onClick={() => onSelectAgent('full-stack-dev')}
                className="group relative overflow-hidden p-6 rounded-3xl bg-[#16181c] border border-gray-800 hover:border-green-500/50 transition-all hover:shadow-2xl hover:shadow-green-900/10 text-left"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Code size={100} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
                        <Code size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Code Assistant</h3>
                    <p className="text-sm text-gray-400">Debug, write, and optimize code with the Dev Agent.</p>
                </div>
            </button>

            <button 
                onClick={() => onSelectAgent('vision-artist')}
                className="group relative overflow-hidden p-6 rounded-3xl bg-[#16181c] border border-gray-800 hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-900/10 text-left"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ImageIcon size={100} />
                </div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                        <Sparkles size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Generate Images</h3>
                    <p className="text-sm text-gray-400">Create HD visuals with DALL-E 3 integration.</p>
                </div>
            </button>
        </div>

        {/* Featured Agents */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Globe size={18} className="text-blue-500" />
                    Trending Capabilities
                </h2>
                <button 
                    onClick={onNewChat} // In a real app this might open the library
                    className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                    View all <ArrowRight size={14} />
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredAgents.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => onSelectAgent(agent.id)}
                        className="flex flex-col p-4 rounded-2xl bg-[#16181c] border border-gray-800 hover:bg-gray-800 transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl filter drop-shadow group-hover:scale-110 transition-transform">{agent.icon}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-900 px-2 py-1 rounded">
                                {agent.category}
                            </span>
                        </div>
                        <h4 className="font-semibold text-gray-200 group-hover:text-blue-400 transition-colors">{agent.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{agent.description}</p>
                    </button>
                ))}
            </div>
        </div>

        {/* Footer Info */}
        <div className="pt-10 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-mono gap-4">
            <div>
                <span className="text-green-500">●</span> System Operational
            </div>
            <div>
                Secure Vault: Active (AES-256)
            </div>
            <div>
                v3.1.0-release
            </div>
        </div>
      </div>
    </div>
  );
};

export default Hub;