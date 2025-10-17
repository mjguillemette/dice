/**
 * Modifier Configurations
 * All modifiers/transformations are defined here for easy extension
 */

import type { ModifierDefinition } from "../types/modifier.types";

// ===== CARD MODIFIERS =====

export const TOWER_BOOST: ModifierDefinition = {
  id: "tower_boost",
  type: "tarot_boost",
  name: "Tower Boost",
  description: "Increased size, weight, and score from the Tower card",

  effects: {
    physics: {
      massMultiplier: 2.0,
      sizeMultiplier: 1.5,
    },
    score: {
      scoreMultiplier: 2.0,
    },
    visual: {
      emissiveColor: 0x8a2be2,  // Blueviolet
      emissiveIntensity: 0.5,
    },
  },

  stacking: "none",
  priority: 10,
  duration: "permanent",

  icon: "🗼",
  color: 0x8a2be2,
  rarity: "uncommon",
  tags: ["card", "boost", "size", "score"],
};

export const SUN_BOOST: ModifierDefinition = {
  id: "sun_boost",
  type: "sun_boost",
  name: "Sun Boost",
  description: "Reduced weight and increased score from the Sun card",

  effects: {
    physics: {
      massMultiplier: 0.5,
    },
    score: {
      scoreMultiplier: 1.5,
    },
    visual: {
      emissiveColor: 0xffd700,  // Gold
      emissiveIntensity: 0.6,
      glow: true,
      glowColor: 0xffd700,
    },
  },

  stacking: "none",
  priority: 10,
  duration: "permanent",

  icon: "☀️",
  color: 0xffd700,
  rarity: "uncommon",
  tags: ["card", "boost", "light", "score"],
};

// ===== STATUS MODIFIERS =====

export const BLESSED: ModifierDefinition = {
  id: "blessed",
  type: "blessed",
  name: "Blessed",
  description: "Divine favor grants +1 to all rolls",

  effects: {
    score: {
      scoreAddition: 1,
    },
    visual: {
      emissiveColor: 0xffffff,
      emissiveIntensity: 0.3,
      glow: true,
      glowColor: 0xffffff,
    },
  },

  stacking: "add",  // Multiple blessings stack
  priority: 20,
  duration: "round",

  icon: "✨",
  color: 0xffffff,
  rarity: "rare",
  tags: ["status", "positive", "score"],
};

export const CURSED: ModifierDefinition = {
  id: "cursed",
  type: "cursed",
  name: "Cursed",
  description: "Dark curse reduces all rolls by 1",

  effects: {
    score: {
      scoreAddition: -1,
      minValue: 1,  // Can't go below 1
    },
    visual: {
      colorTint: 0x8b0000,  // Dark red tint
      emissiveColor: 0x8b0000,
      emissiveIntensity: 0.4,
    },
  },

  stacking: "add",  // Multiple curses stack
  priority: 20,
  duration: "round",

  icon: "💀",
  color: 0x8b0000,
  rarity: "uncommon",
  tags: ["status", "negative", "score"],
};

export const HELL_CORRUPTION: ModifierDefinition = {
  id: "hell_corruption",
  type: "hell_corruption",
  name: "Corrupted",
  description: "Infernal corruption warps the die",

  effects: {
    physics: {
      massMultiplier: 1.2,
    },
    score: {
      scoreMultiplier: 0.5,  // Halves score
    },
    visual: {
      colorTint: 0xff0000,
      emissiveColor: 0xff0000,
      emissiveIntensity: 0.7,
    },
  },

  stacking: "multiply",  // Gets worse with more corruption
  priority: 5,
  duration: "permanent",

  icon: "🔥",
  color: 0xff0000,
  rarity: "common",
  tags: ["corruption", "negative", "environmental"],
};

// ===== SPECIAL MODIFIERS =====

export const LUCKY: ModifierDefinition = {
  id: "lucky",
  type: "lucky",
  name: "Lucky",
  description: "Reroll on 1s",

  effects: {
    score: {
      rerollChance: 1.0,
      rerollCondition: (value) => value === 1,
    },
    visual: {
      emissiveColor: 0x00ff00,
      emissiveIntensity: 0.4,
    },
  },

  stacking: "none",
  priority: 30,
  duration: "round",

  icon: "🍀",
  color: 0x00ff00,
  rarity: "rare",
  tags: ["luck", "reroll", "positive"],
};

export const WEIGHTED: ModifierDefinition = {
  id: "weighted",
  type: "weighted",
  name: "Weighted",
  description: "Biased toward higher values",

  effects: {
    physics: {
      massMultiplier: 1.5,
      angularDampingAdd: 0.2,
    },
    score: {
      scoreMultiplier: 1.2,
    },
    visual: {
      opacity: 0.9,
    },
  },

  stacking: "none",
  priority: 15,
  duration: "permanent",

  icon: "⚖️",
  color: 0x808080,
  rarity: "uncommon",
  tags: ["physics", "bias", "positive"],
};

export const EXPLOSIVE: ModifierDefinition = {
  id: "explosive",
  type: "explosive",
  name: "Explosive",
  description: "On max value, triggers an additional bonus roll",

  effects: {
    visual: {
      emissiveColor: 0xff4500,
      emissiveIntensity: 0.5,
      particleEffect: "sparks",
    },
  },

  stacking: "none",
  priority: 25,
  duration: "round",

  lifecycle: {
    onApply: (die) => {
      console.log(`💥 Explosive modifier applied to die ${die.id}`);
    },
  },

  icon: "💥",
  color: 0xff4500,
  rarity: "epic",
  tags: ["special", "bonus", "explosive"],
};

export const HOURGLASS_CURSE: ModifierDefinition = {
  id: "hourglass_curse",
  type: "hourglass_curse",
  name: "Time Cursed",
  description: "Touched by the hourglass, time works against you",

  effects: {
    score: {
      scoreMultiplier: 0.75,
    },
    visual: {
      emissiveColor: 0x4b0082,  // Indigo
      emissiveIntensity: 0.4,
      particleEffect: "sand",
    },
  },

  stacking: "multiply",
  priority: 15,
  duration: "round",

  icon: "⏳",
  color: 0x4b0082,
  rarity: "rare",
  tags: ["curse", "time", "negative"],
};

// ===== MODIFIER REGISTRY =====

export const MODIFIER_REGISTRY = new Map([
  ["tower_boost", TOWER_BOOST],
  ["sun_boost", SUN_BOOST],
  ["blessed", BLESSED],
  ["cursed", CURSED],
  ["hell_corruption", HELL_CORRUPTION],
  ["lucky", LUCKY],
  ["weighted", WEIGHTED],
  ["explosive", EXPLOSIVE],
  ["hourglass_curse", HOURGLASS_CURSE],
]);

// ===== HELPER FUNCTIONS =====

export function getModifierDefinition(id: string): ModifierDefinition | undefined {
  return MODIFIER_REGISTRY.get(id);
}

export function getAllModifiers(): ModifierDefinition[] {
  return Array.from(MODIFIER_REGISTRY.values());
}

export function getModifiersByType(type: string): ModifierDefinition[] {
  return getAllModifiers().filter(m => m.type === type);
}

export function getModifiersByTag(tag: string): ModifierDefinition[] {
  return getAllModifiers().filter(m => m.tags?.includes(tag));
}

export function getModifiersByRarity(rarity: string): ModifierDefinition[] {
  return getAllModifiers().filter(m => m.rarity === rarity);
}
