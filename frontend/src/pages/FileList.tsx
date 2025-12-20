import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  ExternalLink,
  HardDrive,
  Search,
  Plus,
  Inbox,
  ShieldCheck,
  Activity,
  RefreshCw
} from "lucide-react";
import { fetchFiles } from "../api/cosmeon";
import { cn } from "../lib/utils";

export default function FileList() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFiles = () => {
    setLoading(true);
    fetchFiles()
      .then((data) => {
        const sorted = data.sort((a: any, b: any) =>
          new Date(b.inserted_at || 0).getTime() - new Date(a.inserted_at || 0).getTime()
        );
        setFiles(sorted);
      })
      .catch((err) => console.error("Failed to synchronize with vault", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const getHealthStatus = (file: any) => {
    // Basic heuristic since we don't have per-file health in the list yet
    const isReady = file.shards && file.shards.length > 0;
    return {
      label: isReady ? "Healthy" : "Unknown",
      color: isReady ? "emerald" : "amber",
      icon: isReady ? ShieldCheck : Activity
    };
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Locating Distributed Assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-400 mb-1">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Storage Explorer</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic uppercase">
            Distributed <span className="text-gradient">Assets</span>
          </h1>
          <p className="text-slate-400 max-w-xl font-medium">
            Access and manage your cryptographically secured file fragments across the decentralized cluster.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={loadFiles}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Refresh Vault"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <Link
            to="/upload"
            className="button-premium group px-8 py-4 text-white flex items-center space-x-3 italic uppercase font-black tracking-tighter"
          >
            <Plus className="w-5 h-5" />
            <span>New Deployment</span>
          </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="Filter by hash or filename..."
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
          />
        </div>
      </div>

      {/* Content Section */}
      {files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="premium-glass rounded-[2rem] p-20 text-center border-dashed border-2 border-white/5"
        >
          <div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-600">
            <Inbox className="w-12 h-12" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">Vault is Empty</h3>
          <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
            You haven't distributed any assets yet. Start by deploying your first file to the cluster.
          </p>
          <Link
            to="/upload"
            className="button-premium inline-flex px-10 py-4 text-white italic uppercase font-black tracking-tighter text-lg"
          >
            Launch First Upload
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {files.map((file, index) => {
            const health = getHealthStatus(file);
            const HealthIcon = health.icon;
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="premium-glass group p-8 hover:border-blue-500/30 transition-all duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-500">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase",
                    `bg-${health.color}-500/10 border-${health.color}-500/20 text-${health.color}-400`
                  )}>
                    <HealthIcon className="w-3 h-3" />
                    <span>{health.label}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div>
                    <h3 className="font-black text-white text-xl truncate tracking-tighter uppercase italic">{file.filename || "Untitled Shard"}</h3>
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter truncate mt-1">
                      ID: {file.id}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Size</p>
                      <p className="text-sm font-bold text-slate-300">{(file.original_size / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol</p>
                      <p className="text-sm font-bold text-blue-400 uppercase tracking-tighter">{file.algorithm_used}</p>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/file/${file.id}`}
                  className="w-full flex items-center justify-center space-x-3 py-4 rounded-2xl bg-slate-800 hover:bg-blue-600 text-white font-black text-xs italic uppercase tracking-tighter transition-all duration-500 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                >
                  <span>Inspect Resource</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}


