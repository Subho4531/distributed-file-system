"""
Smart Storage Engine for intelligent algorithm selection and file analysis.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass
class FileMetadata:
    """Metadata about a file for algorithm selection."""
    filename: str
    extension: str
    size: int = 0
    is_compressible: bool = False
    is_critical: bool = False
    access_pattern: str = "random"  # random, sequential, hot
    
    def get_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for algorithm configuration."""
        return {
            "filename": self.filename,
            "extension": self.extension,
            "size": self.size,
            "is_compressible": self.is_compressible,
            "is_critical": self.is_critical,
            "access_pattern": self.access_pattern,
        }


class SmartStorageEngine:
    """
    Intelligent storage algorithm selector based on file characteristics and policies.
    """
    
    # Algorithm cost multipliers (lower = cheaper)
    ALGORITHM_COSTS = {
        "replication": 3.0,      # 3x storage overhead
        "reed-solomon": 1.67,    # ~1.67x storage overhead for k=3, m=2
        "xor-parity": 1.5,       # 1.5x storage overhead for 2 parity disks
    }
    
    # Compressible file extensions
    COMPRESSIBLE_EXTENSIONS = {
        "txt", "json", "xml", "csv", "log", "sql", "html", "css", "js", 
        "py", "java", "cpp", "c", "h", "pdf", "doc", "docx", "xlsx"
    }
    
    # Critical file extensions (high redundancy needed)
    CRITICAL_EXTENSIONS = {
        "db", "sqlite", "iso", "tar", "zip", "7z", "rar", "vmdk", "vdi"
    }
    
    def __init__(self):
        """Initialize the smart storage engine."""
        self.algorithm_cache = {}
    
    def analyze_file(self, filename: str) -> FileMetadata:
        """
        Analyze file metadata to inform algorithm selection.
        
        Args:
            filename: Name of the file
            
        Returns:
            FileMetadata object with analysis results
        """
        # Extract extension
        extension = filename.split(".")[-1].lower() if "." in filename else ""
        
        # Determine if compressible
        is_compressible = extension in self.COMPRESSIBLE_EXTENSIONS
        
        # Determine if critical
        is_critical = extension in self.CRITICAL_EXTENSIONS
        
        return FileMetadata(
            filename=filename,
            extension=extension,
            is_compressible=is_compressible,
            is_critical=is_critical,
            access_pattern="random"  # Default assumption
        )
    
    def select_algorithm(self, metadata: FileMetadata, policy: str = "balanced") -> Dict[str, Any]:
        """
        Intelligently select storage algorithm based on file metadata and policy.
        
        Args:
            metadata: FileMetadata object with file characteristics
            policy: Selection policy ("cost", "reliability", "balanced")
            
        Returns:
            Decision dict with algorithm, config, reasoning, and cost estimate
        """
        if policy == "cost":
            return self._select_cost_optimized(metadata)
        elif policy == "reliability":
            return self._select_reliability_optimized(metadata)
        else:  # balanced (default)
            return self._select_balanced(metadata)
    
    def _select_cost_optimized(self, metadata: FileMetadata) -> Dict[str, Any]:
        """Select algorithm prioritizing cost."""
        algorithm = "xor-parity"
        config = {"parity_disks": 2}
        cost = self._estimate_cost(algorithm, metadata)
        
        return {
            "algorithm": algorithm,
            "config": config,
            "reasoning": "Cost-optimized: XOR parity provides good cost/redundancy balance",
            "cost_estimate": cost,
        }
    
    def _select_reliability_optimized(self, metadata: FileMetadata) -> Dict[str, Any]:
        """Select algorithm prioritizing reliability."""
        # Critical files get full replication
        if metadata.is_critical or metadata.size > 1_000_000_000:  # > 1GB
            algorithm = "replication"
            config = {"replication_factor": 4}
        else:
            algorithm = "reed-solomon"
            config = {"k": 3, "m": 3}  # More parity blocks for better recovery
        
        cost = self._estimate_cost(algorithm, metadata)
        
        return {
            "algorithm": algorithm,
            "config": config,
            "reasoning": f"Reliability-optimized: {algorithm} for critical/large files",
            "cost_estimate": cost,
        }
    
    def _select_balanced(self, metadata: FileMetadata) -> Dict[str, Any]:
        """Select algorithm balancing cost and reliability."""
        # Small files: replication (simpler, lower overhead for small sizes)
        if metadata.size < 10_000_000:  # < 10MB
            algorithm = "replication"
            config = {"replication_factor": 3}
        # Medium files: Reed-Solomon (good balance)
        elif metadata.size < 1_000_000_000:  # < 1GB
            algorithm = "reed-solomon"
            config = {"k": 4, "m": 2}  # 50% overhead, can recover from 2 failures
        # Large files: XOR parity (cost-effective for large data)
        else:
            algorithm = "xor-parity"
            config = {"parity_disks": 2}
        
        cost = self._estimate_cost(algorithm, metadata)
        
        return {
            "algorithm": algorithm,
            "config": config,
            "reasoning": f"Balanced: {algorithm} chosen for {metadata.filename} ({metadata.size} bytes)",
            "cost_estimate": cost,
        }
    
    def _configure_algorithm(self, algorithm: str, metadata: FileMetadata) -> Dict[str, Any]:
        """
        Configure algorithm parameters based on file metadata.
        
        Args:
            algorithm: Algorithm name ("replication", "reed-solomon", "xor-parity")
            metadata: File metadata
            
        Returns:
            Configuration dict for the algorithm
        """
        if algorithm == "replication":
            # More replicas for critical files
            factor = 4 if metadata.is_critical else 3
            return {"replication_factor": factor}
        
        elif algorithm == "reed-solomon":
            # More parity blocks for critical/large files
            if metadata.is_critical or metadata.size > 500_000_000:
                return {"k": 3, "m": 3}
            else:
                return {"k": 4, "m": 2}
        
        elif algorithm == "xor-parity":
            # More parity disks for critical files
            parity = 3 if metadata.is_critical else 2
            return {"parity_disks": parity}
        
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
    
    def _estimate_cost(self, algorithm: str, metadata: FileMetadata) -> float:
        """
        Estimate storage cost for an algorithm.
        
        Args:
            algorithm: Algorithm name
            metadata: File metadata
            
        Returns:
            Estimated cost (as a multiplier of base file size)
        """
        base_cost = self.ALGORITHM_COSTS.get(algorithm, 1.0)
        
        # Adjust based on file size (economies of scale for large files)
        if metadata.size > 1_000_000_000:  # > 1GB
            base_cost *= 0.9
        
        # Compressible files might benefit from compression (reduce cost)
        if metadata.is_compressible:
            base_cost *= 0.8
        
        return round(base_cost, 2)
    
    def get_algorithm_info(self, algorithm: str) -> Dict[str, Any]:
        """
        Get detailed information about an algorithm.
        
        Args:
            algorithm: Algorithm name
            
        Returns:
            Info dict with description, overhead, recovery capability
        """
        info_map = {
            "replication": {
                "description": "Simple data replication across multiple nodes",
                "overhead": "3x to 4x storage",
                "recovery": "Can recover from (replication_factor - 1) failures",
                "best_for": "Small critical files, high availability",
                "complexity": "Low",
            },
            "reed-solomon": {
                "description": "Erasure coding with k data blocks and m parity blocks",
                "overhead": "~1.67x to 2x storage depending on k and m",
                "recovery": "Can recover from m failures",
                "best_for": "Medium files with good cost/reliability balance",
                "complexity": "Medium",
            },
            "xor-parity": {
                "description": "XOR-based parity for cost-effective redundancy",
                "overhead": "~1.5x to 2x storage depending on parity disks",
                "recovery": "Can recover from parity_disks failures",
                "best_for": "Large files, cost-optimized storage",
                "complexity": "Medium",
            },
        }
        
        return info_map.get(algorithm, {})
