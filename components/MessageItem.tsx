import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { User, Cpu, Globe, Paperclip, Search, MessageSquare } from './Icons';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  // Custom renderer for code blocks to add copy button
  const components = {
    code({node, inline, className, children, ...props}: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      
      const handleCopy = () => {
         navigator.clipboard.writeText(codeString);
      };

      return !inline && match ? (
        <div className="relative my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
                <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-white transition-colors">
                    Copy
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <code className={className} {...props} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {children}
                </code>
            </div>
        </div>
      ) : (
        <code className="bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <div className={`group w-full text-gray-100 ${isUser ? 'bg-transparent' : 'bg-transparent'}`}>
      <div className="max-w-4xl mx-auto flex gap-4 p-4 md:py-8 px-6">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${isUser ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
            {isUser ? <User size={18} /> : <Cpu size={18} className="text-white" />}
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
            <div className="font-semibold text-sm mb-2 opacity-90 text-gray-300 flex items-center gap-2">
                {isUser ? 'You' : 'OmniMind'}
                {message.groundingSources && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-900">Research Mode</span>}
            </div>
            
            {message.images && message.images.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                    {message.images.map((img, idx) => (
                        <img 
                            key={idx} 
                            src={img} 
                            alt="Uploaded content" 
                            className="h-64 w-auto rounded-xl border border-gray-700 object-cover shadow-lg" 
                        />
                    ))}
                </div>
            )}

            <div className="markdown-body text-[15px] md:text-base text-gray-200 font-normal leading-7">
                <ReactMarkdown components={components}>{message.content}</ReactMarkdown>
            </div>
            
            {/* Grounding Sources */}
            {message.groundingSources && message.groundingSources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-800/60">
                    <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <Globe size={12} />
                        SOURCES
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {message.groundingSources.map((source, idx) => (
                            <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 bg-gray-800/40 hover:bg-gray-800 text-xs text-blue-400 px-3 py-2 rounded-lg transition-colors border border-gray-800"
                            >
                                <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] text-gray-300">
                                    {idx + 1}
                                </div>
                                <div className="truncate">{source.title}</div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
            
            {message.isStreaming && (
                <div className="mt-2 flex items-center gap-1.5 opacity-70">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;