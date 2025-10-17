/**
 * Scoring System for Yahtzee-style dice scoring
 * Tracks pairs, runs, and highest totals across time periods
 */

import type { TimeOfDay } from "./gameStateSystem";

// ===== TYPES & INTERFACES =====

export type ScoreCategory =
  | "highest_total"
  | "pair"
  | "two_pair"
  | "three_of_kind"
  | "four_of_kind"
  | "run_of_3"
  | "run_of_4"
  | "run_of_5"
  | "run_of_6";

export interface DiceRoll {
  values: number[]; // The face values of all dice
  total: number; // Sum of all dice
}

export interface ScoreCategoryData {
  category: ScoreCategory;
  score: number;
  achieved: boolean;
  diceValues?: number[]; // The dice that made this score
}

export interface TimeOfDayScores {
  morning: ScoreCategoryData[];
  midday: ScoreCategoryData[];
  night: ScoreCategoryData[];
}

export interface ScoringState {
  currentScores: ScoreCategoryData[]; // Current time of day scores
  historicalScores: TimeOfDayScores; // All scores across time periods
  currentTimeOfDay: TimeOfDay;
}

// ===== SCORING FUNCTIONS =====

/**
 * Count occurrences of each die value
 */
function countDiceValues(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

/**
 * Check for pairs (two of a kind)
 * Returns the highest pair value if found
 */
function checkForPair(values: number[]): { found: boolean; value: number; diceValues: number[] } {
  const counts = countDiceValues(values);
  let highestPair = 0;
  let pairDice: number[] = [];

  for (const [value, count] of counts.entries()) {
    if (count >= 2 && value > highestPair) {
      highestPair = value;
      pairDice = [value, value];
    }
  }

  return {
    found: highestPair > 0,
    value: highestPair * 2,
    diceValues: pairDice
  };
}

/**
 * Check for two pairs
 */
function checkForTwoPair(values: number[]): { found: boolean; value: number; diceValues: number[] } {
  const counts = countDiceValues(values);
  const pairs: number[] = [];

  for (const [value, count] of counts.entries()) {
    if (count >= 2) {
      pairs.push(value);
    }
  }

  if (pairs.length >= 2) {
    // Get the two highest pairs
    pairs.sort((a, b) => b - a);
    const topTwoPairs = pairs.slice(0, 2);
    return {
      found: true,
      value: topTwoPairs[0] * 2 + topTwoPairs[1] * 2,
      diceValues: [topTwoPairs[0], topTwoPairs[0], topTwoPairs[1], topTwoPairs[1]]
    };
  }

  return { found: false, value: 0, diceValues: [] };
}

/**
 * Check for three of a kind
 */
function checkForThreeOfKind(values: number[]): { found: boolean; value: number; diceValues: number[] } {
  const counts = countDiceValues(values);
  let highestTriple = 0;

  for (const [value, count] of counts.entries()) {
    if (count >= 3 && value > highestTriple) {
      highestTriple = value;
    }
  }

  if (highestTriple > 0) {
    return {
      found: true,
      value: highestTriple * 3,
      diceValues: [highestTriple, highestTriple, highestTriple]
    };
  }

  return { found: false, value: 0, diceValues: [] };
}

/**
 * Check for four of a kind
 */
function checkForFourOfKind(values: number[]): { found: boolean; value: number; diceValues: number[] } {
  const counts = countDiceValues(values);
  let highestQuad = 0;

  for (const [value, count] of counts.entries()) {
    if (count >= 4 && value > highestQuad) {
      highestQuad = value;
    }
  }

  if (highestQuad > 0) {
    return {
      found: true,
      value: highestQuad * 4,
      diceValues: [highestQuad, highestQuad, highestQuad, highestQuad]
    };
  }

  return { found: false, value: 0, diceValues: [] };
}

/**
 * Check for runs (consecutive numbers)
 * Returns the longest run found
 */
function checkForRun(values: number[], minLength: number): { found: boolean; length: number; value: number; diceValues: number[] } {
  const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

  let longestRun: number[] = [];
  let currentRun: number[] = [uniqueValues[0]];

  for (let i = 1; i < uniqueValues.length; i++) {
    if (uniqueValues[i] === uniqueValues[i - 1] + 1) {
      // Consecutive number, add to current run
      currentRun.push(uniqueValues[i]);
    } else {
      // Break in sequence, check if current run is longest
      if (currentRun.length > longestRun.length) {
        longestRun = [...currentRun];
      }
      currentRun = [uniqueValues[i]];
    }
  }

  // Check final run
  if (currentRun.length > longestRun.length) {
    longestRun = [...currentRun];
  }

  if (longestRun.length >= minLength) {
    const runValue = longestRun.reduce((sum, val) => sum + val, 0);
    return {
      found: true,
      length: longestRun.length,
      value: runValue,
      diceValues: longestRun
    };
  }

  return { found: false, length: 0, value: 0, diceValues: [] };
}

/**
 * Calculate all scores for a given dice roll
 */
export function calculateScores(diceRoll: DiceRoll): ScoreCategoryData[] {
  const scores: ScoreCategoryData[] = [];
  const values = diceRoll.values;

  // Highest Total (always present)
  scores.push({
    category: "highest_total",
    score: diceRoll.total,
    achieved: true,
    diceValues: [...values]
  });

  // Check for pairs
  const pair = checkForPair(values);
  scores.push({
    category: "pair",
    score: pair.value,
    achieved: pair.found,
    diceValues: pair.diceValues
  });

  // Check for two pairs
  const twoPair = checkForTwoPair(values);
  scores.push({
    category: "two_pair",
    score: twoPair.value,
    achieved: twoPair.found,
    diceValues: twoPair.diceValues
  });

  // Check for three of a kind
  const threeKind = checkForThreeOfKind(values);
  scores.push({
    category: "three_of_kind",
    score: threeKind.value,
    achieved: threeKind.found,
    diceValues: threeKind.diceValues
  });

  // Check for four of a kind
  const fourKind = checkForFourOfKind(values);
  scores.push({
    category: "four_of_kind",
    score: fourKind.value,
    achieved: fourKind.found,
    diceValues: fourKind.diceValues
  });

  // Check for runs
  const run3 = checkForRun(values, 3);
  scores.push({
    category: "run_of_3",
    score: run3.value,
    achieved: run3.found && run3.length === 3,
    diceValues: run3.diceValues
  });

  const run4 = checkForRun(values, 4);
  scores.push({
    category: "run_of_4",
    score: run4.value,
    achieved: run4.found && run4.length === 4,
    diceValues: run4.diceValues
  });

  const run5 = checkForRun(values, 5);
  scores.push({
    category: "run_of_5",
    score: run5.value,
    achieved: run5.found && run5.length === 5,
    diceValues: run5.diceValues
  });

  const run6 = checkForRun(values, 6);
  scores.push({
    category: "run_of_6",
    score: run6.value,
    achieved: run6.found && run6.length === 6,
    diceValues: run6.diceValues
  });

  return scores;
}

/**
 * Get display name for a score category
 */
export function getCategoryDisplayName(category: ScoreCategory): string {
  const names: Record<ScoreCategory, string> = {
    highest_total: "Highest Total",
    pair: "Pair",
    two_pair: "Two Pair",
    three_of_kind: "Three of a Kind",
    four_of_kind: "Four of a Kind",
    run_of_3: "Run of 3",
    run_of_4: "Run of 4",
    run_of_5: "Run of 5",
    run_of_6: "Run of 6"
  };
  return names[category];
}

/**
 * Update scores for a time of day period
 * Only updates if the new score is higher than the existing one
 */
export function updateBestScores(
  currentBest: ScoreCategoryData[],
  newScores: ScoreCategoryData[]
): ScoreCategoryData[] {
  const updated = [...currentBest];

  for (const newScore of newScores) {
    const existingIndex = updated.findIndex(s => s.category === newScore.category);

    if (existingIndex === -1) {
      // Category doesn't exist yet, add it
      updated.push(newScore);
    } else {
      // Update if new score is higher
      const existing = updated[existingIndex];
      if (newScore.score > existing.score || (newScore.achieved && !existing.achieved)) {
        updated[existingIndex] = newScore;
      }
    }
  }

  return updated;
}

/**
 * Initialize empty scores for a time period
 */
export function initializeEmptyScores(): ScoreCategoryData[] {
  const categories: ScoreCategory[] = [
    "highest_total",
    "pair",
    "two_pair",
    "three_of_kind",
    "four_of_kind",
    "run_of_3",
    "run_of_4",
    "run_of_5",
    "run_of_6"
  ];

  return categories.map(category => ({
    category,
    score: 0,
    achieved: false,
    diceValues: []
  }));
}

/**
 * Initial scoring state
 */
export const initialScoringState: ScoringState = {
  currentScores: initializeEmptyScores(),
  historicalScores: {
    morning: initializeEmptyScores(),
    midday: initializeEmptyScores(),
    night: initializeEmptyScores()
  },
  currentTimeOfDay: "morning"
};
