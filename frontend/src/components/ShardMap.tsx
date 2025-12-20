import type { ShardStatus } from "../types/file";

interface ShardMapProps {
  shards: ShardStatus[];
}

export default function ShardMap({ shards }: ShardMapProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {shards.map((shard, index) => {
        const isOnline = shard.status === "online";

        return (
          <div
            key={shard.shard_index}
            className={`
              card-dark rounded-xl p-5 border-2 card-hover animate-slide-up
              ${
                isOnline
                  ? "card-teal border-teal-500/40"
                  : "card-red border-red-500/40"
              }
            `}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold
                    ${
                      isOnline
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }
                  `}
                >
                  {isOnline ? "✓" : "✗"}
                </div>
                <div>
                  <p className="font-bold text-white">{shard.bucket}</p>
                  <p className="text-xs text-gray-400">Storage Node</p>
                </div>
              </div>

              <span
                className={`
                  px-3 py-1 rounded-full text-xs font-bold
                  ${
                    isOnline
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }
                `}
              >
                {shard.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">🧩 Shard Index</span>
                <span className="font-mono font-semibold text-white">
                  {shard.shard_index}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">📦 Size</span>
                <span className="font-mono font-semibold text-white">
                  {Math.round(shard.size / 1024)} KB
                </span>
              </div>
            </div>

            {!isOnline && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-xs text-red-400 font-medium flex items-center">
                  <span className="mr-1.5">⚠️</span>
                  Missing shard — recovery needed
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
