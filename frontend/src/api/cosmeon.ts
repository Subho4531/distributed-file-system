import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const cosmeonAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// --------------------
// Nodes
// --------------------
export async function fetchNodeStatus() {
  const res = await cosmeonAPI.get("/nodes/status");
  return res.data;
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
// Reconstruct file
// --------------------
export async function reconstructFile(fileId: string) {
  const res = await cosmeonAPI.get(`/file/${fileId}/reconstruct`);
  return res.data;
}

// --------------------
// Delete file
// --------------------
export async function deleteFile(fileId: string) {
  const res = await cosmeonAPI.delete(`/file/${fileId}`);
  return res.data;
}
