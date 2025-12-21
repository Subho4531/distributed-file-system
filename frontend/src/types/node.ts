export interface NodeStatus {
  node_id: string;
  status: "online" | "offline";
  files_count: number;
  capacity_gb?: number;
  capacity_bytes?: number;
  used_bytes?: number;
  utilization_percent?: number;
  available_bytes?: number;
  last_checked: string;
  simulated_failure?: boolean;
  // Legacy support
  capacity?: string;
}

export interface NodesStatusResponse {
  total_nodes: number;
  online_nodes: number;
  nodes: NodeStatus[];
}
