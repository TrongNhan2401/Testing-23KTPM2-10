import { useState, useCallback, useEffect, useRef } from 'react';

interface UsePollingOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  interval?: number;
}

interface UsePollingReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isPolling: boolean;
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions<T> = {}
): UsePollingReturn<T> {
  const { onSuccess, onError, interval = 5000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      if (onSuccessRef.current) {
        onSuccessRef.current(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setIsPolling(true);
    fetch();
    intervalRef.current = setInterval(fetch, interval);
  }, [fetch, interval]);

  const stop = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetch();
  }, [fetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isPolling,
    start,
    stop,
    refresh,
  };
}
