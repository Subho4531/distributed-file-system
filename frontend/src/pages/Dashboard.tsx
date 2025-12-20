import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Activity, Server, AlertCircle, Shield } from "lucide-react";
import { fetchNodeStatus } from "../api/cosmeon";
import type { NodesStatusResponse } from "../types/node";
import NodeCard from "../components/NodeCard";

export default function Dashboard() {
  const [data, setData] = useState<NodesStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetchNodeStatus();
      setData(res);
      setError(null);
    } catch (err) {
      setError("Failed to fetch node status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
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

  if (error) {
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
            className="button-premium px-8 py-2 text-white"
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
              COSMEON isn't just storage. It's a self-healing, intelligent cluster that fragments your data across global nodes using advanced parity logic.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={loadData}
              className="premium-glass px-6 py-3 text-white rounded-xl font-bold text-sm flex items-center space-x-3 hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>Diagnostic Sync</span>
            </button>
            <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Health: Operational</span>
            </div>
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
              animate={{ width: `${(data.online_nodes / data.total_nodes) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Why COSMEON? / Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Smart Engine",
            desc: "Algorithms selected dynamically based on file importance and size.",
            icon: Shield,
            color: "blue"
          },
          {
            title: "Fault Tolerance",
            desc: "N+M redundancy ensures data survival even if multiple nodes fail.",
            icon: AlertCircle,
            color: "purple"
          },
          {
            title: "Cost Efficiency",
            desc: "Optimized storage footprint without compromising reliability.",
            icon: RefreshCw,
            color: "emerald"
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="premium-glass p-8 space-y-4 hover:border-white/10 transition-colors group"
          >
            <div className={`w-12 h-12 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center text-${feature.color}-400 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{feature.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Node Infrastructure</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.nodes.map((node, index) => (
            <motion.div
              key={node.node_id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <NodeCard node={node} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

