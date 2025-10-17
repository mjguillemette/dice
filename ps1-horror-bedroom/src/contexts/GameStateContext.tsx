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

interface GameStateContextValue {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  // Convenience methods for common actions
  startGame: () => void;
  throwDice: () => void;
  diceSettled: (diceValues?: number[]) => void;
  successfulRoll: () => void;
  failedRoll: () => void;
  itemSelected: () => void;
  returnToMenu: () => void;
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

  const throwDice = useCallback(() => {
    dispatch({ type: "THROW_DICE" });
  }, []);

  const diceSettled = useCallback((diceValues?: number[]) => {
    if (diceValues && diceValues.length > 0) {
      const total = diceValues.reduce((sum, val) => sum + val, 0);
      dispatch({
        type: "DICE_SETTLED",
        diceRoll: {
          values: diceValues,
          total
        }
      });
    } else {
      dispatch({ type: "DICE_SETTLED" });
    }
  }, []);

  const successfulRoll = useCallback(() => {
    dispatch({ type: "SUCCESSFUL_ROLL" });
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

  const value: GameStateContextValue = {
    gameState,
    dispatch,
    startGame,
    throwDice,
    diceSettled,
    successfulRoll,
    failedRoll,
    itemSelected,
    returnToMenu
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
