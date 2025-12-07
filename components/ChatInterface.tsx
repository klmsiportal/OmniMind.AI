import React, { useState, useRef, useEffect } from 'react';
import { Send, ImageIcon, Paperclip, X, Search, Loader2, Globe } from './Icons';
import { Message, Role, ModelType, ChatSession } from '../types';
import { streamResponse, generateImage } from '../services/geminiService';
import MessageItem from './MessageItem';
import { MODEL_OPTIONS } from '../constants';

interface ChatInterfaceProps {
  currentSession: ChatSession;
  onUpdateSession: (updatedSession: ChatSession) => void;
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  isSearchEnabled: boolean;
  setIsSearchEnabled: (enabled: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentSession,
  onUpdateSession,
  selectedModel,
  setSelectedModel,
  isSearchEnabled,
  setIsSearchEnabled
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession.messages]);

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

    // Optimistic Update
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
    setIsLoading(true);

    try {
      if (selectedModel === ModelType.IMAGE) {
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
        // Handle Text/Chat/Search
        await streamResponse({
            model: selectedModel,
            prompt: userMessage.content,
            images: userMessage.images,
            useSearch: isSearchEnabled
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
        
        // Finalize streaming state
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
            content: "Sorry, I encountered an error processing your request. Please check your API key or try again.",
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
    <div className="flex flex-col h-full bg-gray-950 relative">
      {/* Top Bar - Model Selector */}
      <div className="sticky top-0 z-10 p-2 md:p-4 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 flex justify-center">
        <div className="glass-panel rounded-full p-1 flex items-center gap-1">
            {MODEL_OPTIONS.map((model) => (
                <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedModel === model.id 
                        ? 'bg-gray-800 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                >
                   <span>{model.icon}</span>
                   <span className="hidden md:inline">{model.name}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {currentSession.messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
               <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20">
                    <span className="text-3xl">✨</span>
               </div>
               <h2 className="text-2xl font-semibold text-white mb-2">OmniMind AI</h2>
               <p className="max-w-md mb-8">Capabilities include advanced reasoning, image generation, and real-time web search.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  <button onClick={() => setInput("Analyze the current trends in AI development.")} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800 text-sm text-left transition-colors">
                    "Analyze current AI trends..."
                  </button>
                  <button onClick={() => setInput("Generate a futuristic cyberpunk city.")} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800 text-sm text-left transition-colors">
                    "Generate a cyberpunk city..."
                  </button>
                  <button onClick={() => setInput("Explain quantum entanglement to a 5 year old.")} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800 text-sm text-left transition-colors">
                    "Explain quantum entanglement..."
                  </button>
                  <button onClick={() => setInput("Write a React component for a Navbar.")} className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-800 text-sm text-left transition-colors">
                    "Write React Navbar code..."
                  </button>
               </div>
           </div>
        ) : (
          currentSession.messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <div className="max-w-3xl mx-auto">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto p-2">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                            <img src={att} alt="attachment" className="w-16 h-16 rounded-md object-cover border border-gray-700" />
                            <button 
                                onClick={() => removeAttachment(idx)}
                                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex flex-col bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl focus-within:border-gray-600 transition-colors">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="w-full bg-transparent text-white p-4 pb-12 outline-none resize-none max-h-48 min-h-[60px]"
                    rows={1}
                />
                
                <div className="absolute bottom-2 left-2 flex items-center gap-2">
                     <button 
                        onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium ${isSearchEnabled ? 'bg-blue-900/30 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Enable Web Search"
                     >
                        <Globe size={18} />
                        <span className={isSearchEnabled ? 'inline' : 'hidden'}>Search On</span>
                     </button>

                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-white rounded-lg transition-colors"
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
                </div>

                <div className="absolute bottom-2 right-2">
                    <button
                        onClick={() => handleSubmit()}
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        className={`p-2 rounded-lg transition-all ${
                            (input.trim() || attachments.length > 0) && !isLoading
                             ? 'bg-white text-black hover:bg-gray-200' 
                             : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">
                OmniMind can make mistakes. Consider checking important information.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;