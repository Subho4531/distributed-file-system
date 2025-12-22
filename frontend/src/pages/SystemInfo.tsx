import { Cpu, Code2, Database, Layers, Globe } from "lucide-react";

export default function SystemInfo() {
    const stack = [
        { name: "FastAPI", category: "Backend Engine", desc: "Asynchronous Python framework for hyper-fast shard orchestration.", icon: Zap },
        { name: "Supabase", category: "Persistence Layer", desc: "Distributed object storage and PostgreSQL for cluster metadata.", icon: Database },
        { name: "React + Vite", category: "Frontend Core", desc: "Aesthetic, hardware-accelerated UI for real-time node monitoring.", icon: Code2 },
        { name: "Reed-Solomon", category: "Mathematical Core", desc: "Erasure coding logic for industrial-grade data survivability.", icon: Cpu }
    ];

    return (
        <div className="space-y-20 py-10 max-w-5xl mx-auto">
            <div className="text-center space-y-6">
                <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic">
                    System <span className="text-gradient">Architecture</span>
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto font-medium text-xl leading-relaxed">
                    COSMEON is a next-generation distributed file system designed for mission-critical data resilience.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="premium-glass p-10 space-y-8">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center">
                        <Layers className="w-8 h-8 mr-4 text-blue-500" /> Core Stack
                    </h2>
                    <div className="space-y-6">
                        {stack.map((item, i) => (
                            <div key={i} className="flex items-start space-x-6 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white tracking-tight uppercase italic leading-none mb-1">{item.name}</h4>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{item.category}</p>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="premium-glass p-10 space-y-6">
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter flex items-center">
                            <Globe className="w-8 h-8 mr-4 text-emerald-500" /> Topography
                        </h2>
                        <div className="space-y-4">
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Data is ingested, analyzed by the <span className="text-blue-400 font-bold">Smart Engine</span>, and then fragmented into cryptographic shards.
                            </p>
                            <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-300">Cluster Status: Synchronized</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <span className="text-xs font-bold text-slate-300">Latency: 45ms Avg</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <span className="text-xs font-bold text-slate-300">Throughput: 1.2 GB/s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-glass p-10 space-y-6 border-blue-500/20">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Design Philosophy</h3>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">
                            We prioritize transparency. Every shard is trackable, every algorithm is explained, and every failure is simulated to provide complete confidence in data integrity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center pt-10">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4">Developed by COSMEON Engineering</p>
                <div className="flex justify-center space-x-8">
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                </div>
            </div>
        </div>
    );
}

function Zap(props: any) {
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
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    );
}
