import { useState, useEffect, useCallback } from "react";
import { listPapers, deletePaper } from "../utils/api";

/**
 * usePapers
 * Centralises all paper-list state: fetching, adding, and deleting.
 * Used by App.js so state is shared across Sidebar and Workspace.
 */
export function usePapers() {
  const [papers, setPapers]   = useState([]);
  const [fetching, setFetching] = useState(false);

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const res = await listPapers();
      setPapers(res.data);
    } catch (_) {
      /* backend not running yet — silently ignore on mount */
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addPaper = useCallback((paperData) => {
    setPapers((prev) => {
      if (prev.find((p) => p.paper_id === paperData.paper_id)) return prev;
      return [
        {
          paper_id:    paperData.paper_id,
          filename:    paperData.filename,
          word_count:  paperData.word_count,
          uploaded_at: Date.now() / 1000,
        },
        ...prev,
      ];
    });
  }, []);

  const removePaper = useCallback(async (paperId) => {
    try {
      await deletePaper(paperId);
    } catch (_) { /* already gone */ }
    setPapers((prev) => prev.filter((p) => p.paper_id !== paperId));
  }, []);

  return { papers, fetching, addPaper, removePaper, refresh: fetchAll };
}
