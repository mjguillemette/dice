/**
 * Modifier Engine
 * Handles composition and application of modifiers to dice
 */

import type {
  ModifierDefinition,
  PhysicsEffect,
  ScoreEffect,
  VisualEffect,
  ComposedEffects,
  GameContext,
} from "../../types/modifier.types";
import type { DiceInstance } from "../../types/dice.types";
import { MODIFIER_REGISTRY } from "../../config/modifiers.config";

// ===== DEFAULT EFFECTS =====

const DEFAULT_PHYSICS: Required<PhysicsEffect> = {
  massMultiplier: 1.0,
  sizeMultiplier: 1.0,
  frictionMultiplier: 1.0,
  restitutionMultiplier: 1.0,
  gravityMultiplier: 1.0,
  angularDampingAdd: 0.0,
};

const DEFAULT_SCORE: Required<ScoreEffect> = {
  scoreMultiplier: 1.0,
  scoreAddition: 0,
  minValue: Number.NEGATIVE_INFINITY,
  maxValue: Number.POSITIVE_INFINITY,
  rerollChance: 0.0,
  rerollCondition: () => false,
};

// ===== MODIFIER ENGINE =====

export class ModifierEngine {
  private context: GameContext;

  constructor(context: GameContext) {
    this.context = context;
  }

  /**
   * Update the game context (call this when game state changes)
   */
  updateContext(context: Partial<GameContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Compose all modifiers on a die into a single set of effects
   * This is the core of the modifier system - handles stacking, priority, etc.
   */
  composeModifiers(die: DiceInstance): ComposedEffects {
    const modifierDefs = this.getActiveModifierDefinitions(die);

    // Sort by priority (lower priority applied first)
    modifierDefs.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // Start with default effects
    let physics = { ...DEFAULT_PHYSICS };
    let score = { ...DEFAULT_SCORE };
    const visual: Partial<VisualEffect> = {};

    // Apply each modifier's effects
    for (const def of modifierDefs) {
      if (def.effects.physics) {
        physics = this.stackPhysicsEffect(physics, def.effects.physics, def.stacking);
      }
      if (def.effects.score) {
        score = this.stackScoreEffect(score, def.effects.score, def.stacking);
      }
      if (def.effects.visual) {
        Object.assign(visual, def.effects.visual);  // Visuals don't stack, last wins
      }
    }

    return { physics, score, visual };
  }

  /**
   * Get modifier definitions for active modifiers on a die
   */
  private getActiveModifierDefinitions(die: DiceInstance): ModifierDefinition[] {
    return die.transformations
      .map(t => MODIFIER_REGISTRY.get(t.type))
      .filter((def): def is ModifierDefinition => {
        if (!def) return false;
        // Check if condition is met (if defined)
        return !def.condition || def.condition(die, this.context);
      });
  }

  /**
   * Stack physics effects based on stacking behavior
   */
  private stackPhysicsEffect(
    current: Required<PhysicsEffect>,
    incoming: PhysicsEffect,
    stacking: ModifierDefinition["stacking"]
  ): Required<PhysicsEffect> {
    const result = { ...current };

    for (const key of Object.keys(incoming) as (keyof PhysicsEffect)[]) {
      const value = incoming[key];
      if (value === undefined) continue;

      switch (stacking) {
        case "none":
        case "replace":
          result[key] = value;
          break;

        case "add":
          if (key === "angularDampingAdd") {
            result[key] = current[key] + value;
          } else {
            result[key] = value;  // For multipliers, replace
          }
          break;

        case "multiply":
          if (key.includes("Multiplier")) {
            result[key] = current[key] * value;
          } else {
            result[key] = current[key] + value;
          }
          break;

        case "max":
          result[key] = Math.max(current[key], value);
          break;
      }
    }

    return result;
  }

  /**
   * Stack score effects based on stacking behavior
   */
  private stackScoreEffect(
    current: Required<ScoreEffect>,
    incoming: ScoreEffect,
    stacking: ModifierDefinition["stacking"]
  ): Required<ScoreEffect> {
    const result = { ...current };

    for (const key of Object.keys(incoming) as (keyof ScoreEffect)[]) {
      const value = incoming[key];
      if (value === undefined) continue;

      switch (stacking) {
        case "none":
        case "replace":
          if (key === "scoreMultiplier" || key === "scoreAddition") {
            result[key] = value as number;
          } else if (key === "minValue" || key === "maxValue") {
            result[key] = value as number;
          } else if (key === "rerollChance") {
            result[key] = value as number;
          } else if (key === "rerollCondition") {
            result[key] = value as (value: number) => boolean;
          }
          break;

        case "add":
          if (key === "scoreAddition") {
            result[key] = current[key] + (value as number);
          } else if (key === "scoreMultiplier") {
            result[key] = value as number;  // Multipliers don't add
          }
          break;

        case "multiply":
          if (key === "scoreMultiplier") {
            result[key] = current[key] * (value as number);
          } else if (key === "scoreAddition") {
            result[key] = current[key] + (value as number);
          }
          break;

        case "max":
          if (key === "scoreMultiplier" || key === "scoreAddition" || key === "minValue" || key === "maxValue" || key === "rerollChance") {
            result[key] = Math.max(current[key] as number, value as number);
          }
          break;
      }
    }

    return result;
  }

  /**
   * Calculate the final score for a die with all modifiers applied
   */
  calculateScore(die: DiceInstance, baseFaceValue: number): number {
    const effects = this.composeModifiers(die);
    const scoreEffect = effects.score;

    // Apply score calculation
    let score = baseFaceValue * scoreEffect.scoreMultiplier;
    score += scoreEffect.scoreAddition;

    // Clamp to min/max
    score = Math.max(scoreEffect.minValue, Math.min(scoreEffect.maxValue, score));

    return Math.round(score);
  }

  /**
   * Check if a die should be rerolled based on modifiers
   */
  shouldReroll(die: DiceInstance, faceValue: number): boolean {
    const effects = this.composeModifiers(die);
    const scoreEffect = effects.score;

    if (scoreEffect.rerollChance <= 0) return false;

    // Check condition
    if (!scoreEffect.rerollCondition(faceValue)) return false;

    // Check chance (if less than 1.0)
    if (scoreEffect.rerollChance < 1.0) {
      return Math.random() < scoreEffect.rerollChance;
    }

    return true;
  }

  /**
   * Apply modifiers to a die's physics configuration
   */
  applyPhysicsModifiers(
    baseMass: number,
    baseSize: number,
    baseFriction: number,
    baseRestitution: number,
    effects: Required<PhysicsEffect>
  ): {
    mass: number;
    size: number;
    friction: number;
    restitution: number;
  } {
    return {
      mass: baseMass * effects.massMultiplier,
      size: baseSize * effects.sizeMultiplier,
      friction: baseFriction * effects.frictionMultiplier,
      restitution: baseRestitution * effects.restitutionMultiplier,
    };
  }

  /**
   * Get a human-readable description of all active modifiers
   */
  getModifierDescriptions(die: DiceInstance): string[] {
    return this.getActiveModifierDefinitions(die)
      .map(def => `${def.icon || "•"} ${def.name}: ${def.description}`);
  }

  /**
   * Get all modifier names as an array
   */
  getModifierNames(die: DiceInstance): string[] {
    return this.getActiveModifierDefinitions(die).map(def => def.name);
  }
}

// ===== SINGLETON INSTANCE =====

let engineInstance: ModifierEngine | null = null;

export function getModifierEngine(context?: GameContext): ModifierEngine {
  if (!engineInstance && context) {
    engineInstance = new ModifierEngine(context);
  }
  if (!engineInstance) {
    throw new Error("ModifierEngine not initialized. Call with context first.");
  }
  return engineInstance;
}

export function resetModifierEngine(): void {
  engineInstance = null;
}
