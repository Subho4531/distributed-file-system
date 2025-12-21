import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CloudUpload,
  File,
  Shield,
  Zap,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Cpu,
  Files
} from "lucide-react";
import { cn } from "../lib/utils";

const API_BASE = "http://localhost:8001";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [policy, setPolicy] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    file_id?: string;
    algorithm?: string;
    can_survive_failures?: number;
    storage_cost?: number;
    error?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("policy", policy);
    // Only send explicit algorithm when user selected one (not Smart Engine auto)
    if (selectedAlgo && selectedAlgo !== "auto") {
      formData.append("algorithm", selectedAlgo);
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setResult(res.data);
    } catch (e) {
      console.error(e);
      setResult({ error: "Upload failed. Please check network connection." });
    } finally {
      setLoading(false);
    }
  };

  const algorithms = [
    { id: "auto", label: "Smart Engine", icon: Zap, color: "blue", desc: "Auto-select best protocol" },
    { id: "replication", label: "Replication", icon: Shield, color: "emerald", desc: "Mirror data across nodes" },
    { id: "reed-solomon", label: "Reed-Solomon", icon: Cpu, color: "purple", desc: "Advanced parity fragments" },
  ];

  const policies = [
    { id: "balanced", label: "Balanced", icon: Shield, color: "blue", desc: "Optimal performance & safety" },
    { id: "cost", label: "Economy", icon: DollarSign, color: "green", desc: "Minimal storage expenditure" },
  ];

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const [selectedAlgo, setSelectedAlgo] = useState("auto");

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4"
        >
          <CloudUpload className="w-4 h-4 mr-2" />
          Secure Ingress
        </motion.div>
        <h1 className="text-5xl font-extrabold text-white tracking-tight uppercase italic tracking-tighter">
          Distribute <span className="text-gradient">Assets</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
          Multi-protocol distributed storage. Choose your algorithm or let our Smart Engine handle it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
              <Cpu className="w-3 h-3 mr-2" /> Redundancy Logic
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {algorithms.map((a) => {
                const Icon = a.icon;
                const isActive = selectedAlgo === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAlgo(a.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden",
                      isActive
                        ? "bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/5"
                        : "bg-transparent border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isActive ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm uppercase tracking-tight", isActive ? "text-white" : "text-slate-400")}>{a.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{a.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center">
                <Shield className="w-3 h-3 mr-2" /> Storage Protocol
              </h3>
              {selectedAlgo !== "auto" && (
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-2 py-1 rounded bg-slate-800">
                  Auto-Disabled
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3">
              {policies.map((p) => {
                const Icon = p.icon;
                const isActive = policy === p.id;
                const isDisabled = selectedAlgo !== "auto";
                return (
                  <button
                    key={p.id}
                    onClick={() => !isDisabled && setPolicy(p.id)}
                    disabled={isDisabled}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden",
                      isActive && !isDisabled
                        ? "bg-slate-900 border-blue-500/50 shadow-lg shadow-blue-500/5"
                        : "bg-transparent border-white/5 hover:border-white/10",
                      isDisabled ? "opacity-30 cursor-not-allowed" : ""
                    )}
                  >
                    <div className="flex items-center space-x-4 relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isActive && !isDisabled ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm uppercase tracking-tight", isActive && !isDisabled ? "text-white" : "text-slate-400")}>{p.label}</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-tight">{p.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Upload Zone & Results */}
        <div className="lg:col-span-8 space-y-6">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "premium-glass relative group min-h-[500px] flex flex-col items-center justify-center p-8 border-2 border-dashed transition-all duration-500",
              isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.01]" : "border-white/10 hover:border-white/20",
              file && "border-solid border-blue-500/30"
            )}
          >
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-input"
            />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.label
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center text-center space-y-6"
                >
                  <div className="w-24 h-24 rounded-3xl bg-slate-800/50 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all duration-500 group-hover:scale-110">
                    <CloudUpload className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-white tracking-tight">
                      Drop your data here
                    </p>
                    <p className="text-slate-500 font-medium">
                      or click to <span className="text-blue-400 font-bold group-hover:underline z-50">browse files</span>
                    </p>
                  </div>

                
                  <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-4">
                    <span>Max 2GB</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span>E2E Encrypted</span>
                  </div>
                </motion.label>
              ) : (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-lg space-y-6 mx-auto"
                >
                  <div className="relative p-5 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center space-x-4 pr-12">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <File className="w-7 h-7" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-white font-black uppercase italic tracking-tighter truncate max-w-[200px]">{file.name}</p>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Mouse down on remove button');
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Removing file:', file?.name);
                        setFile(null);
                        setResult(null);
                      }}
                      className="absolute top-3 right-3 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400 hover:text-red-300 transition-colors border border-red-500/30 hover:border-red-500/50 shadow-lg"
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={cn(
                    "grid gap-4",
                    selectedAlgo === "auto" ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/5">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Target Engine</p>
                      <p className="text-sm font-bold text-blue-400 uppercase italic tracking-tighter">
                        {algorithms.find(a => a.id === selectedAlgo)?.label}
                      </p>
                    </div>
                    {selectedAlgo === "auto" && (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-white/5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Policy Active</p>
                        <p className="text-sm font-bold text-emerald-400 uppercase italic tracking-tighter">
                          {policies.find(p => p.id === policy)?.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="button-premium w-full py-6 text-xl font-black text-white group italic uppercase tracking-tighter"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-4">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Initializing Channels...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-3">
                        <span>Deploy to Cluster</span>
                        <Zap className="w-6 h-6 group-hover:animate-pulse" />
                      </span>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Background animation for dragging */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px] pointer-events-none rounded-2xl" />
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "premium-glass p-8 space-y-8 relative overflow-hidden",
                  result.error ? "border-rose-500/30" : "border-emerald-500/30"
                )}
              >
                {result.error ? (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Transmission Failed</h4>
                      <p className="text-slate-400 font-medium">{result.error}</p>
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="px-8 py-3 rounded-2xl bg-rose-500/10 text-rose-400 font-black text-xs uppercase tracking-widest hover:bg-rose-500/20 transition-colors"
                    >
                      Retry Deployment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="text-3xl font-black text-white leading-none uppercase tracking-tighter italic">Asset Committed</h4>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Fragment Sequence: {result.file_id?.slice(0, 12)}</p>
                        </div>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                        <p className="text-lg font-black text-emerald-400 italic uppercase">Distributed</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Protocol</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{result.algorithm}</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resilience</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{result.can_survive_failures} Node Failures</p>
                      </div>
                      <div className="p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Overhead</p>
                        <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{result.storage_cost}x Rate</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        to="/files"
                        className="flex-1 py-5 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs italic uppercase tracking-widest transition-all duration-500 flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/20"
                      >
                        <Files className="w-4 h-4" />
                        <span>View in Explorer</span>
                      </Link>
                      <button className="flex-1 py-5 rounded-3xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs italic uppercase tracking-widest transition-all duration-500 flex items-center justify-center space-x-3">
                        <span>Analyze Shards</span>
                        <Database className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Decorative glow */}
                <div className={cn(
                  "absolute -bottom-20 -right-20 w-40 h-40 blur-[100px] rounded-full opacity-30",
                  result.error ? "bg-rose-500" : "bg-emerald-500"
                )} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5V19c0 1.66 4.03 3 9 3s9-1.34 9-3V5"></path>
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"></path>
    </svg>
  );
}

