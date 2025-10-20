/**
 * Physics Configuration
 * Centralized physics constants for dice throwing and gravity
 */

export interface DicePhysicsConfig {
  // Throw force
  basePower: number;
  distanceMultiplier: number;
  maxDistanceBoost: number;
  powerVariation: number;

  // Lob arc
  baseUpwardVelocity: number;
  upwardVariation: number;
  arcBoostMultiplier: number;
  maxArcBoost: number;

  // Tumbling
  angularVelocity: number;

  // Gravity (applied in Dice.tsx physics)
  gravity: number;
}

// Default gentle lob physics
export const DEFAULT_PHYSICS: DicePhysicsConfig = {
  basePower: 3.0,
  distanceMultiplier: .55,
  maxDistanceBoost: 1.4,
  powerVariation: 0.44,

  baseUpwardVelocity: -1,
  upwardVariation: 0.3,
  arcBoostMultiplier: 0.5,
  maxArcBoost: 0.8,

  angularVelocity: 16,

  gravity: 9.81
};

// Current active configuration
let activeConfig: DicePhysicsConfig = { ...DEFAULT_PHYSICS };
let activePreset: string | null = "gentle"; // Track which preset is active

/**
 * Get current physics configuration
 */
export function getPhysicsConfig(): Readonly<DicePhysicsConfig> {
  return activeConfig;
}

/**
 * Get currently active preset name
 */
export function getActivePreset(): string | null {
  return activePreset;
}

/**
 * Update physics configuration (partial update)
 * Clears active preset when manually adjusted
 */
export function updatePhysicsConfig(updates: Partial<DicePhysicsConfig>) {
  activeConfig = { ...activeConfig, ...updates };
  activePreset = null; // Manual adjustment clears preset
}

/**
 * Reset to default physics
 */
export function resetPhysics() {
  activeConfig = { ...DEFAULT_PHYSICS };
  activePreset = "gentle"; // Reset to gentle preset
}

/**
 * Preset configurations
 */
export const PHYSICS_PRESETS = {
  gentle: {
    basePower: 1.4,
    baseUpwardVelocity: -1.2,
    angularVelocity: 12,
    gravity: 9.81
  } as Partial<DicePhysicsConfig>,

  normal: {
    basePower: 2.0,
    baseUpwardVelocity: -0.8,
    angularVelocity: 15,
    gravity: 9.81
  } as Partial<DicePhysicsConfig>,

  aggressive: {
    basePower: 3.0,
    baseUpwardVelocity: -0.5,
    angularVelocity: 20,
    gravity: 9.81
  } as Partial<DicePhysicsConfig>,

  slowMotion: {
    basePower: 1.0,
    baseUpwardVelocity: -1.5,
    angularVelocity: 8,
    gravity: 4.0
  } as Partial<DicePhysicsConfig>
};

/**
 * Apply a physics preset
 */
export function applyPreset(presetName: keyof typeof PHYSICS_PRESETS) {
  const preset = PHYSICS_PRESETS[presetName];
  activeConfig = { ...activeConfig, ...preset };
  activePreset = presetName; // Set active preset
}
