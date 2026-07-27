import { useState, useCallback } from "react";

/**
 * useApi
 * Generic hook that wraps any async API function with loading,
 * error, and data state. Keeps components clean.
 *
 * Usage:
 *   const { execute, data, loading, error } = useApi(askQuestion);
 *   await execute(paperId, "What is this paper about?");
 */
export function useApi(apiFn) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFn(...args);
      setData(res.data);
      return res.data;
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Something went wrong. Is the backend running?";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  const reset = useCallback(() => {
    setData(null);
    setError("");
  }, []);

  return { execute, data, loading, error, reset };
}
