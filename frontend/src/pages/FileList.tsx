import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ExternalLink,
  HardDrive,
  Search,
  Plus,
  Inbox,
  ShieldCheck,
  Activity,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Download
} from "lucide-react";
import { fetchFiles, fetchFileStatus, deleteFile, reconstructFile, getReconstructInfo } from "../api/cosmeon";
import { cn } from "../lib/utils";

export default function FileList() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reconstructing, setReconstructing] = useState<string | null>(null);
  const [reconstructError, setReconstructError] = useState<string | null>(null);

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
    // Enhanced heuristic based on file data
    const hasShards = file.shards && file.shards.length > 0;
    const algorithm = file.algorithm || file.algorithm_used;
    
    if (!hasShards) {
      return {
        label: "Unknown",
        color: "slate",
        icon: Activity
      };
    }

    // For Reed-Solomon, check if we have enough shards
    if (algorithm === "reed-solomon") {
      const config = file.config || file.algorithm_config || {};
      const k = config.k || 3;
      const totalShards = file.shards.length;
      const minNeeded = k;
      
      if (totalShards >= minNeeded) {
        return {
          label: "Healthy",
          color: "emerald",
          icon: ShieldCheck
        };
      } else {
        return {
          label: "Degraded",
          color: "amber",
          icon: AlertCircle
        };
      }
    }

    // For replication, any shard is sufficient
    if (algorithm === "replication") {
      return {
        label: "Healthy",
        color: "emerald",
        icon: ShieldCheck
      };
    }

    // Default case
    return {
      label: "Healthy",
      color: "emerald",
      icon: ShieldCheck
    };
  };

  const handleInspectClick = async (fileId: string) => {
    setSelectedFileId(fileId);
    setStatusLoading(true);
    setStatusData(null);
    try {
      const data = await fetchFileStatus(fileId);
      setStatusData(data);
    } catch (err) {
      console.error("Failed to fetch file status:", err);
      setStatusData({ error: "Failed to load status" });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      return;
    }
    
    setDeleting(fileId);
    setDeleteError(null);
    try {
      await deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      setSelectedFileId(null);
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || "Failed to delete file");
      setDeleting(null);
    }
  };

  const handleReconstructFile = async (fileId: string) => {
    setReconstructing(fileId);
    setReconstructError(null);
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
        
        // Show success message
        alert(`File "${info.filename}" downloaded successfully!`);
      } else if (!info.can_reconstruct) {
        alert(message);
      }
    } catch (err: any) {
      setReconstructError(err.response?.data?.detail || "Failed to reconstruct file");
    } finally {
      setReconstructing(null);
    }
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
                  <div className="flex flex-col items-end space-y-2">
                    <div className={cn(
                      "flex items-center space-x-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase",
                      health.color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      health.color === "amber" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      health.color === "red" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                      "bg-slate-500/10 border-slate-500/20 text-slate-400"
                    )}>
                      <HealthIcon className="w-3 h-3" />
                      <span>{health.label}</span>
                    </div>
                    {file.algorithm === "reed-solomon" && file.config && (
                      <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                        k={file.config.k || file.algorithm_config?.k || 3}, m={file.config.m || file.algorithm_config?.m || 2}
                      </div>
                    )}
                  </div>
                </div>

                  <div className="space-y-4 mb-10">
                    <div>
                      <h3 className="font-black text-white text-xl truncate tracking-tighter uppercase italic">{file.filename || "Untitled Shard"}</h3>
                      <p className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter truncate mt-1">
                        ID: {file.id}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Size</p>
                        <p className="text-sm font-bold text-slate-300">{(file.original_size / 1024).toFixed(2)} KB</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol</p>
                        <p className="text-sm font-bold text-blue-400 uppercase tracking-tighter">{file.algorithm || file.algorithm_used}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Overhead</p>
                        <p className="text-sm font-bold text-amber-400">{file.cost_estimate || 'N/A'}x</p>
                      </div>
                    </div>

                    {/* Shard Count Display */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Shards</span>
                      <span className="text-slate-300 font-bold">{file.shards?.length || 0} distributed</span>
                    </div>
                  </div>

                <div className="flex gap-3 relative z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleInspectClick(file.id);
                    }}
                    className="flex-1 flex items-center justify-center space-x-3 py-4 rounded-2xl bg-slate-800 hover:bg-blue-600 text-white font-black text-xs italic uppercase tracking-tighter transition-all duration-500 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                  >
                    <span>Inspect Resource</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    disabled={deleting === file.id}
                    className="px-4 py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-black text-xs italic uppercase tracking-tighter transition-all duration-500 disabled:opacity-50"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Status Modal */}
      <AnimatePresence>
        {selectedFileId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFileId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="premium-glass rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  File Status Details
                </h2>
                <button
                  onClick={() => setSelectedFileId(null)}
                  className="p-2 z-50 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {statusLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-400">Loading status...</p>
                </div>
              ) : statusData?.error ? (
                <div className="flex items-start space-x-4 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-semibold">{statusData.error}</p>
                  </div>
                </div>
              ) : statusData ? (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">File Information</h3>
                    <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Filename</p>
                        <p className="text-sm font-semibold text-white">{statusData.filename}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">File ID</p>
                        <p className="text-xs font-mono text-blue-400 truncate">{statusData.file_id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Algorithm Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Storage Configuration</h3>
                    <div className="grid grid-cols-3 gap-4 bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Algorithm</p>
                        <p className="text-sm font-bold text-blue-400 uppercase">{statusData.algorithm}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Online Shards</p>
                        <p className="text-sm font-bold text-emerald-400">{statusData.online_shards}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Needed</p>
                        <p className="text-sm font-bold text-blue-400">{statusData.needed_shards}</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Status */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recovery Status</h3>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            statusData.health === "healthy" ? "bg-emerald-500" : 
                            statusData.health === "degraded" ? "bg-amber-500" : "bg-red-500"
                          )} />
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Health Status</p>
                            <p className={cn(
                              "font-bold uppercase tracking-tighter text-sm",
                              statusData.health === "healthy" ? "text-emerald-400" : 
                              statusData.health === "degraded" ? "text-amber-400" : "text-red-400"
                            )}>
                              {statusData.health}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reconstructable</p>
                          <div className="flex items-center space-x-2 justify-end">
                            {statusData.reconstructable ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-400">YES</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-red-400">NO</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {statusData.reconstructable && (
                        <div className="pt-3 border-t border-white/5">
                          <p className="text-xs text-slate-400">
                            Can survive <span className="font-bold text-emerald-400">{statusData.can_survive_more || 0}</span> more shard failures
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shard Details */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Shard Distribution</h3>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="grid grid-cols-1 gap-3">
                        {statusData.shard_status?.map((shard: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                shard.status === "online" ? "bg-emerald-500" : "bg-red-500"
                              )} />
                              <div>
                                <p className="text-xs font-bold text-white">Shard {shard.shard_index}</p>
                                <p className="text-xs text-slate-500 font-mono">{shard.bucket}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-xs font-bold uppercase tracking-widest",
                                shard.status === "online" ? "text-emerald-400" : "text-red-400"
                              )}>
                                {shard.status}
                              </p>
                              <p className="text-xs text-slate-500">{(shard.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setSelectedFileId(null)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-tighter transition-colors"
                    >
                      Close
                    </button>
                    {statusData.reconstructable && (
                      <button
                        onClick={() => handleReconstructFile(selectedFileId)}
                        disabled={reconstructing === selectedFileId}
                        className="flex-1 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-tighter transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>{reconstructing === selectedFileId ? "Reconstructing..." : "Reconstruct"}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteFile(selectedFileId)}
                      disabled={deleting === selectedFileId}
                      className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-bold uppercase tracking-tighter transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deleting === selectedFileId ? "Deleting..." : "Delete"}</span>
                    </button>
                  </div>
                  {(deleteError || reconstructError) && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
                      {deleteError || reconstructError}
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


