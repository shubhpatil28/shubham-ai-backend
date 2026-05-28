import React from 'react';

/**
 * GlassLoader — futuristic neon pulse loading state.
 * Used as Suspense fallback and as inline skeleton loaders.
 */
const GlassLoader = ({ label = 'INITIALIZING MODULE...', size = 'md' }) => {
  const sizes = {
    sm: { container: 'h-24', ring: 'w-8 h-8', inner: 'w-5 h-5', text: 'text-[9px]' },
    md: { container: 'h-40', ring: 'w-12 h-12', inner: 'w-7 h-7', text: 'text-[10px]' },
    lg: { container: 'h-full min-h-[300px]', ring: 'w-16 h-16', inner: 'w-10 h-10', text: 'text-xs' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center ${s.container} gap-4 glass-panel`}>
      {/* Nested spinning rings */}
      <div className="relative flex items-center justify-center">
        <div className={`${s.ring} rounded-full border-2 border-[#00f3ff]/30 border-t-[#00f3ff] animate-spin`} />
        <div
          className={`absolute ${s.inner} rounded-full border border-[#bd00ff]/40 border-b-[#bd00ff] animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
        />
        <div className="absolute w-2 h-2 rounded-full bg-[#00f3ff] animate-pulse"
          style={{ boxShadow: '0 0 8px #00f3ff' }}
        />
      </div>

      <p className={`${s.text} font-mono text-[#00f3ff] tracking-[0.25em] uppercase animate-pulse`}>
        {label}
      </p>

      {/* Skeleton bars */}
      <div className="flex flex-col gap-2 w-full max-w-[160px]">
        {[100, 75, 88].map((w, i) => (
          <div
            key={i}
            className="h-1 rounded-full bg-gradient-to-r from-[#00f3ff]/20 to-transparent animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
};

export default GlassLoader;
