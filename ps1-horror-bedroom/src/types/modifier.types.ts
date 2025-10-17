/**
 * Modifier system type definitions
 * Modifiers are composable effects that can be applied to dice
 */

import type { DiceInstance } from "./dice.types";

// ===== MODIFIER TYPES =====

export type ModifierType =
  | "tarot_boost"       // From Tower card
  | "sun_boost"         // From Sun card
  | "hourglass_curse"   // From hourglass
  | "hell_corruption"   // Environmental corruption
  | "blessed"           // Positive modifier
  | "cursed"            // Negative modifier
  | "lucky"             // Reroll on specific values
  | "weighted"          // Bias toward certain values
  | "explosive"         // Can trigger additional rolls
  | "custom";           // User-defined

export type StackingBehavior =
  | "none"              // Only one instance allowed
  | "replace"           // New replaces old
  | "add"               // Effects add together
  | "multiply"          // Effects multiply
  | "max";              // Use maximum value

// ===== EFFECT DEFINITIONS =====

export interface PhysicsEffect {
  massMultiplier?: number;
  sizeMultiplier?: number;
  frictionMultiplier?: number;
  restitutionMultiplier?: number;
  gravityMultiplier?: number;
  angularDampingAdd?: number;
}

export interface ScoreEffect {
  scoreMultiplier?: number;
  scoreAddition?: number;
  minValue?: number;
  maxValue?: number;
  rerollChance?: number;
  rerollCondition?: (value: number) => boolean;
}

export interface VisualEffect {
  colorTint?: number | string;
  emissiveColor?: number | string;
  emissiveIntensity?: number;
  scale?: number;
  opacity?: number;
  glow?: boolean;
  glowColor?: number | string;
  particleEffect?: string;
}

export interface BehaviorEffect {
  onSettle?: (die: DiceInstance) => void;
  onReroll?: (die: DiceInstance) => boolean;  // Return true to allow reroll
  onScore?: (die: DiceInstance, baseScore: number) => number;
}

// ===== MODIFIER DEFINITION =====

export interface ModifierDefinition {
  // Identity
  id: string;
  type: ModifierType;
  name: string;
  description: string;

  // What does this modifier do?
  effects: {
    physics?: PhysicsEffect;
    score?: ScoreEffect;
    visual?: VisualEffect;
    behavior?: BehaviorEffect;
  };

  // How do multiple instances stack?
  stacking: StackingBehavior;

  // When is this modifier active?
  condition?: (die: DiceInstance, context: GameContext) => boolean;

  // Priority for application order (higher = applied later)
  priority?: number;

  // Duration
  duration?: "permanent" | "round" | "attempt" | number;  // number = milliseconds

  // Lifecycle hooks
  lifecycle?: {
    onApply?: (die: DiceInstance) => void;
    onUpdate?: (die: DiceInstance, deltaTime: number) => void;
    onRemove?: (die: DiceInstance) => void;
  };

  // Visual representation
  icon?: string;
  color?: number | string;

  // Metadata
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  tags?: string[];
}

// ===== MODIFIER INSTANCE =====

export interface ModifierInstance {
  definitionId: string;
  appliedAt: number;
  expiresAt?: number;
  stack: number;  // How many times this modifier is stacked

  // Cached computed values (for performance)
  cachedEffects?: {
    physics?: PhysicsEffect;
    score?: ScoreEffect;
    visual?: VisualEffect;
  };
}

// ===== GAME CONTEXT =====

export interface GameContext {
  timeOfDay: "morning" | "midday" | "night";
  hellFactor: number;
  currentAttempt: number;
  successfulRolls: number;
  daysMarked: number;
  phase: string;
  // Add more context as needed
}

// ===== MODIFIER COMPOSITION RESULT =====

export interface ComposedEffects {
  physics: Required<PhysicsEffect>;
  score: Required<ScoreEffect>;
  visual: Partial<VisualEffect>;
}

// ===== MODIFIER REGISTRY =====

export type ModifierRegistry = Map<string, ModifierDefinition>;
