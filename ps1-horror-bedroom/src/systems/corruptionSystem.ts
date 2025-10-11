import { useState, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CORRUPTION_SPEED } from '../constants/gameConfig';

export interface CorruptionState {
  hellFactor: number;
  autoCorruption: boolean;
  corruptionDirection: number;
}

/**
 * Custom hook to manage the corruption system
 * @returns Object containing corruption state and control functions
 */
export function useCorruption() {
  const [hellFactor, setHellFactor] = useState(0.0);
  const [autoCorruption, setAutoCorruption] = useState(true);
  const corruptionDirection = useRef(1);

  // Auto-corruption update in animation loop
  useFrame(() => {
    if (autoCorruption) {
      setHellFactor((prev) => {
        let newFactor = prev + CORRUPTION_SPEED * corruptionDirection.current;

        if (newFactor >= 1.0) {
          newFactor = 1.0;
          corruptionDirection.current = -1;
        } else if (newFactor <= 0.0) {
          newFactor = 0.0;
          corruptionDirection.current = 1;
        }

        return newFactor;
      });
    }
  });

  const increaseCorruption = useCallback(() => {
    setAutoCorruption(false);
    setHellFactor((prev) => Math.min(1, prev + 0.05));
  }, []);

  const decreaseCorruption = useCallback(() => {
    setAutoCorruption(false);
    setHellFactor((prev) => Math.max(0, prev - 0.05));
  }, []);

  const toggleAutoCorruption = useCallback(() => {
    setAutoCorruption((prev) => !prev);
  }, []);

  return {
    hellFactor,
    autoCorruption,
    increaseCorruption,
    decreaseCorruption,
    toggleAutoCorruption,
  };
}
