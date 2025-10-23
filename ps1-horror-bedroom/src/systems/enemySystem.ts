/**
 * Enemy System
 * Manages enemy spawning and behavior
 */

import { type Enemy } from '../types/combat.types';

export const enemySystem = {
  spawnEnemy: (enemyType: string, position: [number, number, number]): Enemy => {
    // For now, we only have one enemy type
    if (enemyType === 'imp') {
      return {
        id: Date.now() + Math.random(),
        type: 'imp',
        position,
        hp: 10,
        maxHp: 10,
        portalProgress: 0,
        entranceAnimationProgress: 0,
      };
    }

    throw new Error(`Unknown enemy type: ${enemyType}`);
  },
};
