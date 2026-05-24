import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Ensure it connects to Flask backend

export default function AIOrb() {
  const [voiceState, setVoiceState] = useState('idle'); // idle, listening, processing, transcript, speaking
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Orb connected to WebSocket server');
    });

    socket.on('voice_state', (data) => {
      if (data.state) setVoiceState(data.state);
      if (data.text) setTranscript(data.text);
    });

    return () => {
      socket.off('connect');
      socket.off('voice_state');
    };
  }, []);

  // Web Audio API for volume reactivity
  useEffect(() => {
    if (voiceState === 'listening') {
      const startAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.fftSize = 256;
          
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          
          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArrayRef.current[i];
            }
            const avg = sum / bufferLength;
            // Normalize volume 0 to 1
            const normalized = Math.min(avg / 128, 1);
            setVolume(normalized);
            rafIdRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (err) {
          console.warn('Microphone access denied or unavailable for visualizer:', err);
        }
      };
      startAudio();
    } else {
      // Cleanup audio when not listening
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (sourceRef.current) {
        sourceRef.current.mediaStream.getTracks().forEach(t => t.stop());
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current) audioContextRef.current.close();
      setVolume(0);
    }
    
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [voiceState]);

  const getOrbStateStyles = () => {
    switch (voiceState) {
      case 'listening':
        // Base scale 1.0, plus up to 0.4 based on volume
        const dynamicScale = 1.0 + (volume * 0.4);
        return {
          scale: dynamicScale,
          boxShadow: `0px 0px ${20 + (volume * 40)}px #0ea5e9`,
          borderColor: '#38bdf8'
        };
      case 'processing':
        return {
          rotate: [0, 360],
          scale: 1.1,
          boxShadow: '0px 0px 40px #a855f7',
          borderColor: '#c084fc',
          borderRadius: ['50%', '30%', '50%']
        };
      case 'speaking':
        return {
          scale: [1, 1.15, 1, 1.2, 1],
          boxShadow: ['0px 0px 30px #10b981', '0px 0px 80px #10b981', '0px 0px 30px #10b981'],
          borderColor: '#34d399'
        };
      default: // idle
        return {
          scale: 1,
          boxShadow: '0px 0px 10px rgba(14, 165, 233, 0.3)',
          borderColor: 'rgba(14, 165, 233, 0.4)'
        };
    }
  };

  const getOrbTransition = () => {
    switch (voiceState) {
      case 'listening':
        return { type: 'spring', stiffness: 300, damping: 20 }; // Snappy reaction to audio
      case 'processing':
        return { repeat: Infinity, duration: 2, ease: "linear" };
      case 'speaking':
        return { repeat: Infinity, duration: 0.8, ease: "easeInOut" };
      default:
        return { duration: 1 };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* The Glow Orb */}
      <div className="relative flex items-center justify-center mb-8 h-48 w-48">
        <motion.div
          animate={getOrbStateStyles()}
          transition={getOrbTransition()}
          className="absolute w-32 h-32 rounded-full border-4 bg-slate-900/50 backdrop-blur-xl flex items-center justify-center z-10"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 opacity-20 blur-md"></div>
        </motion.div>
        
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="absolute w-40 h-40 rounded-full border border-dashed border-cyan-500/30"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="absolute w-48 h-48 rounded-full border-2 border-dotted border-purple-500/20"
        />
      </div>

      {/* Transcript Status */}
      <div className="h-12 flex items-center justify-center w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={voiceState + transcript}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`font-mono text-sm tracking-widest uppercase ${
              voiceState === 'listening' ? 'text-cyan-400 animate-pulse' :
              voiceState === 'processing' ? 'text-purple-400' :
              voiceState === 'speaking' ? 'text-emerald-400' :
              'text-slate-500'
            }`}
          >
            {voiceState === 'listening' ? 'Listening...' :
             voiceState === 'processing' ? 'Processing...' :
             voiceState === 'speaking' ? 'Executing' :
             voiceState === 'transcript' ? `"${transcript}"` :
             'System Idle'}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
