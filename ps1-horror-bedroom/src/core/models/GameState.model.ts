/**
 * Game State Domain Models
 * Core data structures for overall game state and progression
 */

import type { TimeOfDay } from './Score.model';

export type GamePhase =
  | 'menu'
  | 'rolling'
  | 'item_selection'
  | 'store'
  | 'game_over'
  | 'paused';

/**
 * Core game state model
 */
export interface GameStateModel {
  // Game progression
  phase: GamePhase;
  currentDay: number;
  currentRound: number; // Round within current day
  currentAttempt: number; // Attempt within current round
  maxAttempts: number;
  totalAttempts: number; // Total across all time
  totalRounds: number;
  successfulRolls: number; // For time progression

  // Time system
  currentTimeOfDay: TimeOfDay;

  // Corruption mechanic
  corruption: number; // 0.0 to 1.0
  corruptionPerRoll: number;

  // Targets and goals
  dailyTarget: number;
  dailyBestScore: number;
  allTimeBestScore: number;

  // Economy
  currency: number; // Cents

  // Metadata
  gameStartedAt: number;
  lastSaveAt: number;
}

/**
 * Game configuration
 */
export interface GameConfig {
  // Attempts
  maxAttemptsPerRound: number;
  maxRoundsPerDay: number;

  // Time progression
  rollsPerTimeAdvance: number;

  // Corruption
  initialCorruption: number;
  maxCorruption: number;
  corruptionPerRoll: number;

  // Economy
  startingCurrency: number;

  // Difficulty
  dailyTargetMultiplier: number;
}

/**
 * Save data structure
 */
export interface SaveData {
  version: string;
  gameState: GameStateModel;
  savedAt: number;
}

/**
 * Type guards
 */
export const isGameStateModel = (obj: any): obj is GameStateModel => {
  return (
    typeof obj === 'object' &&
    typeof obj.phase === 'string' &&
    typeof obj.currentDay === 'number' &&
    typeof obj.corruption === 'number'
  );
};

export const isValidGamePhase = (phase: string): phase is GamePhase => {
  return ['menu', 'rolling', 'item_selection', 'store', 'game_over', 'paused'].includes(
    phase
  );
};

/**
 * Factory functions
 */
export const createGameState = (config?: Partial<GameConfig>): GameStateModel => {
  const defaultConfig: GameConfig = {
    maxAttemptsPerRound: 2,
    maxRoundsPerDay: 10,
    rollsPerTimeAdvance: 3,
    initialCorruption: 0.0,
    maxCorruption: 1.0,
    corruptionPerRoll: 0.005,
    startingCurrency: 0,
    dailyTargetMultiplier: 1.2,
    ...config
  };

  return {
    phase: 'menu',
    currentDay: 0,
    currentRound: 0,
    currentAttempt: 0,
    maxAttempts: defaultConfig.maxAttemptsPerRound,
    totalAttempts: 0,
    totalRounds: 0,
    successfulRolls: 0,
    currentTimeOfDay: 'morning',
    corruption: defaultConfig.initialCorruption,
    corruptionPerRoll: defaultConfig.corruptionPerRoll,
    dailyTarget: 1000,
    dailyBestScore: 0,
    allTimeBestScore: 0,
    currency: defaultConfig.startingCurrency,
    gameStartedAt: Date.now(),
    lastSaveAt: Date.now()
  };
};

export const createDefaultConfig = (): GameConfig => {
  return {
    maxAttemptsPerRound: 2,
    maxRoundsPerDay: 10,
    rollsPerTimeAdvance: 3,
    initialCorruption: 0.0,
    maxCorruption: 1.0,
    corruptionPerRoll: 0.005,
    startingCurrency: 0,
    dailyTargetMultiplier: 1.2
  };
};

/**
 * Utility functions
 */
export const isLastAttempt = (state: GameStateModel): boolean => {
  return state.currentAttempt >= state.maxAttempts;
};

export const canRoll = (state: GameStateModel): boolean => {
  return state.phase === 'rolling' && state.currentAttempt < state.maxAttempts;
};

export const isGameOver = (state: GameStateModel): boolean => {
  return state.phase === 'game_over' || state.corruption >= 1.0;
};

export const shouldAdvanceTime = (state: GameStateModel): boolean => {
  return state.successfulRolls > 0 && state.successfulRolls % 3 === 0;
};

export const getNextTimeOfDay = (current: TimeOfDay): TimeOfDay | null => {
  const sequence: TimeOfDay[] = ['morning', 'midday', 'night'];
  const currentIndex = sequence.indexOf(current);
  return currentIndex < sequence.length - 1 ? sequence[currentIndex + 1] : null;
};

export const getCorruptionPercentage = (state: GameStateModel): number => {
  return Math.floor(state.corruption * 100);
};

export const getRemainingAttempts = (state: GameStateModel): number => {
  return Math.max(0, state.maxAttempts - state.currentAttempt);
};

/**
 * Save/Load helpers
 */
export const serializeSaveData = (gameState: GameStateModel): string => {
  const saveData: SaveData = {
    version: '1.0',
    gameState,
    savedAt: Date.now()
  };
  return JSON.stringify(saveData);
};

export const deserializeSaveData = (json: string): SaveData | null => {
  try {
    const data = JSON.parse(json);
    if (data.version && data.gameState && isGameStateModel(data.gameState)) {
      return data as SaveData;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse save data:', error);
    return null;
  }
};
