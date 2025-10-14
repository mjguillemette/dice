/**
 * Game State Machine System
 * Manages the comprehensive state machine for time passage and game progression
 */

// ===== TYPES & INTERFACES =====

export type TimeOfDay = 'morning' | 'midday' | 'night';

export type GamePhase =
  | 'idle'            // No dice thrown, waiting for player
  | 'throwing'        // Dice are in motion
  | 'settled'         // Dice have settled, waiting for pickup
  | 'evaluating'      // Evaluating if roll was successful
  | 'item_selection'; // Choosing an item at end of day

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
}

export type GameAction =
  | { type: 'THROW_DICE' }
  | { type: 'DICE_SETTLED' }
  | { type: 'SUCCESSFUL_ROLL' }
  | { type: 'FAILED_ROLL' }
  | { type: 'PICKUP_DICE' }
  | { type: 'RESET_ATTEMPTS' }
  | { type: 'ITEM_SELECTED' }; // Player selected an item

// ===== CONSTANTS =====

export const ROLLS_PER_TIME_PERIOD = 3;
export const MAX_ATTEMPTS_PER_ROUND = 2; // Changed from 3 to 2
export const MAX_CALENDAR_DAYS = 31;

// ===== INITIAL STATE =====

export const initialGameState: GameState = {
  timeOfDay: 'morning',
  daysMarked: 2, // Start with 1st and 2nd marked
  successfulRolls: 0,
  currentAttempts: 0,
  phase: 'idle',
  totalAttempts: 0,
  totalSuccesses: 0,
};

// ===== STATE MACHINE LOGIC =====

/**
 * Advances time of day: morning → midday → night → morning (new day)
 */
function advanceTime(currentTime: TimeOfDay, currentDay: number): { timeOfDay: TimeOfDay; daysMarked: number } {
  if (currentTime === 'morning') {
    return { timeOfDay: 'midday', daysMarked: currentDay };
  } else if (currentTime === 'midday') {
    return { timeOfDay: 'night', daysMarked: currentDay };
  } else {
    // Night → Morning (new day)
    const newDay = Math.min(currentDay + 1, MAX_CALENDAR_DAYS);
    return { timeOfDay: 'morning', daysMarked: newDay };
  }
}

/**
 * Game State Reducer
 * Handles all state transitions based on actions
 */
export function gameStateReducer(state: GameState, action: GameAction): GameState {
  console.log('🎲 Game State Action:', action.type, 'Current State:', {
    phase: state.phase,
    attempts: state.currentAttempts,
    successes: state.successfulRolls,
    timeOfDay: state.timeOfDay,
  });

  switch (action.type) {
    case 'THROW_DICE': {
      // Can only throw from idle or settled states
      if (state.phase !== 'idle' && state.phase !== 'settled') {
        console.warn('⚠️ Cannot throw dice in phase:', state.phase);
        return state;
      }

      const newAttempts = state.currentAttempts + 1;

      return {
        ...state,
        phase: 'throwing',
        currentAttempts: newAttempts,
        totalAttempts: state.totalAttempts + 1,
      };
    }

    case 'DICE_SETTLED': {
      // Dice have stopped moving, ready for evaluation
      if (state.phase !== 'throwing') {
        console.warn('⚠️ Dice settled but phase was not throwing:', state.phase);
      }

      return {
        ...state,
        phase: 'settled',
      };
    }

    case 'SUCCESSFUL_ROLL': {
      // All dice in receptacle - successful round!
      // Increment roll progress and reset attempts
      const newSuccesses = state.successfulRolls + 1;
      const shouldAdvanceTime = newSuccesses % ROLLS_PER_TIME_PERIOD === 0;

      let newTimeState = {
        timeOfDay: state.timeOfDay,
        daysMarked: state.daysMarked,
      };

      if (shouldAdvanceTime) {
        newTimeState = advanceTime(state.timeOfDay, state.daysMarked);
        console.log('⏰ Time advanced!', newTimeState);
      }

      console.log('✅ Round complete - SUCCESS! Roll progress:', newSuccesses % ROLLS_PER_TIME_PERIOD, '/ 3');

      // Check if we just completed a full day (night -> morning transition)
      const justCompletedDay = shouldAdvanceTime && state.timeOfDay === 'night';

      return {
        ...state,
        phase: justCompletedDay ? 'item_selection' : 'idle',
        successfulRolls: newSuccesses,
        currentAttempts: 0, // Reset attempts after round completes
        totalSuccesses: state.totalSuccesses + 1,
        ...newTimeState,
      };
    }

    case 'FAILED_ROLL': {
      // Check if we've used all attempts
      const roundComplete = state.currentAttempts >= MAX_ATTEMPTS_PER_ROUND;

      if (roundComplete) {
        // Round is over - used all attempts without success
        console.log('❌ Round complete - FAILED (used all', MAX_ATTEMPTS_PER_ROUND, 'attempts)');

        // Still increment roll progress (failed rounds count toward time passage)
        const newSuccesses = state.successfulRolls + 1;
        const shouldAdvanceTime = newSuccesses % ROLLS_PER_TIME_PERIOD === 0;

        let newTimeState = {
          timeOfDay: state.timeOfDay,
          daysMarked: state.daysMarked,
        };

        if (shouldAdvanceTime) {
          newTimeState = advanceTime(state.timeOfDay, state.daysMarked);
          console.log('⏰ Time advanced!', newTimeState);
        }

        // Check if we just completed a full day (night -> morning transition)
        const justCompletedDay = shouldAdvanceTime && state.timeOfDay === 'night';

        return {
          ...state,
          phase: justCompletedDay ? 'item_selection' : 'idle',
          successfulRolls: newSuccesses,
          currentAttempts: 0, // Reset attempts for next round
          ...newTimeState,
        };
      } else {
        // Still have attempts left in this round
        console.log('⚠️ Attempt failed - attempts remaining:', MAX_ATTEMPTS_PER_ROUND - state.currentAttempts);
        return {
          ...state,
          phase: 'idle', // Ready for next attempt
        };
      }
    }

    case 'PICKUP_DICE': {
      // Player picked up dice, ready to throw again
      return {
        ...state,
        phase: 'idle',
      };
    }

    case 'RESET_ATTEMPTS': {
      // Manual reset (e.g., exceeded max attempts)
      return {
        ...state,
        currentAttempts: 0,
        phase: 'idle',
      };
    }

    case 'ITEM_SELECTED': {
      // Player selected an item, return to gameplay
      console.log('🎁 Item selected - returning to gameplay');
      return {
        ...state,
        phase: 'idle',
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
  const rollProgress = `${state.successfulRolls % ROLLS_PER_TIME_PERIOD}/${ROLLS_PER_TIME_PERIOD}`;
  const attemptProgress = `${state.currentAttempts}/${MAX_ATTEMPTS_PER_ROUND}`;
  return `Day ${state.daysMarked} (${state.timeOfDay}) | Rolls: ${rollProgress} | Attempts: ${attemptProgress}`;
}
