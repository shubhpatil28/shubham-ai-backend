import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, componentName: props.name || 'Component' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[SHUBHAM AI OS] ErrorBoundary(${this.state.componentName}) caught:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Inline fallback — shown when this is wrapping a sub-component (not the whole app)
      if (this.props.inline) {
        return (
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-red-500/20 bg-red-950/10 backdrop-blur-md text-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500/60 flex items-center justify-center text-red-400 text-lg">
              ⚠
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                {this.state.componentName} Module Offline
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                {this.state.error?.message || 'Module failed to initialize'}
              </p>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1 text-[10px] font-mono uppercase border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Retry Module
            </button>
          </div>
        );
      }

      // Full-screen fallback — for root-level boundary
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 font-mono relative overflow-hidden">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,243,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          {/* Pulsing warning orb */}
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-2 border-red-500/60 flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(239,68,68,0.4), inset 0 0 30px rgba(239,68,68,0.1)' }}>
              <div className="w-16 h-16 rounded-full border border-red-500/40 flex items-center justify-center animate-pulse">
                <span className="text-3xl">⚠</span>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping" />
          </div>

          <h1 className="text-xl font-bold text-red-400 tracking-[0.3em] uppercase mb-2">
            ⚠ SHUBHAM AI CORE RECOVERING...
          </h1>
          <p className="text-slate-500 text-xs tracking-wider mb-6">
            A critical module has encountered a terminal exception
          </p>

          <div className="bg-black/40 border border-red-500/20 rounded-xl p-4 max-w-lg w-full mb-6 backdrop-blur-md overflow-auto max-h-36">
            <p className="text-[10px] text-red-300 font-mono break-all">
              {this.state.error?.toString() || 'Unknown error'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2 border border-[#00f3ff]/40 text-[#00f3ff] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#00f3ff]/10 transition-all"
            >
              Attempt Recovery
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-red-900/20 border border-red-500/40 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all"
            >
              Full System Reboot
            </button>
          </div>

          <p className="text-[10px] text-slate-600 mt-8 tracking-widest uppercase">
            SHUBHAM AI OS V3.5 — SELF-HEALING ENABLED
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
