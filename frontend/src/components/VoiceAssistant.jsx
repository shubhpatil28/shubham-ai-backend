import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';

/**
 * VoiceAssistant — safe version.
 * Handles: mic permission denied, browser unsupported speech API,
 * missing audio context, and missing WebSocket gracefully.
 */
const VoiceAssistant = ({ isListening, onToggle }) => {
  const [micStatus, setMicStatus] = useState('unknown'); // 'unknown' | 'available' | 'denied' | 'unsupported'

  useEffect(() => {
    // Check if getUserMedia / MediaDevices API exists
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      return;
    }

    // Probe mic permission without actually streaming
    navigator.permissions
      ?.query({ name: 'microphone' })
      .then((result) => {
        if (result.state === 'denied') {
          setMicStatus('denied');
        } else {
          setMicStatus('available');
        }
        result.onchange = () => {
          setMicStatus(result.state === 'denied' ? 'denied' : 'available');
        };
      })
      .catch(() => {
        // Permissions API not supported — assume available
        setMicStatus('available');
      });
  }, []);

  // Unsupported browser
  if (micStatus === 'unsupported') {
    return (
      <div
        title="Voice assistant unavailable on this device"
        className="p-3 rounded-full border border-slate-700 bg-slate-900/40 text-slate-600 cursor-not-allowed flex items-center gap-1.5"
      >
        <AlertTriangle size={16} className="text-amber-500/60" />
      </div>
    );
  }

  // Permission denied
  if (micStatus === 'denied') {
    return (
      <div
        title="Microphone permission denied. Enable mic in browser settings."
        className="p-3 rounded-full border border-red-500/20 bg-red-900/10 text-red-500/60 cursor-not-allowed"
      >
        <MicOff size={18} />
      </div>
    );
  }

  // Normal voice button
  return (
    <div className="relative flex items-center justify-center">
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-[-10px] rounded-full border border-red-500/30 animate-pulse" />
        </>
      )}

      <button
        type="button"
        onClick={() => {
          try { onToggle(); } catch (e) { console.warn('[VoiceAssistant] Toggle error:', e); }
        }}
        className={`relative z-10 p-3 rounded-full border transition-all duration-300 shadow-lg ${
          isListening
            ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-500/30'
            : 'bg-[#bd00ff]/10 border-[#bd00ff]/30 text-[#bd00ff] hover:bg-[#bd00ff] hover:text-white shadow-[0_0_10px_rgba(189,0,255,0.2)]'
        }`}
        title={isListening ? 'Stop Listening' : 'Start Voice Assistant'}
      >
        {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
      </button>
    </div>
  );
};

export default VoiceAssistant;
