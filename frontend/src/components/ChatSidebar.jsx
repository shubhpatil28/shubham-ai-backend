import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Search, X } from 'lucide-react';

const ChatSidebar = ({ chatHistory, onNewChat, onDeleteChat, isOpen, toggleSidebar }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // We can group history by sessions if the backend supports it, 
  // but for now we filter the messages in history.
  const filteredChats = chatHistory.filter(chat => 
    chat.cleanText && chat.cleanText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-950/95 border-r border-[#00f3ff]/10 backdrop-blur-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col md:relative md:translate-x-0`}>
      {/* Header */}
      <div className="p-4 border-b border-[#00f3ff]/10 flex items-center justify-between">
        <h2 className="text-sm font-mono font-bold text-[#00f3ff] uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={16} /> Sessions
        </h2>
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-lg border border-[#00f3ff]/30 bg-[#00f3ff]/5 text-[#00f3ff] hover:bg-[#00f3ff]/15 hover:border-[#00f3ff]/50 transition-all flex items-center justify-center gap-2 text-sm font-mono uppercase tracking-wider shadow-[0_0_10px_rgba(0,243,255,0.05)] hover:shadow-[0_0_15px_rgba(0,243,255,0.15)]"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text"
            placeholder="Search memory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#00f3ff]/40 transition-colors placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="text-center text-slate-600 text-xs font-mono py-8">
            NO SESSIONS FOUND
          </div>
        ) : (
          filteredChats.map((chat, idx) => (
            <div 
              key={idx} 
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-700/50"
            >
              <div className="truncate text-xs text-slate-300 flex-1 pr-2">
                {chat.cleanText.substring(0, 35)}...
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                title="Delete Session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#00f3ff]/10">
        <div className="text-[10px] font-mono text-slate-500 flex justify-between">
          <span>STORAGE: LOCAL</span>
          <span className="text-emerald-500">SYNCED</span>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
