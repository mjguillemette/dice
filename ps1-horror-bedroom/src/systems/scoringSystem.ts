/**
 * Scoring System for Yahtzee-style dice scoring
 * Tracks pairs, runs, and highest totals across time periods
 * Now with full dice ID tracking for bidirectional highlighting
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
  diceIds?: number[]; // Optional: The IDs of the dice (in same order as values)
  scoreMultipliers?: number[]; // Optional: Score multipliers for each die (from transformations)
}

export interface ScoreCategoryData {
  category: ScoreCategory;
  score: number;
  achieved: boolean;
  diceValues?: number[]; // The dice values that made this score
  diceIds?: number[]; // The IDs of the dice that made this score
  lastUpdatedAttempt?: number; // Track which attempt this score was achieved on
  comboCount?: number; // How many consecutive times this score has been achieved (for incense)
  multiScoreMultiplier?: number; // Multi-score combo multiplier (1.0 - 2.5) when multiple scores trigger
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
  lastScoredCategories?: ScoreCategory[]; // Track which categories scored last attempt (for combo tracking)
}

// ===== SCORING FUNCTIONS =====

/**
 * Count occurrences of each die value, tracking indices
 */
function countDiceValues(values: number[]): Map<number, { count: number; indices: number[] }> {
  const counts = new Map<number, { count: number; indices: number[] }>();
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const existing = counts.get(value);
    if (existing) {
      existing.count++;
      existing.indices.push(i);
    } else {
      counts.set(value, { count: 1, indices: [i] });
    }
  }
  return counts;
}

/**
 * Check for pairs (two of a kind)
 * Returns the highest pair value if found
 */
function checkForPair(values: number[]): { found: boolean; value: number; diceValues: number[]; indices: number[] } {
  const counts = countDiceValues(values);
  let highestPair = 0;
  let pairDice: number[] = [];
  let pairIndices: number[] = [];

  for (const [value, data] of counts.entries()) {
    if (data.count >= 2 && value > highestPair) {
      highestPair = value;
      pairDice = [value, value];
      pairIndices = data.indices.slice(0, 2); // Take first 2 indices of this value
    }
  }

  return {
    found: highestPair > 0,
    value: highestPair * 2,
    diceValues: pairDice,
    indices: pairIndices
  };
}

/**
 * Check for two pairs
 */
function checkForTwoPair(values: number[]): { found: boolean; value: number; diceValues: number[]; indices: number[] } {
  const counts = countDiceValues(values);
  const pairData: Array<{ value: number; indices: number[] }> = [];

  for (const [value, data] of counts.entries()) {
    if (data.count >= 2) {
      pairData.push({ value, indices: data.indices.slice(0, 2) });
    }
  }

  if (pairData.length >= 2) {
    // Get the two highest pairs
    pairData.sort((a, b) => b.value - a.value);
    const topTwoPairs = pairData.slice(0, 2);
    return {
      found: true,
      value: topTwoPairs[0].value * 2 + topTwoPairs[1].value * 2,
      diceValues: [topTwoPairs[0].value, topTwoPairs[0].value, topTwoPairs[1].value, topTwoPairs[1].value],
      indices: [...topTwoPairs[0].indices, ...topTwoPairs[1].indices]
    };
  }

  return { found: false, value: 0, diceValues: [], indices: [] };
}

/**
 * Check for three of a kind
 */
function checkForThreeOfKind(values: number[]): { found: boolean; value: number; diceValues: number[]; indices: number[] } {
  const counts = countDiceValues(values);
  let highestTriple = 0;
  let tripleIndices: number[] = [];

  for (const [value, data] of counts.entries()) {
    if (data.count >= 3 && value > highestTriple) {
      highestTriple = value;
      tripleIndices = data.indices.slice(0, 3);
    }
  }

  if (highestTriple > 0) {
    return {
      found: true,
      value: highestTriple * 3,
      diceValues: [highestTriple, highestTriple, highestTriple],
      indices: tripleIndices
    };
  }

  return { found: false, value: 0, diceValues: [], indices: [] };
}

/**
 * Check for four of a kind
 */
function checkForFourOfKind(values: number[]): { found: boolean; value: number; diceValues: number[]; indices: number[] } {
  const counts = countDiceValues(values);
  let highestQuad = 0;
  let quadIndices: number[] = [];

  for (const [value, data] of counts.entries()) {
    if (data.count >= 4 && value > highestQuad) {
      highestQuad = value;
      quadIndices = data.indices.slice(0, 4);
    }
  }

  if (highestQuad > 0) {
    return {
      found: true,
      value: highestQuad * 4,
      diceValues: [highestQuad, highestQuad, highestQuad, highestQuad],
      indices: quadIndices
    };
  }

  return { found: false, value: 0, diceValues: [], indices: [] };
}

/**
 * Check for runs (consecutive numbers)
 * Returns the longest run found
 */
function checkForRun(values: number[], minLength: number): { found: boolean; length: number; value: number; diceValues: number[]; indices: number[] } {
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
    // Find indices of dice that match the run values
    const runIndices: number[] = [];
    const runValuesCopy = [...longestRun];

    for (let i = 0; i < values.length && runValuesCopy.length > 0; i++) {
      const idx = runValuesCopy.indexOf(values[i]);
      if (idx !== -1) {
        runIndices.push(i);
        runValuesCopy.splice(idx, 1);
      }
    }

    const runValue = longestRun.reduce((sum, val) => sum + val, 0);
    return {
      found: true,
      length: longestRun.length,
      value: runValue,
      diceValues: longestRun,
      indices: runIndices
    };
  }

  return { found: false, length: 0, value: 0, diceValues: [], indices: [] };
}

/**
 * Calculate multi-score combo multiplier
 * When multiple score categories (besides highest_total) are achieved in one roll,
 * apply an exponential bonus: 110% for 2, up to 250% for 8
 */
function calculateMultiScoreMultiplier(achievedCount: number): number {
  if (achievedCount < 2) return 1.0;

  // Exponential scaling: 110%, 160%, 200%, 230%, 250%
  const multipliers = [1.0, 1.1, 1.6, 2.0, 2.3, 2.5, 2.5, 2.5, 2.5];
  return multipliers[Math.min(achievedCount, multipliers.length - 1)];
}

/**
 * Calculate all scores for a given dice roll with combo tracking support
 * @param diceRoll - The dice roll to score
 * @param attemptNumber - Current attempt number for tracking
 * @param previousScores - Previous scores for combo tracking
 * @param comboMultiplierActive - Whether incense is active (adds 15% per combo)
 */
export function calculateScores(
  diceRoll: DiceRoll,
  attemptNumber?: number,
  previousScores?: ScoreCategoryData[],
  comboMultiplierActive: boolean = false
): ScoreCategoryData[] {
  const scores: ScoreCategoryData[] = [];
  const values = diceRoll.values;
  const diceIds = diceRoll.diceIds || [];
  const scoreMultipliers = diceRoll.scoreMultipliers || [];

  // Helper to map indices to dice IDs
  const mapIndicesToIds = (indices: number[]): number[] => {
    if (diceIds.length === 0) return [];
    return indices.map(i => diceIds[i]).filter(id => id !== undefined);
  };

  // Helper to get combo count for a category
  const getComboCount = (category: ScoreCategory, wasAchieved: boolean): number => {
    if (!comboMultiplierActive || !wasAchieved || !previousScores) {
      return 0;
    }

    const prevScore = previousScores.find(s => s.category === category);
    if (!prevScore || !prevScore.achieved) {
      return 0; // Combo broken
    }

    // Increment combo count
    return (prevScore.comboCount || 0) + 1;
  };

  // Helper to calculate score with modifiers and combos applied
  const applyModifiers = (
    baseScore: number,
    indices: number[],
    category: ScoreCategory,
    wasAchieved: boolean
  ): number => {
    if (baseScore === 0) return 0;

    let score = baseScore;

    // Apply dice transformation multipliers
    if (scoreMultipliers.length > 0) {
      let totalMultiplier = 1;
      for (const idx of indices) {
        const multiplier = scoreMultipliers[idx] || 1;
        totalMultiplier *= multiplier;
      }
      score = Math.floor(score * totalMultiplier);
    }

    // Apply combo multiplier if incense is active
    if (comboMultiplierActive && wasAchieved) {
      const comboCount = getComboCount(category, wasAchieved);
      if (comboCount > 0) {
        const comboBonus = 1 + (comboCount * 0.15); // 15% per combo, additive
        score = Math.floor(score * comboBonus);
        console.log(`🔥 Combo x${comboCount + 1}! ${category} score: ${Math.floor(baseScore)} → ${score} (+${Math.floor((comboBonus - 1) * 100)}%)`);
      }
    }

    return score;
  };

  // Highest Total (always present, uses all dice)
  const allIndices = values.map((_, i) => i);
  const highestTotalCombo = getComboCount("highest_total", true);
  scores.push({
    category: "highest_total",
    score: applyModifiers(diceRoll.total, allIndices, "highest_total", true),
    achieved: true,
    diceValues: [...values],
    diceIds: [...diceIds],
    lastUpdatedAttempt: attemptNumber,
    comboCount: highestTotalCombo
  });

  // Check for pairs
  const pair = checkForPair(values);
  const pairCombo = getComboCount("pair", pair.found);
  scores.push({
    category: "pair",
    score: applyModifiers(pair.value, pair.indices, "pair", pair.found),
    achieved: pair.found,
    diceValues: pair.diceValues,
    diceIds: mapIndicesToIds(pair.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: pairCombo
  });

  // Check for two pairs
  const twoPair = checkForTwoPair(values);
  const twoPairCombo = getComboCount("two_pair", twoPair.found);
  scores.push({
    category: "two_pair",
    score: applyModifiers(twoPair.value, twoPair.indices, "two_pair", twoPair.found),
    achieved: twoPair.found,
    diceValues: twoPair.diceValues,
    diceIds: mapIndicesToIds(twoPair.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: twoPairCombo
  });

  // Check for three of a kind
  const threeKind = checkForThreeOfKind(values);
  const threeKindCombo = getComboCount("three_of_kind", threeKind.found);
  scores.push({
    category: "three_of_kind",
    score: applyModifiers(threeKind.value, threeKind.indices, "three_of_kind", threeKind.found),
    achieved: threeKind.found,
    diceValues: threeKind.diceValues,
    diceIds: mapIndicesToIds(threeKind.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: threeKindCombo
  });

  // Check for four of a kind
  const fourKind = checkForFourOfKind(values);
  const fourKindCombo = getComboCount("four_of_kind", fourKind.found);
  scores.push({
    category: "four_of_kind",
    score: applyModifiers(fourKind.value, fourKind.indices, "four_of_kind", fourKind.found),
    achieved: fourKind.found,
    diceValues: fourKind.diceValues,
    diceIds: mapIndicesToIds(fourKind.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: fourKindCombo
  });

  // Check for runs
  const run3 = checkForRun(values, 3);
  const run3Achieved = run3.found && run3.length === 3;
  const run3Combo = getComboCount("run_of_3", run3Achieved);
  scores.push({
    category: "run_of_3",
    score: applyModifiers(run3.value, run3.indices, "run_of_3", run3Achieved),
    achieved: run3Achieved,
    diceValues: run3.diceValues,
    diceIds: mapIndicesToIds(run3.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: run3Combo
  });

  const run4 = checkForRun(values, 4);
  const run4Achieved = run4.found && run4.length === 4;
  const run4Combo = getComboCount("run_of_4", run4Achieved);
  scores.push({
    category: "run_of_4",
    score: applyModifiers(run4.value, run4.indices, "run_of_4", run4Achieved),
    achieved: run4Achieved,
    diceValues: run4.diceValues,
    diceIds: mapIndicesToIds(run4.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: run4Combo
  });

  const run5 = checkForRun(values, 5);
  const run5Achieved = run5.found && run5.length === 5;
  const run5Combo = getComboCount("run_of_5", run5Achieved);
  scores.push({
    category: "run_of_5",
    score: applyModifiers(run5.value, run5.indices, "run_of_5", run5Achieved),
    achieved: run5Achieved,
    diceValues: run5.diceValues,
    diceIds: mapIndicesToIds(run5.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: run5Combo
  });

  const run6 = checkForRun(values, 6);
  const run6Achieved = run6.found && run6.length === 6;
  const run6Combo = getComboCount("run_of_6", run6Achieved);
  scores.push({
    category: "run_of_6",
    score: applyModifiers(run6.value, run6.indices, "run_of_6", run6Achieved),
    achieved: run6Achieved,
    diceValues: run6.diceValues,
    diceIds: mapIndicesToIds(run6.indices),
    lastUpdatedAttempt: attemptNumber,
    comboCount: run6Combo
  });

  // Apply multi-score combo multiplier
  // Count how many non-highest-total scores were achieved
  const achievedNonTotalCount = scores.filter(
    s => s.achieved && s.category !== "highest_total"
  ).length;

  const multiScoreMultiplier = calculateMultiScoreMultiplier(achievedNonTotalCount);

  if (multiScoreMultiplier > 1.0) {
    console.log(
      `⚡ MULTI-SCORE COMBO! ${achievedNonTotalCount} scores triggered → ${Math.floor(multiScoreMultiplier * 100)}% bonus!`
    );

    // Apply multiplier to all scores (including highest_total)
    scores.forEach(score => {
      score.multiScoreMultiplier = multiScoreMultiplier;
      if (score.achieved && score.score > 0) {
        const originalScore = score.score;
        score.score = Math.floor(score.score * multiScoreMultiplier);
        console.log(
          `  ${score.category}: ${originalScore} → ${score.score} (+${Math.floor((multiScoreMultiplier - 1) * 100)}%)`
        );
      }
    });
  }

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
        // Replace with new score (which has updated comboCount)
        updated[existingIndex] = newScore;
      } else {
        // Keep the best score, but update combo count and achievement status
        // This ensures combo tracking continues even if score isn't beaten
        updated[existingIndex] = {
          ...existing,
          comboCount: newScore.comboCount,
          achieved: newScore.achieved,
          lastUpdatedAttempt: newScore.lastUpdatedAttempt
        };
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
    diceValues: [],
    diceIds: []
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
