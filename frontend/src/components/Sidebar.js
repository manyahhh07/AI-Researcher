import React from "react";

export default function Sidebar({ papers, selectedId, onSelect, onDelete }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-card">
        <div className="sidebar-header">
          <span>📚</span> My Papers
        </div>
        {papers.length === 0 ? (
          <div className="sidebar-empty">
            Upload a PDF to get started. Your papers will appear here.
          </div>
        ) : (
          <div className="paper-list">
            {papers.map((p) => (
              <div
                key={p.paper_id}
                className={`paper-item ${selectedId === p.paper_id ? "active" : ""}`}
                onClick={() => onSelect(p)}
              >
                <span className="paper-icon">📄</span>
                <div className="paper-info">
                  <div className="paper-name" title={p.filename}>{p.filename}</div>
                  <div className="paper-meta">
                    {p.word_count ? `~${(p.word_count / 1000).toFixed(1)}k words` : ""}
                  </div>
                </div>
                <button
                  className="paper-delete"
                  title="Delete paper"
                  onClick={(e) => { e.stopPropagation(); onDelete(p.paper_id); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-card">
        <div className="sidebar-header">
          <span>⚙️</span> Stack
        </div>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { icon: "🔵", label: "FastAPI", sub: "REST backend" },
            { icon: "🟣", label: "Claude Sonnet", sub: "AI reasoning" },
            { icon: "🔴", label: "PyMuPDF", sub: "PDF extraction" },
            { icon: "🟢", label: "React 18", sub: "Frontend" },
          ].map(({ icon, label, sub }) => (
            <div key={label} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-dark)" }}>{label}</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
