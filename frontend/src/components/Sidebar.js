import React from "react";

export default function Sidebar({ papers, selectedId, onSelect, onDelete, onUploadClick }) {
  return (
    <aside className="sidebar">
      <button className="sidebar-upload-btn" onClick={onUploadClick}>
        + Upload Paper
      </button>

      <div className="sidebar-section">
        {papers.length === 0 ? (
          <div className="sidebar-empty">
            <p className="sidebar-empty-text">
              No papers yet.<br />Upload a PDF to get started.
            </p>
          </div>
        ) : (
          <>
            <div className="sidebar-label">Papers</div>
            <div className="sidebar-papers">
              {papers.map((p) => (
                <div
                  key={p.paper_id}
                  className={`paper-nav-item ${selectedId === p.paper_id ? "active" : ""}`}
                  onClick={() => onSelect(p)}
                >
                  <div className="paper-nav-icon">PDF</div>
                  <div className="paper-nav-info">
                    <div className="paper-nav-name" title={p.filename}>
                      {p.filename.replace(".pdf", "")}
                    </div>
                    <div className="paper-nav-meta">
                      {p.word_count ? `~${(p.word_count / 1000).toFixed(1)}k words` : "Processing…"}
                    </div>
                  </div>
                  <button
                    className="paper-nav-delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(p.paper_id); }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          <span className="sidebar-footer-dot" />
          100% Free · Powered by Groq
        </div>
      </div>
    </aside>
  );
}
