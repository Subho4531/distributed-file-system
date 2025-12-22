import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Activity, Server, AlertCircle, Shield, Database, HardDrive, Zap } from "lucide-react";
import { fetchNodeStatus, fetchFiles } from "../api/cosmeon";
import type { NodesStatusResponse } from "../types/node";
import NodeCard from "../components/NodeCard";

export default function Dashboard() {
  const [data, setData] = useState<NodesStatusResponse | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Dashboard: Loading data...');
      const [nodeRes, filesRes] = await Promise.all([
        fetchNodeStatus().catch(err => {
          console.warn("Node status fetch failed:", err);
          return { total_nodes: 0, online_nodes: 0, nodes: [] };
        }),
        fetchFiles().catch(err => {
          console.warn("Files fetch failed:", err);
          return [];
        })
      ]);
      
      console.log('Dashboard: Data loaded', { nodeRes, filesRes });
      setData(nodeRes);
      setFiles(Array.isArray(filesRes) ? filesRes : []);
      setError(null);
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      setError(err.message || "Failed to fetch cluster data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate cluster statistics with safe defaults
  const totalFiles = files.length;
  const totalStorage = data?.nodes.reduce((sum, node) => {
    const capacity = node.capacity_bytes || (node.capacity_gb ? node.capacity_gb * 1024 * 1024 * 1024 : 50 * 1024 * 1024 * 1024);
    return sum + capacity;
  }, 0) || 0;
  const usedStorage = data?.nodes.reduce((sum, node) => {
    const used = node.used_bytes || 0;
    return sum + used;
  }, 0) || 0;
  const clusterUtilization = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;
  
  // Calculate average storage overhead from files
  const averageOverhead = files.length > 0 
    ? files.reduce((sum, file) => sum + (file.cost_estimate || 0), 0) / files.length 
    : 0;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <motion.div
            className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-slate-400 font-medium animate-pulse">Synchronizing Cluster Data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-red-500/30 max-w-md shadow-2xl shadow-red-500/10"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
          <p className="text-red-400 font-medium mb-6">{error}</p>
          <button
            onClick={loadData}
            className="button-premium px-8 py-3 text-white"
          >
            Retry Connection
          </button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-16">
      {/* Hero / System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-blue-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold tracking-widest uppercase">Network Analytics</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
              Distributed <span className="text-gradient">Intelligence</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl">
              ShardX isn't just storage. It's a self-healing, intelligent cluster that fragments your data across global nodes using advanced parity logic.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={loadData}
              disabled={loading}
              className="premium-glass px-6 py-3 text-white rounded-xl font-bold text-sm flex items-center space-x-3 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span>{loading ? 'Syncing...' : 'Diagnostic Sync'}</span>
            </button>
            <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Health: Operational</span>
            </div>
            {error && (
              <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-3 h-3" />
                <span>Partial Data</span>
              </div>
            )}
          </div>
        </div>

        <div className="premium-glass p-8 flex flex-col justify-center space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">Cluster Vitals</h3>
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-black text-white tracking-tighter italic">{data.total_nodes}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Nodes</p>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-400 tracking-tighter italic">{data.online_nodes}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Nodes</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.total_nodes > 0 ? (data.online_nodes / data.total_nodes) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Cluster Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-glass p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Files</span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{totalFiles}</p>
            <p className="text-xs text-slate-500">Distributed Assets</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-glass p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <HardDrive className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Storage</span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{Math.round(totalStorage / (1024**3))} GB</p>
            <p className="text-xs text-slate-500">Total Capacity</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-glass p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Usage</span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{clusterUtilization.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">Cluster Utilization</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="premium-glass p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Overhead</span>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400">
              {averageOverhead > 0 ? `${averageOverhead.toFixed(1)}x` : "N/A"}
            </p>
            <p className="text-xs text-slate-500">Avg Storage Cost</p>
          </div>
        </motion.div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-glass p-8 space-y-4 hover:border-white/10 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Smart Engine</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Algorithms selected dynamically based on file importance and size.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-glass p-8 space-y-4 hover:border-white/10 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Fault Tolerance</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Reed-Solomon redundancy ensures data survival even if multiple nodes fail.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="premium-glass p-8 space-y-4 hover:border-white/10 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Cost Efficiency</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Optimized storage footprint without compromising reliability.
          </p>
        </motion.div>
      </div>

      {/* Node Infrastructure */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Node Infrastructure</h2>
          </div>
          <div className="text-sm text-slate-400">
            {data.online_nodes}/{data.total_nodes} nodes online
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {data.nodes && data.nodes.length > 0 ? (
            data.nodes.map((node, index) => (
              <motion.div
                key={node.node_id || `node-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <NodeCard node={node} onNodeStatusChange={loadData} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <Server className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-400 mb-2">No Nodes Available</h3>
              <p className="text-sm text-slate-500 max-w-md">
                No storage nodes are currently available. Check your connection and try refreshing.
              </p>
              <button
                onClick={loadData}
                className="mt-4 px-6 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-colors"
              >
                Refresh Nodes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

