// src/hooks/useDashboardData.js

import { useEffect, useMemo, useState } from "react";
import useAsync from "./useAsync";
import { fetchFutureDraws } from "../lib/powerballApi";

/**
 * Temporary dashboard loader.
 * Keeps Dashboard stable while real endpoints are wired.
 */
async function fetchDashboardPlaceholder() {
  return {
    status: "ok",
    message: "Dashboard data is not configured yet.",
    timestamp: new Date().toISOString(),
  };
}

export default function useDashboardData() {
  return useAsync(fetchDashboardPlaceholder, [], { immediate: true });
}

/**
 * Normalize future draws response:
 * - supports backend returning { data: [...] }
 * - supports fetchFutureDraws returning { data: [...] } OR raw json
 * - supports raw array response
 */
function normalizeFutureDrawsResponse(r) {
  if (!r) return [];

  // If fetchFutureDraws returns an envelope: { data, ... }
  if (Array.isArray(r?.data)) return r.data;

  // If backend returns { data: [...] } and fetchFutureDraws returns raw json
  if (Array.isArray(r?.raw?.data)) return r.raw.data;

  // If endpoint returns array directly
  if (Array.isArray(r)) return r;

  return [];
}

/**
 * Future Draws hook with filters.
 * Uses JSON key to avoid refetch loops when parent passes a new object each render.
 */
export function useFutureDraws(filters = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    fetchFutureDraws({ limit: 200, ...filters })
      .then((r) => {
        if (cancelled) return;
        setData(normalizeFutureDrawsResponse(r));
      })
      .catch((e) => {
        if (cancelled) return;
        setData([]);
        setError(e?.message || "Failed to load future draws");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filtersKey]);

  return { data, loading, error };
}

/**
 * Simple version (no external filters), loads once.
 */
export function useFutureDrawsSimple() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    fetchFutureDraws({ limit: 200, direction: "desc" })
      .then((r) => {
        if (cancelled) return;
        setData(normalizeFutureDrawsResponse(r));
      })
      .catch((e) => {
        if (cancelled) return;
        setData([]);
        setError(e?.message || "Failed to load future draws");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
