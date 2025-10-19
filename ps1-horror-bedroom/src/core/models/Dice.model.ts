/**
 * Dice Domain Models
 * Core data structures for dice entities
 */

export type DiceType = 'd6' | 'd4' | 'd3' | 'coin' | 'nickel' | 'thumbtack';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Represents a modifier applied to a die
 */
export interface DiceModifier {
  id: string;
  type: 'score_multiplier' | 'face_change' | 'reroll' | 'transform';
  value: number | string;
  source: 'item' | 'card' | 'synergy';
  sourceId: string;
  duration?: number; // Number of rolls, undefined = permanent
}

/**
 * Represents a transformation applied to a die
 */
export interface DiceTransformation {
  id: string;
  fromType: DiceType;
  toType: DiceType;
  appliedAt: number; // Timestamp
  sourceItemId: string;
}

/**
 * Core dice model - represents a single die in the game
 */
export interface DiceModel {
  // Identity
  id: string;
  type: DiceType;

  // State
  faceValue: number | null; // null if not settled
  isSettled: boolean;
  isInReceptacle: boolean; // Whether die landed in scoring area

  // Physics
  position: Vector3;
  rotation: Quaternion;
  velocity?: Vector3;
  angularVelocity?: Vector3;

  // Game mechanics
  modifiers: DiceModifier[];
  transformations: DiceTransformation[];
  scoreContribution: number; // Calculated score this die contributes

  // Metadata
  rollNumber: number; // Which roll this die participated in
  lastUpdated: number; // Timestamp
}

/**
 * Result of a dice roll for a single die
 */
export interface DiceRollResult {
  diceId: string;
  diceType: DiceType;
  faceValue: number;
  scoreValue: number; // Face value after modifiers applied
  modifiers: DiceModifier[];
  wasTransformed: boolean;
}

/**
 * Collection of dice results for scoring
 */
export interface DiceRollCollection {
  dice: DiceRollResult[];
  totalValue: number;
  rollNumber: number;
  timestamp: number;
}

/**
 * Dice configuration for spawning
 */
export interface DiceSpawnConfig {
  type: DiceType;
  count: number;
  position?: Vector3;
  initialVelocity?: Vector3;
}

/**
 * Dice pool - all dice available to the player
 */
export interface DicePool {
  d6: number;
  d4: number;
  d3: number;
  coins: number;
  nickels: number;
  thumbtacks: number;
}

/**
 * Type guards
 */
export const isDiceModel = (obj: any): obj is DiceModel => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.isSettled === 'boolean'
  );
};

export const isDiceRollResult = (obj: any): obj is DiceRollResult => {
  return (
    typeof obj === 'object' &&
    typeof obj.diceId === 'string' &&
    typeof obj.faceValue === 'number'
  );
};

/**
 * Factory functions
 */
export const createDice = (
  type: DiceType,
  id?: string,
  position?: Vector3
): DiceModel => {
  return {
    id: id || `${type}-${Date.now()}-${Math.random()}`,
    type,
    faceValue: null,
    isSettled: false,
    isInReceptacle: false,
    position: position || { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    modifiers: [],
    transformations: [],
    scoreContribution: 0,
    rollNumber: 0,
    lastUpdated: Date.now()
  };
};

export const createDicePool = (): DicePool => {
  return {
    d6: 2,
    d4: 0,
    d3: 0,
    coins: 1,
    nickels: 0,
    thumbtacks: 2
  };
};
