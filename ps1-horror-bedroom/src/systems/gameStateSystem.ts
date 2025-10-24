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
import type { CombatState, CombatPhase, Enemy } from "../types/combat.types";

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

  // Combat system
  combat: CombatState;
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
  | { type: "ITEM_SELECTED" }
  // Combat actions
  | { type: "COMBAT_START"; enemies: Enemy[] }
  | { type: "COMBAT_ENEMY_ROLL" }
  | { type: "COMBAT_PLAYER_TURN_START" }
  | { type: "COMBAT_SELECT_ABILITY"; abilityCategory: string }
  | { type: "COMBAT_SELECT_ENEMY"; enemyId: number }
  | { type: "COMBAT_USE_ABILITY"; enemyId?: number } // undefined for non-targeted abilities
  | { type: "COMBAT_RESOLVE" }
  | { type: "COMBAT_END" }
  | { type: "COMBAT_APPLY_DAMAGE_TO_PLAYER"; damage: number }
  | { type: "COMBAT_APPLY_DAMAGE_TO_ENEMY"; enemyId: number; damage: number };

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

const initialCombatState: CombatState = {
  phase: null,
  enemies: [],
  playerHP: 10, // Start at 10 until highest_total is achieved
  maxPlayerHP: 10, // Start at 10 until highest_total is achieved
  selectedAbility: null,
  selectedEnemyId: null,
  usedDiceIds: [], // Track dice used this combat round
  currentDiceRoll: null // Current dice roll for recalculating abilities
};

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
  isGameOver: false,
  combat: initialCombatState
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

      // Update maxPlayerHP if highest_total score was achieved
      const highestTotalScore = newScoring.currentScores.find(
        s => s.category === "highest_total"
      );
      const newMaxHP = highestTotalScore?.achieved
        ? highestTotalScore.score
        : state.combat.maxPlayerHP;

      // If maxHP increased, also heal player to new max
      const newPlayerHP = newMaxHP > state.combat.maxPlayerHP
        ? newMaxHP
        : state.combat.playerHP;

      if (newMaxHP !== state.combat.maxPlayerHP) {
        console.log(`💖 Max HP updated: ${state.combat.maxPlayerHP} → ${newMaxHP} (Current HP: ${newPlayerHP})`);
      }

      // Store dice roll in combat state for recalculating abilities
      const currentDiceRoll = action.diceRoll ? {
        values: action.diceRoll.values,
        diceIds: action.diceRoll.diceIds || [],
        scoreMultipliers: action.diceRoll.scoreMultipliers || []
      } : state.combat.currentDiceRoll;

      return {
        ...state,
        phase: "settled",
        scoring: newScoring,
        dailyBestScore: newDailyBest,
        combat: {
          ...state.combat,
          maxPlayerHP: newMaxHP,
          playerHP: newPlayerHP,
          currentDiceRoll: currentDiceRoll
        }
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

      // Reset HP at start of new day
      const combatState = justCompletedDay
        ? {
            ...state.combat,
            playerHP: state.combat.maxPlayerHP,
            // Also reset combat phase and enemies
            phase: null as CombatPhase,
            enemies: [] as Enemy[]
          }
        : state.combat;

      if (justCompletedDay) {
        console.log(`💖 New day! HP restored to max: ${state.combat.maxPlayerHP}`);
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
        isGameOver: newIsGameOver,
        combat: combatState
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

    // ===== COMBAT ACTIONS =====

    case "COMBAT_START": {
      console.log("⚔️ Combat starting with", action.enemies.length, "enemies");
      return {
        ...state,
        combat: {
          ...state.combat,
          phase: "combat_enemy_spawn",
          enemies: action.enemies,
          selectedAbility: null,
          selectedEnemyId: null,
          usedDiceIds: [], // Clear used dice for new combat
          currentDiceRoll: null // Clear dice roll for new combat
        }
      };
    }

    case "COMBAT_ENEMY_ROLL": {
      console.log("🎲 Enemies rolling for attack damage - clearing used dice");
      // Roll attack damage for each enemy (d4 for damage, show d6 for visual)
      const enemiesWithRolls = state.combat.enemies.map(enemy => {
        const visualDice = Math.floor(Math.random() * 6) + 1; // d6 for visual (1-6)
        const actualDamage = Math.floor(Math.random() * 4) + 1; // d4 for damage (1-4)
        return {
          ...enemy,
          diceValue: visualDice,
          attackRoll: actualDamage
        };
      });

      return {
        ...state,
        combat: {
          ...state.combat,
          phase: "combat_player_turn",
          enemies: enemiesWithRolls,
          usedDiceIds: [] // Clear used dice at start of new round
        }
      };
    }

    case "COMBAT_PLAYER_TURN_START": {
      console.log("👤 Player turn starting");
      return {
        ...state,
        phase: "idle", // Allow dice throwing
        combat: {
          ...state.combat,
          phase: "combat_player_turn"
        }
      };
    }

    case "COMBAT_SELECT_ABILITY": {
      console.log("✨ Ability selected:", action.abilityCategory);
      return {
        ...state,
        combat: {
          ...state.combat,
          selectedAbility: action.abilityCategory,
          selectedEnemyId: null // Clear enemy selection when changing ability
        }
      };
    }

    case "COMBAT_SELECT_ENEMY": {
      console.log("🎯 Enemy targeted:", action.enemyId);
      return {
        ...state,
        combat: {
          ...state.combat,
          selectedEnemyId: action.enemyId
        }
      };
    }

    case "COMBAT_USE_ABILITY": {
      const { selectedAbility, selectedEnemyId } = state.combat;
      const targetId = action.enemyId || selectedEnemyId;

      if (!selectedAbility || !targetId) {
        console.warn("⚠️ Cannot use ability: missing ability or target");
        return state;
      }

      console.log("💥 Using ability:", selectedAbility, "on enemy:", targetId);

      // Find the ability's score from current scores
      const abilityScore = state.scoring.currentScores.find(
        s => s.category === selectedAbility
      );

      if (!abilityScore || !abilityScore.achieved) {
        console.warn("⚠️ Ability not available:", selectedAbility);
        return state;
      }

      // Track which dice were used for this ability
      const usedDice = abilityScore.diceIds || [];
      const newUsedDiceIds = [...state.combat.usedDiceIds, ...usedDice];
      console.log(`🎲 Used dice: ${usedDice.join(', ')} | Total used this round: ${newUsedDiceIds.join(', ')}`);

      // Apply damage to the target enemy
      const damage = abilityScore.score;
      const updatedEnemies = state.combat.enemies.map(enemy => {
        if (enemy.id === targetId) {
          const newHP = Math.max(0, enemy.hp - damage);
          console.log(`💥 Enemy ${enemy.id} HP: ${enemy.hp} → ${newHP} (${damage} damage)`);
          return { ...enemy, hp: newHP };
        }
        return enemy;
      });

      // Remove defeated enemies
      const defeatedEnemies = updatedEnemies.filter(e => e.hp <= 0);
      const survivingEnemies = updatedEnemies.filter(e => e.hp > 0);

      defeatedEnemies.forEach(enemy => {
        console.log(`💀 ${enemy.type.toUpperCase()} defeated!`);
      });

      if (defeatedEnemies.length > 0) {
        console.log(`💀 ${defeatedEnemies.length} enemy(ies) defeated`);
      }

      // IMPORTANT: Don't end combat immediately when all enemies die
      // Keep combat active so COMBAT_RESOLVE can handle victory properly
      // (awards bonus, advances time, resets state)
      return {
        ...state,
        combat: {
          ...state.combat,
          enemies: survivingEnemies,
          selectedAbility: null,
          selectedEnemyId: null,
          usedDiceIds: newUsedDiceIds, // Track used dice
          // Keep combat_player_turn phase even if all enemies defeated
          // This allows COMBAT_RESOLVE to detect victory and handle it properly
          phase: state.combat.phase
        }
      };
    }

    case "COMBAT_APPLY_DAMAGE_TO_ENEMY": {
      console.log("💥 Applying", action.damage, "damage to enemy", action.enemyId);

      const updatedEnemies = state.combat.enemies.map(enemy => {
        if (enemy.id === action.enemyId) {
          const newHP = Math.max(0, enemy.hp - action.damage);
          console.log(`Enemy ${enemy.id} HP: ${enemy.hp} → ${newHP}`);
          return { ...enemy, hp: newHP };
        }
        return enemy;
      });

      // Remove defeated enemies
      const aliveEnemies = updatedEnemies.filter(e => e.hp > 0);
      const defeatedCount = updatedEnemies.length - aliveEnemies.length;

      if (defeatedCount > 0) {
        console.log(`💀 ${defeatedCount} enemy(ies) defeated!`);
      }

      return {
        ...state,
        combat: {
          ...state.combat,
          enemies: aliveEnemies
        }
      };
    }

    case "COMBAT_APPLY_DAMAGE_TO_PLAYER": {
      console.log("💔 Player taking", action.damage, "damage");
      const newPlayerHP = Math.max(0, state.combat.playerHP - action.damage);

      const playerDefeated = newPlayerHP <= 0;
      if (playerDefeated) {
        console.log("☠️ Player defeated in combat!");
      }

      return {
        ...state,
        combat: {
          ...state.combat,
          playerHP: newPlayerHP
        },
        isGameOver: playerDefeated,
        phase: playerDefeated ? "menu" : state.phase
      };
    }

    case "COMBAT_RESOLVE": {
      console.log("⚔️ Resolving combat round");

      // Calculate total enemy damage from SURVIVING enemies only
      const totalDamage = state.combat.enemies.reduce(
        (sum, enemy) => sum + (enemy.attackRoll || 0),
        0
      );

      console.log(`${state.combat.enemies.length} surviving enemies deal ${totalDamage} total damage`);

      // Apply damage and check if player is defeated
      const newPlayerHP = Math.max(0, state.combat.playerHP - totalDamage);
      const playerDefeated = newPlayerHP <= 0;

      // Check if any enemies remain
      const combatContinues = state.combat.enemies.length > 0 && !playerDefeated;
      const combatVictory = state.combat.enemies.length === 0 && !playerDefeated;

      // If combat is won, advance time and calculate bonus
      let bonusAmount = 0;
      let newTimeState = {
        timeOfDay: state.timeOfDay,
        daysMarked: state.daysMarked
      };
      let newScoring = state.scoring;

      if (combatVictory) {
        const remainingRounds = getRollsUntilTimeChange(state.successfulRolls);
        bonusAmount = remainingRounds * 10; // 10 points per remaining round
        console.log(`🎉 Combat victory! ${remainingRounds} rounds remaining = ${bonusAmount} bonus points`);

        // Advance to next time of day
        newTimeState = advanceTime(state.timeOfDay, state.daysMarked);
        console.log(`⏰ Time advanced from ${state.timeOfDay} to ${newTimeState.timeOfDay}`);

        // Check if we just completed a full day (night -> morning transition)
        const justCompletedDay = state.timeOfDay === "night";

        // Reset scores for new time period
        if (justCompletedDay) {
          // New day - reset scorecard completely
          newScoring = {
            ...state.scoring,
            currentScores: initializeEmptyScores(),
            currentTimeOfDay: newTimeState.timeOfDay as TimeOfDay
          };
          console.log("📊 New day! Scorecard reset for:", newTimeState.timeOfDay);
        } else {
          // Just changing time within the same day - reset scores for new period
          newScoring = {
            ...state.scoring,
            currentScores: initializeEmptyScores(),
            currentTimeOfDay: newTimeState.timeOfDay as TimeOfDay
          };
          console.log("📊 Time period changed to:", newTimeState.timeOfDay);
        }

        // Set phase to item_selection if day completed, otherwise idle
        const nextPhase = justCompletedDay ? "item_selection" : "idle";

        return {
          ...state,
          combat: {
            ...state.combat,
            phase: null,
            playerHP: newPlayerHP,
            selectedAbility: null,
            selectedEnemyId: null,
            usedDiceIds: [],
            currentDiceRoll: null
          },
          ...newTimeState,
          scoring: newScoring,
          successfulRolls: state.successfulRolls + remainingRounds, // Fast-forward the rolls
          currentAttempts: 0,
          phase: nextPhase
        };
      }

      return {
        ...state,
        combat: {
          ...state.combat,
          phase: combatContinues ? "combat_await_player" : null,
          playerHP: newPlayerHP,
          selectedAbility: null,
          selectedEnemyId: null,
          usedDiceIds: combatContinues ? state.combat.usedDiceIds : [],
          currentDiceRoll: combatContinues ? state.combat.currentDiceRoll : null
        },
        isGameOver: playerDefeated,
        phase: !combatContinues ? "idle" : state.phase
      };
    }

    case "COMBAT_END": {
      console.log("🏁 Combat ending");
      return {
        ...state,
        combat: {
          ...initialCombatState,
          playerHP: state.combat.playerHP, // Preserve HP
          maxPlayerHP: state.combat.maxPlayerHP
        }
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
