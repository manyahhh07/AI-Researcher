import React from "react";
import PaperWorkspace from "../components/PaperWorkspace";

export default function WorkspacePage({ paper, onBack }) {
  return <PaperWorkspace paper={paper} onBack={onBack} />;
}
