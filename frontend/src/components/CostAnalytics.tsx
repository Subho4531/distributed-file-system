interface Props {
  algorithm: string;
  online: number;
  needed: number;
  survivable: number;
}

export default function CostAnalytics({
  algorithm,
  online,
  needed,
  survivable,
}: Props) {
  const algorithmConfig: Record<string, { icon: string; bgColor: string }> = {
    replication: { icon: "📋", bgColor: "bg-blue-500/20" },
    "reed-solomon": { icon: "🔢", bgColor: "bg-purple-500/20" },
  };

  const config = algorithmConfig[algorithm] || { icon: "⚙️", bgColor: "bg-gray-500/20" };

  return (
    <div className="card-dark rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 rounded-xl ${config.bgColor} border border-slate-600 flex items-center justify-center text-2xl mr-4`}>
          {config.icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Storage Analytics</h3>
          <p className="text-sm text-gray-400">Real-time metrics and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-xs text-gray-400 mb-1">Algorithm</p>
          <p className="font-bold text-white capitalize">{algorithm}</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-xs text-gray-400 mb-1">Online Shards</p>
          <p className="font-bold text-green-400">{online}</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-xs text-gray-400 mb-1">Required Shards</p>
          <p className="font-bold text-blue-400">{needed}</p>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-xs text-gray-400 mb-1">Survivable Failures</p>
          <p className="font-bold text-yellow-400">{survivable}</p>
        </div>
      </div>
    </div>
  );
}
