import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { AGENTS_LIBRARY } from '../constants';
import { Agent, AgentCategory } from '../types';

interface AgentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agent: Agent) => void;
  selectedAgentId: string;
}

const CATEGORIES: AgentCategory[] = ['General', 'Coding', 'Writing', 'Productivity', 'Academic', 'Data', 'Lifestyle', 'Creative'];

const AgentLibrary: React.FC<AgentLibraryProps> = ({ isOpen, onClose, onSelectAgent, selectedAgentId }) => {
  const [activeCategory, setActiveCategory] = useState<AgentCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredAgents = AGENTS_LIBRARY.filter(agent => {
    const matchesCategory = activeCategory === 'All' || agent.category === activeCategory;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111315] w-full max-w-5xl h-[85vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    OmniMind Intelligence Library
                </h2>
                <p className="text-gray-400 text-sm mt-1">Select a specialized neural agent for your task.</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
                <X size={24} />
             </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mt-2">
            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search agents..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <button 
                    onClick={() => setActiveCategory('All')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === 'All' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    All
                </button>
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0b0c0e]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAgents.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => {
                            onSelectAgent(agent);
                            onClose();
                        }}
                        className={`group relative p-4 rounded-xl border text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full ${
                            selectedAgentId === agent.id 
                            ? 'bg-blue-900/10 border-blue-500/50 shadow-blue-500/10' 
                            : 'bg-[#16181c] border-gray-800 hover:border-gray-600'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{agent.icon}</span>
                            {selectedAgentId === agent.id && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            )}
                        </div>
                        <h3 className={`font-semibold mb-1 ${selectedAgentId === agent.id ? 'text-blue-400' : 'text-gray-200'}`}>
                            {agent.name}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {agent.description}
                        </p>
                        <div className="mt-auto pt-3 flex items-center gap-2">
                             <span className="text-[10px] uppercase tracking-wider font-bold text-gray-600 bg-gray-900 px-2 py-1 rounded">
                                {agent.category}
                             </span>
                        </div>
                    </button>
                ))}
            </div>
            
            {filteredAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                    <Search size={32} className="mb-2 opacity-50" />
                    <p>No agents found matching your criteria.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default AgentLibrary;