import { useState, useCallback, useEffect } from "react";

interface UseScoreOptions {
  initialScore?: number;
  saveToStorage?: boolean;
  storageKey?: string;
}

export function useScore({
  initialScore = 0,
  saveToStorage = false,
  storageKey = "game-score",
}: UseScoreOptions = {}) {
  const [score, setScore] = useState(() => {
    if (saveToStorage) {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).score : initialScore;
    }
    return initialScore;
  });

  const [highScore, setHighScore] = useState(() => {
    if (saveToStorage) {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).highScore : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (saveToStorage) {
      localStorage.setItem(storageKey, JSON.stringify({ score, highScore }));
    }
  }, [score, highScore, saveToStorage, storageKey]);

  const addPoints = useCallback((points: number) => {
    setScore((prev: number) => {
      const newScore = prev + points;
      if (newScore > highScore) {
        setHighScore(newScore);
      }
      return newScore;
    });
  }, [highScore]);

  const subtractPoints = useCallback((points: number) => {
    setScore((prev: number) => Math.max(0, prev - points));
  }, []);

  const resetScore = useCallback(() => {
    setScore(initialScore);
  }, [initialScore]);

  const resetAll = useCallback(() => {
    setScore(initialScore);
    setHighScore(0);
    if (saveToStorage) {
      localStorage.removeItem(storageKey);
    }
  }, [initialScore, saveToStorage, storageKey]);

  return {
    score,
    highScore,
    addPoints,
    subtractPoints,
    resetScore,
    resetAll,
  };
}
