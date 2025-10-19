/**
 * Dice Transformation System
 *
 * Framework for applying permanent transformations to dice based on game mechanics.
 * Transformations can affect size, weight, appearance, and behavior.
 */

export type TransformationType =
  | "tarot_boost" // Landed on tarot card - increased size and weight
  | "sun_boost" // Landed on sun card - reduce weight
  | "hourglass_curse" // Hit hourglass - time-related effect
  | "hell_corruption" // High hell factor - visual corruption
  | "blessed" // Positive effect
  | "cursed"; // Negative effect

export interface DiceTransformation {
  type: TransformationType;
  appliedAt: number; // Timestamp when transformation was applied

  // Physical modifications
  sizeMultiplier?: number; // Multiply visual size (default: 1.0)
  massMultiplier?: number; // Multiply physics mass (default: 1.0)
  frictionMultiplier?: number; // Multiply friction (default: 1.0)

  // Visual modifications
  colorTint?: number; // Hex color to tint the die
  emissive?: number; // Emissive color
  emissiveIntensity?: number; // How much it glows

  // Behavior modifications
  valueModifier?: number; // Add/subtract from rolled value
  scoreMultiplier?: number; // Multiply the die's score (default: 1.0)
  rerollChance?: number; // Chance to auto-reroll (0-1)

  // Metadata
  description?: string; // Human-readable description
  stackable?: boolean; // Can multiple of this transformation apply?
}

/**
 * Predefined transformation templates
 */
export const TRANSFORMATION_TEMPLATES: Record<
  TransformationType,
  DiceTransformation
> = {
  tarot_boost: {
    type: "tarot_boost",
    appliedAt: 0,
    sizeMultiplier: 1.08,
    massMultiplier: 1.03,
    scoreMultiplier: 1.2, // Each tarot boost increases score by 20%
    description: "Mystical power flows through this die",
    stackable: true
  },

  sun_boost: {
    type: "sun_boost",
    appliedAt: 0,
    sizeMultiplier: 1,
    massMultiplier: 0.5,
    scoreMultiplier: 1,
    emissive: 0xffdd77,
    emissiveIntensity: 0.01,
    rerollChance: 0.1, // 10% chance to reroll
    description: "Radiates with solar energy",
    stackable: true
  },

  hourglass_curse: {
    type: "hourglass_curse",
    appliedAt: 0,
    sizeMultiplier: 0.8,
    massMultiplier: 0.7,
    colorTint: 0xccaa66,
    description: "Time has worn this die",
    stackable: false
  },

  hell_corruption: {
    type: "hell_corruption",
    appliedAt: 0,
    colorTint: 0xff0000,
    emissive: 0x660000,
    emissiveIntensity: 0.3,
    description: "Corrupted by dark forces",
    stackable: false
  },

  blessed: {
    type: "blessed",
    appliedAt: 0,
    valueModifier: 1,
    colorTint: 0xffdd00,
    emissive: 0xffff88,
    emissiveIntensity: 0.15,
    description: "Blessed by fortune",
    stackable: false
  },

  cursed: {
    type: "cursed",
    appliedAt: 0,
    valueModifier: -1,
    colorTint: 0x330000,
    description: "Cursed with misfortune",
    stackable: false
  }
};

/**
 * Apply a transformation to an existing set of transformations
 */
export function applyTransformation(
  existingTransformations: DiceTransformation[],
  newTransformation: TransformationType
): DiceTransformation[] {
  const template = TRANSFORMATION_TEMPLATES[newTransformation];

  if (!template.stackable) {
    const exists = existingTransformations.some(
      (t) => t.type === newTransformation
    );
    if (exists) {
      console.log(
        `⚠️ Transformation ${newTransformation} already applied and is not stackable`
      );
      return existingTransformations;
    }
  }

  const transformation: DiceTransformation = {
    ...template,
    appliedAt: Date.now()
  };

  return [...existingTransformations, transformation];
}

/**
 * Calculate combined effects of all transformations
 */
export function calculateTransformationEffects(
  transformations: DiceTransformation[]
): {
  sizeMultiplier: number;
  massMultiplier: number;
  frictionMultiplier: number;
  colorTint?: number;
  emissive?: number;
  rerollChance?: number;
  emissiveIntensity: number;
  valueModifier: number;
  scoreMultiplier: number;
} {
  // Initialize with base values
  let sizeMultiplier = 1.0;
  let massMultiplier = 1.0;
  let frictionMultiplier = 1.0;
  let valueModifier = 0;
  let scoreMultiplier = 1.0;
  let rerollChance = 0; // Start with 0 chance
  let emissiveIntensity = 0;
  let colorTint: number | undefined;
  let emissive: number | undefined;

  // Loop through each applied transformation
  for (const t of transformations) {
    // FIX: Check for 'undefined' instead of truthiness to allow '0' as a valid value.
    if (t.sizeMultiplier !== undefined) sizeMultiplier *= t.sizeMultiplier;
    if (t.massMultiplier !== undefined) massMultiplier *= t.massMultiplier;
    if (t.frictionMultiplier !== undefined)
      frictionMultiplier *= t.frictionMultiplier;
    if (t.valueModifier !== undefined) valueModifier += t.valueModifier;
    if (t.scoreMultiplier !== undefined) scoreMultiplier *= t.scoreMultiplier;
    if (t.emissiveIntensity !== undefined) {
      emissiveIntensity = Math.max(emissiveIntensity, t.emissiveIntensity);
    }
    if (t.rerollChance !== undefined) {
      rerollChance = Math.max(rerollChance, t.rerollChance);
    }
    // Use the tint/emissive color from the most recently applied transformation
    if (t.colorTint !== undefined) colorTint = t.colorTint;
    if (t.emissive !== undefined) emissive = t.emissive;
  }

  return {
    sizeMultiplier,
    massMultiplier,
    frictionMultiplier,
    colorTint,
    emissive,
    emissiveIntensity,
    valueModifier,
    scoreMultiplier,
    rerollChance
  };
}

/**
 * Get human-readable description of all transformations
 */
export function getTransformationDescription(
  transformations: DiceTransformation[]
): string {
  if (transformations.length === 0) return "Normal die";
  return transformations.map((t) => t.description || t.type).join(", ");
}

/**
 * Remove transformations older than a certain age (in milliseconds)
 */
export function removeExpiredTransformations(
  transformations: DiceTransformation[],
  maxAge?: number
): DiceTransformation[] {
  if (!maxAge) return transformations;
  const now = Date.now();
  return transformations.filter((t) => now - t.appliedAt < maxAge);
}
