import type { ShardStatus } from "../types/file";

interface ShardCardProps {
  shard: ShardStatus;
}

export default function ShardCard({ shard }: ShardCardProps) {
  const isOnline = shard.status === "online";

  return (
    <div
      className={`rounded-lg border p-4 text-sm
        ${
          isOnline
            ? "border-green-400 bg-green-50"
            : "border-red-400 bg-red-50"
        }`}
    >
      <div className="flex justify-between mb-2">
        <span className="font-semibold">
          Shard #{shard.shard_index}
        </span>

        <span
          className={`px-2 py-0.5 rounded text-xs font-medium
            ${
              isOnline
                ? "bg-green-200 text-green-800"
                : "bg-red-200 text-red-800"
            }`}
        >
          {shard.status.toUpperCase()}
        </span>
      </div>

      <p>📍 Node: {shard.bucket}</p>
      <p>💾 Size: {shard.size} bytes</p>
    </div>
  );
}
