/**
 * Item Domain Models
 * Core data structures for items, effects, and inventory
 */

export type ItemType =
  | 'cigarette'
  | 'incense'
  | 'hourglass'
  | 'board_game'
  | 'card_tower'
  | 'card_sun'
  | 'unknown';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type ItemCategory = 'consumable' | 'passive' | 'card' | 'dice_modifier';

export type EffectType =
  | 'score_multiplier'
  | 'currency_bonus'
  | 'combo_multiplier'
  | 'dice_transformation'
  | 'time_manipulation'
  | 'corruption_reduction';

export type EffectTrigger =
  | 'on_purchase'
  | 'on_roll'
  | 'on_score'
  | 'on_time_change'
  | 'passive'
  | 'on_activate';

/**
 * Represents a single effect that an item can have
 */
export interface ItemEffect {
  id: string;
  type: EffectType;
  trigger: EffectTrigger;
  value: number | string | boolean;
  duration?: number; // Number of rounds/rolls, undefined = permanent
  condition?: EffectCondition;
  description: string;
}

/**
 * Condition that must be met for an effect to activate
 */
export interface EffectCondition {
  type: 'corruption_above' | 'corruption_below' | 'time_of_day' | 'score_above' | 'dice_count';
  value: number | string;
}

/**
 * Context provided when applying effects
 */
export interface EffectContext {
  // Current game state
  gameState: {
    corruption: number;
    timeOfDay: string;
    currentAttempt: number;
  };

  // Roll results (if applicable)
  diceResults?: any[];
  scores?: any[];

  // Player stats
  currency: number;
  inventory: ItemModel[];
}

/**
 * Result of applying an effect
 */
export interface EffectResult {
  success: boolean;
  modifiedValue?: number;
  message?: string;
  sideEffects?: Partial<{
    corruptionChange: number;
    currencyChange: number;
    itemsAdded: string[];
    itemsRemoved: string[];
  }>;
}

/**
 * Core item model
 */
export interface ItemModel {
  // Identity
  id: string;
  type: ItemType;
  name: string;
  description: string;

  // Classification
  category: ItemCategory;
  rarity: ItemRarity;

  // Economics
  baseCost: number;
  sellValue: number;

  // Game mechanics
  effects: ItemEffect[];
  isActive: boolean;
  usesRemaining?: number; // For consumables
  cooldown?: number; // Rounds until can be used again

  // Metadata
  acquiredAt?: number; // Timestamp
  timesUsed?: number;
}

/**
 * Player inventory
 */
export interface InventoryModel {
  items: ItemModel[];
  maxSlots: number;
  activeItems: Set<string>; // Item IDs currently active
}

/**
 * Item shop/store
 */
export interface StoreModel {
  availableItems: ItemModel[];
  refreshCost: number;
  lastRefresh: number;
  refreshesRemaining: number;
}

/**
 * Type guards
 */
export const isItemModel = (obj: any): obj is ItemModel => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.category === 'string'
  );
};

export const isConsumable = (item: ItemModel): boolean => {
  return item.category === 'consumable';
};

export const isPassive = (item: ItemModel): boolean => {
  return item.category === 'passive';
};

export const hasUsesRemaining = (item: ItemModel): boolean => {
  return item.usesRemaining === undefined || item.usesRemaining > 0;
};

/**
 * Factory functions
 */
export const createItem = (
  type: ItemType,
  overrides?: Partial<ItemModel>
): ItemModel => {
  const baseItem: ItemModel = {
    id: `${type}-${Date.now()}`,
    type,
    name: type.replace('_', ' ').toUpperCase(),
    description: '',
    category: 'passive',
    rarity: 'common',
    baseCost: 100,
    sellValue: 50,
    effects: [],
    isActive: false,
    ...overrides
  };

  return baseItem;
};

export const createInventory = (): InventoryModel => {
  return {
    items: [],
    maxSlots: 10,
    activeItems: new Set()
  };
};

export const createStore = (): StoreModel => {
  return {
    availableItems: [],
    refreshCost: 50,
    lastRefresh: Date.now(),
    refreshesRemaining: 3
  };
};

/**
 * Utility functions
 */
export const canAffordItem = (item: ItemModel, currency: number): boolean => {
  return currency >= item.baseCost;
};

export const canAddToInventory = (inventory: InventoryModel): boolean => {
  return inventory.items.length < inventory.maxSlots;
};

export const findItemById = (
  inventory: InventoryModel,
  itemId: string
): ItemModel | undefined => {
  return inventory.items.find(item => item.id === itemId);
};

export const findItemsByType = (
  inventory: InventoryModel,
  type: ItemType
): ItemModel[] => {
  return inventory.items.filter(item => item.type === type);
};

export const getActiveItems = (inventory: InventoryModel): ItemModel[] => {
  return inventory.items.filter(item => inventory.activeItems.has(item.id));
};
