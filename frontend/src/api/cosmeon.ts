import axios from "axios";

// Use environment variable or fallback to production URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://distributed-file-system-41mt.vercel.app/";

export const cosmeonAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// --------------------
// Nodes
// --------------------
export async function fetchNodeStatus() {
  console.log('API: Fetching node status...');
  try {
    const res = await cosmeonAPI.get("/nodes/status");
    console.log('API: Node status response:', res.data);
    return res.data;
  } catch (error) {
    console.error('API: Failed to fetch node status:', error);
    throw error;
  }
}

// --------------------
// Files
// --------------------
export async function fetchFiles() {
  const res = await cosmeonAPI.get("/files");
  return res.data;
}

// --------------------
// File status
// --------------------
export async function fetchFileStatus(fileId: string) {
  const res = await cosmeonAPI.get(`/file/${fileId}/status`);
  return res.data;
}

// --------------------
// Reconstruct file info
// --------------------
export async function getReconstructInfo(fileId: string) {
  const res = await cosmeonAPI.get(`/file/${fileId}/reconstruct-info`);
  return res.data;
}

// --------------------
// Reconstruct and download file
// --------------------
export async function reconstructFile(fileId: string) {
  // This will trigger the actual download
  const response = await cosmeonAPI.get(`/file/${fileId}/reconstruct`, {
    responseType: 'blob'
  });
  return response;
}

// --------------------
// Delete file
// --------------------
export async function deleteFile(fileId: string) {
  const res = await cosmeonAPI.delete(`/file/${fileId}`);
  return res.data;
}

// --------------------
// Node simulation
// --------------------
export async function simulateNodeFailure(nodeId: string) {
  console.log(`API: Simulating failure for node ${nodeId}`);
  try {
    const res = await cosmeonAPI.post(`/nodes/${nodeId}/simulate-failure`);
    console.log(`API: Simulate failure response:`, res.data);
    return res.data;
  } catch (error) {
    console.error(`API: Failed to simulate failure for node ${nodeId}:`, error);
    throw error;
  }
}

export async function restoreNode(nodeId: string) {
  console.log(`API: Restoring node ${nodeId}`);
  try {
    const res = await cosmeonAPI.post(`/nodes/${nodeId}/restore`);
    console.log(`API: Restore response:`, res.data);
    return res.data;
  } catch (error) {
    console.error(`API: Failed to restore node ${nodeId}:`, error);
    throw error;
  }
}

export async function getFailureStatus() {
  const res = await cosmeonAPI.get("/nodes/failures");
  return res.data;
}
