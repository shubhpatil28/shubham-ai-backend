import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
document.title = "SHUBHAM_OS_BUILD_8592F6C";
import { Send, MessageSquare, Brain, Radio, Calendar, Cpu, Sparkles, MessageCircle, Menu, FileText, ChevronRight, Database, Zap, Search, ShieldAlert, Mic2, Globe, Activity, TrendingUp, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

// ── Core config ──────────────────────────────────────────────
import { API_URL, safeFetch } from './config/api';
import { AGENTS, TASK_STAGES } from './config/agents';

// ── Always-needed components (eager) ────────────────────────
import ErrorBoundary from './components/ErrorBoundary';
import GlassLoader from './components/GlassLoader';
import FallbackCard from './components/FallbackCard';
import AgentOrb from './components/AgentOrb';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import VoiceAssistant from './components/VoiceAssistant';
import StatusPanel from './components/StatusPanel';
import Console from './components/Console';
import BootScreen from './components/BootScreen';
import NeuralBackground from './components/NeuralBackground';
import AgentNetwork from './components/AgentNetwork';
import TaskPipeline from './components/TaskPipeline';
import HolographicNotification from './components/HolographicNotification';
import IntelligenceFeed from './components/IntelligenceFeed';
import WorldHUD from './components/WorldHUD';

// ── Lazy-loaded tab modules ──────────────────────────────────
const ChatSidebar = lazy(() => import('./components/ChatSidebar').catch(() => ({ default: () => <FallbackCard name="Chat Sidebar" /> })));
const Planner     = lazy(() => import('./components/Planner').catch(() => ({ default: () => <FallbackCard name="Planner" /> })));
const WhatsAppHub = lazy(() => import('./components/WhatsAppHub').catch(() => ({ default: () => <FallbackCard name="WhatsApp Hub" /> })));
const MemoryVault = lazy(() => import('./components/MemoryVault').catch(() => ({ default: () => <FallbackCard name="Memory Vault" /> })));
const DataHub     = lazy(() => import('./components/DataHub').catch(() => ({ default: () => <FallbackCard name="Data Hub" /> })));
const SystemControl = lazy(() => import('./components/SystemControl').catch(() => ({ default: () => <FallbackCard name="System Control" /> })));

// ── Safe WebSocket init ──────────────────────────────────────
let socket = null;
try {
  socket = io(API_URL, { transports: ['websocket', 'polling'], timeout: 5000 });
} catch (e) {
  console.warn('[App] Socket.IO connection failed (non-fatal):', e.message);
}

// ── App ──────────────────────────────────────────────────────
const App = () => {
  console.log("APP_V5_RUNTIME_LOADED");
  console.log("APP_COMPONENT_MOUNTED", "App.jsx");
  const [isBooted, setIsBooted] = useState(false);
  const [activeTab, setActiveTab] = useState('core');
  
  // OS Consciousness States
  const [activeAgentId, setActiveAgentId] = useState('nexus');
  const [communicatingWith, setCommunicatingWith] = useState(null);
  const [currentStage, setCurrentStage] = useState('queued');
  const [activeTaskName, setActiveTaskName] = useState('SYSTEM_IDLE');
  const [coreState, setCoreState] = useState('idle');
  const [notifications, setNotifications] = useState([]);
  
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [isBrowserListening, setIsBrowserListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);

  const addLog = (text, type = 'system') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setLogs((prev) => [...prev.slice(-150), { text, type, time }]);
  };

  const addNotification = (note) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...note, id }]);
    setTimeout(() => dismissNotification(id), 8000);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchMemoryCount = async () => {
    const { data } = await safeFetch('/api/memory');
    if (Array.isArray(data)) setMemoriesCount(data.length);
  };

  const fetchChatHistory = async () => {
    const { data } = await safeFetch('/api/chat-history');
    if (!Array.isArray(data)) return;
    const cleanHistory = data.map((item) => {
      let text = item?.message || '';
      try {
        const parsed = JSON.parse(text);
        if (parsed?.response) text = parsed.response;
      } catch (_) {}
      return { ...item, cleanText: text };
    });
    setChatHistory(cleanHistory);
  };

  // ── Consciousness Engine ──
  useEffect(() => {
    if (!isBooted) return;
    
    addLog('Autonomous Intelligence Network: ONLINE', 'system');
    addLog('Establishing satellite internet links...', 'action');
    fetchMemoryCount();
    fetchChatHistory();

    // Background Autonomous Events
    const eventsLoop = setInterval(() => {
      if (Math.random() > 0.7) {
        const agentPool = ['oracle', 'sentinel', 'echo', 'forge'];
        const selectedId = agentPool[Math.floor(Math.random() * agentPool.length)];
        const agent = AGENTS[selectedId?.toUpperCase()];
        
        const ideas = {
          oracle: { title: 'Market Insight', msg: 'Detected high-volatility trend in Solana ecosystem.', priority: 'normal' },
          sentinel: { title: 'Security Ping', msg: 'External probe blocked at node 0x2A.', priority: 'high' },
          echo: { title: 'Memory Evolution', msg: 'Contextual relationship mapped between two knowledge nodes.', priority: 'normal' },
          forge: { title: 'Optimization', msg: 'Backend kernel updated for 15% faster latency.', priority: 'normal' }
        };

        const note = ideas[selectedId];
        addNotification({ ...note, agentId: selectedId });
        addLog(`[${agent.name}] ${note.msg}`, 'system');
      }
    }, 25000);

    return () => clearInterval(eventsLoop);
  }, [isBooted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const simulateTaskPipeline = async (type, task) => {
    setActiveTaskName(task.toUpperCase().replace(/\s/g, '_'));
    const stages = ['queued', 'analyzing', 'planning', 'generating', 'validating', 'completed'];
    let targetAgent = 'nexus';
    if (type.includes('site') || type.includes('code')) targetAgent = 'forge';
    else if (type.includes('memory') || type.includes('forget')) targetAgent = 'echo';
    else if (type.includes('data') || type.includes('research')) targetAgent = 'oracle';
    else if (type.includes('system') || type.includes('os')) targetAgent = 'terminus';

    addLog(`Task Routed to Agent ${targetAgent.toUpperCase()}`, 'system');
    for (const stage of stages) {
      setCurrentStage(stage);
      setCommunicatingWith(stage === 'planning' ? 'nexus' : targetAgent);
      setActiveAgentId(stage === 'generating' ? targetAgent : 'nexus');
      await new Promise(r => setTimeout(r, stage === 'generating' ? 3000 : 1500));
    }
    addLog(`[OS] ROUTING_PATCH_V4: ACTIVE`, 'system');
    addLog(`Task ${task} completed by autonomous swarm.`, 'response');
    setTimeout(() => {
      setCurrentStage('queued');
      setActiveAgentId('nexus');
      setCommunicatingWith(null);
      setActiveTaskName('SYSTEM_IDLE');
    }, 5000);
  };

  const processInput = async (messageText) => {
    console.log("PROCESS_INPUT_CALLED", messageText);
    if (!messageText?.trim()) return;
    
    // ── STEP 1: NORMALIZE INPUT ──
    const normalizedCommand = messageText
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    const systemPatterns = [
      /^open chrome$/,
      /^open vscode$/,
      /^open whatsapp$/,
      /^open downloads$/,
      /^open documents$/,
      /^create folder\b/,
      /^shutdown\b/,
      /^restart\b/,
      /^shutdown pc$/,
      /^restart pc$/
    ];

    console.log("NORMALIZED_COMMAND", normalizedCommand);
    const isSystemCommand = systemPatterns.some(pattern => pattern.test(normalizedCommand));
    console.log("IS_SYSTEM_COMMAND", isSystemCommand);

    console.log("ACTIVE_RUNTIME_PATCH: v4_CinematicApp");
    console.log("INPUT:", messageText);
    console.log("IS_SYSTEM:", isSystemCommand);

    if (isSystemCommand) {
      console.log("ROUTING_TO_SYSTEM_COMMAND");
      console.log("ROUTED_TO_SYSTEM_COMMAND_V4");
      addLog(`[MATCH] SYSTEM_COMMAND: ${normalizedCommand}`, 'system');
      addLog(`[ACTION] DISPATCHING TO LOCAL AGENT...`, 'action');
      
      setActiveTab('system');
      setActiveAgentId('terminus');

      console.log("SYSTEM_REQUEST_SOURCE", window.location.pathname);
      const { data, error } = await safeFetch('/api/system-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: normalizedCommand }),
      });

      if (error) {
        addLog(`[REELAY_ERROR] ${error}`, 'error');
        setCoreState('warning');
      } else {
        const isSuccess = data.status === 'success' || data.status === 'pending';
        addLog(data.message, isSuccess ? 'response' : 'error');
        if (data.status === 'failed') setCoreState('warning');
      }
      return;
    }

    // ── STEP 2: FALLBACK TO CHAT ──
    console.log("ROUTING_TO_CHAT");
    console.log("ROUTED_TO_CHAT");
    setCoreState('processing');
    addLog(`Direct Link Command: "${messageText}"`, 'action');
    
    console.log("CHAT_REQUEST_SOURCE", window.location.pathname);
    const { data, error } = await safeFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageText }),
    });

    if (error) {
      setCoreState('warning');
      addLog(error, 'error');
      setTimeout(() => setCoreState('idle'), 3000);
      return;
    }
    
    if (data?.action) simulateTaskPipeline(data.action.type, messageText);
    else setActiveAgentId('nexus');
    
    setCoreState('speaking');
    fetchMemoryCount();
    fetchChatHistory();
    setTimeout(() => setCoreState('idle'), 4000);
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    processInput(inputText);
    setInputText('');
  };

  const toggleVoiceListen = () => {
    const next = !isBrowserListening;
    setIsBrowserListening(next);
    setCoreState(next ? 'listening' : 'idle');
    setActiveAgentId(next ? 'pulse' : 'nexus');
    try { socket?.emit('toggle_listening', { enable: next }); } catch (_) {}
    addLog(next ? 'Agent PULSE established voice tether.' : 'PULSE standby. Control: NEXUS.', 'system');
  };

  const handleNewChat = () => {
    setChatHistory([]);
    addLog('Neural chat buffer purged manually.', 'system');
  };

  const TabModule = ({ name, children }) => (
    <ErrorBoundary name={name} inline>
      <Suspense fallback={<GlassLoader label={`ESTABLISHING ${name.toUpperCase()} TETHER...`} size="lg" />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <div className="relative min-h-screen bg-[#020308] text-slate-100 font-sans selection:bg-[#00f3ff]/30 selection:text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {!isBooted ? (
          <BootScreen key="boot" onComplete={() => setIsBooted(true)} />
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen w-full relative overflow-hidden crt-overlay"
          >
            <NeuralBackground />
            <HolographicNotification notifications={notifications} onDismiss={dismissNotification} />

            {/* Cinematic Sidebar */}
            <TabModule name="Chat Sidebar">
              <ChatSidebar
                chatHistory={chatHistory}
                onNewChat={handleNewChat}
                isOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </TabModule>

            <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
              {/* ── Autonomous Internet OS Header ── */}
              <header className="px-8 py-5 flex items-center justify-between border-b border-[#00f3ff]/5 bg-black/60 backdrop-blur-3xl z-30">
                <div className="flex items-center gap-6">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-[#00f3ff]"><Menu /></button>
                  <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-[0.6em] text-white flex items-center gap-4">
                      <div className="relative">
                         <div className="w-3 h-3 rounded-full bg-[#00f3ff]" />
                         <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#00f3ff] animate-ping" />
                      </div>
                      SHUBHAM AI <span className="font-light text-[#00f3ff]/60 text-xs tracking-[1em]">INTERNET_CORE</span>
                      <span className="text-[10px] text-pink-500 font-mono font-bold">[DEBUG] APP_V5_RUNTIME_LOADED</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                         <Globe size={12} /> WORLD ACCESS: GRANTED
                       </span>
                       <span className="text-slate-800">|</span>
                       <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                         SATELLITE SYNC: ACTIVE
                       </span>
                    </div>
                  </div>
                </div>

                {/* Agent Status Cluster */}
                <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                   {Object.values(AGENTS).map(agent => (
                     <motion.div 
                        key={agent.id}
                        animate={{ 
                          opacity: activeAgentId === agent.id ? 1 : 0.3,
                          scale: activeAgentId === agent.id ? 1.1 : 1
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center relative cursor-default"
                        style={{ color: agent.color }}
                     >
                        <agent.icon size={16} />
                        {activeAgentId === agent.id && (
                          <motion.div layoutId="activeAgent" className="absolute -bottom-1 w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                        )}
                     </motion.div>
                   ))}
                </div>

                <div className="hidden xl:flex items-center gap-1.5 p-1.5 bg-black/40 rounded-xl border border-white/5">
                    {[
                      { id: 'core',     icon: <Cpu size={14} />,            label: 'Network' },
                      { id: 'whatsapp', icon: <MessageCircle size={14} />,  label: 'Nexus' },
                      { id: 'system',   icon: <Terminal size={14} />,        label: 'Terminus' },
                      { id: 'memory',   icon: <Brain size={14} />,           label: 'Vault' },
                      { id: 'data',     icon: <TrendingUp size={14} />,     label: 'Oracle' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-all ${
                          activeTab === tab.id ? 'bg-[#00f3ff] text-black shadow-[0_0_30px_rgba(0,243,255,0.4)]' : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        {tab.icon}
                        <span className="hidden lg:inline">{tab.label}</span>
                      </button>
                    ))}
                </div>
              </header>

              {/* ── Neural Global Workspace ── */}
              <div className="flex-1 p-6 relative overflow-y-auto custom-scrollbar">
                {/* Visual Depth Layers (Digital Fog) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#00f3ff]/05 to-transparent pointer-events-none -z-10" />
                <div className="absolute top-1/4 -left-20 w-64 h-64 bg-purple-500/10 blur-[120px] pointer-events-none" />

                <AnimatePresence mode="wait">
                  {activeTab === 'core' && (
                    <motion.div 
                      key="core"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="dashboard-grid h-full"
                    >
                      {/* Left HUD Panel - Awareness & Network */}
                      <div className="flex flex-col gap-6 h-full p-2">
                        <AgentNetwork activeAgentId={activeAgentId} communicatingWith={communicatingWith} />
                        <WorldHUD />
                        <Console logs={logs} />
                      </div>

                      {/* Center Agent Core */}
                      <div className="flex flex-col h-full glass-panel border-[#00f3ff]/10">
                        <div className="flex-1 flex items-center justify-center p-8 relative">
                           <AgentOrb agentId={activeAgentId} state={coreState} isListening={isBrowserListening} />
                        </div>

                        {/* Dialogue/Thought Stream Overlay */}
                        <div className="h-[300px] m-4 bg-black/60 rounded-3xl border border-white/5 flex flex-col p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/40 to-transparent" />
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[10px] font-mono text-cyan-400 font-black uppercase tracking-[0.3em]">Consciousness Stream</span>
                             </div>
                             <div className="flex items-center gap-4 text-[8px] font-mono text-slate-500 uppercase">
                                <span>Satellite: ACTIVE</span>
                                <span>Buffer: CLEAR</span>
                             </div>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                            {chatHistory.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                <Sparkles size={40} className="mb-4 text-cyan-400 animate-bounce" />
                                <p className="text-xs font-mono tracking-[0.2em] uppercase leading-relaxed">
                                  Global Intelligence Swarm ready.<br/>Initiate command or observe autonomous flow.
                                </p>
                              </div>
                            ) : (
                              chatHistory.map((chat, i) => (
                                <MessageBubble key={i} message={chat.cleanText} isUser={chat.sender === 'user'} isNew={i === chatHistory.length - 1} themeColor={AGENTS[activeAgentId?.toUpperCase()]?.color} />
                              ))
                            )}
                            {coreState === 'processing' && <TypingIndicator />}
                            <div ref={chatEndRef} />
                          </div>

                          <form onSubmit={handleSendText} className="mt-6 flex gap-4 items-center">
                            <VoiceAssistant isListening={isBrowserListening} onToggle={toggleVoiceListen} />
                            <div className="flex-1 relative group">
                              <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={`SIGNAL TO ${activeAgentId.toUpperCase()}...`}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                              />
                            </div>
                            <button type="submit" className="p-4 bg-[#00f3ff] rounded-2xl text-black hover:bg-white shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center">
                               <Send size={20} />
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Right HUD Panel - Intelligence & Planning */}
                      <div className="flex flex-col gap-6 h-full p-2">
                        <IntelligenceFeed />
                        <TaskPipeline currentStage={currentStage} activeAgentId={activeAgentId} taskName={activeTaskName} />
                        <TabModule name="Planner">
                           <Planner />
                        </TabModule>
                      </div>
                    </motion.div>
                  )}

                  {activeTab !== 'core' && (
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full pb-20">
                        {activeTab === 'whatsapp' && <TabModule name="WhatsApp Hub"><WhatsAppHub onLog={addLog} /></TabModule>}
                        {activeTab === 'system' && <TabModule name="System Control"><SystemControl onLog={addLog} /></TabModule>}
                        {activeTab === 'memory' && <TabModule name="Memory Vault"><MemoryVault onLog={addLog} /></TabModule>}
                        {activeTab === 'data' && <TabModule name="Data Hub"><DataHub onLog={addLog} /></TabModule>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Global OS Footer ── */}
              <footer className="px-8 py-3.5 border-t border-white/5 bg-black/90 flex items-center justify-between text-[10px] font-mono text-slate-500 relative z-40 backdrop-blur-3xl">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    OS CIVILIZATION: ONLINE
                  </div>
                  <div className="hidden sm:flex items-center gap-6">
                    <span className="flex items-center gap-2"><Globe size={12} /> NODES: 142 ACTIVE</span>
                    <span className="flex items-center gap-2"><Activity size={12} /> TRAFFIC: 1.2 GB/S</span>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                      <Zap size={12} className="text-[#00f3ff]" />
                      <span className="text-white font-bold">MODE: AUTONOMOUS</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-cyan-400" />
                      <span className="text-cyan-400 animate-pulse uppercase tracking-[0.4em] font-black">Scanning Internet Grids...</span>
                   </div>
                </div>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
