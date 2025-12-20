interface Props {
    onToggle: (nodeId: string) => void;
  }
  
  export default function NodeFailureToggle({ onToggle }: Props) {
    const nodes = ["node-1", "node-2", "node-3", "node-4", "node-5"];
  
    return (
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Simulate Node Failure</h3>
        <div className="flex gap-2 flex-wrap">
          {nodes.map((n) => (
            <button
              key={n}
              onClick={() => onToggle(n)}
              className="px-3 py-1 border rounded text-sm"
            >
              Toggle {n}
            </button>
          ))}
        </div>
      </div>
    );
  }
  