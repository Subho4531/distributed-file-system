import { motion } from "framer-motion";
import { Shield, Cpu, Database, CheckCircle2 } from "lucide-react";

export default function Comparison() {
    const algorithms = [
        {
            id: "replication",
            name: "Replication",
            icon: Shield,
            color: "emerald",
            storage: "3.0x (2.1x compressed)",
            recovery: "Highly Resilient",
            compute: "Near Zero",
            bestFor: "Small metadata, high-access files",
            details: "Multiplies data shards across independent nodes. Optional compression reduces overhead by ~30%. If any one node survives, data is safe."
        },
        {
            id: "reed-solomon",
            name: "Reed-Solomon",
            icon: Cpu,
            color: "blue",
            storage: "1.67x (1.2x compressed)",
            recovery: "Tunable Safety",
            compute: "High (Matrix Math)",
            bestFor: "Large files, long-term archival",
            details: "Uses Cauchy-Vandermonde matrices to create 'erasure shards'. Compression reduces storage by ~30%. Can lose M shards and still recover."
        }
    ];

    return (
        <div className="space-y-16 py-10">
            <div className="text-center space-y-4">
                <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">Academic Review</h2>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
                    Protocol <span className="text-gradient">Analysis</span>
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto font-medium text-lg">
                    Understanding the mathematical trade-offs between storage efficiency and data survivability.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {algorithms.map((algo, i) => (
                    <motion.div
                        key={algo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="premium-glass p-8 space-y-8 group hover:border-white/10 transition-all flex flex-col"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`w-16 h-16 rounded-3xl bg-${algo.color}-500/10 flex items-center justify-center text-${algo.color}-400 group-hover:scale-110 transition-transform`}>
                                <algo.icon className="w-8 h-8" />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-${algo.color}-500/10 text-${algo.color}-400 rounded-full border border-${algo.color}-500/20`}>
                                Lvl 4 Logic
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{algo.name}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{algo.details}</p>
                        </div>

                        <div className="space-y-4 flex-grow">
                            <div className="p-4 bg-white/5 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage Overhead</span>
                                    <span className="text-xs font-bold text-white">{algo.storage}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compute Load</span>
                                    <span className="text-xs font-bold text-white">{algo.compute}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resilience</span>
                                    <span className="text-xs font-bold text-emerald-400">{algo.recovery}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compression</span>
                                    <span className="text-xs font-bold text-blue-400">~30% Reduction</span>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3 p-4 border border-white/5 rounded-2xl">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Recommended Use</p>
                                    <p className="text-xs font-bold text-slate-300">{algo.bestFor}</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-4 rounded-2xl bg-slate-900 border border-white/5 text-white font-black text-xs uppercase italic tracking-tighter hover:bg-white/5 transition-colors">
                            Read Technical Spec
                        </button>
                    </motion.div>
                ))}
            </div>

            {/* Comparison Table */}
            <div className="premium-glass p-10 overflow-x-auto">
                <h3 className="text-2xl font-black text-white mb-8 uppercase italic tracking-tighter flex items-center">
                    <Database className="w-6 h-6 mr-3 text-blue-500" /> Mathematical Comparison
                </h3>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol</th>
                            <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Space Efficiency</th>
                            <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recovery Math</th>
                            <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Failure Tolerance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {[
                            { name: "Replication (3x)", efficiency: "33.3%", math: "Identity Mapping", tolerance: "N-1 Nodes" },
                            { name: "Replication + Compression", efficiency: "47.6%", math: "Identity + DEFLATE", tolerance: "N-1 Nodes" },
                            { name: "Reed-Solomon (k=4, m=2)", efficiency: "66.7%", math: "Galois Field / Vandermonde", tolerance: "2 Nodes" },
                            { name: "Reed-Solomon + Compression", efficiency: "83.3%", math: "Galois Field + DEFLATE", tolerance: "2 Nodes" }
                        ].map((row, i) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                                <td className="py-6 font-bold text-white">{row.name}</td>
                                <td className="py-6 font-medium text-slate-400">{row.efficiency}</td>
                                <td className="py-6 font-medium text-slate-400 font-mono text-xs">{row.math}</td>
                                <td className="py-6 font-bold text-emerald-400">{row.tolerance}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
