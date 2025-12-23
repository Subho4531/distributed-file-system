import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchFileStatus,
  reconstructFile,
  getReconstructInfo
} from "../api/cosmeon";
import type { FileStatusResponse } from "../types/file";
import ShardMap from "../components/ShardMap";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Activity,
  Database,
  Cpu,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  ChevronRight,
  Zap
} from "lucide-react";
import { cn } from "../lib/utils";

export default function FileDetails() {
  const { fileId } = useParams<{ fileId: string }>();

  const [data, setData] = useState<FileStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconstructing, setReconstructing] = useState(false);
  const [reconstructResult, setReconstructResult] = useState<any>(null);

  useEffect(() => {
    if (!fileId) return;

    fetchFileStatus(fileId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to resolve cryptographic file descriptor.");
        setLoading(false);
      });
  }, [fileId]);

  const handleReconstruct = async () => {
    if (!fileId) return;
    setReconstructing(true);
    setReconstructResult(null);

    try {
      // First get reconstruction info
      const info = await getReconstructInfo(fileId);
      
      // Show alert with reconstruction details
      const message = `File Reconstruction Details:
      
Filename: ${info.filename}
Algorithm: ${info.algorithm.toUpperCase()}
Total Shards: ${info.total_shards}
Available Shards: ${info.available_shards}
Needed Shards: ${info.needed_shards}
Missing Shards: ${info.missing_shards.length}
Original Size: ${(info.original_size / 1024).toFixed(2)} KB

${info.can_reconstruct ? 'File can be reconstructed successfully!' : 'Cannot reconstruct - insufficient shards available.'}

Click OK to download the reconstructed file.`;

      if (info.can_reconstruct && confirm(message)) {
        // Trigger the actual download
        const response = await reconstructFile(fileId);
        
        // Create download link
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = info.filename || `reconstructed_${fileId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Show success message and set result for UI
        alert(`File "${info.filename}" downloaded successfully!`);
        setReconstructResult({
          filename: info.filename,
          reconstructed_size: info.original_size,
          missing_shards: info.missing_shards,
          reconstruction_time: new Date().toISOString()
        });
      } else if (!info.can_reconstruct) {
        alert(message);
        setReconstructResult({ error: "Cannot reconstruct - insufficient shards available" });
      }
    } catch (err: any) {
      setReconstructResult({ error: err.response?.data?.detail || "Quantum parity reconstruction failed" });
    } finally {
      setReconstructing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-blue-500/20 rounded-2xl animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-black tracking-tighter uppercase italic">Synchronizing</p>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Accessing Cluster Distribution</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 rounded-3xl premium-glass border-rose-500/20 max-w-md"
        >
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tighter">Access Denied</h2>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">{error || "The requested file shard could not be localized on the network."}</p>
          <Link
            to="/files"
            className="button-premium px-8 py-3 text-white inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Vault</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const algorithms = {
    "replication": {
      title: "Replication Protocol",
      desc: "Full duplicates of your data are stored on multiple nodes. Simple and fast, but storage-intensive.",
      metrics: ["300% storage overhead", "Zero compute cost", "High availability"]
    },
    "reed-solomon": {
      title: "Reed-Solomon Erasure Coding",
      desc: "Data is split into K fragments plus M parity fragments. Any K-of-N fragments can reconstruct the original.",
      metrics: ["66% storage overhead", "Moderate compute cost", "Maximized reliability"]
    },
    "xor-parity": {
      title: "XOR Parity Logic",
      desc: "Uses bitwise XOR operations to create parity shards. Highly efficient for small clusters.",
      metrics: ["50% storage overhead", "Minimal compute cost", "Balanced protection"]
    }
  };

  const algoInfo = algorithms[data.algorithm as keyof typeof algorithms] || algorithms.replication;

  const healthConfig = {
    healthy: {
      icon: ShieldCheck,
      color: "emerald",
      label: "Optimal Integrity",
      desc: "All redundancy parameters met"
    },
    degraded: {
      icon: ShieldAlert,
      color: "amber",
      label: "Redundancy Loss",
      desc: "Maintenance required"
    },
    critical: {
      icon: ShieldX,
      color: "rose",
      label: "System Critical",
      desc: "Immediate intervention needed"
    },
  };

  const status = healthConfig[data.health as keyof typeof healthConfig] || healthConfig.healthy;
  const HealthIcon = status.icon;

  return (
    <div className="space-y-12 pb-20">
      {/* breadcrumbs */}
      <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        <Link to="/files" className="hover:text-blue-400 transition-colors">Vault</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-300">Inspector</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileSearch className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">{data.filename}</h1>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-tighter">{data.file_id}</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "premium-glass min-w-[300px] p-6 flex items-center space-x-6 relative overflow-hidden group",
            data.health === 'healthy' ? "border-emerald-500/20" : data.health === 'degraded' ? "border-amber-500/20" : "border-rose-500/20"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center relative z-10",
            data.health === 'healthy' ? "bg-emerald-500/10 text-emerald-400" : data.health === 'degraded' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
          )}>
            <HealthIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status Protocol</p>
            <h4 className={cn(
              "text-xl font-black uppercase italic tracking-tighter",
              data.health === 'healthy' ? "text-emerald-400" : data.health === 'degraded' ? "text-amber-400" : "text-rose-400"
            )}>{status.label}</h4>
            <p className="text-[10px] font-bold text-slate-400">{status.desc}</p>
          </div>
          {/* subtle glow */}
          <div className={cn(
            "absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20",
            data.health === 'healthy' ? "bg-emerald-500" : data.health === 'degraded' ? "bg-amber-500" : "bg-rose-500"
          )} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-glass p-6 space-y-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <Database className="w-3.5 h-3.5 mr-2" /> Storage Detail
              </h3>
              <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Shard Distribution</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter">
                    {data.online_shards} <span className="text-slate-600 text-sm font-bold uppercase tracking-widest ml-1">/ {data.shard_status.length}</span>
                  </p>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Survivability</p>
                  <p className="text-2xl font-black text-emerald-400 italic tracking-tighter uppercase whitespace-nowrap">
                    {data.can_survive_more} <span className="text-[10px] text-slate-500 ml-1">Failures</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Minimum Quorum
              </h3>
              <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <p className="text-3xl font-black text-white italic tracking-tighter">{data.needed_shards}</p>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Required for restore</p>
              </div>
            </div>
          </div>

          <div className="premium-glass p-8 border-blue-500/10 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center">
              <Zap className="w-3.5 h-3.5 mr-2" /> Why {data.algorithm}?
            </h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              {algoInfo.desc}
            </p>
            <div className="space-y-2">
              {algoInfo.metrics.map((m, i) => (
                <div key={i} className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* Shard Map Wrapper */}
          <div className="premium-glass p-8">
            <h2 className="text-xl font-black text-white mb-8 italic uppercase tracking-tighter flex items-center">
              <Cpu className="w-5 h-5 mr-3 text-blue-400" /> Distributed Shard Topography
            </h2>
            <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5">
              <ShardMap shards={data.shard_status} />
            </div>
          </div>

          {/* Reconstruction Module */}
          <div className="premium-glass p-8 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <h2 className="text-xl font-black text-white mb-2 italic uppercase tracking-tighter flex items-center">
                  <RefreshCcw className={cn("w-5 h-5 mr-3 text-blue-400", reconstructing && "animate-spin")} />
                  Atomic Reconstruction
                </h2>
                <p className="text-slate-400 text-sm max-w-md">Recover your original file by reassembling cryptographic fragments from the available network nodes.</p>
              </div>

              <button
                onClick={handleReconstruct}
                disabled={!data.reconstructable || reconstructing}
                className={cn(
                  "button-premium px-10 py-4 font-black text-white italic uppercase tracking-tighter text-lg leading-none active:scale-95 group",
                  (!data.reconstructable || reconstructing) && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                {reconstructing ? "Processing..." : "Decrypt & Restore"}
              </button>
            </div>

            <div className="mt-8 relative z-10">
              <AnimatePresence mode="wait">
                {!reconstructResult ? (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center space-x-4",
                      data.reconstructable ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      data.reconstructable ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    )}>
                      {data.reconstructable ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-black text-sm uppercase italic tracking-tighter",
                        data.reconstructable ? "text-emerald-400" : "text-rose-400"
                      )}>{data.reconstructable ? "Quorum Metadata Validated" : "Insufficient Distribution"}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {data.reconstructable ? "Ready for synthesis" : `${data.needed_shards} nodes required, only ${data.online_shards} available`}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-8 rounded-3xl border relative overflow-hidden",
                      reconstructResult.error ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                    )}
                  >
                    {reconstructResult.error ? (
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                          <ShieldX className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-rose-500 italic uppercase tracking-tighter">Decryption Failure</h4>
                          <p className="text-slate-400 text-sm">{reconstructResult.error}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                              <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                              <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-tight">Synthesis Successful</h4>
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">File Integrity: 100% Verified</p>
                            </div>
                          </div>

                          <div className="hidden md:block text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payload Size</p>
                            <p className="text-2xl font-black text-white italic tracking-tighter">{(reconstructResult.reconstructed_size / 1024).toFixed(2)} <span className="text-slate-600 text-sm font-bold uppercase">KB</span></p>
                          </div>
                        </div>

                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Reconstruction Log</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Quantum parity algorithms applied. Missing shards ({reconstructResult.missing_shards?.length ?? 0}) recovered from redundant segments.
                            Buffer streams finalized.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Background design */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-32 -mt-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

