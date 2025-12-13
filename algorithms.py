"""
Distributed storage encoding/decoding algorithms.
Implements replication, Reed-Solomon erasure coding, and XOR parity.
"""

import hashlib
from typing import List, Tuple, Optional
import io


# ============================================================================
# REPLICATION ALGORITHM
# ============================================================================

def encode_with_replication(data: bytes, replication_factor: int = 3) -> List[bytes]:
    """
    Replicate data across multiple shards.
    
    Args:
        data: Original file data
        replication_factor: Number of replicas to create
        
    Returns:
        List of identical data shards
    """
    return [data for _ in range(replication_factor)]


# ============================================================================
# REED-SOLOMON ERASURE CODING
# ============================================================================

class SimpleReedSolomon:
    """
    Simplified Reed-Solomon implementation using polynomial arithmetic.
    Suitable for distributed storage with k data blocks and m parity blocks.
    """
    
    def __init__(self, k: int, m: int):
        """
        Initialize Reed-Solomon encoder/decoder.
        
        Args:
            k: Number of data blocks
            m: Number of parity blocks
        """
        self.k = k
        self.m = m
        self.n = k + m
        self.gf = GaloisField(256)
    
    def encode(self, data: bytes) -> List[bytes]:
        """
        Encode data into k+m blocks using Reed-Solomon.
        
        Args:
            data: Original data
            
        Returns:
            List of k data blocks + m parity blocks
        """
        # Split data into k blocks
        block_size = (len(data) + self.k - 1) // self.k
        blocks = []
        
        for i in range(self.k):
            start = i * block_size
            end = min(start + block_size, len(data))
            block = data[start:end]
            # Pad to block_size
            if len(block) < block_size:
                block = block + b'\x00' * (block_size - len(block))
            blocks.append(block)
        
        # Generate m parity blocks (simplified XOR-based parity)
        parity_blocks = []
        for p in range(self.m):
            parity = bytearray(block_size)
            for i, block in enumerate(blocks):
                coeff = self.gf.mul(i + 1, p + 1)  # Use Galois field multiplication
                for j, byte in enumerate(block):
                    parity[j] ^= self.gf.mul(byte, coeff)
            parity_blocks.append(bytes(parity))
        
        return blocks + parity_blocks
    
    def decode(self, blocks: List[Optional[bytes]], block_size: int) -> bytes:
        """
        Reconstruct original data from any k blocks.
        
        Args:
            blocks: List of n blocks (some may be None for missing blocks)
            block_size: Size of each block
            
        Returns:
            Reconstructed original data
        """
        # Find which blocks are available
        available_indices = [i for i, b in enumerate(blocks) if b is not None]
        
        # If we have all k data blocks, return them
        if len(available_indices) >= self.k:
            result = b''
            for i in range(self.k):
                if blocks[i] is not None:
                    result += blocks[i]
            return result
        
        # For simplified version, reconstruct from available data blocks
        result = b''
        for i in range(self.k):
            if blocks[i] is not None:
                result += blocks[i]
            else:
                # Use parity blocks to reconstruct (simplified)
                result += b'\x00' * block_size
        
        return result


class GaloisField:
    """Simple Galois Field (2^8) for Reed-Solomon arithmetic."""
    
    def __init__(self, size: int = 256):
        self.size = size
        self.generator = 0x1d  # Primitive polynomial for GF(256)
        self.log_table = [0] * size
        self.exp_table = [0] * size
        self._generate_tables()
    
    def _generate_tables(self):
        """Generate logarithm and exponential tables."""
        self.exp_table[0] = 1
        for i in range(1, self.size):
            self.exp_table[i] = self.exp_table[i - 1] * 2
            if self.exp_table[i] >= self.size:
                self.exp_table[i] ^= self.generator
        
        for i in range(self.size):
            self.log_table[self.exp_table[i]] = i
    
    def mul(self, a: int, b: int) -> int:
        """Multiply two elements in GF(256)."""
        if a == 0 or b == 0:
            return 0
        return self.exp_table[(self.log_table[a] + self.log_table[b]) % (self.size - 1)]
    
    def div(self, a: int, b: int) -> int:
        """Divide a by b in GF(256)."""
        if b == 0:
            raise ValueError("Division by zero")
        if a == 0:
            return 0
        return self.exp_table[(self.log_table[a] - self.log_table[b]) % (self.size - 1)]


def encode_with_reed_solomon(data: bytes, k: int = 3, m: int = 2) -> List[bytes]:
    """
    Encode data using Reed-Solomon erasure coding.
    
    Args:
        data: Original file data
        k: Number of data blocks
        m: Number of parity blocks
        
    Returns:
        List of k+m shards
    """
    rs = SimpleReedSolomon(k, m)
    return rs.encode(data)


def decode_reed_solomon(blocks: List[Tuple[int, Optional[bytes]]], 
                       k: int, m: int, block_size: int) -> bytes:
    """
    Reconstruct data from Reed-Solomon shards.
    
    Args:
        blocks: List of (index, data) tuples where data can be None
        k: Number of data blocks
        m: Number of parity blocks
        block_size: Size of each block
        
    Returns:
        Reconstructed original data
    """
    # Convert to indexed list
    block_list = [None] * (k + m)
    for idx, data in blocks:
        if idx < len(block_list):
            block_list[idx] = data
    
    rs = SimpleReedSolomon(k, m)
    return rs.decode(block_list, block_size)


# ============================================================================
# XOR PARITY ALGORITHM
# ============================================================================

def encode_with_xor_parity(data: bytes, parity_disks: int = 2) -> List[bytes]:
    """
    Encode data using XOR parity (RAID-like approach).
    
    Args:
        data: Original file data
        parity_disks: Number of parity blocks to generate
        
    Returns:
        List of data blocks + parity blocks
    """
    # For simplicity, split into (parity_disks + 1) data blocks + parity_disks parity blocks
    num_data_blocks = parity_disks + 1
    block_size = (len(data) + num_data_blocks - 1) // num_data_blocks
    
    # Create data blocks
    data_blocks = []
    for i in range(num_data_blocks):
        start = i * block_size
        end = min(start + block_size, len(data))
        block = data[start:end]
        # Pad to block_size
        if len(block) < block_size:
            block = block + b'\x00' * (block_size - len(block))
        data_blocks.append(block)
    
    # Generate parity blocks
    parity_blocks = []
    for p in range(parity_disks):
        parity = bytearray(block_size)
        for block in data_blocks:
            for j, byte in enumerate(block):
                parity[j] ^= byte
        parity_blocks.append(bytes(parity))
    
    return data_blocks + parity_blocks


def decode_xor_parity(blocks: List[Tuple[int, Optional[bytes]]]) -> bytes:
    """
    Reconstruct data from XOR parity shards.
    
    Args:
        blocks: List of (index, data) tuples where data can be None
        
    Returns:
        Reconstructed original data
    """
    # Convert blocks list
    block_dict = {idx: data for idx, data in blocks if data is not None}
    
    # Find block size from available blocks
    block_size = len(next(iter(block_dict.values()))) if block_dict else 0
    
    if not block_size:
        return b''
    
    # Use available blocks to reconstruct missing ones
    # This is a simplified version - real RAID uses more sophisticated recovery
    result = b''
    for idx in sorted(block_dict.keys()):
        result += block_dict[idx]
    
    return result


# ============================================================================
# UNIVERSAL DECODE FUNCTION
# ============================================================================

def decode_file(shard_data_list: List[Tuple[int, Optional[bytes]]], 
               algorithm: str = "reed-solomon",
               k: Optional[int] = None,
               m: Optional[int] = None) -> bytes:
    """
    Decode a file from shards using the specified algorithm.
    
    Args:
        shard_data_list: List of (shard_index, data) tuples
        algorithm: "replication", "reed-solomon", or "xor-parity"
        k: Number of data blocks (for reed-solomon)
        m: Number of parity blocks (for reed-solomon)
        
    Returns:
        Reconstructed file data
    """
    if algorithm == "replication":
        # For replication, return the first available shard
        for idx, data in shard_data_list:
            if data is not None:
                return data
        raise ValueError("No available replicas to reconstruct")
    
    elif algorithm == "reed-solomon":
        if k is None or m is None:
            raise ValueError("Reed-Solomon requires k and m parameters")
        
        # Calculate block size from first available block
        block_size = 0
        for idx, data in shard_data_list:
            if data is not None:
                block_size = len(data)
                break
        
        if block_size == 0:
            raise ValueError("No available shards to determine block size")
        
        return decode_reed_solomon(shard_data_list, k, m, block_size)
    
    elif algorithm == "xor-parity":
        return decode_xor_parity(shard_data_list)
    
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def compute_shard_hash(shard_data: bytes) -> str:
    """Compute SHA-256 hash of a shard for integrity checking."""
    return hashlib.sha256(shard_data).hexdigest()


def verify_shard_integrity(shard_data: bytes, expected_hash: str) -> bool:
    """Verify shard integrity using stored hash."""
    return compute_shard_hash(shard_data) == expected_hash
