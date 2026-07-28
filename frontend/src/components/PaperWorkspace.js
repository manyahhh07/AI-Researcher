import React, { useState, useRef, useEffect } from "react";
import { askQuestion, summarizePaper, getEquations, getCitations, searchPaper } from "../utils/api";

const TABS = [
  { id: "qa",        label: "Ask AI"     },
  { id: "summary",   label: "Summarize"  },
  { id: "equations", label: "Equations"  },
  { id: "citations", label: "Citations"  },
  { id: "search",    label: "Search"     },
];

function TypingIndicator() {
  return (
    <div className="qa-typing">
      <div className="qa-typing-dot" />
      <div className="qa-typing-dot" />
      <div className="qa-typing-dot" />
    </div>
  );
}

/* ── Q&A ─────────────────────────────────────────────────── */
function QAPanel({ paperId }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "I've read this paper. Ask me anything — methodology, findings, specific claims, or anything you're curious about.", sources: [] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setMessages(prev => [...prev, { role: "ai", text: "Could not reach the backend. Make sure FastAPI is running on port 8000.", sources: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qa-panel">
      <div className="qa-messages">
        {messages.map((m, i) => (
          <div key={i} className={`qa-message ${m.role}`}>
            <div className="qa-avatar">
              {m.role === "user" ? "U" : "AI"}
            </div>
            <div className="qa-bubble-wrap">
              <div className="qa-bubble">{m.text}</div>
              {m.sources?.length > 0 && (
                <div className="qa-sources">
                  <div className="qa-sources-label">Sources used</div>
                  {m.sources.slice(0, 2).map((s, j) => (
                    <div key={j} className="qa-source-item">
                      Chunk {s.chunk_index} · {s.text.slice(0, 100)}…
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="qa-message ai">
            <div className="qa-avatar">AI</div>
            <div className="qa-bubble-wrap">
              <div className="qa-bubble"><TypingIndicator /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="qa-input-area">
        <input
          className="qa-input"
          placeholder="Ask a question about this paper…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
        />
        <button className="qa-send" onClick={send} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

/* ── Summary ─────────────────────────────────────────────── */
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
    } catch {
      setSummary("Could not reach the backend.");
    } finally {
      setLoading(false);
    }
  };

  const styleLabels = { concise: "Concise", detailed: "Detailed", eli5: "ELI5" };

  return (
    <div className="panel-page">
      <h2 className="panel-heading">Summarize</h2>
      <p className="panel-sub">Choose a style and generate a summary of this paper.</p>

      <div className="style-picker">
        {["concise", "detailed", "eli5"].map(s => (
          <button key={s} className={`style-option ${style === s ? "active" : ""}`} onClick={() => setStyle(s)}>
            {styleLabels[s]}
          </button>
        ))}
      </div>

      <button className="generate-btn" onClick={generate} disabled={loading}>
        {loading ? "Generating…" : "Generate Summary"}
      </button>

      {!summary && quickSummary && (
        <div>
          <div className="summary-result-label">Auto-detected on upload</div>
          <div className="summary-result">{quickSummary}</div>
        </div>
      )}

      {summary && (
        <div>
          <div className="summary-result-label">{styleLabels[style]} summary</div>
          <div className="summary-result">{summary}</div>
        </div>
      )}
    </div>
  );
}

/* ── Equations ───────────────────────────────────────────── */
function EquationsPanel({ paperId }) {
  const [equations, setEquations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEquations(paperId)
      .then(r => setEquations(r.data.equations))
      .catch(() => setEquations([]))
      .finally(() => setLoading(false));
  }, [paperId]);

  return (
    <div className="panel-page">
      <h2 className="panel-heading">Equations</h2>
      <p className="panel-sub">{equations ? `${equations.length} expressions detected` : "Scanning…"}</p>

      {loading && <div className="loading-row">Extracting equations…</div>}

      {!loading && equations?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">∑</div>
          <div className="empty-state-title">No equations found</div>
          <div className="empty-state-text">This paper may use plain-text math or be a scanned image PDF.</div>
        </div>
      )}

      {!loading && equations?.length > 0 && (
        <div className="eq-grid">
          {equations.map((eq, i) => (
            <div key={i} className="eq-item">
              <div className="eq-label">Equation {String(i + 1).padStart(2, "0")}</div>
              <div className="eq-text">{eq}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Citations ───────────────────────────────────────────── */
function CitationsPanel({ paperId }) {
  const [citations, setCitations] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCitations(paperId)
      .then(r => setCitations(r.data.citations))
      .catch(() => setCitations([]))
      .finally(() => setLoading(false));
  }, [paperId]);

  const filtered = filter === "all" ? citations : citations?.filter(c => c.type === filter);

  return (
    <div className="panel-page">
      <h2 className="panel-heading">Citations</h2>
      <p className="panel-sub">{citations ? `${citations.length} citations extracted` : "Scanning…"}</p>

      <div className="citation-filter">
        {["all", "inline", "reference"].map(f => (
          <button key={f} className={`style-option ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="loading-row">Extracting citations…</div>}

      {!loading && filtered?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <div className="empty-state-title">No citations in this category</div>
        </div>
      )}

      {!loading && filtered?.length > 0 && (
        <div className="citation-list">
          {filtered.map((c, i) => (
            <div key={i} className={`citation-item ${c.type}`}>
              <div className="citation-type-tag">{c.type}</div>
              <div className="citation-text">{c.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Search ──────────────────────────────────────────────── */
function SearchPanel({ paperId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchPaper(paperId, query);
      setResults(res.data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-page">
      <h2 className="panel-heading">Search</h2>
      <p className="panel-sub">Find the most relevant passages for any concept or keyword.</p>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Enter a concept, term, or phrase…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
        />
        <button className="search-go" onClick={search} disabled={loading || !query.trim()}>
          {loading ? "…" : "Search"}
        </button>
      </div>

      {loading && <div className="loading-row">Searching…</div>}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No strong matches</div>
          <div className="empty-state-text">Try different keywords or a broader phrase.</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => (
            <div key={i} className="search-result">
              <div className="search-result-meta">
                <span className="search-result-label">Chunk {r.chunk_index}</span>
                <span className="search-score">{r.score}</span>
              </div>
              <div className="search-result-text">{r.text}</div>
            </div>
          ))}
        </div>
      )}

      {!searched && (
        <div className="empty-state">
          <div className="empty-state-icon">⌕</div>
          <div className="empty-state-title">Start searching</div>
          <div className="empty-state-text">Results are ranked by keyword-overlap relevance across all chunks in this paper.</div>
        </div>
      )}
    </div>
  );
}

/* ── Main Workspace ──────────────────────────────────────── */
export default function PaperWorkspace({ paper }) {
  const [tab, setTab] = useState("qa");

  return (
    <div className="workspace-page">
      {/* Top bar */}
      <div className="workspace-topbar">
        <div className="workspace-file-info">
          <div className="workspace-filename">{paper.filename}</div>
          <div className="workspace-filemeta">
            <span className="workspace-stat">~{((paper.word_count || 0) / 1000).toFixed(1)}k words</span>
            <span className="workspace-stat">{paper.chunk_count || 0} chunks</span>
            <span className="workspace-stat">{paper.equation_count || 0} equations</span>
            <span className="workspace-stat">{paper.citation_count || 0} citations</span>
          </div>
        </div>
      </div>

      {/* Quick summary strip */}
      {paper.quick_summary && !paper.quick_summary.includes("unavailable") && (
        <div className="workspace-summary-strip">
          {paper.quick_summary}
        </div>
      )}

      {/* Tabs */}
      <div className="workspace-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`workspace-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="workspace-panel">
        {tab === "qa"        && <QAPanel paperId={paper.paper_id} />}
        {tab === "summary"   && <SummaryPanel paperId={paper.paper_id} quickSummary={paper.quick_summary} />}
        {tab === "equations" && <EquationsPanel paperId={paper.paper_id} />}
        {tab === "citations" && <CitationsPanel paperId={paper.paper_id} />}
        {tab === "search"    && <SearchPanel paperId={paper.paper_id} />}
      </div>
    </div>
  );
}
