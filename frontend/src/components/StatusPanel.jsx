import React, { useState, useEffect } from 'react';
import { Shield, Radio, Database, Cpu, Wifi } from 'lucide-react';

const StatusPanel = ({ memoriesCount = 0 }) => {
  const [status, setStatus] = useState({
    status: 'connecting',
    voice_active: false,
    database_connected: false,
    config_loaded: { openai_enabled: false, elevenlabs_enabled: false }
  });
  
  const [localIp, setLocalIp] = useState('127.0.0.1');

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, status: 'offline' }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Try to determine the local hostname/IP
  useEffect(() => {
    // A standard window location fallback for mobile sync instruction
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setLocalIp(window.location.hostname);
    } else {
      // Set a generic instruction
      setLocalIp('IP Address');
    }
  }, []);

  return (
    <div className="glass-panel p-5 flex flex-col h-[340px] justify-between">
      <div>
        <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-2 mb-4">
          <Shield size={14} className="text-[#00f3ff]" />
          <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#00f3ff]">CORE DIAGNOSTICS</h2>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3.5">
          {/* Main Status */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 flex items-center gap-1.5"><Cpu size={12} /> CORE OS:</span>
            <span className={`font-bold uppercase tracking-wider ${status.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
              {status.status}
            </span>
          </div>

          {/* Voice listener */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 flex items-center gap-1.5"><Radio size={12} /> MIC DAEMON:</span>
            <span className={`font-bold ${status.voice_active ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {status.voice_active ? 'BACKGROUND LISTENING' : 'ACTIVE WAKE WORD'}
            </span>
          </div>

          {/* Database */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 flex items-center gap-1.5"><Database size={12} /> SQL MEMORY:</span>
            <span className="text-emerald-400 font-bold">CONNECTED ({memoriesCount} FACTS)</span>
          </div>

          {/* API Integrations */}
          <div className="border-t border-slate-800/60 pt-3 mt-2">
            <span className="text-[9px] font-mono text-slate-500 block mb-1.5">INTEGRATED SYSTEMS</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className={`p-1.5 rounded border text-center ${status.config_loaded.openai_enabled ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                GPT-4o {status.config_loaded.openai_enabled ? 'READY' : 'OFFLINE'}
              </div>
              <div className={`p-1.5 rounded border text-center ${status.config_loaded.elevenlabs_enabled ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}>
                11LABS {status.config_loaded.elevenlabs_enabled ? 'READY' : 'LOCAL TTS'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile + PC Sync info */}
      <div className="mt-4 p-2.5 rounded bg-[#0066ff]/5 border border-[#0066ff]/20 flex items-start gap-2">
        <Wifi size={14} className="text-[#00d2ff] mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-[9px] font-mono font-bold text-[#00d2ff] block uppercase">Mobile Sync Channel</span>
          <p className="text-[8px] font-mono text-slate-400 leading-normal mt-0.5">
            Access this control node from your phone on the same Wi-Fi. Open your phone's browser and go to:
          </p>
          <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-1">
            http://[Your-PC-Local-IP]:5173
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
