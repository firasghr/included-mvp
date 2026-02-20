/**
 * usePolling — repeatedly calls a fetch function at a given interval.
 * Returns the last resolved value, loading state, and any error.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number = 12000,
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) run();
    timerRef.current = setInterval(run, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [run, intervalMs, immediate]);

  return { data, loading, error, refresh: run };
}
