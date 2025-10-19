/**
 * Game State Machine System
 * Manages the comprehensive state machine for time passage and game progression
 */

import type { ScoringState, DiceRoll, ScoreCategoryData } from "./scoringSystem";
import {
  calculateScores,
  updateBestScores,
  initialScoringState,
  initializeEmptyScores
} from "./scoringSystem";

// ===== TYPES & INTERFACES =====

export type TimeOfDay = "morning" | "midday" | "night";

export type GamePhase =
  | "menu" // Initial menu screen
  | "idle" // No dice thrown, waiting for player
  | "throwing" // Dice are in motion
  | "settled" // Dice have settled, waiting for pickup
  | "evaluating" // Evaluating if roll was successful
  | "item_selection"; // Choosing an item at end of day

export interface GameState {
  // Time passage
  timeOfDay: TimeOfDay;
  daysMarked: number;

  // Roll tracking
  successfulRolls: number;
  currentAttempts: number;

  // Game phase
  phase: GamePhase;

  // History (for debugging/analytics)
  totalAttempts: number;
  totalSuccesses: number;

  // Scoring system
  scoring: ScoringState;

  // Daily targets and corruption
  dailyTarget: number; // Score target for today
  dailyBestScore: number; // Best score achieved today
  corruption: number; // 0-1, where 1 is game over
  isGameOver: boolean; // True when corruption reaches 100%
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "RETURN_TO_MENU" }
  | { type: "THROW_DICE"; corruptionPerRoll?: number } // Add corruption modifier from items
  | {
      type: "DICE_SETTLED";
      diceRoll?: DiceRoll;
      comboMultiplierActive?: boolean; // Whether incense is active
      previousScores?: ScoreCategoryData[]; // For combo tracking
    }
  | { type: "SUCCESSFUL_ROLL"; cigaretteBonus?: number } // Corruption scaling from cigarette
  | { type: "FAILED_ROLL" }
  | { type: "PICKUP_DICE" }
  | { type: "RESET_ATTEMPTS" }
  | { type: "ITEM_SELECTED" };

// ===== CONSTANTS =====

export const ROLLS_PER_TIME_PERIOD = 3;
export const MAX_ATTEMPTS_PER_ROUND = 2; // Changed from 3 to 2
export const MAX_CALENDAR_DAYS = 31;

// Daily target calculation: exponential growth
export const BASE_TARGET = 30; // Starting target for day 1 (sum of all score buckets)
export const TARGET_GROWTH_RATE = 1.5; // 50% increase per day - significantly faster exponential growth
export const CORRUPTION_PER_THROW = 0.02; // 2% corruption increase per throw
export const CORRUPTION_DECREASE_ON_SUCCESS = 0.25; // Decrease corruption when target met (unused, now % based)

/**
 * Calculate the target score for a given day (exponential growth)
 */
export function calculateDailyTarget(day: number): number {
  return Math.floor(BASE_TARGET * Math.pow(TARGET_GROWTH_RATE, day - 1));
}

/**
 * Calculate total score from all achieved score buckets
 */
export function calculateTotalScore(scores: import("./scoringSystem").ScoreCategoryData[]): number {
  return scores.reduce((total, score) => {
    return total + (score.achieved ? score.score : 0);
  }, 0);
}

// ===== INITIAL STATE =====

export const initialGameState: GameState = {
  timeOfDay: "morning",
  daysMarked: 2, // Start with 1st and 2nd marked
  successfulRolls: 0,
  currentAttempts: 0,
  phase: "menu",
  totalAttempts: 0,
  totalSuccesses: 0,
  scoring: initialScoringState,
  dailyTarget: calculateDailyTarget(2), // Target for day 2
  dailyBestScore: 0,
  corruption: 0,
  isGameOver: false
};

// ===== STATE MACHINE LOGIC =====

/**
 * Advances time of day: morning → midday → night → morning (new day)
 */
function advanceTime(
  currentTime: TimeOfDay,
  currentDay: number
): { timeOfDay: TimeOfDay; daysMarked: number } {
  if (currentTime === "morning") {
    return { timeOfDay: "midday", daysMarked: currentDay };
  } else if (currentTime === "midday") {
    return { timeOfDay: "night", daysMarked: currentDay };
  } else {
    // Night → Morning (new day)
    const newDay = Math.min(currentDay + 1, MAX_CALENDAR_DAYS);
    return { timeOfDay: "morning", daysMarked: newDay };
  }
}

/**
 * Game State Reducer
 * Handles all state transitions based on actions
 */
export function gameStateReducer(
  state: GameState,
  action: GameAction
): GameState {
  console.log("🎲 Game State Action:", action.type, "Current State:", {
    phase: state.phase,
    attempts: state.currentAttempts,
    successes: state.successfulRolls,
    timeOfDay: state.timeOfDay
  });

  switch (action.type) {
    case "START_GAME": {
      // If game over, reset to initial state
      if (state.isGameOver) {
        console.log("🔄 Resetting game after game over");
        return {
          ...initialGameState,
          phase: "item_selection"  // Start with item selection on first morning
        };
      }

      // Otherwise just start the game with item selection
      return {
        ...state,
        phase: "item_selection"  // Start with item selection on first morning
      };
    }

    case "RETURN_TO_MENU": {
      // Return to menu - reset to initial state but keep history
      console.log("🔙 Returning to menu");
      return {
        ...initialGameState,
        totalAttempts: state.totalAttempts,
        totalSuccesses: state.totalSuccesses
      };
    }

    case "THROW_DICE": {
      // Can only throw from idle or settled states
      if (state.phase !== "idle" && state.phase !== "settled") {
        console.warn("⚠️ Cannot throw dice in phase:", state.phase);
        return state;
      }

      const newAttempts = state.currentAttempts + 1;

      // Reset scores if we're starting fresh in a new time period
      // (Check if current time of day doesn't match the scoring time of day)
      let newScoring = state.scoring;
      if (
        newAttempts === 1 &&
        state.scoring.currentTimeOfDay !== state.timeOfDay
      ) {
        newScoring = {
          ...state.scoring,
          currentScores: initializeEmptyScores(),
          currentTimeOfDay: state.timeOfDay
        };
        console.log(
          "📊 Scores reset for new time period:",
          state.timeOfDay
        );
      }

      // Increase corruption by base 2% per throw + any additional corruption from items (e.g. cigarette)
      const totalCorruptionIncrease = CORRUPTION_PER_THROW + (action.corruptionPerRoll || 0);
      const newCorruption = Math.min(1, state.corruption + totalCorruptionIncrease);
      const isGameOver = newCorruption >= 1;

      if (action.corruptionPerRoll && action.corruptionPerRoll > 0) {
        console.log("🚬 Cigarette effect: +" + Math.floor(action.corruptionPerRoll * 100) + "% corruption (Total: +" + Math.floor(totalCorruptionIncrease * 100) + "%)");
      }

      if (isGameOver) {
        console.log("☠️ GAME OVER - Corruption reached 100% during throw");
      }

      return {
        ...state,
        phase: isGameOver ? "menu" : "throwing",
        currentAttempts: newAttempts,
        totalAttempts: state.totalAttempts + 1,
        scoring: newScoring,
        corruption: newCorruption,
        isGameOver
      };
    }

    case "DICE_SETTLED": {
      // Dice have stopped moving, ready for evaluation
      if (state.phase !== "throwing") {
        console.warn(
          "⚠️ Dice settled but phase was not throwing:",
          state.phase
        );
      }

      // Calculate scores if dice roll data provided
      let newScoring = state.scoring;
      if (action.diceRoll) {
        // Pass previous scores and combo multiplier status for combo tracking
        const rollScores = calculateScores(
          action.diceRoll,
          state.totalAttempts,
          action.previousScores || state.scoring.currentScores,
          action.comboMultiplierActive || false
        );
        console.log("🎯 Calculated scores for roll (attempt #" + state.totalAttempts + "):", rollScores);

        // Update current scores (best scores for this time period)
        const updatedCurrentScores = updateBestScores(
          state.scoring.currentScores,
          rollScores
        );

        // Also update historical scores for this time period
        const historicalScores = { ...state.scoring.historicalScores };
        historicalScores[state.timeOfDay] = updatedCurrentScores;

        newScoring = {
          ...state.scoring,
          currentScores: updatedCurrentScores,
          historicalScores,
          currentTimeOfDay: state.timeOfDay
        };
      }

      // Update daily best score as sum of ALL achieved score buckets
      const totalBucketScore = calculateTotalScore(newScoring.currentScores);
      const newDailyBest = Math.max(state.dailyBestScore, totalBucketScore);

      console.log("📊 Total bucket score:", totalBucketScore, "Daily best:", newDailyBest);

      return {
        ...state,
        phase: "settled",
        scoring: newScoring,
        dailyBestScore: newDailyBest
      };
    }

    case "SUCCESSFUL_ROLL": {
      // All dice in receptacle - successful round!
      // Increment roll progress and reset attempts
      const newSuccesses = state.successfulRolls + 1;
      const shouldAdvanceTime = newSuccesses % ROLLS_PER_TIME_PERIOD === 0;

      let newTimeState = {
        timeOfDay: state.timeOfDay,
        daysMarked: state.daysMarked
      };

      if (shouldAdvanceTime) {
        newTimeState = advanceTime(state.timeOfDay, state.daysMarked);
        console.log("⏰ Time advanced!", newTimeState);
      }

      console.log(
        "✅ Round complete - SUCCESS! Roll progress:",
        newSuccesses % ROLLS_PER_TIME_PERIOD,
        "/ 3"
      );

      // Check if we just completed a full day (night -> morning transition)
      const justCompletedDay = shouldAdvanceTime && state.timeOfDay === "night";

      // Apply cigarette bonus if provided (adds to Highest Total based on corruption%)
      let scoringAfterCigarette = state.scoring;
      if (justCompletedDay && action.cigaretteBonus && action.cigaretteBonus > 0) {
        const bonusAmount = action.cigaretteBonus; // Capture for type narrowing
        const updatedScores = state.scoring.currentScores.map(score => {
          if (score.category === "highest_total" && score.achieved) {
            const bonusPoints = Math.floor(bonusAmount);
            console.log(`🚬 Cigarette corruption bonus: +${bonusPoints} to Highest Total (${Math.floor(state.corruption * 100)}% corruption)`);
            return {
              ...score,
              score: score.score + bonusPoints
            };
          }
          return score;
        });

        scoringAfterCigarette = {
          ...state.scoring,
          currentScores: updatedScores
        };
      }

      // Check if daily target was met and update corruption
      let newCorruption = state.corruption;
      let newDailyTarget = state.dailyTarget;
      let newDailyBestScore = state.dailyBestScore;
      let newIsGameOver = state.isGameOver;

      if (justCompletedDay) {
        const targetMet = state.dailyBestScore >= state.dailyTarget;

        if (!targetMet) {
          // Missed the daily target - no corruption change (already increasing per throw)
          console.log(
            "💀 Daily target MISSED! (" + state.dailyBestScore + " / " + state.dailyTarget + ")",
            "Corruption remains at " + Math.floor(state.corruption * 100) + "%"
          );

          // Check for game over
          if (state.corruption >= 1) {
            newIsGameOver = true;
            newCorruption = 1;
            console.log("☠️ GAME OVER - Corruption reached 100%");
          }
        } else {
          // Target met - decrease corruption based on % over goal
          const percentOver = ((state.dailyBestScore - state.dailyTarget) / state.dailyTarget);
          const corruptionDecrease = percentOver; // 100% over = -100% corruption, 50% over = -50%, etc.
          newCorruption = Math.max(0, state.corruption - corruptionDecrease);

          console.log(
            "✨ Daily target MET! (" + state.dailyBestScore + " / " + state.dailyTarget + ")",
            "Score " + Math.floor(percentOver * 100) + "% over target!",
            "Corruption decreased from " + Math.floor(state.corruption * 100) + "% to " + Math.floor(newCorruption * 100) + "%"
          );
        }

        // Set new target for the new day
        newDailyTarget = calculateDailyTarget(newTimeState.daysMarked);
        newDailyBestScore = 0; // Reset for new day
        console.log("🎯 New daily target for day " + newTimeState.daysMarked + ": " + newDailyTarget);
      }

      // Handle scoring when time advances
      let finalScoring = scoringAfterCigarette;
      if (shouldAdvanceTime) {
        if (justCompletedDay) {
          // Reset scores immediately when starting a new day (night -> morning)
          finalScoring = {
            ...scoringAfterCigarette,
            currentScores: initializeEmptyScores(),
            currentTimeOfDay: newTimeState.timeOfDay as TimeOfDay
          };
          console.log(
            "📊 New day! Scorecard reset for:",
            newTimeState.timeOfDay
          );
        } else {
          // Just changing time within the same day - keep scores
          finalScoring = {
            ...scoringAfterCigarette,
            currentTimeOfDay: newTimeState.timeOfDay as TimeOfDay
          };
          console.log(
            "📊 Time period changed to:",
            newTimeState.timeOfDay
          );
        }
      }

      return {
        ...state,
        phase: newIsGameOver ? "menu" : (justCompletedDay ? "item_selection" : "idle"),
        successfulRolls: newSuccesses,
        currentAttempts: 0, // Reset attempts after round completes
        totalSuccesses: state.totalSuccesses + 1,
        ...newTimeState,
        scoring: finalScoring,
        dailyTarget: newDailyTarget,
        dailyBestScore: newDailyBestScore,
        corruption: newCorruption,
        isGameOver: newIsGameOver
      };
    }

    case "FAILED_ROLL": {
      // Check if we've used all attempts
      const roundComplete = state.currentAttempts >= MAX_ATTEMPTS_PER_ROUND;

      if (roundComplete) {
        // Round is over - used all attempts without success
        console.log(
          "❌ Round complete - FAILED (used all",
          MAX_ATTEMPTS_PER_ROUND,
          "attempts)"
        );

        // Still increment roll progress (failed rounds count toward time passage)
        const newSuccesses = state.successfulRolls + 1;
        const shouldAdvanceTime = newSuccesses % ROLLS_PER_TIME_PERIOD === 0;

        let newTimeState = {
          timeOfDay: state.timeOfDay,
          daysMarked: state.daysMarked
        };

        if (shouldAdvanceTime) {
          newTimeState = advanceTime(state.timeOfDay, state.daysMarked);
          console.log("⏰ Time advanced!", newTimeState);
        }

        // Check if we just completed a full day (night -> morning transition)
        const justCompletedDay =
          shouldAdvanceTime && state.timeOfDay === "night";

        // Check if daily target was met and update corruption
        let newCorruption = state.corruption;
        let newDailyTarget = state.dailyTarget;
        let newDailyBestScore = state.dailyBestScore;
        let newIsGameOver = state.isGameOver;

        if (justCompletedDay) {
          const targetMet = state.dailyBestScore >= state.dailyTarget;

          if (!targetMet) {
            // Missed the daily target - no corruption change (already increasing per throw)
            console.log(
              "💀 Daily target MISSED! (" + state.dailyBestScore + " / " + state.dailyTarget + ")",
              "Corruption remains at " + Math.floor(state.corruption * 100) + "%"
            );

            // Check for game over
            if (state.corruption >= 1) {
              newIsGameOver = true;
              newCorruption = 1;
              console.log("☠️ GAME OVER - Corruption reached 100%");
            }
          } else {
            // Target met - decrease corruption based on % over goal
            const percentOver = ((state.dailyBestScore - state.dailyTarget) / state.dailyTarget);
            const corruptionDecrease = percentOver; // 100% over = -100% corruption, 50% over = -50%, etc.
            newCorruption = Math.max(0, state.corruption - corruptionDecrease);

            console.log(
              "✨ Daily target MET! (" + state.dailyBestScore + " / " + state.dailyTarget + ")",
              "Score " + Math.floor(percentOver * 100) + "% over target!",
              "Corruption decreased from " + Math.floor(state.corruption * 100) + "% to " + Math.floor(newCorruption * 100) + "%"
            );
          }

          // Set new target for the new day
          newDailyTarget = calculateDailyTarget(newTimeState.daysMarked);
          newDailyBestScore = 0; // Reset for new day
          console.log("🎯 New daily target for day " + newTimeState.daysMarked + ": " + newDailyTarget);
        }

        // Handle scoring when time advances
        let newScoring = state.scoring;
        if (shouldAdvanceTime) {
          if (justCompletedDay) {
            // Reset scores immediately when starting a new day (night -> morning)
            newScoring = {
              ...state.scoring,
              currentScores: initializeEmptyScores(),
              currentTimeOfDay: newTimeState.timeOfDay as TimeOfDay
            };
            console.log(
              "📊 New day! Scorecard reset for:",
              newTimeState.timeOfDay
            );
          } else {
            // Just changing time within the same day - keep scores
            newScoring = {
              ...state.scoring,
              currentTimeOfDay: newTimeState.timeOfDay as TimeOfDay
            };
            console.log(
              "📊 Time period changed to:",
              newTimeState.timeOfDay
            );
          }
        }

        return {
          ...state,
          phase: newIsGameOver ? "menu" : (justCompletedDay ? "item_selection" : "idle"),
          successfulRolls: newSuccesses,
          currentAttempts: 0, // Reset attempts for next round
          ...newTimeState,
          scoring: newScoring,
          dailyTarget: newDailyTarget,
          dailyBestScore: newDailyBestScore,
          corruption: newCorruption,
          isGameOver: newIsGameOver
        };
      } else {
        // Still have attempts left in this round
        console.log(
          "⚠️ Attempt failed - attempts remaining:",
          MAX_ATTEMPTS_PER_ROUND - state.currentAttempts
        );
        return {
          ...state,
          phase: "idle" // Ready for next attempt
        };
      }
    }

    case "PICKUP_DICE": {
      // Player picked up dice, ready to throw again
      return {
        ...state,
        phase: "idle"
      };
    }

    case "RESET_ATTEMPTS": {
      // Manual reset (e.g., exceeded max attempts)
      return {
        ...state,
        currentAttempts: 0,
        phase: "idle"
      };
    }

    case "ITEM_SELECTED": {
      // Player selected an item, return to gameplay
      console.log("🎁 Item selected - returning to gameplay");

      // Scores already reset when day changed (during SUCCESSFUL_ROLL/FAILED_ROLL)
      return {
        ...state,
        phase: "idle"
      };
    }

    default:
      return state;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate progress toward next time change (0-1)
 */
export function getTimeProgressRatio(successfulRolls: number): number {
  return (successfulRolls % ROLLS_PER_TIME_PERIOD) / ROLLS_PER_TIME_PERIOD;
}

/**
 * Get the number of remaining rolls until time advances
 */
export function getRollsUntilTimeChange(successfulRolls: number): number {
  return ROLLS_PER_TIME_PERIOD - (successfulRolls % ROLLS_PER_TIME_PERIOD);
}

/**
 * Get the number of remaining attempts in current round
 */
export function getRemainingAttempts(currentAttempts: number): number {
  return Math.max(0, MAX_ATTEMPTS_PER_ROUND - currentAttempts);
}

/**
 * Check if we're on the last attempt
 */
export function isLastAttempt(currentAttempts: number): boolean {
  return currentAttempts >= MAX_ATTEMPTS_PER_ROUND;
}

/**
 * Get a summary string of current game state
 */
export function getGameStateSummary(state: GameState): string {
  const rollProgress = `${
    state.successfulRolls % ROLLS_PER_TIME_PERIOD
  }/${ROLLS_PER_TIME_PERIOD}`;
  const attemptProgress = `${state.currentAttempts}/${MAX_ATTEMPTS_PER_ROUND}`;
  return `Day ${state.daysMarked} (${state.timeOfDay}) | Rolls: ${rollProgress} | Attempts: ${attemptProgress}`;
}
