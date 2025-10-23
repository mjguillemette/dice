/**
 * Combat System
 * Manages the combat loop, player and enemy turns, and actions
 */

import { enemySystem } from './enemySystem';
import { type Enemy } from '../types/combat.types';

export const combatSystem = {
  startCombat: (): Enemy[] => {
    // For now, we just spawn two imps
    const enemies: Enemy[] = [];
    enemies.push(enemySystem.spawnEnemy('imp', [0.25, 0.66, 2.38]));
    enemies.push(enemySystem.spawnEnemy('imp', [0.1, 0.66, 2.35]));
    return enemies;
  },
};
