import { useState, useCallback } from "react";

/**
 * A generic interface for the wallet state.
 * Allows any string key with a number value.
 */
export interface WalletState {
  [key: string]: number;
}

/**
 * A custom hook to manage a player's wallet with multiple currency types.
 * @template T - The shape of the wallet state, extending WalletState.
 * @param {T} initialState - The starting amounts for each currency.
 * @returns An object with the current balances and a function to add currency.
 */
export const useWallet = <T extends WalletState>(initialState: T) => {
  const [balances, setBalances] = useState<T>(initialState);
  const [storedInitialState] = useState<T>(initialState);

  /**
   * Adds a specified amount to a specific currency type in the wallet.
   * Wrapped in useCallback for performance, ensuring a stable function reference.
   * @param {keyof T} type - The type of currency to add (e.g., 'cents', 'gems').
   * @param {number} amount - The amount of currency to add. Must be positive.
   */
  const addCurrency = useCallback((type: keyof T, amount: number) => {
    if (amount > 0) {
      setBalances((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + amount // Safely handle potentially undefined keys
      }));
    }
  }, []);

  // You could add a 'spendCurrency' function here in the future.

  function spendCurrency(type: string, amount: number): boolean {
    if (balances[type] >= amount) {
      setBalances((prev) => ({
        ...prev,
        [type]: prev[type] - amount
      }));
      return true;
    }
    return false;
  }

  const resetWallet = useCallback(() => {
    setBalances(storedInitialState);
  }, [storedInitialState]);

  return { balances, addCurrency, spendCurrency, resetWallet };
};
