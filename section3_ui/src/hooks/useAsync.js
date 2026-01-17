// src/hooks/useAsync.js
import { useCallback, useEffect, useRef, useState } from "react";

export default function useAsync(asyncFn, deps = [], { immediate = true } = {}) {
  const [status, setStatus] = useState("idle"); // idle|loading|success|error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  const callIdRef = useRef(0);

  // ✅ Mantiene siempre la versión más reciente de asyncFn (evita closures viejas)
  const fnRef = useRef(asyncFn);
  useEffect(() => {
    fnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const callId = ++callIdRef.current;

    if (mountedRef.current) {
      setStatus("loading");
      setError(null);
    }

    try {
      const result = await fnRef.current();

      // Solo la llamada más reciente puede escribir estado
      if (!mountedRef.current || callId !== callIdRef.current) return result;

      setData(result);
      setStatus("success");
      return result;
    } catch (e) {
      if (!mountedRef.current || callId !== callIdRef.current) throw e;

      setError(e);
      setStatus("error");
      throw e;
    }
  }, deps);

  useEffect(() => {
    if (!immediate) return;
    run();
  }, [immediate, run]);

  return { status, data, error, run };
}
