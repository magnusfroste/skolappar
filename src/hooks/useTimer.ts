import { useState, useCallback, useEffect, useRef } from "react";

interface UseTimerOptions {
  initialTime?: number;
  countDown?: boolean;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useTimer({
  initialTime = 60,
  countDown = true,
  onComplete,
  autoStart = false,
}: UseTimerOptions = {}) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clear();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        const next = countDown ? prev - 1 : prev + 1;

        if (countDown && next <= 0) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }

        return next;
      });
    }, 1000);

    return clear;
  }, [isRunning, countDown, onComplete, clear]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    setTime(newTime ?? initialTime);
    setIsRunning(false);
  }, [initialTime]);

  const restart = useCallback((newTime?: number) => {
    setTime(newTime ?? initialTime);
    setIsRunning(true);
  }, [initialTime]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    restart,
    formatTime,
    formattedTime: formatTime(time),
  };
}
