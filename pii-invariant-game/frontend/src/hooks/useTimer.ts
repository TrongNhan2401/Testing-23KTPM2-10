import { useState, useCallback, useEffect, useRef } from 'react';

interface UseTimerOptions {
  onExpire?: () => void;
  onTick?: (remainingSeconds: number) => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  remainingSeconds: number;
  isRunning: boolean;
  isExpired: boolean;
  start: (durationSeconds: number, startTime?: Date) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formattedTime: string;
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onExpire, onTick, autoStart = false } = options;

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresAtRef = useRef<Date | null>(null);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);

  // Keep refs updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Calculate remaining time from expiresAt
  const calculateRemaining = useCallback(() => {
    if (!expiresAtRef.current) return 0;
    const now = new Date();
    const diff = Math.max(0, Math.floor((expiresAtRef.current.getTime() - now.getTime()) / 1000));
    return diff;
  }, []);

  // Update remaining time
  const updateRemaining = useCallback(() => {
    const remaining = calculateRemaining();
    setRemainingSeconds(remaining);

    if (onTickRef.current) {
      onTickRef.current(remaining);
    }

    if (remaining <= 0 && !isExpired) {
      setIsExpired(true);
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    }
  }, [calculateRemaining, isExpired]);

  // Start timer
  const start = useCallback((durationSeconds: number, startTime?: Date) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const start = startTime || new Date();
    const expiresAt = new Date(start.getTime() + durationSeconds * 1000);
    expiresAtRef.current = expiresAt;
    setIsExpired(false);
    setIsRunning(true);

    // Initial update
    updateRemaining();

    // Start interval
    intervalRef.current = setInterval(updateRemaining, 1000);
  }, [updateRemaining]);

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    if (isExpired || !expiresAtRef.current) return;
    setIsRunning(true);
    intervalRef.current = setInterval(updateRemaining, 1000);
  }, [isExpired, updateRemaining]);

  // Reset timer
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    expiresAtRef.current = null;
    setRemainingSeconds(0);
    setIsRunning(false);
    setIsExpired(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time as MM:SS
  const formattedTime = (() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  })();

  // Auto-start if specified (needs to be called explicitly)
  useEffect(() => {
    if (autoStart && remainingSeconds === 0 && !isExpired) {
      // Don't auto-start, just set up the hook
    }
  }, [autoStart, remainingSeconds, isExpired]);

  return {
    remainingSeconds,
    isRunning,
    isExpired,
    start,
    pause,
    resume,
    reset,
    formattedTime,
  };
}
