import type { NodeStatus } from "../types/node";
import { useState } from "react";
import { Server, Database, Activity, Monitor, AlertTriangle, ShieldCheck, HardDrive } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface NodeCardProps {
  node: NodeStatus;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function NodeCard({ node }: NodeCardProps) {
  const [forcedOffline, setForcedOffline] = useState(false);
  
  // Provide default values to prevent errors
  const nodeData = {
    node_id: node?.node_id || 'Unknown Node',
    status: node?.status || 'offline',
    files_count: node?.files_count || 0,
    capacity_gb: node?.capacity_gb || (node?.capacity ? parseInt(node.capacity.replace(/\D/g, '')) || 50 : 50),
    capacity_bytes: node?.capacity_bytes || (node?.capacity_gb ? node.capacity_gb * 1024 * 1024 * 1024 : 50 * 1024 * 1024 * 1024),
    used_bytes: node?.used_bytes || 0,
    utilization_percent: node?.utilization_percent || 0,
    available_bytes: node?.available_bytes || (node?.capacity_bytes ? node.capacity_bytes - (node?.used_bytes || 0) : 50 * 1024 * 1024 * 1024),
    last_checked: node?.last_checked || new Date().toISOString()
  };
  
  const isOnline = nodeData.status === "online" && !forcedOffline;
  
  // Calculate display values with safe defaults
  const displayUtilization = isOnline ? Math.max(0, Math.min(100, nodeData.utilization_percent)) : 0;
  const displayUsed = isOnline ? nodeData.used_bytes : 0;
  const displayFiles = isOnline ? nodeData.files_count : 0;

  return (
    <div className="premium-glass p-0 group overflow-visible relative">
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
              <h3 className="font-bold text-white tracking-tight">{nodeData.node_id}</h3>
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
            <p className="text-xl font-bold text-white">{displayFiles}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-end">
              Capacity <HardDrive className="w-3 h-3 ml-1" />
            </span>
            <p className="text-xl font-bold text-white">{nodeData.capacity_gb} GB</p>
          </div>
        </div>

        {/* Storage Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Storage Usage</span>
            <span className="text-[10px] font-bold text-slate-300">
              {formatBytes(displayUsed)} / {formatBytes(nodeData.capacity_bytes)}
            </span>
          </div>
          
          {/* Capacity Visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Utilization</span>
              <span>{displayUtilization.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, displayUtilization))}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isOnline 
                    ? displayUtilization > 80 
                      ? "bg-gradient-to-r from-red-500 to-orange-500" 
                      : displayUtilization > 60 
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-500"
                    : "bg-slate-700"
                )}
              />
            </div>
          </div>

          {/* Available Space */}
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Available:</span>
            <span className="font-bold">
              {formatBytes(isOnline ? nodeData.available_bytes : nodeData.capacity_bytes)}
            </span>
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl bg-rose-950/30 backdrop-blur-[2px] pointer-events-none flex items-center justify-center border-2 border-rose-500/30"
        >
          <div className="bg-rose-500 text-white p-2 rounded-full shadow-2xl shadow-rose-500/50">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

