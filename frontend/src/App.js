import React, { useState } from "react";
import { usePapers } from "./hooks/usePapers";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import "./App.css";

export default function App() {
  const { papers, addPaper, removePaper } = usePapers();
  const [selectedPaper, setSelectedPaper] = useState(null);

  const handleUploadComplete = (paperData) => {
    addPaper(paperData);
    setSelectedPaper(paperData);
  };

  const handleDelete = async (paperId) => {
    await removePaper(paperId);
    if (selectedPaper?.paper_id === paperId) setSelectedPaper(null);
  };

  return (
    <div className="app-root">
      {/* Top nav */}
      <nav className="app-nav">
        <a className="nav-brand" href="/" onClick={e => { e.preventDefault(); setSelectedPaper(null); }}>
          <div className="nav-brand-mark">
<svg
  width="16"
  height="16"
  viewBox="0 0 40 40"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M10 8 L10 32 M10 8 L24 8 Q34 8 34 18 Q34 28 24 28 L10 28"
    stroke="white"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />
</svg> 
</div>         
          <div>
            <div className="nav-brand-name">PaperSense AI</div>
          </div>
        </a>
        <div className="nav-divider" />
        <span className="nav-tagline">Read Less. Understand More.</span>
        <div className="nav-spacer" />
        <div className="nav-status">
          <span className="nav-status-dot" />
          Groq · Llama 3.3 70B · Free
        </div>
      </nav>

      <div className="app-body">
        <Sidebar
          papers={papers}
          selectedId={selectedPaper?.paper_id}
          onSelect={setSelectedPaper}
          onDelete={handleDelete}
          onUploadClick={() => setSelectedPaper(null)}
        />

        <main className="main-content">
          {!selectedPaper ? (
            <HomePage onUploadComplete={handleUploadComplete} />
          ) : (
            <WorkspacePage
              paper={selectedPaper}
              onBack={() => setSelectedPaper(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}