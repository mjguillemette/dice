import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode
} from "react";
import {
  gameStateReducer,
  initialGameState,
  type GameState,
  type GameAction
} from "../systems/gameStateSystem";
import type { Enemy } from "../types/combat.types";

interface GameStateContextValue {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods for common actions
  startGame: () => void;
  throwDice: (corruptionPerRoll?: number) => void;
  diceSettled: (diceValues?: number[], diceIds?: number[], scoreMultipliers?: number[], comboMultiplierActive?: boolean, previousScores?: any[]) => void;
  successfulRoll: (cigaretteBonus?: number) => void;
  failedRoll: () => void;
  itemSelected: () => void;
  returnToMenu: () => void;
  // Combat methods
  combatStart: (enemies: Enemy[]) => void;
  combatEnemyRoll: () => void;
  combatPlayerTurnStart: () => void;
  combatSelectAbility: (abilityCategory: string) => void;
  combatSelectEnemy: (enemyId: number) => void;
  combatUseAbility: (enemyId?: number) => void;
  combatApplyDamageToEnemy: (enemyId: number, damage: number) => void;
  combatApplyDamageToPlayer: (damage: number) => void;
  combatResolve: () => void;
  combatEnd: () => void;
}

const GameStateContext = createContext<GameStateContextValue | undefined>(
  undefined
);

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const [gameState, dispatch] = useReducer(gameStateReducer, initialGameState);

  // Convenience methods that wrap dispatch calls
  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  const throwDice = useCallback((corruptionPerRoll?: number) => {
    dispatch({ type: "THROW_DICE", corruptionPerRoll });
  }, []);

  const diceSettled = useCallback((diceValues?: number[], diceIds?: number[], scoreMultipliers?: number[], comboMultiplierActive?: boolean, previousScores?: any[]) => {
    if (diceValues && diceValues.length > 0) {
      const total = diceValues.reduce((sum, val) => sum + val, 0);
      dispatch({
        type: "DICE_SETTLED",
        diceRoll: {
          values: diceValues,
          total,
          diceIds,
          scoreMultipliers
        },
        comboMultiplierActive,
        previousScores
      });
    } else {
      dispatch({ type: "DICE_SETTLED" });
    }
  }, []);

  const successfulRoll = useCallback((cigaretteBonus?: number) => {
    dispatch({ type: "SUCCESSFUL_ROLL", cigaretteBonus });
  }, []);

  const failedRoll = useCallback(() => {
    dispatch({ type: "FAILED_ROLL" });
  }, []);

  const itemSelected = useCallback(() => {
    dispatch({ type: "ITEM_SELECTED" });
  }, []);

  const returnToMenu = useCallback(() => {
    dispatch({ type: "RETURN_TO_MENU" });
  }, []);

  // Combat convenience methods
  const combatStart = useCallback((enemies: Enemy[]) => {
    dispatch({ type: "COMBAT_START", enemies });
  }, []);

  const combatEnemyRoll = useCallback(() => {
    dispatch({ type: "COMBAT_ENEMY_ROLL" });
  }, []);

  const combatPlayerTurnStart = useCallback(() => {
    dispatch({ type: "COMBAT_PLAYER_TURN_START" });
  }, []);

  const combatSelectAbility = useCallback((abilityCategory: string) => {
    dispatch({ type: "COMBAT_SELECT_ABILITY", abilityCategory });
  }, []);

  const combatSelectEnemy = useCallback((enemyId: number) => {
    dispatch({ type: "COMBAT_SELECT_ENEMY", enemyId });
  }, []);

  const combatUseAbility = useCallback((enemyId?: number) => {
    dispatch({ type: "COMBAT_USE_ABILITY", enemyId });
  }, []);

  const combatApplyDamageToEnemy = useCallback((enemyId: number, damage: number) => {
    dispatch({ type: "COMBAT_APPLY_DAMAGE_TO_ENEMY", enemyId, damage });
  }, []);

  const combatApplyDamageToPlayer = useCallback((damage: number) => {
    dispatch({ type: "COMBAT_APPLY_DAMAGE_TO_PLAYER", damage });
  }, []);

  const combatResolve = useCallback(() => {
    dispatch({ type: "COMBAT_RESOLVE" });
  }, []);

  const combatEnd = useCallback(() => {
    dispatch({ type: "COMBAT_END" });
  }, []);

  const value: GameStateContextValue = {
    gameState,
    dispatch,
    startGame,
    throwDice,
    diceSettled,
    successfulRoll,
    failedRoll,
    itemSelected,
    returnToMenu,
    combatStart,
    combatEnemyRoll,
    combatPlayerTurnStart,
    combatSelectAbility,
    combatSelectEnemy,
    combatUseAbility,
    combatApplyDamageToEnemy,
    combatApplyDamageToPlayer,
    combatResolve,
    combatEnd
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}
