import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_LOGS = [
  { text: 'SHUBHAM AI CORE v3.5 initializing...', delay: 200, type: 'system' },
  { text: 'Loading neural pattern libraries...', delay: 600, type: 'info' },
  { text: 'Calibrating biometric interface vectors...', delay: 1000, type: 'info' },
  { text: '[OK] Groq inference engine connected', delay: 1400, type: 'ok' },
  { text: '[OK] Memory vault SQLite online', delay: 1700, type: 'ok' },
  { text: '[OK] WebSocket relay initialized', delay: 2000, type: 'ok' },
  { text: 'Running self-diagnostic protocols...', delay: 2300, type: 'info' },
  { text: '[OK] Voice daemon: standby mode', delay: 2600, type: 'ok' },
  { text: '[OK] Task scheduler: armed', delay: 2850, type: 'ok' },
  { text: '[OK] Site compiler: ready', delay: 3050, type: 'ok' },
  { text: 'Authenticating cognitive access token...', delay: 3300, type: 'warn' },
  { text: '[OK] Access granted — User: SHUBHAM', delay: 3600, type: 'ok' },
  { text: '━━━ ALL SYSTEMS ONLINE ━━━', delay: 3900, type: 'ready' },
];

const SYSTEMS = [
  { label: 'Neural Engine', delay: 300 },
  { label: 'Memory Vault', delay: 600 },
  { label: 'Voice Nexus', delay: 900 },
  { label: 'Data Cortex', delay: 1200 },
  { label: 'AI Reactor', delay: 1500 },
];

const BootScreen = ({ onComplete }) => {
  const [visibleLogs, setVisibleLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [systemsDone, setSystemsDone] = useState([]);
  const [glitch, setGlitch] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Log reveal
    BOOT_LOGS.forEach(({ text, delay, type }) => {
      setTimeout(() => setVisibleLogs(prev => [...prev, { text, type }]), delay);
    });

    // Progress bar
    const progressSteps = [0, 15, 30, 45, 60, 72, 84, 93, 100];
    progressSteps.forEach((val, i) => {
      setTimeout(() => setProgress(val), 300 + i * 450);
    });

    // Systems check
    SYSTEMS.forEach(({ label, delay }) => {
      setTimeout(() => setSystemsDone(prev => [...prev, label]), delay);
    });

    // Glitch effect
    setTimeout(() => setGlitch(true), 3700);
    setTimeout(() => setGlitch(false), 3850);

    // Complete
    setTimeout(() => {
      setDone(true);
      setTimeout(onComplete, 800);
    }, 4400);
  }, [onComplete]);

  const logColor = (type) => {
    if (type === 'ok') return 'text-emerald-400';
    if (type === 'warn') return 'text-amber-400';
    if (type === 'ready') return 'text-[#00f3ff] font-bold tracking-widest animate-pulse';
    if (type === 'system') return 'text-[#bd00ff]';
    return 'text-slate-400';
  };

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-[#020610] flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Scan lines */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,243,255,0.015) 2px, rgba(0,243,255,0.015) 4px)',
            }}
          />

          {/* Moving grid */}
          <motion.div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{
              backgroundImage: 'linear-gradient(rgba(0,243,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Corner decorations */}
          {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8 border-[#00f3ff]/40 pointer-events-none`}
              style={{
                borderTopWidth: pos.includes('top') ? 2 : 0,
                borderBottomWidth: pos.includes('bottom') ? 2 : 0,
                borderLeftWidth: pos.includes('left') ? 2 : 0,
                borderRightWidth: pos.includes('right') ? 2 : 0,
              }}
            />
          ))}

          {/* Top bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
            <span className="text-[10px] font-mono text-[#00f3ff]/60 tracking-[0.5em] uppercase">
              SHUBHAM AI / SECURE BOOT / v3.5.0
            </span>
            <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
          </div>

          {/* Central Orb */}
          <div className="relative mb-8 flex items-center justify-center">
            <motion.div
              className="w-32 h-32 rounded-full"
              animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: 'radial-gradient(circle, rgba(0,243,255,0.6) 0%, rgba(0,102,255,0.3) 50%, transparent 70%)',
                boxShadow: '0 0 60px rgba(0,243,255,0.5), 0 0 120px rgba(0,102,255,0.2)',
              }}
            />
            {/* Spinning rings */}
            <motion.div
              className="absolute w-44 h-44 rounded-full border border-[#00f3ff]/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ borderStyle: 'dashed' }}
            />
            <motion.div
              className="absolute w-56 h-56 rounded-full border border-[#bd00ff]/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              style={{ borderStyle: 'dashed' }}
            />
            {/* Center text */}
            <div className={`absolute font-mono text-center ${glitch ? 'translate-x-[2px] text-red-400' : ''} transition-none`}>
              <div className="text-[10px] text-slate-400 tracking-widest">JARVIS</div>
              <div className="text-xs font-bold text-[#00f3ff] tracking-wider">ONLINE</div>
            </div>
          </div>

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className={`text-center mb-6 ${glitch ? 'translate-x-[-3px]' : ''} transition-none`}
          >
            <h1 className="text-4xl font-black tracking-[0.4em] text-white uppercase mb-1"
              style={{ textShadow: '0 0 30px rgba(0,243,255,0.6)' }}>
              SHUBHAM AI
            </h1>
            <p className="text-[11px] font-mono text-[#00f3ff]/60 tracking-[0.6em]">
              NEURAL OPERATING SYSTEM — CLASSIFIED
            </p>
          </motion.div>

          {/* System checks */}
          <div className="flex gap-3 mb-6 flex-wrap justify-center">
            {SYSTEMS.map(({ label }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: systemsDone.includes(label) ? 1 : 0.3, scale: 1 }}
                className={`px-3 py-1 rounded-full border text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                  systemsDone.includes(label)
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5'
                    : 'border-slate-700 text-slate-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${systemsDone.includes(label) ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                {label}
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-96 max-w-[85vw] mb-4">
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
              <span>BOOT SEQUENCE</span>
              <span className="text-[#00f3ff]">{progress}%</span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #0066ff, #00f3ff)',
                  boxShadow: '0 0 10px #00f3ff',
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Terminal log */}
          <div className="w-96 max-w-[85vw] h-40 bg-black/60 border border-[#00f3ff]/10 rounded-xl p-3 overflow-hidden font-mono text-[10px] leading-5">
            {visibleLogs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={logColor(log.type)}
              >
                <span className="text-slate-600 mr-2">{'>'}</span>{log.text}
              </motion.div>
            ))}
            {/* Blinking cursor */}
            <span className="text-[#00f3ff] animate-pulse">█</span>
          </div>

          {/* Bottom status */}
          <div className="absolute bottom-6 flex items-center gap-6 text-[9px] font-mono text-slate-600">
            <span>SECURE KERNEL: v3.5.0</span>
            <span className="text-[#00f3ff]/40">|</span>
            <span>NEURAL THREADS: 256</span>
            <span className="text-[#00f3ff]/40">|</span>
            <span>ENCRYPTION: AES-256</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BootScreen;
