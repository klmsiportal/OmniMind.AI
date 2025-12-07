import React, { useState, useRef, useEffect } from 'react';
import { Send, ImageIcon, Paperclip, X, Search, Loader2, Globe, Mic, Settings, Zap } from './Icons';
import { Message, Role, ModelType, ChatSession, Agent } from '../types';
import { streamResponse, generateImage } from '../services/geminiService';
import MessageItem from './MessageItem';
import { AGENTS_LIBRARY, getAgentById } from '../constants';
import AgentLibrary from './AgentLibrary';

interface ChatInterfaceProps {
  currentSession: ChatSession;
  onUpdateSession: (updatedSession: ChatSession) => void;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  isSearchEnabled: boolean;
  setIsSearchEnabled: (enabled: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  onUpdateSession,
  selectedAgentId,
  setSelectedAgentId,
  isSearchEnabled,
  setIsSearchEnabled
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentAgent = getAgentById(selectedAgentId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setAttachments(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser.");
        return;
    }
    
    if (isRecording) {
        // Stop logic would go here if we had a persistent reference
        setIsRecording(false);
        return;
    }

    setIsRecording(true);
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
    };

    recognition.onerror = () => {
        setIsRecording(false);
    };

    recognition.onend = () => {
        setIsRecording(false);
    };

    recognition.start();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input,
      timestamp: Date.now(),
      images: attachments
    };

    const newMessages = [...currentSession.messages, userMessage];
    
    // Placeholder for bot
    const botMessageId = (Date.now() + 1).toString();
    const botPlaceholder: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: "",
      timestamp: Date.now(),
      isStreaming: true
    };
    
    onUpdateSession({
      ...currentSession,
      messages: [...newMessages, botPlaceholder]
    });

    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      if (currentAgent.model === ModelType.IMAGE) {
        // Handle Image Generation
        const imageUrl = await generateImage(userMessage.content);
        const finalBotMessage: Message = {
            id: botMessageId,
            role: Role.MODEL,
            content: `generated image based on: ${userMessage.content}`,
            images: [imageUrl],
            timestamp: Date.now(),
            isStreaming: false
        };
        onUpdateSession({
            ...currentSession,
            messages: [...newMessages, finalBotMessage]
        });
      } else {
        // Handle Text/Chat/Search with Agent Context
        await streamResponse({
            model: currentAgent.model,
            prompt: userMessage.content,
            images: userMessage.images,
            useSearch: isSearchEnabled,
            systemInstruction: currentAgent.systemPrompt
        }, (text, grounding) => {
            const updatedBotMessage: Message = {
                id: botMessageId,
                role: Role.MODEL,
                content: text,
                timestamp: Date.now(),
                isStreaming: true,
                groundingSources: grounding
            };
            onUpdateSession({
                ...currentSession,
                messages: [...newMessages, updatedBotMessage]
            });
        });
        
        onUpdateSession((prev) => {
            const msgs = [...prev.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.id === botMessageId) {
                lastMsg.isStreaming = false;
            }
            return { ...prev, messages: msgs };
        });
      }
    } catch (error) {
        console.error("Generation failed", error);
        const errorMessage: Message = {
            id: botMessageId,
            role: Role.MODEL,
            content: "**Error:** Failed to connect to OpenAI. Please verify your API Key in Vercel settings.",
            timestamp: Date.now(),
            isStreaming: false
        };
        onUpdateSession({
            ...currentSession,
            messages: [...newMessages, errorMessage]
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0c0e] relative font-sans">
      <AgentLibrary 
         isOpen={isLibraryOpen} 
         onClose={() => setIsLibraryOpen(false)} 
         selectedAgentId={selectedAgentId}
         onSelectAgent={(agent) => setSelectedAgentId(agent.id)}
      />

      {/* Top Bar - Active Agent */}
      <div className="sticky top-0 z-10 px-6 py-4 bg-[#0b0c0e]/80 backdrop-blur-xl border-b border-gray-800 flex justify-between items-center">
        <button 
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-3 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-full transition-all group"
        >
            <span className="text-xl">{currentAgent.icon}</span>
            <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {currentAgent.name}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {currentAgent.category} Agent
                </span>
            </div>
            <Settings size={14} className="ml-2 text-gray-600 group-hover:rotate-90 transition-transform" />
        </button>
        
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-600">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             ONLINE
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-32 scroll-smooth">
        {currentSession.messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500 animate-in fade-in duration-700 slide-in-from-bottom-4">
               <div className="relative">
                   <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                   <div className="relative w-24 h-24 bg-gradient-to-tr from-gray-800 to-black rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-gray-800">
                        <span className="text-5xl">{currentAgent.icon}</span>
                   </div>
               </div>
               
               <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{currentAgent.name}</h2>
               <p className="max-w-md mb-10 text-lg text-gray-400 font-light">{currentAgent.description}</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                  {['Analyze this data...', 'Write a poem about...', 'Explain quantum physics...', 'Debug my code...'].map((placeholder, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setInput(placeholder)} 
                        className="p-4 bg-[#16181c] border border-gray-800 rounded-xl hover:bg-gray-800 hover:border-gray-600 text-sm text-left transition-all hover:-translate-y-0.5"
                      >
                        "{placeholder}"
                      </button>
                  ))}
               </div>
           </div>
        ) : (
          <div className="py-6">
            {currentSession.messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 md:left-72 right-0 p-4 md:p-6 bg-gradient-to-t from-[#0b0c0e] via-[#0b0c0e] to-transparent z-20">
        <div className="max-w-4xl mx-auto">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto p-2">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative group animate-in zoom-in-50 duration-200">
                            <img src={att} alt="attachment" className="w-20 h-20 rounded-xl object-cover border border-gray-700 shadow-lg" />
                            <button 
                                onClick={() => removeAttachment(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex flex-col bg-[#16181c] border border-gray-800 rounded-3xl shadow-2xl focus-within:border-blue-900/50 focus-within:ring-1 focus-within:ring-blue-900/30 transition-all duration-300">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentAgent.name}...`}
                    className="w-full bg-transparent text-gray-100 p-5 pb-14 outline-none resize-none max-h-60 min-h-[60px] text-base placeholder-gray-600"
                    rows={1}
                />
                
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                     <button 
                        onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                        className={`p-2 rounded-xl transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                            isSearchEnabled 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                        title={isSearchEnabled ? "Web Search Active" : "Enable Web Search"}
                     >
                        <Globe size={16} />
                        <span className="hidden sm:inline">{isSearchEnabled ? 'Search On' : 'Search'}</span>
                     </button>

                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                        title="Upload Image"
                     >
                        <Paperclip size={18} />
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileSelect}
                     />
                     
                     <button
                        onClick={handleMicClick}
                        className={`p-2 rounded-xl transition-all ${isRecording ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
                        title="Voice Input"
                     >
                        <Mic size={18} />
                     </button>
                </div>

                <div className="absolute bottom-3 right-3">
                    <button
                        onClick={() => handleSubmit()}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className={`p-3 rounded-xl transition-all duration-200 shadow-lg ${
                            (input.trim() || attachments.length > 0) && !isLoading
                             ? 'bg-white text-black hover:bg-gray-200 hover:scale-105 hover:shadow-white/10' 
                             : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
                OmniMind v2.0 • Powered by OpenAI • Created by Akin S. Sokpah
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;