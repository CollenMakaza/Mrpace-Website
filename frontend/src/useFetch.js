import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

// Loads data from the API and tracks loading / error state.
export default function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    setError("");
    return api(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
