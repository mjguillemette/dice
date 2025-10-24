import { useState, useCallback } from "react";

/**
 * Dice configuration interface representing all available dice types and their counts
 */
export interface DiceConfiguration {
  // Standard dice
  d6Count: number;
  coinCount: number;
  nickelCount: number;
  d3Count: number;
  d4Count: number;
  d8Count: number;
  d10Count: number;
  d12Count: number;
  d20Count: number;
  thumbTackCount: number;

  // Special/modified dice
  goldenPyramidCount: number;
  caltropCount: number;
  casinoRejectCount: number;
  weightedDieCount: number;
  loadedCoinCount: number;
  cursedDieCount: number;
  splitDieCount: number;
  mirrorDieCount: number;
  riggedDieCount: number;
}

/**
 * Actions for modifying dice configuration
 */
export interface DiceConfigurationActions {
  setD6Count: (count: number) => void;
  setCoinCount: (count: number) => void;
  setNickelCount: (count: number) => void;
  setD3Count: (count: number) => void;
  setD4Count: (count: number) => void;
  setD8Count: (count: number) => void;
  setD10Count: (count: number) => void;
  setD12Count: (count: number) => void;
  setD20Count: (count: number) => void;
  setThumbTackCount: (count: number) => void;
  setGoldenPyramidCount: (count: number) => void;
  setCaltropCount: (count: number) => void;
  setCasinoRejectCount: (count: number) => void;
  setWeightedDieCount: (count: number) => void;
  setLoadedCoinCount: (count: number) => void;
  setCursedDieCount: (count: number) => void;
  setSplitDieCount: (count: number) => void;
  setMirrorDieCount: (count: number) => void;
  setRiggedDieCount: (count: number) => void;

  // Utility methods
  getTotalDiceCount: () => number;
  resetToDefaults: () => void;
}

const DEFAULT_CONFIGURATION: DiceConfiguration = {
  d6Count: 2,
  coinCount: 1,
  nickelCount: 0,
  d3Count: 0,
  d4Count: 0,
  d8Count: 0,
  d10Count: 0,
  d12Count: 0,
  d20Count: 0,
  thumbTackCount: 2,
  goldenPyramidCount: 0,
  caltropCount: 0,
  casinoRejectCount: 0,
  weightedDieCount: 0,
  loadedCoinCount: 0,
  cursedDieCount: 0,
  splitDieCount: 0,
  mirrorDieCount: 0,
  riggedDieCount: 0
};

/**
 * Custom hook to manage dice configuration state
 * Consolidates all dice-related state management into a single hook
 *
 * @returns {[DiceConfiguration, DiceConfigurationActions]} Tuple of configuration and actions
 */
export function useDiceConfiguration(): [DiceConfiguration, DiceConfigurationActions] {
  // Standard dice
  const [d6Count, setD6Count] = useState(DEFAULT_CONFIGURATION.d6Count);
  const [coinCount, setCoinCount] = useState(DEFAULT_CONFIGURATION.coinCount);
  const [nickelCount, setNickelCount] = useState(DEFAULT_CONFIGURATION.nickelCount);
  const [d3Count, setD3Count] = useState(DEFAULT_CONFIGURATION.d3Count);
  const [d4Count, setD4Count] = useState(DEFAULT_CONFIGURATION.d4Count);
  const [d8Count, setD8Count] = useState(DEFAULT_CONFIGURATION.d8Count);
  const [d10Count, setD10Count] = useState(DEFAULT_CONFIGURATION.d10Count);
  const [d12Count, setD12Count] = useState(DEFAULT_CONFIGURATION.d12Count);
  const [d20Count, setD20Count] = useState(DEFAULT_CONFIGURATION.d20Count);
  const [thumbTackCount, setThumbTackCount] = useState(DEFAULT_CONFIGURATION.thumbTackCount);

  // Special dice
  const [goldenPyramidCount, setGoldenPyramidCount] = useState(DEFAULT_CONFIGURATION.goldenPyramidCount);
  const [caltropCount, setCaltropCount] = useState(DEFAULT_CONFIGURATION.caltropCount);
  const [casinoRejectCount, setCasinoRejectCount] = useState(DEFAULT_CONFIGURATION.casinoRejectCount);
  const [weightedDieCount, setWeightedDieCount] = useState(DEFAULT_CONFIGURATION.weightedDieCount);
  const [loadedCoinCount, setLoadedCoinCount] = useState(DEFAULT_CONFIGURATION.loadedCoinCount);
  const [cursedDieCount, setCursedDieCount] = useState(DEFAULT_CONFIGURATION.cursedDieCount);
  const [splitDieCount, setSplitDieCount] = useState(DEFAULT_CONFIGURATION.splitDieCount);
  const [mirrorDieCount, setMirrorDieCount] = useState(DEFAULT_CONFIGURATION.mirrorDieCount);
  const [riggedDieCount, setRiggedDieCount] = useState(DEFAULT_CONFIGURATION.riggedDieCount);

  const configuration: DiceConfiguration = {
    d6Count,
    coinCount,
    nickelCount,
    d3Count,
    d4Count,
    d8Count,
    d10Count,
    d12Count,
    d20Count,
    thumbTackCount,
    goldenPyramidCount,
    caltropCount,
    casinoRejectCount,
    weightedDieCount,
    loadedCoinCount,
    cursedDieCount,
    splitDieCount,
    mirrorDieCount,
    riggedDieCount
  };

  const getTotalDiceCount = useCallback(() => {
    return (
      d6Count +
      coinCount +
      nickelCount +
      d3Count +
      d4Count +
      d8Count +
      d10Count +
      d12Count +
      d20Count +
      thumbTackCount +
      goldenPyramidCount +
      caltropCount +
      casinoRejectCount +
      weightedDieCount +
      loadedCoinCount +
      cursedDieCount +
      splitDieCount +
      mirrorDieCount +
      riggedDieCount
    );
  }, [
    d6Count,
    coinCount,
    nickelCount,
    d3Count,
    d4Count,
    d8Count,
    d10Count,
    d12Count,
    d20Count,
    thumbTackCount,
    goldenPyramidCount,
    caltropCount,
    casinoRejectCount,
    weightedDieCount,
    loadedCoinCount,
    cursedDieCount,
    splitDieCount,
    mirrorDieCount,
    riggedDieCount
  ]);

  const resetToDefaults = useCallback(() => {
    setD6Count(DEFAULT_CONFIGURATION.d6Count);
    setCoinCount(DEFAULT_CONFIGURATION.coinCount);
    setNickelCount(DEFAULT_CONFIGURATION.nickelCount);
    setD3Count(DEFAULT_CONFIGURATION.d3Count);
    setD4Count(DEFAULT_CONFIGURATION.d4Count);
    setD8Count(DEFAULT_CONFIGURATION.d8Count);
    setD10Count(DEFAULT_CONFIGURATION.d10Count);
    setD12Count(DEFAULT_CONFIGURATION.d12Count);
    setD20Count(DEFAULT_CONFIGURATION.d20Count);
    setThumbTackCount(DEFAULT_CONFIGURATION.thumbTackCount);
    setGoldenPyramidCount(DEFAULT_CONFIGURATION.goldenPyramidCount);
    setCaltropCount(DEFAULT_CONFIGURATION.caltropCount);
    setCasinoRejectCount(DEFAULT_CONFIGURATION.casinoRejectCount);
    setWeightedDieCount(DEFAULT_CONFIGURATION.weightedDieCount);
    setLoadedCoinCount(DEFAULT_CONFIGURATION.loadedCoinCount);
    setCursedDieCount(DEFAULT_CONFIGURATION.cursedDieCount);
    setSplitDieCount(DEFAULT_CONFIGURATION.splitDieCount);
    setMirrorDieCount(DEFAULT_CONFIGURATION.mirrorDieCount);
    setRiggedDieCount(DEFAULT_CONFIGURATION.riggedDieCount);
  }, []);

  const actions: DiceConfigurationActions = {
    setD6Count,
    setCoinCount,
    setNickelCount,
    setD3Count,
    setD4Count,
    setD8Count,
    setD10Count,
    setD12Count,
    setD20Count,
    setThumbTackCount,
    setGoldenPyramidCount,
    setCaltropCount,
    setCasinoRejectCount,
    setWeightedDieCount,
    setLoadedCoinCount,
    setCursedDieCount,
    setSplitDieCount,
    setMirrorDieCount,
    setRiggedDieCount,
    getTotalDiceCount,
    resetToDefaults
  };

  return [configuration, actions];
}
