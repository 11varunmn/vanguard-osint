import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vanguard_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("vanguard_token", data.access_token);
  return data;
};

export const logout = () => localStorage.removeItem("vanguard_token");


// ─── Cases ────────────────────────────────────────────────────────────────

export const getCases = () => api.get("/api/v1/cases").then((r) => r.data);

export const getCase = (id: string) =>
  api.get(`/api/v1/cases/${id}`).then((r) => r.data);

export const createCase = (body: {
  title: string;
  description?: string;
  classification?: string;
}) => api.post("/api/v1/cases", body).then((r) => r.data);

export const updateCase = (id: string, body: object) =>
  api.patch(`/api/v1/cases/${id}`, body).then((r) => r.data);


// ─── Sources ──────────────────────────────────────────────────────────────

export const getSources = (caseId: string) =>
  api.get(`/api/v1/cases/${caseId}/sources`).then((r) => r.data);

export const addSource = (
  caseId: string,
  body: { platform: string; handle: string; source_url?: string }
) => api.post(`/api/v1/cases/${caseId}/sources`, body).then((r) => r.data);


// ─── Ingestion ────────────────────────────────────────────────────────────

export const ingestText = (
  caseId: string,
  body: { source_id: string; text_content: string; label?: string; provenance_notes?: string }
) => api.post(`/api/v1/cases/${caseId}/ingest/text`, body).then((r) => r.data);

export const ingestFile = (caseId: string, file: File, sourceId?: string) => {
  const form = new FormData();
  form.append("file", file);
  if (sourceId) form.append("source_id", sourceId);
  return api.post(`/api/v1/cases/${caseId}/ingest/file`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};


// ─── Stylometry ───────────────────────────────────────────────────────────

export const compareTexts = (
  caseId: string,
  body: { text_a: string; text_b: string; label_a: string; label_b: string }
) =>
  api.post(`/api/v1/cases/${caseId}/stylometry/compare`, body).then((r) => r.data);

export const getStylometryResults = (caseId: string) =>
  api.get(`/api/v1/cases/${caseId}/stylometry/results`).then((r) => r.data);


// ─── Graph ────────────────────────────────────────────────────────────────

export const getGraph = (caseId: string) =>
  api.get(`/api/v1/cases/${caseId}/graph`).then((r) => r.data);

export const getClusters = (caseId: string) =>
  api.get(`/api/v1/cases/${caseId}/graph/clusters`).then((r) => r.data);


// ─── Audit ────────────────────────────────────────────────────────────────

export const getAudit = (caseId: string) =>
  api.get(`/api/v1/cases/${caseId}/audit`).then((r) => r.data);


// ─── Evidence ─────────────────────────────────────────────────────────────

export const getEvidence = (caseId: string) =>
  api.get(`/api/v1/cases/${caseId}/evidence`).then((r) => r.data);


// ─── Reports ──────────────────────────────────────────────────────────────

export const generateReport = (
  caseId: string,
  body: { include_stylometry?: boolean; include_graph?: boolean; analyst_note?: string }
) => api.post(`/api/v1/cases/${caseId}/reports`, body).then((r) => r.data);
