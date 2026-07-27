import React from "react";
import UploadZone from "../components/UploadZone";

/**
 * HomePage
 * Shown when no paper is selected. Wraps the UploadZone with a
 * page-level container and a welcome banner.
 */
export default function HomePage({ onUploadComplete }) {
  return (
    <div className="page home-page">
      <UploadZone onUploadComplete={onUploadComplete} />
    </div>
  );
}
