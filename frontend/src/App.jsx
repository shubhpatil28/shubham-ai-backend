import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, MessageSquare, Brain, Sun, Moon, Radio, Calendar, Cpu, Sparkles, MessageCircle } from 'lucide-react';
import JarvisCore from './components/JarvisCore';
import StatusPanel from './components/StatusPanel';
import Console from './components/Console';
import Planner from './components/Planner';
import SiteBuilder from './components/SiteBuilder';
import WhatsAppHub from './components/WhatsAppHub';
import MemoryVault from './components/MemoryVault';
import RouteIndicator from './components/RouteIndicator';
import AIOrb from './components/AIOrb';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const App = () => {
  const [activeTab, setActiveTab] = useState('core'); // core | whatsapp | memory | builder
  const [coreStatus, setCoreStatus] = useState('sleeping');
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [isBrowserListening, setIsBrowserListening] = useState(false);
  const chatEndRef = useRef(null);

  // Helper to add system diagnostic logs
  const addLog = (text, type = 'system') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { text, type, time }]);
  };

  const fetchMemoryCount = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setMemoriesCount(data.length || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/chat-history');
      if (res.ok) {
        const data = await res.json();
        // Extract plain text responses from JSON storage payloads
        const cleanHistory = data.map(item => {
          let text = item.message;
          try {
            const parsed = JSON.parse(item.message);
            if (parsed.response) text = parsed.response;
          } catch {}
          return { ...item, cleanText: text };
        });
        setChatHistory(cleanHistory);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Initialize and load dashboard details
  useEffect(() => {
    addLog("Shubham AI Neural Network active.", "system");
    addLog("Memory registers loaded.", "system");
    fetchMemoryCount();
    fetchChatHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle Text/Voice input processing
  const processInput = async (messageText) => {
    if (!messageText.trim()) return;

    setCoreStatus('processing');
    addLog(`User Command: "${messageText}"`, 'action');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`AI Response: "${data.response}"`, 'response');
        if (data.action) {
          addLog(`Automation Triggered: [${data.action.type}] ${JSON.stringify(data.action)}`, 'system');
        }
        if (data.action_result) {
          addLog(`Result: ${data.action_result}`, 'response');
        }
        
        setCoreStatus('speaking');
        fetchMemoryCount();
        fetchChatHistory();

        // Switch to corresponding tab if action dictates it to make it dynamic!
        if (data.action) {
          const actType = data.action.type;
          if (actType.startsWith('whatsapp') || actType === 'whatsapp_schedule') {
            setActiveTab('whatsapp');
          } else if (actType.startsWith('save_memory') || actType === 'forget_memory') {
            setActiveTab('memory');
          } else if (actType === 'generate_site') {
            setActiveTab('builder');
          }
        }

        setTimeout(() => {
          setCoreStatus('sleeping');
        }, 4000);
      } else {
        setCoreStatus('sleeping');
        addLog("API Error in transmission.", "error");
      }
    } catch (error) {
      console.error(error);
      setCoreStatus('sleeping');
      addLog("Failed to reach server backend node.", "error");
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    processInput(inputText);
    setInputText('');
  };

  const toggleVoiceListen = () => {
    setIsBrowserListening(!isBrowserListening);
    socket.emit('toggle_listening', { enable: !isBrowserListening });
    if (!isBrowserListening) {
      addLog("Remote mic listening triggered via WebSocket.", "system");
    } else {
      addLog("Remote mic listening disabled.", "system");
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between">
      {/* HUD Header */}
      <header className="border-b border-[#00f3ff]/10 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f3ff] animate-ping" />
          <h1 className="text-sm font-mono font-extrabold tracking-[0.4em] text-white">
            SHUBHAM AI <span className="text-[#00f3ff] font-light">OS_V3</span>
          </h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border border-slate-800 bg-slate-950/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('core')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 ${
              activeTab === 'core' ? 'bg-[#00f3ff]/10 text-[#00f3ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio size={12} /> Reactor Core
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 ${
              activeTab === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle size={12} /> WhatsApp Hub
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 ${
              activeTab === 'memory' ? 'bg-[#bd00ff]/10 text-[#bd00ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain size={12} /> Memory Vault
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center gap-1.5 ${
              activeTab === 'builder' ? 'bg-cyan-400/10 text-cyan-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu size={12} /> Web Builder
          </button>
        </div>

        <div className="flex items-center gap-6 font-mono text-[10px] text-slate-400">
          <div>COGNITIVE LINK: <span className="text-emerald-400 font-bold">STABLE</span></div>
          <div>DATE: {new Date().toLocaleDateString()}</div>
        </div>
      </header>

      {/* Main Workspace Area based on activeTab */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'core' && (
          <main className="dashboard-grid h-full p-6 gap-6">
            {/* Left Diagnostics Console */}
            <section className="flex flex-col gap-5 justify-between h-[75vh]">
              <StatusPanel memoriesCount={memoriesCount} />
              <Console logs={logs} />
            </section>

            {/* Center Circular Core & Chat Panel */}
            <section className="glass-panel flex flex-col justify-between p-6 h-[75vh]">
              {/* Reactor Core */}
              <div className="flex-1 flex items-center justify-center">
                <AIOrb />
              </div>

              {/* Interactive Dialogue Log */}
              <div className="h-[220px] flex flex-col border border-slate-800/40 bg-slate-950/20 rounded-xl p-4 mt-4">
                <span className="text-[9px] font-mono text-slate-500 block mb-2 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={10} /> dialogue interface
                </span>
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-3">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-slate-500 font-mono text-xs py-8">
                      INITIATE SYSTEM LOG OR GREET WAKE WORD "HEY BUDDY"
                    </div>
                  ) : (
                    chatHistory.map((chat, index) => {
                      const isUser = chat.sender === 'user';
                      return (
                        <div 
                          key={index} 
                          className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <span className="text-[8px] font-mono text-slate-500 uppercase mb-0.5">
                            {isUser ? 'User' : 'Buddy'}
                          </span>
                          <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                            isUser 
                              ? 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tr-none' 
                              : 'bg-[#00f3ff]/5 border border-[#00f3ff]/20 text-[#00f3ff] rounded-tl-none'
                          }`}>
                            {chat.cleanText}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Route Indicator */}
                <RouteIndicator message={inputText} />

                {/* Input form */}
                <form onSubmit={handleSendText} className="flex gap-2 items-center mt-1">
                  <button 
                    type="button"
                    onClick={toggleVoiceListen}
                    className={`p-2 rounded-lg border transition-all ${
                      isBrowserListening 
                        ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
                        : 'bg-[#bd00ff]/10 border-[#bd00ff]/30 text-[#bd00ff] hover:bg-[#bd00ff] hover:text-white'
                    }`}
                  >
                    <Mic size={16} />
                  </button>
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Transmit query text or click mic..."
                    className="flex-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40"
                  />
                  <button 
                    type="submit"
                    className="p-2 rounded-lg bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-slate-950 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </section>

            {/* Right Planner Modules */}
            <section className="flex flex-col gap-5 justify-between h-[75vh]">
              <Planner />
            </section>
          </main>
        )}

        {activeTab === 'whatsapp' && <WhatsAppHub onLog={addLog} />}
        {activeTab === 'memory' && <MemoryVault onLog={addLog} />}
        {activeTab === 'builder' && <SiteBuilder onLog={addLog} />}
      </div>

      {/* Memory Register footer */}
      <footer className="bg-slate-950/20 border-t border-[#00f3ff]/5 py-2.5 px-6 flex items-center justify-between text-[9px] font-mono text-slate-500 z-10">
        <div className="flex items-center gap-2">
          <Brain size={12} className="text-[#00f3ff]" />
          <span>COGNITIVE FACTS LOADED: {memoriesCount}</span>
        </div>
        <div>
          SYSTEM STATUS: <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
        <span>BUDDY COMPANION V3.5</span>
      </footer>
    </div>
  );
};

export default App;
