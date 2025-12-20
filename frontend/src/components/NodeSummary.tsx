import type { NodeStatus } from "../types/node";
import SummaryCard from "./SummaryCard";
import { Server, CheckCircle, XCircle, HeartPulse } from "lucide-react";

interface NodeSummaryProps {
  nodes: NodeStatus[];
}

export default function NodeSummary({ nodes }: NodeSummaryProps) {
  const total = nodes.length;
  const online = nodes.filter((n) => n.status === "online").length;
  const offline = total - online;

  let healthLabel = "Excellent";
  let healthColor: "blue" | "green" | "red" | "purple" | "yellow" = "green";
  let healthValue = 100;

  if (offline === 1) {
    healthLabel = "Warning";
    healthColor = "yellow";
    healthValue = 75;
  }

  if (offline >= 2) {
    healthLabel = "Critical";
    healthColor = "red";
    healthValue = 35;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      <SummaryCard
        title="Total Nodes"
        value={total}
        color="blue"
        icon={Server}
      />
      <SummaryCard
        title="Active Nodes"
        value={online}
        color="green"
        icon={CheckCircle}
      />
      <SummaryCard
        title="Failed Nodes"
        value={offline}
        color="red"
        icon={XCircle}
      />
      <SummaryCard
        title="Cluster Health"
        value={healthValue}
        color={healthColor}
        icon={HeartPulse}
        suffix="%"
        subtitle={healthLabel}
      />
    </div>
  );
}

