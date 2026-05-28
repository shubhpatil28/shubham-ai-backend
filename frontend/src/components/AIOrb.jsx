import React from 'react';
import { motion } from 'framer-motion';

/**
 * AIOrb - Cinematic, holographic AI core orb.
 * Reactive to AI states: sleeping, listening, processing, speaking, warning, offline.
 */
const AIOrb = ({ state = 'sleeping' }) => {
  const stateConfigs = {
    sleeping: {
      color: '#00f3ff',
      glowColor: 'rgba(0, 243, 255, 0.4)',
      pulseSpeed: 4,
      rotationSpeed: 20,
      label: 'SYSTEM STANDBY',
    },
    listening: {
      color: '#bd00ff',
      glowColor: 'rgba(189, 0, 255, 0.6)',
      pulseSpeed: 1.5,
      rotationSpeed: 10,
      label: 'LISTENING...',
    },
    processing: {
      color: '#ff0055',
      glowColor: 'rgba(255, 0, 85, 0.7)',
      pulseSpeed: 0.8,
      rotationSpeed: 4,
      label: 'THINKING...',
    },
    speaking: {
      color: '#00ff66',
      glowColor: 'rgba(0, 255, 102, 0.6)',
      pulseSpeed: 1.2,
      rotationSpeed: 15,
      label: 'TRANSMITTING',
    },
    warning: {
      color: '#ff9900',
      glowColor: 'rgba(255, 153, 0, 0.6)',
      pulseSpeed: 0.5,
      rotationSpeed: 2,
      label: 'CORE ALERT',
    },
    offline: {
      color: '#666666',
      glowColor: 'rgba(102, 102, 102, 0.3)',
      pulseSpeed: 8,
      rotationSpeed: 60,
      label: 'CORE OFFLINE',
    },
  };

  const config = stateConfigs[state] || stateConfigs.sleeping;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Container with dynamic glow */}
      <motion.div
        animate={{
          boxShadow: [
            `0 0 40px ${config.glowColor}`,
            `0 0 80px ${config.glowColor}`,
            `0 0 40px ${config.glowColor}`,
          ],
        }}
        transition={{
          duration: config.pulseSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-64 h-64 rounded-full flex items-center justify-center"
      >
        {/* Core background aura */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: config.color }}
        />

        {/* Outer segmented ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: config.rotationSpeed, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-current opacity-30"
          style={{ color: config.color, borderStyle: 'dashed', borderDasharray: '20, 15' }}
        />

        {/* Middle ring with counter rotation */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: config.rotationSpeed * 0.7, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border border-transparent border-l-current opacity-40"
          style={{ color: config.color, borderStyle: 'dotted', borderDasharray: '5, 10' }}
        />

        {/* Inner neural ring */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-10 rounded-full border-2 border-current opacity-50"
          style={{ color: config.color }}
        />

        {/* The Core Orb */}
        <motion.div
          animate={{
            scale: state === 'processing' ? [1, 0.95, 1.05, 1] : [1, 1.02, 1],
          }}
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-black shadow-inner"
          style={{
            boxShadow: `inset 0 0 20px ${config.color}44`,
          }}
        >
          {/* Internal energy particles simulation */}
          <div className="absolute inset-0 opacity-40">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${config.color}, transparent)`,
              }}
            />
          </div>

          {/* Central light source */}
          <div 
            className="w-8 h-8 rounded-full blur-md opacity-80"
            style={{ backgroundColor: config.color, boxShadow: `0 0 20px ${config.color}` }}
          />
        </motion.div>

        {/* Reactive ripple waves (for speaking/listening) */}
        {(state === 'speaking' || state === 'listening') && (
           <motion.div
             initial={{ scale: 0.8, opacity: 0.5 }}
             animate={{ scale: 1.8, opacity: 0 }}
             transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
             className="absolute inset-0 rounded-full border border-current"
             style={{ color: config.color }}
           />
        )}
      </motion.div>

      {/* OS Labels */}
      <div className="mt-12 text-center pointer-events-none">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <span 
            className="text-[10px] font-mono font-black tracking-[0.6em] mb-1 opacity-50 uppercase"
            style={{ color: config.color }}
          >
            Core Status
          </span>
          <span 
            className="text-lg font-mono font-bold tracking-[0.2em] mb-2 uppercase"
            style={{ color: config.color, textShadow: `0 0 10px ${config.color}66` }}
          >
            {config.label}
          </span>
          
          {/* Pulse bar */}
          <div className="w-16 h-[2px] bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
               animate={{ x: [-64, 64] }}
               transition={{ duration: config.pulseSpeed, repeat: Infinity, ease: 'linear' }}
               className="w-full h-full"
               style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
             />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIOrb;
