import { useState } from "react";
import { useFrame } from "@react-three/fiber";
import { type Enemy } from "../types/combat.types";
import { combatSystem } from "../systems/combatSystem";

export const useCombat = () => {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [isEnding, setIsEnding] = useState(false);

  // FIX: isCombatActive is now derived from other state.
  // This prevents state synchronization issues.
  const isCombatActive = enemies.length > 0 || isEnding;

  const startCombat = () => {
    setIsEnding(false);
    setEnemies(combatSystem.startCombat());
  };

  const endCombat = () => {
    if (enemies.length > 0) {
      setIsEnding(true);
    }
  };

  useFrame((_state, delta) => {
    // This guard now works reliably.
    if (!isCombatActive) {
      return;
    }

    let hasChanges = false;
    let allPortalsClosed = isEnding;

    const newEnemies = enemies.map((enemy) => {
      let { portalProgress, entranceAnimationProgress } = enemy;
      let enemyHasChanged = false;

      if (isEnding) {
        if (portalProgress > 0) {
          portalProgress = Math.max(0, portalProgress - delta * 2);
          enemyHasChanged = true;
        }
      } else {
        if (portalProgress < 1 && entranceAnimationProgress === 0) {
          portalProgress = Math.min(1, portalProgress + delta * 2);
          enemyHasChanged = true;
        }
        if (portalProgress >= 1 && entranceAnimationProgress < 1) {
          entranceAnimationProgress = Math.min(
            1,
            entranceAnimationProgress + delta * 1.5
          );
          enemyHasChanged = true;
        }
      }

      if (portalProgress > 0) {
        allPortalsClosed = false;
      }

      if (enemyHasChanged) {
        hasChanges = true;
      }

      return enemyHasChanged
        ? { ...enemy, portalProgress, entranceAnimationProgress }
        : enemy;
    });

    if (hasChanges) {
      setEnemies(newEnemies);
    }

    if (isEnding && allPortalsClosed) {
      setIsEnding(false);
      setEnemies([]);
    }
  });

  // The 'isCombatActive' prop is still returned for convenience.
  return { enemies, startCombat, endCombat, isCombatActive };
};
