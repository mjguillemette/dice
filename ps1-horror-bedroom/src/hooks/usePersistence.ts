/**
 * Persistence Hook
 * Manages localStorage for persistent game data (high scores, unlocks, etc.)
 */

import { useEffect, useState } from 'react';

interface PersistentData {
  bestDaysSurvived: number;
  bestTotalScore: number;
  totalGamesPlayed: number;
  totalDeaths: number;
  // Future: unlocks, achievements, etc.
}

const STORAGE_KEY = 'ps1-horror-bedroom-save';

const DEFAULT_DATA: PersistentData = {
  bestDaysSurvived: 0,
  bestTotalScore: 0,
  totalGamesPlayed: 0,
  totalDeaths: 0,
};

/**
 * Load persistent data from localStorage
 */
function loadPersistentData(): PersistentData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_DATA, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load persistent data:', error);
  }
  return { ...DEFAULT_DATA };
}

/**
 * Save persistent data to localStorage
 */
function savePersistentData(data: PersistentData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save persistent data:', error);
  }
}

/**
 * Hook for managing persistent game data
 */
export function usePersistence() {
  const [data, setData] = useState<PersistentData>(loadPersistentData);

  // Auto-save whenever data changes
  useEffect(() => {
    savePersistentData(data);
  }, [data]);

  const recordGameOver = (daysSurvived: number, totalScore: number) => {
    setData(prev => ({
      ...prev,
      bestDaysSurvived: Math.max(prev.bestDaysSurvived, daysSurvived),
      bestTotalScore: Math.max(prev.bestTotalScore, totalScore),
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      totalDeaths: prev.totalDeaths + 1,
    }));
  };

  const recordGameStart = () => {
    setData(prev => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
    }));
  };

  const resetAllData = () => {
    setData({ ...DEFAULT_DATA });
  };

  return {
    data,
    recordGameOver,
    recordGameStart,
    resetAllData,
  };
}

export default usePersistence;
