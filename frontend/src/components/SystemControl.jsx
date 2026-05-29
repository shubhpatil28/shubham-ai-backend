import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Power, RotateCcw, Folder, Globe, Code, MessageSquare, AlertCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFetch } from '../config/api';

const SystemControl = ({ onLog }) => {
  const [logs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const addSystemLog = (text, status = 'success') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setSystemLogs(prev => [{ text, status, time }, ...prev.slice(0, 49)]);
  };

  const handleCommand = async (command, confirmed = false) => {
    setLoading(true);
    setPendingAction(null);
    onLog?.(`Initiating System Command: ${command.toUpperCase()}`, 'action');

    const { data, error } = await safeFetch('/api/system-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, confirmed }),
    });

    if (error) {
      addSystemLog(error, 'failed');
      onLog?.(error, 'error');
    } else if (data.status === 'pending') {
      setPendingAction({ command, message: data.message });
      addSystemLog(data.message, 'warning');
    } else {
      addSystemLog(data.message, data.status);
      onLog?.(data.message, data.status === 'success' ? 'response' : 'error');
    }
    setLoading(false);
  };

  const quickCommands = [
    { label: 'Chrome', icon: Globe, cmd: 'open chrome', color: 'text-blue-400' },
    { label: 'VS Code', icon: Code, cmd: 'open vscode', color: 'text-blue-500' },
    { label: 'WhatsApp', icon: MessageSquare, cmd: 'open whatsapp', color: 'text-emerald-400' },
    { label: 'Downloads', icon: Eye, cmd: 'open downloads', color: 'text-cyan-400' },
    { label: 'Documents', icon: Folder, cmd: 'open documents', color: 'text-indigo-400' },
  ];

  return (
    <div className="flex flex-col h-full p-6 gap-6 bg-slate-950/20 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-cyan-500/10 pb-4">
        <h2 className="text-sm font-mono font-bold text-cyan-300 tracking-[0.3em] uppercase flex items-center gap-2">
          <Terminal size={18} /> System Control Engine
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => handleCommand('restart')}
            className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-all"
            title="Restart PC"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            onClick={() => handleCommand('shutdown')}
            className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
            title="Shutdown PC"
          >
            <Power size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickCommands.map((c) => (
          <button
            key={c.label}
            onClick={() => handleCommand(c.cmd)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all group gap-2"
          >
            <c.icon size={24} className={`${c.color} group-hover:scale-110 transition-transform`} />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{c.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {pendingAction && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={20} />
              <p className="text-xs font-mono text-amber-200">{pendingAction.message}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPendingAction(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-[10px] font-mono hover:bg-slate-800"
              >
                CANCEL
              </button>
              <button 
                onClick={() => handleCommand(pendingAction.command, true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-mono font-bold"
              >
                CONFIRM_EXECUTION
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Execution Logs</span>
        </div>
        <div className="flex-1 bg-black/60 border border-slate-800 rounded-2xl p-4 font-mono overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-700 text-xs italic">
              Awaiting system trigger...
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3 text-[11px] leading-relaxed group">
                <span className="text-slate-600">[{log.time}]</span>
                <span className={
                  log.status === 'success' ? 'text-emerald-400' : 
                  log.status === 'warning' ? 'text-amber-400' : 
                  'text-rose-400'
                }>
                  {log.status === 'success' ? '>>' : '!!'} {log.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemControl;
