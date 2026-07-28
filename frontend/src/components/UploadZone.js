import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadPaper } from "../utils/api";

const FEATURES = [
  { num: "01", title: "Q&A Chat", desc: "Ask anything. Get answers grounded in the paper's actual content." },
  { num: "02", title: "Smart Summaries", desc: "Concise bullets, structured report, or plain-language ELI5." },
  { num: "03", title: "Equation Extraction", desc: "Automatically surfaces all mathematical expressions." },
  { num: "04", title: "Citation Tracing", desc: "Extract inline citations and full reference lists." },
  { num: "05", title: "Semantic Search", desc: "Find the most relevant passages for any concept or keyword." },
];

export default function UploadZone({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
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
      setError(e?.response?.data?.detail || "Could not reach the backend. Is FastAPI running on port 8000?");
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
    <div className="home-page">
      <div className="home-hero">
        <div className="home-eyebrow">Research Assistant</div>
        <h1 className="home-title">
          Read Less.<br /><em>Understand More.</em>
        </h1>
        <p className="home-subtitle">
          Upload a research paper and let AI help you understand it — ask questions, get summaries, extract insights, search instantly.
        </p>
      </div>

      <div className="home-content">
        {/* Upload card */}
        <div className="upload-card">
          {error && <div className="error-banner" style={{ margin: "16px 16px 0" }}>{error}</div>}

          <div
            {...getRootProps()}
            className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="upload-zone-icon">
              {uploading ? "⏳" : isDragActive ? "📂" : "↑"}
            </div>
            <div className="upload-zone-title">
              {uploading ? `Processing ${filename}…` : isDragActive ? "Drop to upload" : "Drop your PDF here"}
            </div>
            <p className="upload-zone-sub">
              {uploading ? "Extracting text, equations, and citations" : "Supports any research paper, thesis, or report"}
            </p>
            {!uploading && <button className="upload-btn">Choose PDF</button>}
            {!uploading && <p className="upload-secure">Your files are private and never stored permanently</p>}
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="upload-progress-label">
                <span>Uploading</span>
                <span>{progress}%</span>
              </div>
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Features list */}
        <div className="features-list">
          <div className="features-heading">What you can do</div>
          {FEATURES.map((f) => (
            <div key={f.num} className="feature-row">
              <div className="feature-row-num">{f.num}</div>
              <div className="feature-row-body">
                <div className="feature-row-title">{f.title}</div>
                <div className="feature-row-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
