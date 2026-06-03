import React, { useState } from 'react';
import { Cpu, ExternalLink, Sparkles, Download, Globe, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config/api';

const SiteBuilder = ({ onLog }) => {
  console.log("APP_COMPONENT_MOUNTED", "SiteBuilder.jsx");
  const [siteName, setSiteName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState(null);
  
  // Deployment stats
  const [deployResult, setDeployResult] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!siteName.trim() || !prompt.trim()) return;

    setGenerating(true);
    setResult(null);
    setDeployResult(null);
    if (onLog) {
      onLog(`Initializing site engine compile for: "${siteName}"...`, 'system');
    }

    try {
      const response = await fetch(`${API_URL}/api/site-gen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName,
          prompt: prompt
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        if (onLog) {
          onLog(`Site engine compilation successful! Static index created.`, 'response');
        }
      } else {
        throw new Error("Compilation error");
      }
    } catch (error) {
      console.error("Error generating website:", error);
      if (onLog) {
        onLog(`Failed to compile website layout.`, 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleExportZip = () => {
    if (!result) return;
    window.open(`${API_URL}/api/site-gen/export?site_name=${result.site_name}`, '_blank');
    if (onLog) onLog(`Exporting Vite package: ${result.site_name}.zip`, "system");
  };

  const handleDeploy = async () => {
    if (!result) return;
    setDeploying(true);
    if (onLog) onLog(`Deploying ${result.site_name} to Google Cloud production nodes...`, "action");

    try {
      const response = await fetch(`${API_URL}/api/site-gen/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_name: result.site_name })
      });

      if (response.ok) {
        const data = await response.json();
        setDeployResult(data);
        if (onLog) onLog(`Successfully deployed to Cloud production: ${data.deployed_url}`, "response");
      }
    } catch (e) {
      console.error(e);
      if (onLog) onLog("Deployment nodes returned critical handshake error.", "error");
    } finally {
      setDeploying(false);
    }
  };

  const previewFrameUrl = result ? `${result.preview_url}` : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-full overflow-y-auto">
      {/* Control Pane (Left 4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Compiler Form */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-2.5 mb-4">
            <Cpu size={14} className="text-[#00f3ff]" />
            <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#00f3ff] uppercase">Compiler Node</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-[9px] font-mono text-slate-500 block mb-1">PROJECT TARGET IDENTIFIER</label>
              <input 
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. portfolio_website, saas_landing"
                required
                disabled={generating}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <div>
              <label className="text-[9px] font-mono text-slate-500 block mb-1">DESIGN/LAYOUT DIRECTIVES</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Premium React landing page for a carbon-offsetting startup, glassmorphic dark UI, pricing cards, clean SVG hero graphic..."
                rows={4}
                required
                disabled={generating}
                className="w-full resize-none bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className={`w-full flex items-center justify-center gap-2 text-xs font-mono py-2.5 rounded-xl transition-all font-bold uppercase ${
                generating
                  ? 'bg-slate-950/50 border border-slate-850 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400'
              }`}
            >
              <Sparkles size={12} className={generating ? 'animate-spin' : ''} />
              {generating ? 'COMPILING DESIGN...' : 'INITIATE COMPILER'}
            </button>
          </form>
        </div>

        {/* Suggestions & Refinement Checklist */}
        {result && (
          <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-3 flex items-center gap-2">
              <CheckCircle2 className="text-[#bd00ff] w-4 h-4" /> Architectural Suggestions
            </h3>
            <div className="space-y-3">
              {(result.suggestions || []).map((suggestion, idx) => (
                <div key={idx} className="flex gap-2 text-xs font-mono text-slate-400 leading-relaxed bg-slate-950/40 border border-slate-900 rounded-xl p-2.5">
                  <span className="text-[#00f3ff] font-bold">0{idx+1}.</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Release Actions */}
        {result && (
          <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl space-y-4">
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-1 flex items-center gap-2">
              <Globe className="text-emerald-400 w-4 h-4" /> Production Pipeline
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportZip}
                className="py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1.5"
              >
                <Download size={14} className="text-[#00f3ff]" /> Export Vite ZIP
              </button>

              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Globe size={14} className="text-emerald-400" /> {deploying ? 'Deploying...' : 'One-Click Deploy'}
              </button>
            </div>

            {deployResult && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 font-mono text-[10px] space-y-1.5">
                <div className="text-emerald-400 font-bold uppercase">RELEASE COMPLETE</div>
                <div className="text-slate-400 truncate">Domain: <a href={deployResult.deployed_url} target="_blank" rel="noreferrer" className="text-white underline">{deployResult.deployed_url}</a></div>
                <div className="text-slate-500">Timestamp: {deployResult.timestamp}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Workspace (Right 8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-[75vh] min-h-[500px]">
        <div className="glass-panel border border-slate-800/60 bg-slate-950/40 rounded-2xl flex-1 flex flex-col overflow-hidden relative">
          {/* Preview Tab Bar */}
          <div className="px-5 py-3.5 border-b border-slate-850 flex items-center justify-between font-mono text-xs text-slate-400 bg-slate-950/20">
            <span className="font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Live Preview Workspace
            </span>
            {result && (
              <a 
                href={previewFrameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-[#00f3ff] hover:underline flex items-center gap-1"
              >
                Launch Separate <ExternalLink size={10} />
              </a>
            )}
          </div>

          {/* IFrame Screen */}
          <div className="flex-1 bg-slate-900/10 relative">
            {previewFrameUrl ? (
              <iframe
                src={previewFrameUrl}
                title="AI Generated Preview Screen"
                className="w-full h-full border-none bg-slate-950"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-600 font-mono text-xs">
                <AlertTriangle className="w-8 h-8 text-slate-700 animate-bounce" />
                <span>WORKSPACE STANDBY. COMPILE A SITE TO LOAD PREVIEW SCREEN.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteBuilder;
