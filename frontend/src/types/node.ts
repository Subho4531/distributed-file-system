export interface NodeStatus {
  node_id: string;
  status: "online" | "offline";
  files_count: number;
  capacity?: string;
  last_checked: string;
}

export interface NodesStatusResponse {
  total_nodes: number;
  online_nodes: number;
  nodes: NodeStatus[];
}
