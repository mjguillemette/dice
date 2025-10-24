/**
 * Enemy System
 * Manages enemy spawning, positioning, and behavior
 */

import { type Enemy } from '../types/combat.types';
import { logger, LogCategory } from '../utils/logger';

/**
 * Enemy type definitions with their base stats
 */
export interface EnemyDefinition {
  type: string;
  minHP: number;
  maxHP: number;
  attackDice: string; // e.g., "1d6", "2d4"
  scale: number;
}

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  imp: {
    type: 'imp',
    minHP: 1,
    maxHP: 6,
    attackDice: '1d6',
    scale: 0.1
  }
};

/**
 * Predefined spawn positions for enemies
 */
export const ENEMY_SPAWN_POSITIONS: [number, number, number][] = [
  [0, 0, 3.5],      // Center front
  [-1.5, 0, 3.5],   // Left front
  [1.5, 0, 3.5],    // Right front
  [-1.0, 0, 4.0],   // Left back
  [1.0, 0, 4.0],    // Right back
];

/**
 * Roll HP for an enemy based on its definition
 */
function rollEnemyHP(enemyDef: EnemyDefinition): number {
  const range = enemyDef.maxHP - enemyDef.minHP + 1;
  return Math.floor(Math.random() * range) + enemyDef.minHP;
}

/**
 * Generate a unique enemy ID
 */
function generateEnemyId(): number {
  return Date.now() + Math.random();
}

/**
 * Spawn a single enemy
 */
export function spawnEnemy(
  enemyType: string,
  position: [number, number, number],
  options: {
    portalProgress?: number;
    entranceProgress?: number;
  } = {}
): Enemy {
  const enemyDef = ENEMY_DEFINITIONS[enemyType];

  if (!enemyDef) {
    logger.error(`Unknown enemy type: ${enemyType}`, LogCategory.ENEMY);
    throw new Error(`Unknown enemy type: ${enemyType}`);
  }

  const rolledHP = rollEnemyHP(enemyDef);

  const enemy: Enemy = {
    id: generateEnemyId(),
    type: enemyType,
    position,
    hp: rolledHP,
    maxHp: rolledHP,
    portalProgress: options.portalProgress ?? 1,
    entranceAnimationProgress: options.entranceProgress ?? 1,
  };

  logger.enemy(`Spawned ${enemyType} at [${position.join(', ')}] with ${rolledHP}HP`);

  return enemy;
}

/**
 * Spawn multiple enemies in a wave
 */
export function spawnEnemyWave(
  count: number,
  enemyType: string = 'imp',
  options: {
    portalProgress?: number;
    entranceProgress?: number;
    customPositions?: [number, number, number][];
  } = {}
): Enemy[] {
  const positions = options.customPositions || ENEMY_SPAWN_POSITIONS;

  if (count > positions.length) {
    logger.warn(`Requested ${count} enemies but only ${positions.length} spawn positions available`, LogCategory.ENEMY);
  }

  const actualCount = Math.min(count, positions.length);
  const enemies: Enemy[] = [];

  for (let i = 0; i < actualCount; i++) {
    enemies.push(spawnEnemy(enemyType, positions[i], options));
  }

  logger.combat(`Spawned wave of ${actualCount} ${enemyType}(s)`);

  return enemies;
}

/**
 * Calculate total enemy damage for a wave
 */
export function calculateWaveDamage(enemies: Enemy[]): number {
  return enemies.reduce((total, enemy) => {
    return total + (enemy.attackRoll || 0);
  }, 0);
}

/**
 * Roll attack dice for an enemy
 */
export function rollEnemyAttack(enemy: Enemy): number {
  const enemyDef = ENEMY_DEFINITIONS[enemy.type];
  if (!enemyDef) return 1;

  // For now, simple 1d6 roll
  const roll = Math.floor(Math.random() * 6) + 1;
  logger.combat(`${enemy.type} #${enemy.id} rolled ${roll} for attack`);

  return roll;
}

// Legacy export for backward compatibility
export const enemySystem = {
  spawnEnemy
};
