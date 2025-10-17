/**
 * Dice Type Configurations
 * All dice types are defined here for easy modification and extension
 */

import type { DiceTypeDefinition } from "../types/dice.types";

// ===== STANDARD DICE =====

export const D6: DiceTypeDefinition = {
  id: "d6",
  name: "D6",
  description: "Standard six-sided die",
  faces: 6,

  physics: {
    mass: 1.0,
    size: 0.15,
    friction: 0.6,
    restitution: 0.3,
    angularDamping: 0.5,
  },

  visual: {
    geometry: "box",
    material: {
      color: 0xffffff,
      roughness: 0.8,
      metalness: 0.2,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
  },

  rarity: "common",
  unlocked: true,
};

export const D4: DiceTypeDefinition = {
  id: "d4",
  name: "D4",
  description: "Four-sided die (tetrahedron)",
  faces: 4,

  physics: {
    mass: 0.8,
    size: 0.14,
    friction: 0.7,
    restitution: 0.2,
    angularDamping: 0.6,
  },

  visual: {
    geometry: "tetrahedron",
    material: {
      color: 0xffd700,
      roughness: 0.7,
      metalness: 0.3,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
  },

  rarity: "common",
  unlocked: true,
};

export const D3: DiceTypeDefinition = {
  id: "d3",
  name: "D3",
  description: "Three-sided die (triangular prism)",
  faces: 3,

  physics: {
    mass: 0.9,
    size: 0.13,
    friction: 0.65,
    restitution: 0.25,
    angularDamping: 0.55,
  },

  visual: {
    geometry: "cylinder",
    geometryArgs: [0.13, 0.13, 0.1, 3],
    material: {
      color: 0x87ceeb,
      roughness: 0.75,
      metalness: 0.25,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
  },

  rarity: "uncommon",
  unlocked: true,
};

export const D8: DiceTypeDefinition = {
  id: "d8",
  name: "D8",
  description: "Eight-sided die (octahedron)",
  faces: 8,

  physics: {
    mass: 1.1,
    size: 0.16,
    friction: 0.6,
    restitution: 0.35,
    angularDamping: 0.45,
  },

  visual: {
    geometry: "octahedron",
    material: {
      color: 0xff6347,
      roughness: 0.8,
      metalness: 0.2,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
  },

  rarity: "uncommon",
  unlocked: false,
};

export const D12: DiceTypeDefinition = {
  id: "d12",
  name: "D12",
  description: "Twelve-sided die (dodecahedron)",
  faces: 12,

  physics: {
    mass: 1.3,
    size: 0.17,
    friction: 0.55,
    restitution: 0.4,
    angularDamping: 0.4,
  },

  visual: {
    geometry: "dodecahedron",
    material: {
      color: 0x9370db,
      roughness: 0.7,
      metalness: 0.3,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
  },

  rarity: "rare",
  unlocked: false,
};

export const D20: DiceTypeDefinition = {
  id: "d20",
  name: "D20",
  description: "Twenty-sided die (icosahedron)",
  faces: 20,

  physics: {
    mass: 1.4,
    size: 0.18,
    friction: 0.5,
    restitution: 0.45,
    angularDamping: 0.35,
  },

  visual: {
    geometry: "icosahedron",
    material: {
      color: 0x4169e1,
      roughness: 0.6,
      metalness: 0.4,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
  },

  rarity: "epic",
  unlocked: false,
};

// ===== SPECIAL DICE =====

export const COIN: DiceTypeDefinition = {
  id: "coin",
  name: "Coin",
  description: "A two-sided coin that awards currency",
  faces: 2,

  physics: {
    mass: 0.5,
    size: 0.12,
    friction: 0.4,
    restitution: 0.5,
    angularDamping: 0.3,
  },

  visual: {
    geometry: "cylinder",
    geometryArgs: [0.12, 0.12, 0.02],
    material: {
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    },
  },

  scoring: {
    baseMultiplier: 0.0,  // Coins don't score points
    valueFunction: (faceValue) => faceValue * 100,  // Currency value
  },

  rarity: "common",
  unlocked: true,
};

export const THUMBTACK: DiceTypeDefinition = {
  id: "thumbtack",
  name: "Thumbtack",
  description: "An unstable die that lands on 1 or its max value",
  faces: 2,

  physics: {
    mass: 0.6,
    size: 0.1,
    friction: 0.8,
    restitution: 0.1,
    angularDamping: 0.7,
  },

  visual: {
    geometry: "cone",
    geometryArgs: [0.05, 0.15, 8],
    material: {
      color: 0xff4500,
      roughness: 0.9,
      metalness: 0.1,
    },
  },

  scoring: {
    baseMultiplier: 1.0,
    valueFunction: (faceValue) => faceValue === 1 ? 1 : 6,  // Always 1 or 6
  },

  rarity: "uncommon",
  unlocked: true,
};

// ===== DICE REGISTRY =====

export const DICE_REGISTRY = new Map([
  ["d6", D6],
  ["d4", D4],
  ["d3", D3],
  ["d8", D8],
  ["d12", D12],
  ["d20", D20],
  ["coin", COIN],
  ["thumbtack", THUMBTACK],
]);

// ===== HELPER FUNCTIONS =====

export function getDiceDefinition(typeId: string): DiceTypeDefinition | undefined {
  return DICE_REGISTRY.get(typeId);
}

export function getAllDiceTypes(): DiceTypeDefinition[] {
  return Array.from(DICE_REGISTRY.values());
}

export function getUnlockedDiceTypes(): DiceTypeDefinition[] {
  return getAllDiceTypes().filter(d => d.unlocked);
}
