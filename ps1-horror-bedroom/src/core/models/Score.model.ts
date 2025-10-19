/**
 * Score Domain Models
 * Core data structures for scoring, combos, and achievements
 */

export type ScoreCategory =
  | 'highest_total'
  | 'pair'
  | 'two_pair'
  | 'three_of_kind'
  | 'four_of_kind'
  | 'run_of_3'
  | 'run_of_4'
  | 'run_of_5'
  | 'run_of_6';

export type TimeOfDay = 'morning' | 'midday' | 'night';

/**
 * A single score achievement
 */
export interface ScoreModel {
  // Identity
  category: ScoreCategory;

  // Value
  baseValue: number; // Score before multipliers
  finalValue: number; // Score after all multipliers
  multiplier: number; // Total multiplier applied (1.0 = none)

  // Achievement state
  achieved: boolean;

  // Dice involved
  diceIds: string[]; // IDs of dice that contributed
  diceValues: number[]; // Face values of those dice

  // Combo/streak tracking
  comboCount: number; // Consecutive times this category was achieved
  comboMultiplier: number; // Bonus from combo (1.0 = none)

  // Multi-score bonus
  multiScoreMultiplier: number; // Bonus from achieving multiple scores (1.0 = none)

  // Metadata
  achievedAtRound: number;
  achievedAtAttempt: number;
  timestamp: number;
}

/**
 * Scoring history for a time period
 */
export interface TimeOfDayScores {
  timeOfDay: TimeOfDay;
  scores: ScoreModel[];
  totalScore: number;
  highestScore: number;
  achievedCategories: Set<ScoreCategory>;
}

/**
 * Complete scoring state
 */
export interface ScoringModel {
  // Current period
  currentTimeOfDay: TimeOfDay;
  currentScores: ScoreModel[];
  currentTotalScore: number;

  // Historical
  morning: TimeOfDayScores | null;
  midday: TimeOfDayScores | null;
  night: TimeOfDayScores | null;

  // Daily tracking
  dailyBestScore: number;
  dailyTarget: number;

  // Combo tracking
  lastScoredCategories: Set<ScoreCategory>; // For combo detection
}

/**
 * Multiplier that can be applied to scores
 */
export interface ScoreMultiplier {
  source: 'item' | 'card' | 'combo' | 'corruption' | 'multi_score';
  type: 'additive' | 'multiplicative';
  value: number;
  appliesToCategories?: ScoreCategory[]; // undefined = all categories
}

/**
 * Input for score calculation
 */
export interface ScoreCalculationInput {
  diceResults: Array<{
    id: string;
    type: string;
    faceValue: number;
    scoreValue: number; // After modifiers
  }>;
  multipliers: ScoreMultiplier[];
  previousScores?: ScoreModel[]; // For combo tracking
  currentAttempt: number;
  currentRound: number;
}

/**
 * Type guards
 */
export const isScoreModel = (obj: any): obj is ScoreModel => {
  return (
    typeof obj === 'object' &&
    typeof obj.category === 'string' &&
    typeof obj.finalValue === 'number' &&
    typeof obj.achieved === 'boolean'
  );
};

/**
 * Factory functions
 */
export const createScore = (
  category: ScoreCategory,
  overrides?: Partial<ScoreModel>
): ScoreModel => {
  return {
    category,
    baseValue: 0,
    finalValue: 0,
    multiplier: 1.0,
    achieved: false,
    diceIds: [],
    diceValues: [],
    comboCount: 0,
    comboMultiplier: 1.0,
    multiScoreMultiplier: 1.0,
    achievedAtRound: 0,
    achievedAtAttempt: 0,
    timestamp: Date.now(),
    ...overrides
  };
};

export const createTimeOfDayScores = (timeOfDay: TimeOfDay): TimeOfDayScores => {
  const categories: ScoreCategory[] = [
    'highest_total',
    'pair',
    'two_pair',
    'three_of_kind',
    'four_of_kind',
    'run_of_3',
    'run_of_4',
    'run_of_5',
    'run_of_6'
  ];

  return {
    timeOfDay,
    scores: categories.map(cat => createScore(cat)),
    totalScore: 0,
    highestScore: 0,
    achievedCategories: new Set()
  };
};

export const createScoringModel = (): ScoringModel => {
  return {
    currentTimeOfDay: 'morning',
    currentScores: Object.values(createTimeOfDayScores('morning').scores),
    currentTotalScore: 0,
    morning: null,
    midday: null,
    night: null,
    dailyBestScore: 0,
    dailyTarget: 1000,
    lastScoredCategories: new Set()
  };
};

/**
 * Utility functions
 */
export const getScoreByCategory = (
  scores: ScoreModel[],
  category: ScoreCategory
): ScoreModel | undefined => {
  return scores.find(s => s.category === category);
};

export const getAchievedScores = (scores: ScoreModel[]): ScoreModel[] => {
  return scores.filter(s => s.achieved);
};

export const getTotalScore = (scores: ScoreModel[]): number => {
  return scores.reduce((sum, score) => sum + score.finalValue, 0);
};

export const getHighestScore = (scores: ScoreModel[]): ScoreModel | null => {
  const achieved = getAchievedScores(scores);
  if (achieved.length === 0) return null;

  return achieved.reduce((highest, current) =>
    current.finalValue > highest.finalValue ? current : highest
  );
};

export const hasAchievedCategory = (
  scores: ScoreModel[],
  category: ScoreCategory
): boolean => {
  const score = getScoreByCategory(scores, category);
  return score?.achieved || false;
};

/**
 * Combo calculation helpers
 */
export const calculateComboMultiplier = (comboCount: number): number => {
  if (comboCount <= 0) return 1.0;
  // 15% per combo level, additive
  return 1.0 + comboCount * 0.15;
};

export const calculateMultiScoreMultiplier = (achievedCount: number): number => {
  // Based on how many scores achieved in one roll (excluding highest_total)
  const multipliers = [1.0, 1.0, 1.1, 1.6, 2.0, 2.3, 2.5, 2.5, 2.5];
  return multipliers[Math.min(achievedCount, multipliers.length - 1)];
};

/**
 * Score display helpers
 */
export const getCategoryDisplayName = (category: ScoreCategory): string => {
  const names: Record<ScoreCategory, string> = {
    highest_total: 'Highest Total',
    pair: 'Pair',
    two_pair: 'Two Pair',
    three_of_kind: 'Three of a Kind',
    four_of_kind: 'Four of a Kind',
    run_of_3: 'Run of 3',
    run_of_4: 'Run of 4',
    run_of_5: 'Run of 5',
    run_of_6: 'Run of 6'
  };
  return names[category] || category;
};

export const formatScore = (score: number): string => {
  return score.toLocaleString();
};
