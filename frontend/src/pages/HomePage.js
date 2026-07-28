import React from "react";
import UploadZone from "../components/UploadZone";

export default function HomePage({ onUploadComplete }) {
  return <UploadZone onUploadComplete={onUploadComplete} />;
}
