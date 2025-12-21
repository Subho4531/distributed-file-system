"""
Node failure simulation system for COSMEON distributed storage.
Manages simulated node failures that affect API responses and file reconstruction.
"""

from typing import Set, Dict, Any
from datetime import datetime
import threading

class NodeFailureSimulator:
    """Manages simulated node failures across the system"""
    
    def __init__(self):
        self._failed_nodes: Set[str] = set()
        self._lock = threading.Lock()
        self._failure_history: Dict[str, datetime] = {}
    
    def simulate_failure(self, node_id: str) -> bool:
        """Simulate a node failure"""
        with self._lock:
            if node_id not in self._failed_nodes:
                self._failed_nodes.add(node_id)
                self._failure_history[node_id] = datetime.utcnow()
                print(f"[SIMULATOR] Node {node_id} marked as FAILED")
                return True
            return False
    
    def restore_node(self, node_id: str) -> bool:
        """Restore a failed node"""
        with self._lock:
            if node_id in self._failed_nodes:
                self._failed_nodes.remove(node_id)
                if node_id in self._failure_history:
                    del self._failure_history[node_id]
                print(f"[SIMULATOR] Node {node_id} RESTORED")
                return True
            return False
    
    def is_node_failed(self, node_id: str) -> bool:
        """Check if a node is currently failed"""
        with self._lock:
            return node_id in self._failed_nodes
    
    def get_failed_nodes(self) -> Set[str]:
        """Get all currently failed nodes"""
        with self._lock:
            return self._failed_nodes.copy()
    
    def get_online_nodes(self, all_nodes: list) -> list:
        """Filter out failed nodes from a list of all nodes"""
        with self._lock:
            return [node for node in all_nodes if node not in self._failed_nodes]
    
    def get_failure_info(self) -> Dict[str, Any]:
        """Get detailed failure information"""
        with self._lock:
            return {
                "failed_nodes": list(self._failed_nodes),
                "failure_count": len(self._failed_nodes),
                "failure_history": {
                    node: timestamp.isoformat() 
                    for node, timestamp in self._failure_history.items()
                }
            }
    
    def clear_all_failures(self) -> int:
        """Clear all simulated failures"""
        with self._lock:
            count = len(self._failed_nodes)
            self._failed_nodes.clear()
            self._failure_history.clear()
            print(f"[SIMULATOR] Cleared {count} simulated failures")
            return count

# Global instance
node_simulator = NodeFailureSimulator()