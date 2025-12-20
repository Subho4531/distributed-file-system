import type { NodeStatus } from "../types/node";
import { useState } from "react";
import { Server, Database, Activity, Monitor, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface NodeCardProps {
  node: NodeStatus;
}

export default function NodeCard({ node }: NodeCardProps) {
  const [forcedOffline, setForcedOffline] = useState(false);
  const isOnline = node.status === "online" && !forcedOffline;

  return (
    <div className="premium-glass p-0 group overflow-visible">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-xl transition-colors duration-500",
              isOnline ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-500"
            )}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-tight">{node.node_id}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center">
                <Monitor className="w-3 h-3 mr-1" /> Primary Cluster
              </p>
            </div>
          </div>

          <div className={cn(
            "flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter border",
            isOnline
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
            {isOnline ? "ACTIVE" : "OFFLINE"}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
              <Database className="w-3 h-3 mr-1" /> Files
            </span>
            <p className="text-xl font-bold text-white">{node.files_count}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-end">
              Capacity <Activity className="w-3 h-3 ml-1" />
            </span>
            <p className="text-xl font-bold text-white">{node.capacity || "500 GB"}</p>
          </div>
        </div>

        {/* Capacity Visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Utilization</span>
            <span>{isOnline ? "12%" : "0%"}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: isOnline ? "12%" : "0%" }}
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                isOnline ? "from-blue-500 to-purple-500" : "bg-slate-700"
              )}
            />
          </div>
        </div>

        {/* Action Toggle */}
        <button
          onClick={() => setForcedOffline(!forcedOffline)}
          className={cn(
            "w-full py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center space-x-2 border",
            forcedOffline
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-slate-800/50 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
          )}
        >
          {forcedOffline ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Restore Node Connection</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>Simulate Node Failure</span>
            </>
          )}
        </button>
      </div>

      {/* Warning Overlay for Offline Status */}
      {!isOnline && (
        <div className="absolute inset-0 rounded-2xl bg-rose-950/20 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
          <div className="bg-rose-500 text-white p-1 rounded-full scale-150 shadow-2xl shadow-rose-500/50">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}

