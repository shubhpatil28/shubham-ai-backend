import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * AIOrb - Fullscreen futuristic orb visual component.
 * Props:
 *   coreStatus: string indicating AI state ('sleeping', 'processing', 'speaking', 'error')
 *   isBrowserListening: boolean indicating if mic is active.
 */
const AIOrb = ({ coreStatus, isBrowserListening }) => {
  const controls = useAnimation();

  // Map AI states to animation variants
  const variants = {
    idle: {
      scale: [1, 1.02, 1],
      opacity: [0.7, 0.9, 0.7],
      transition: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
    },
    listening: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
    },
    thinking: {
      rotate: [0, 360],
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 3, ease: 'linear' },
    },
    speaking: {
      scale: [1, 1.03, 1],
      opacity: [0.8, 1, 0.8],
      transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
    },
    error: {
      rotate: [0, -10, 10, -10, 0],
      opacity: [0.7, 0.5, 0.7],
      transition: { repeat: 3, duration: 0.5, ease: 'easeInOut' },
    },
  };

  // Determine which variant to play based on props
  useEffect(() => {
    if (coreStatus === 'sleeping') {
      controls.start('idle');
    } else if (isBrowserListening) {
      controls.start('listening');
    } else if (coreStatus === 'processing') {
      controls.start('thinking');
    } else if (coreStatus === 'speaking') {
      controls.start('speaking');
    } else if (coreStatus === 'error') {
      controls.start('error');
    }
  }, [coreStatus, isBrowserListening, controls]);

  // Orb visual – using a radial gradient with blur for glow effect
  const orbStyle = {
    width: '30vw',
    height: '30vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 50%, rgba(0,255,255,0.6), rgba(0,0,0,0.8))',
    boxShadow: '0 0 60px 20px rgba(0,255,255,0.5)',
    filter: 'blur(8px)',
  };

  return (
    <motion.div
      className="flex items-center justify-center w-full h-full"
      animate={controls}
      variants={variants}
    >
      <div style={orbStyle} />
    </motion.div>
  );
};

export default AIOrb;
