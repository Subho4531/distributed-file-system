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
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h3 className="font-semibold mb-2">📊 Storage Analytics</h3>
  
        <ul className="text-sm space-y-1">
          <li>Algorithm: {algorithm}</li>
          <li>Online shards: {online}</li>
          <li>Required shards: {needed}</li>
          <li>Can survive more failures: {survivable}</li>
        </ul>
      </div>
    );
  }
  