/**
 * Rogue-like Item System
 * Manages item definitions, inventory, and item selection
 */

// ===== TYPES & INTERFACES =====
// Export all types for external use

export type ItemType =
  | 'thumbtack'
  | 'coin'
  | 'd3'
  | 'd4'
  | 'tower_card'
  | 'sun_card'
  | 'hourglass';

export interface ItemDefinition {
  id: ItemType;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  // Effects when collected
  effect: {
    type: 'add_dice' | 'add_card' | 'add_decoration';
    maxValue?: number; // For dice: 1=thumbtack, 2=coin, 3=d3, 4=d4, 6=d6
    cardType?: 'tower' | 'sun'; // For cards
  };
}

export interface PlayerInventory {
  // Dice counts by type
  dice: {
    d6: number;
    coins: number;
    thumbtacks: number;
    d3: number;
    d4: number;
  };

  // Cards owned
  cards: {
    tower: boolean;
    sun: boolean;
  };

  // Decorations
  decorations: {
    hourglass: boolean;
  };
}

// ===== ITEM DEFINITIONS =====

export const ITEM_POOL: ItemDefinition[] = [
  {
    id: 'thumbtack',
    name: 'Thumbtack',
    description: 'A simple thumbtack. Always lands tip-up. Adds 1 point.',
    rarity: 'common',
    effect: {
      type: 'add_dice',
      maxValue: 1,
    },
  },
  {
    id: 'coin',
    name: 'Lucky Coin',
    description: 'A two-sided coin. Heads or tails, worth 1-2 points.',
    rarity: 'common',
    effect: {
      type: 'add_dice',
      maxValue: 2,
    },
  },
  {
    id: 'd3',
    name: 'Triangular Die',
    description: 'A three-sided die. Roll 1-3 points.',
    rarity: 'uncommon',
    effect: {
      type: 'add_dice',
      maxValue: 3,
    },
  },
  {
    id: 'd4',
    name: 'Pyramid Die',
    description: 'A four-sided die. Roll 1-4 points.',
    rarity: 'uncommon',
    effect: {
      type: 'add_dice',
      maxValue: 4,
    },
  },
  {
    id: 'tower_card',
    name: 'The Tower',
    description: 'A tarot card. Dice that land on it transform and multiply your score.',
    rarity: 'rare',
    effect: {
      type: 'add_card',
      cardType: 'tower',
    },
  },
  {
    id: 'sun_card',
    name: 'The Sun',
    description: 'A tarot card. Dice that land on it transform and multiply your score.',
    rarity: 'rare',
    effect: {
      type: 'add_card',
      cardType: 'sun',
    },
  },
  {
    id: 'hourglass',
    name: 'Ancient Hourglass',
    description: 'A mysterious hourglass. Its purpose is unclear...',
    rarity: 'rare',
    effect: {
      type: 'add_decoration',
    },
  },
];

// ===== INVENTORY MANAGEMENT =====

export const INITIAL_INVENTORY: PlayerInventory = {
  dice: {
    d6: 2, // Start with 2 d6
    coins: 1, // Start with 1 coin
    thumbtacks: 2, // Start with 2 thumbtacks
    d3: 0,
    d4: 0,
  },
  cards: {
    tower: false,
    sun: false,
  },
  decorations: {
    hourglass: false,
  },
};

/**
 * Apply an item's effect to the inventory
 */
export function applyItemToInventory(inventory: PlayerInventory, item: ItemDefinition): PlayerInventory {
  const newInventory = { ...inventory };

  switch (item.effect.type) {
    case 'add_dice':
      newInventory.dice = { ...newInventory.dice };

      switch (item.effect.maxValue) {
        case 1:
          newInventory.dice.thumbtacks += 1;
          break;
        case 2:
          newInventory.dice.coins += 1;
          break;
        case 3:
          newInventory.dice.d3 += 1;
          break;
        case 4:
          newInventory.dice.d4 += 1;
          break;
        case 6:
          newInventory.dice.d6 += 1;
          break;
      }
      break;

    case 'add_card':
      newInventory.cards = { ...newInventory.cards };
      if (item.effect.cardType === 'tower') {
        newInventory.cards.tower = true;
      } else if (item.effect.cardType === 'sun') {
        newInventory.cards.sun = true;
      }
      break;

    case 'add_decoration':
      newInventory.decorations = { ...newInventory.decorations };
      if (item.id === 'hourglass') {
        newInventory.decorations.hourglass = true;
      }
      break;
  }

  return newInventory;
}

/**
 * Check if an item can be offered (e.g., don't offer cards that are already owned)
 */
export function canOfferItem(inventory: PlayerInventory, item: ItemDefinition): boolean {
  // Cards can only be offered once
  if (item.effect.type === 'add_card') {
    if (item.effect.cardType === 'tower' && inventory.cards.tower) {
      return false;
    }
    if (item.effect.cardType === 'sun' && inventory.cards.sun) {
      return false;
    }
  }

  // Decorations can only be offered once
  if (item.effect.type === 'add_decoration') {
    if (item.id === 'hourglass' && inventory.decorations.hourglass) {
      return false;
    }
  }

  // Dice can always be offered (you can collect more)
  return true;
}

/**
 * Generate 3 random item choices, weighted by rarity
 */
export function generateItemChoices(inventory: PlayerInventory, count: number = 3): ItemDefinition[] {
  // Filter items that can be offered
  const availableItems = ITEM_POOL.filter(item => canOfferItem(inventory, item));

  if (availableItems.length === 0) {
    console.warn('No items available to offer!');
    return [];
  }

  // Weighted selection based on rarity
  const rarityWeights: Record<ItemDefinition['rarity'], number> = {
    common: 50,
    uncommon: 30,
    rare: 20,
  };

  const choices: ItemDefinition[] = [];
  const usedIds = new Set<ItemType>();

  while (choices.length < count && usedIds.size < availableItems.length) {
    // Calculate total weight for remaining items
    const remainingItems = availableItems.filter(item => !usedIds.has(item.id));
    const totalWeight = remainingItems.reduce((sum, item) => sum + rarityWeights[item.rarity], 0);

    // Random weighted selection
    let random = Math.random() * totalWeight;
    let selectedItem: ItemDefinition | null = null;

    for (const item of remainingItems) {
      random -= rarityWeights[item.rarity];
      if (random <= 0) {
        selectedItem = item;
        break;
      }
    }

    if (selectedItem) {
      choices.push(selectedItem);
      usedIds.add(selectedItem.id);
    }
  }

  return choices;
}

/**
 * Get item definition by ID
 */
export function getItemById(id: ItemType): ItemDefinition | undefined {
  return ITEM_POOL.find(item => item.id === id);
}
