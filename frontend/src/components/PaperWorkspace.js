import React, { useState, useRef, useEffect } from "react";
import { askQuestion, summarizePaper, getEquations, getCitations, searchPaper } from "../utils/api";

const TABS = [
  { id: "qa",        icon: "💬", label: "Ask AI"    },
  { id: "summary",   icon: "📝", label: "Summarize" },
  { id: "equations", icon: "∑",  label: "Equations" },
  { id: "citations", icon: "🔗", label: "Citations" },
  { id: "search",    icon: "🔍", label: "Search"    },
];

function LoadingDots() {
  return (
    <span className="loading-dots">
      <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
    </span>
  );
}

// ── Q&A Tab ──────────────────────────────────────────────
function QAPanel({ paperId }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I've read this paper. Ask me anything — methodology, findings, limitations, or specific sections.", sources: [] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await askQuestion(paperId, q);
      setMessages(prev => [...prev, { role: "ai", text: res.data.answer, sources: res.data.sources }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Could not reach the backend. Make sure FastAPI is running on port 8000.", sources: [] }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="panel-card">
      <div className="qa-messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <div className="msg-avatar">{m.role === "user" ? "👤" : "🤖"}</div>
            <div>
              <div className="msg-bubble">{m.text}</div>
              {m.sources?.length > 0 && (
                <div className="msg-sources">
                  <div className="msg-source-label">Context used</div>
                  {m.sources.slice(0, 2).map((s, j) => (
                    <div key={j} className="source-snippet">
                      Chunk #{s.chunk_index} · score {s.score} — {s.text.slice(0, 120)}…
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message ai">
            <div className="msg-avatar">🤖</div>
            <div className="msg-bubble"><LoadingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="qa-input-row">
        <input
          className="qa-input"
          placeholder="e.g. What is the main contribution of this paper?"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button className="qa-submit" onClick={send} disabled={loading || !input.trim()}>
          {loading ? "…" : "Ask →"}
        </button>
      </div>
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────
function SummaryPanel({ paperId, quickSummary }) {
  const [style, setStyle] = useState("concise");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSummary("");
    try {
      const res = await summarizePaper(paperId, style);
      setSummary(res.data.summary);
    } catch { setSummary("⚠️ Backend unavailable."); }
    finally { setLoading(false); }
  };

  return (
    <div className="panel-card">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>Summary Style</div>
        <div className="style-buttons">
          {[
            { id: "concise",  label: "⚡ Concise",  desc: "5 bullet points" },
            { id: "detailed", label: "📋 Detailed",  desc: "Structured sections" },
            { id: "eli5",     label: "🧒 ELI5",      desc: "Plain language" },
          ].map(s => (
            <button key={s.id} className={`style-btn ${style === s.id ? "active" : ""}`} onClick={() => setStyle(s.id)}>
              {s.label} <span style={{ opacity: 0.65, fontWeight: 400 }}>· {s.desc}</span>
            </button>
          ))}
        </div>
        <button className="summary-action-btn" onClick={generate} disabled={loading}>
          {loading ? <LoadingDots /> : "Generate Summary"}
        </button>
      </div>

      {!summary && quickSummary && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: 8 }}>Auto-detected on upload</div>
          <div className="summary-result">{quickSummary}</div>
        </div>
      )}

      {summary && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", color: "var(--maroon-light)", marginBottom: 8 }}>
            {style === "concise" ? "⚡ Concise" : style === "detailed" ? "📋 Detailed" : "🧒 ELI5"} Summary
          </div>
          <div className="summary-result">{summary}</div>
        </div>
      )}
    </div>
  );
}

// ── Equations Tab ─────────────────────────────────────────
function EquationsPanel({ paperId }) {
  const [equations, setEquations] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getEquations(paperId);
      setEquations(res.data.equations);
    } catch { setEquations([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [paperId]);

  if (loading) return <div className="panel-card"><div className="empty-state"><LoadingDots /></div></div>;
  if (!equations) return null;

  return (
    <div className="panel-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--maroon)" }}>Equations & Expressions</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{equations.length} found</div>
        </div>
        <button onClick={load} className="style-btn">↺ Refresh</button>
      </div>
      {equations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">∑</div>
          <div className="empty-state-text">No equations detected.<br />This paper may use plain-text math or be scanned.</div>
        </div>
      ) : (
        <div className="eq-list">
          {equations.map((eq, i) => (
            <div key={i} className="eq-item">
              <div className="eq-badge">EQ {String(i + 1).padStart(2, "0")}</div>
              <div>{eq}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Citations Tab ─────────────────────────────────────────
function CitationsPanel({ paperId }) {
  const [citations, setCitations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    getCitations(paperId)
      .then(r => setCitations(r.data.citations))
      .catch(() => setCitations([]))
      .finally(() => setLoading(false));
  }, [paperId]);

  if (loading) return <div className="panel-card"><div className="empty-state"><LoadingDots /></div></div>;
  if (!citations) return null;

  const filtered = filter === "all" ? citations : citations.filter(c => c.type === filter);

  return (
    <div className="panel-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--maroon)" }}>Citations & References</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{citations.length} total</div>
        </div>
        <div className="style-buttons" style={{ margin: 0 }}>
          {["all", "inline", "reference"].map(f => (
            <button key={f} className={`style-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <div className="empty-state-text">No citations found in this category.</div>
        </div>
      ) : (
        <div className="citation-list">
          {filtered.map((c, i) => (
            <div key={i} className={`citation-item ${c.type}`}>
              <div className="citation-type">{c.type === "inline" ? "📎 Inline" : "📚 Reference"}</div>
              {c.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Search Tab ────────────────────────────────────────────
function SearchPanel({ paperId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchPaper(paperId, query);
      setResults(res.data.results);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="panel-card">
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--maroon)", marginBottom: 16 }}>Semantic Search</div>
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Search for a concept, term, or phrase…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
        />
        <button className="search-btn" onClick={search} disabled={loading || !query.trim()}>
          {loading ? "…" : "Search"}
        </button>
      </div>

      {loading && <div className="empty-state"><LoadingDots /></div>}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-text">No strong matches found. Try different keywords.</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => (
            <div key={i} className="search-result-card">
              <div className="search-result-meta">
                <span className="search-result-label">Chunk #{r.chunk_index}</span>
                <span className="search-score-badge">Score: {r.score}</span>
              </div>
              <div className="search-result-text">{r.text}</div>
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div className="empty-state">
          <div className="empty-state-icon">🔎</div>
          <div className="empty-state-text">Enter a query to find the most relevant passages in this paper using keyword-overlap similarity.</div>
        </div>
      )}
    </div>
  );
}

// ── Main Workspace ────────────────────────────────────────
export default function PaperWorkspace({ paper }) {
  const [tab, setTab] = useState("qa");

  return (
    <div className="workspace">
      <div className="workspace-header">
        <div className="workspace-title-row">
          <span className="workspace-file-icon">📄</span>
          <div>
            <div className="workspace-title">{paper.filename}</div>
            {paper.quick_summary && <div className="quick-summary">"{paper.quick_summary}"</div>}
          </div>
        </div>
        <div className="workspace-stats">
          {[
            { icon: "📝", label: `~${((paper.word_count || 0) / 1000).toFixed(1)}k words` },
            { icon: "🧩", label: `${paper.chunk_count || 0} chunks` },
            { icon: "∑",  label: `${paper.equation_count || 0} equations` },
            { icon: "🔗", label: `${paper.citation_count || 0} citations` },
          ].map(s => (
            <div key={s.label} className="stat-chip">
              <span className="stat-chip-icon">{s.icon}</span> {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "qa"        && <QAPanel paperId={paper.paper_id} />}
      {tab === "summary"   && <SummaryPanel paperId={paper.paper_id} quickSummary={paper.quick_summary} />}
      {tab === "equations" && <EquationsPanel paperId={paper.paper_id} />}
      {tab === "citations" && <CitationsPanel paperId={paper.paper_id} />}
      {tab === "search"    && <SearchPanel paperId={paper.paper_id} />}
    </div>
  );
}
