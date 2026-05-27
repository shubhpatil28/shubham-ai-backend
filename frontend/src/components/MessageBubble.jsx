import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useTypingEffect from '../hooks/useTypingEffect';
import { Bot, User } from 'lucide-react';

const MessageBubble = ({ message, isUser, isNew = false }) => {
  // Only apply typing effect to new AI messages
  const shouldAnimate = !isUser && isNew;
  const { displayedText } = useTypingEffect(message, 15, shouldAnimate);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
          isUser 
            ? 'bg-slate-800 border-slate-600 text-slate-300' 
            : 'bg-[#00f3ff]/10 border-[#00f3ff]/40 text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.2)]'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <span className="text-[10px] font-mono text-slate-500 uppercase mb-1 tracking-wider">
            {isUser ? 'User' : 'Shubham AI'}
          </span>
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser 
              ? 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tr-none shadow-md' 
              : 'bg-[#00f3ff]/5 border border-[#00f3ff]/20 text-slate-200 rounded-tl-none shadow-[0_4px_15px_rgba(0,243,255,0.05)]'
          }`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">{message}</div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayedText}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
