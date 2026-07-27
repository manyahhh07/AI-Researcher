import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadPaper } from "../utils/api";

const FEATURES = [
  { icon: "💬", title: "Q&A Chat", desc: "Ask anything about the paper using RAG-powered semantic search." },
  { icon: "📝", title: "Smart Summary", desc: "Get concise, detailed, or ELI5-style summaries instantly." },
  { icon: "∑ Equations", title: "Equation Extractor", desc: "Automatically highlights all math expressions in the document." },
  { icon: "🔗", title: "Citations", desc: "Extracts inline citations and full reference lists." },
  { icon: "🔍", title: "Semantic Search", desc: "Find the most relevant passages for any keyword or concept." },
  { icon: "📊", title: "Paper Stats", desc: "Word count, page estimate, chunk analysis at a glance." },
];

export default function UploadZone({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [filename, setFilename] = useState("");

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setError("");
    setFilename(file.name);
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadPaper(file, setProgress);
      onUploadComplete(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="upload-wrapper">
      <div className="upload-hero">
        <h1 className="upload-hero-title">Read Less.<br/>Understand More.</h1>
        <p className="upload-hero-sub">Drop any research PDF into PaperSense — ask questions, get summaries, extract equations, trace citations, and search semantically. All in one place.</p>
      </div>

      {error && <div className="error-toast">⚠️ {error}</div>}

      <div {...getRootProps()} className={`dropzone-area ${isDragActive ? "active" : ""}`}>
        <input {...getInputProps()} />
        <span className="dropzone-icon">{uploading ? "⏳" : isDragActive ? "📂" : "📄"}</span>
        <div className="dropzone-title">
          {uploading ? `Analyzing "${filename}"…` : isDragActive ? "Drop to upload" : "Drop your PDF here"}
        </div>
        <p className="dropzone-sub">{uploading ? "Extracting text, equations, and citations" : "or click to browse your files"}</p>
        {!uploading && <span className="dropzone-pill">Choose PDF</span>}
      </div>

      {uploading && (
        <div className="upload-progress">
          <div className="progress-label">
            <span>Uploading & Processing</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-card-icon">{f.icon}</div>
            <div className="feature-card-title">{f.title}</div>
            <div className="feature-card-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
