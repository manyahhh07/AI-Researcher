import React, { useState } from "react";
import { usePapers }     from "./hooks/usePapers";
import Sidebar           from "./components/Sidebar";
import HomePage          from "./pages/HomePage";
import WorkspacePage     from "./pages/WorkspacePage";
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
      <div className="checkered-bg" />

      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">
              PaperSense<span className="logo-accent">AI</span>
            </span>
          </div>
          <p className="header-tagline">Read Less. Understand More.</p>
          <div className="header-badge">
            <span className="badge-dot" />
            Powered by Groq · Llama 3.3 70B · Free
          </div>
        </div>
      </header>

      <div className="app-body">
        <Sidebar
          papers={papers}
          selectedId={selectedPaper?.paper_id}
          onSelect={(p) => setSelectedPaper(p)}
          onDelete={handleDelete}
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
