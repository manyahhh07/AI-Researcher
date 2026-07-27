import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

export const uploadPaper = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

export const listPapers = () => api.get("/papers");

export const askQuestion = (paper_id, question) =>
  api.post("/ask", { paper_id, question });

export const summarizePaper = (paper_id, style = "concise") =>
  api.post("/summarize", { paper_id, style });

export const getEquations = (paper_id) => api.get(`/equations/${paper_id}`);

export const getCitations = (paper_id) => api.get(`/citations/${paper_id}`);

export const searchPaper = (paper_id, query) =>
  api.post("/search", { paper_id, query });

export const deletePaper = (paper_id) => api.delete(`/papers/${paper_id}`);
