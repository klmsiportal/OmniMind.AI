import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { User, Cpu, Globe } from './Icons';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`group w-full text-gray-100 border-b border-black/10 dark:border-gray-900/50 ${isUser ? 'bg-transparent' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto flex gap-4 p-4 md:py-6">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isUser ? 'bg-gray-700' : 'bg-green-600'}`}>
            {isUser ? <User size={18} /> : <Cpu size={18} />}
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
            <div className="font-semibold text-sm mb-1 opacity-90">
                {isUser ? 'You' : 'OmniMind'}
            </div>
            
            {message.images && message.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    {message.images.map((img, idx) => (
                        <img 
                            key={idx} 
                            src={img} 
                            alt="Uploaded content" 
                            className="h-48 w-auto rounded-lg border border-gray-700 object-cover" 
                        />
                    ))}
                </div>
            )}

            <div className="markdown-body text-sm md:text-base text-gray-300 font-light leading-relaxed">
                <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            
            {/* Grounding Sources (Perplexity Style) */}
            {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-800">
                    <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Globe size={12} />
                        SOURCES
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {message.groundingSources.map((source, idx) => (
                            <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-xs text-blue-400 px-3 py-1.5 rounded-full transition-colors border border-gray-700"
                            >
                                <div className="max-w-[150px] truncate">{source.title}</div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
            
            {message.isStreaming && (
                <div className="mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;