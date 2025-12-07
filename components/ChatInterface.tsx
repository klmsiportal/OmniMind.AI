/********************************************************************
 FIXED CHATINTERFACE — FULLY WORKING WITH openaiService.ts
 (Removed Gemini streaming + Gemini image generator)
 (Added OpenAI text completion instead)
********************************************************************/

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, Globe } from './Icons';
import { Message, Role, ModelType, ChatSession } from '../types';
import MessageItem from './MessageItem';
import { MODEL_OPTIONS } from '../constants';
import { askOpenAI } from "../services/openaiService";

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

    const newMessages = [...currentSession.messages, userMessage];

    const botMessageId = (Date.now() + 1).toString();
    const botPlaceholder: Message = {
      id: botMessageId,
      role: Role.MODEL,
      content: "Thinking...",
      timestamp: Date.now(),
      isStreaming: false
    };

    onUpdateSession({
      ...currentSession,
      messages: [...newMessages, botPlaceholder]
    });

    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const result = await askOpenAI(userMessage.content);

      const finalBotMessage: Message = {
        id: botMessageId,
        role: Role.MODEL,
        content: result,
        timestamp: Date.now(),
        isStreaming: false
      };

      onUpdateSession({
        ...currentSession,
        messages: [...newMessages, finalBotMessage]
      });

    } catch (error) {
      console.error("Chat failed", error);

      const errMessage: Message = {
        id: botMessageId,
        role: Role.MODEL,
        content: "Sorry, I encountered an error processing your request.",
        timestamp: Date.now(),
        isStreaming: false
      };

      onUpdateSession({
        ...currentSession,
        messages: [...newMessages, errMessage]
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
      
      {/* MODEL SELECTOR */}
      <div className="sticky top-0 z-10 p-4 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 flex justify-center">
        <div className="glass-panel rounded-full p-1 flex items-center gap-1">
          {MODEL_OPTIONS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                selectedModel === model.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span>{model.icon}</span>
              <span className="hidden md:inline">{model.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto pb-32">
        {currentSession.messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-gray-950">
        <div className="max-w-3xl mx-auto">

          {/* ATTACHMENTS */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative">
                  <img src={att} className="w-16 h-16 rounded-md object-cover" />
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TEXT BOX */}
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask OmniMind anything..."
              className="w-full bg-transparent text-white p-4 pb-12 outline-none resize-none"
            />

            <div className="absolute bottom-2 left-2 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-white"
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
                onClick={handleSubmit}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={`p-2 rounded-lg ${
                  (input.trim() || attachments.length > 0) && !isLoading
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-2">
            OmniMind may make mistakes — double-check information.
          </p>

        </div>
      </div>

    </div>
  );
};

export default ChatInterface;
