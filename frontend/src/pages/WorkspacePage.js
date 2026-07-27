import React from "react";
import PaperWorkspace from "../components/PaperWorkspace";

/**
 * WorkspacePage
 * Shown when a paper is selected. Acts as the page-level shell
 * around the tabbed PaperWorkspace component.
 */
export default function WorkspacePage({ paper, onBack }) {
  return (
    <div className="page workspace-page">
      <div className="page-back-row">
        <button className="back-btn" onClick={onBack}>
          ← Back to upload
        </button>
      </div>
      <PaperWorkspace paper={paper} />
    </div>
  );
}
