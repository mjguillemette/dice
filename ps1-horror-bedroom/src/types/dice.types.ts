/**
 * Core type definitions for the dice system
 * This file defines all the types needed for a scalable, configuration-driven dice system
 */

import type { DiceTransformation } from "../systems/diceTransformationSystem";

// ===== DICE TYPES =====

export type DiceTypeId =
  | "d6"
  | "d4"
  | "d3"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "coin"
  | "thumbtack"
  | "custom";

export type GeometryType =
  | "box"           // Cube (d6)
  | "tetrahedron"   // d4
  | "octahedron"    // d8
  | "dodecahedron"  // d12
  | "icosahedron"   // d20
  | "cylinder"      // Coin
  | "cone"          // Thumbtack
  | "custom";       // Custom geometry

// ===== PHYSICS CONFIGURATION =====

export interface PhysicsConfig {
  mass: number;
  size: number | [number, number, number]; // Uniform or [width, height, depth]
  friction: number;
  restitution: number;  // Bounciness
  angularDamping?: number;
  linearDamping?: number;
  collisionGroup?: number;
  collisionMask?: number;
}

// ===== VISUAL CONFIGURATION =====

export interface MaterialConfig {
  color?: number | string;
  emissive?: number | string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
}

export interface ShaderConfig {
  vertexShader?: string;
  fragmentShader?: string;
  uniforms?: Record<string, any>;
}

export interface VisualConfig {
  geometry: GeometryType;
  geometryArgs?: number[];  // Arguments for geometry constructor
  material: MaterialConfig;
  shader?: ShaderConfig;
  scale?: number | [number, number, number];
}

// ===== DICE TYPE DEFINITION =====

export interface DiceTypeDefinition {
  // Identity
  id: DiceTypeId;
  name: string;
  description?: string;

  // How many faces?
  faces: number;

  // Physics behavior
  physics: PhysicsConfig;

  // Visual appearance
  visual: VisualConfig;

  // Scoring
  scoring: {
    baseMultiplier: number;  // Default 1.0
    valueFunction?: (faceValue: number) => number;  // Custom scoring logic
    canScoreNegative?: boolean;
  };

  // Default modifiers (always applied to this dice type)
  defaultModifiers?: string[];

  // Special behaviors
  behaviors?: {
    onThrow?: (die: DiceInstance) => void;
    onLand?: (die: DiceInstance) => void;
    onSettle?: (die: DiceInstance) => void;
    onPickup?: (die: DiceInstance) => void;
  };

  // Rarity/unlock status (for future features)
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  unlocked?: boolean;
}

// ===== DICE INSTANCE =====

export interface DiceInstance {
  // Instance identity
  id: number;
  typeId: DiceTypeId;

  // Current state
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];

  // Dice value
  faceValue?: number;
  settled: boolean;
  outOfBounds: boolean;

  // Modifiers applied to this instance
  transformations: DiceTransformation[];

  // Computed properties (cached for performance)
  computedScore?: number;
  computedPhysics?: PhysicsConfig;
  computedVisual?: VisualConfig;

  // Lifecycle
  createdAt: number;
  lastUpdated: number;
}

// ===== DICE POOL =====

export interface DicePool {
  d6: number;
  d4: number;
  d3: number;
  d8?: number;
  d10?: number;
  d12?: number;
  d20?: number;
  coins: number;
  thumbtacks: number;
  [key: string]: number | undefined;
}

// ===== DICE EVENTS =====

export type DiceEvent =
  | { type: "dice_thrown"; diceId: number }
  | { type: "dice_landed"; diceId: number; faceValue: number }
  | { type: "dice_settled"; diceId: number; faceValue: number; score: number }
  | { type: "dice_picked_up"; diceId: number }
  | { type: "dice_out_of_bounds"; diceId: number }
  | { type: "modifier_applied"; diceId: number; modifierId: string }
  | { type: "modifier_removed"; diceId: number; modifierId: string };

// ===== HELPER TYPES =====

export type DiceInstanceMap = Map<number, DiceInstance>;
export type DiceTypeMap = Map<DiceTypeId, DiceTypeDefinition>;
