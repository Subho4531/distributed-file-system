export interface ShardStatus {
  shard_index: number;
  bucket: string;
  status: "online" | "offline";
  size: number;
}

export interface FileStatusResponse {
  file_id: string;
  filename: string;
  algorithm: string;
  shard_status: ShardStatus[];
  online_shards: number;
  needed_shards: number;
  can_survive_more: number;
  reconstructable: boolean;
  health: "healthy" | "degraded" | "critical";
}
