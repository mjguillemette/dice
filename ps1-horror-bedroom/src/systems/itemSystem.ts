/**
 * Rogue-like Item System
 * Manages item definitions, inventory, and item selection with robust rarity framework
 */

// ===== TYPES & INTERFACES =====
// Export all types for external use

export type ItemType =
  | "thumbtack"
  | "coin"
  | "nickel"
  | "d3"
  | "d4"
  | "d6"
  | "d8"
  | "d10"
  | "d12"
  | "d20"
  | "golden_pyramid"    // D3 that generates coins
  | "caltrop"           // D4 with unique physics
  | "casino_reject"     // Rigged D6 (weighted high)
  | "weighted_die"
  | "loaded_coin"
  | "cursed_die"        // D6 that adds corruption but rolls high
  | "split_die"         // D6 that can split into 2 D3s
  | "mirror_die"        // D6 that copies another die's value
  | "tower_card"
  | "sun_card"
  | "moon_card"
  | "hourglass"
  | "lucky_charm"
  | "rigged_die"
  | "cigarette"
  | "incense";

/**
 * Rarity system with day-gating and drop rate modifiers
 * - common: Available from day 1, high drop rate
 * - uncommon: Available from day 2, medium drop rate
 * - rare: Available from day 4, low drop rate
 * - epic: Available from day 7, very low drop rate
 * - legendary: Available from day 10, extremely low drop rate
 */
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/**
 * Rarity configuration with progression mechanics
 */
export interface RarityConfig {
  baseWeight: number;        // Base probability weight (higher = more common)
  minDay: number;            // Minimum day to unlock this rarity tier
  luckMultiplier: number;    // How much luck affects this rarity (1.0 = normal, higher = more affected by luck)
  priceMultiplier: number;   // Store price multiplier for this rarity
}

export const RARITY_CONFIGS: Record<ItemRarity, RarityConfig> = {
  common: {
    baseWeight: 100,
    minDay: 1,
    luckMultiplier: 0.5,     // Less affected by luck
    priceMultiplier: 1.0
  },
  uncommon: {
    baseWeight: 50,
    minDay: 2,
    luckMultiplier: 1.0,     // Normally affected by luck
    priceMultiplier: 2.0
  },
  rare: {
    baseWeight: 20,
    minDay: 4,
    luckMultiplier: 1.5,     // More affected by luck
    priceMultiplier: 4.0
  },
  epic: {
    baseWeight: 8,
    minDay: 7,
    luckMultiplier: 2.0,     // Highly affected by luck
    priceMultiplier: 8.0
  },
  legendary: {
    baseWeight: 3,
    minDay: 10,
    luckMultiplier: 3.0,     // Extremely affected by luck
    priceMultiplier: 15.0
  }
};

/**
 * Item pool type - determines where items can appear
 */
export type ItemPool = "reward" | "store" | "both";

/**
 * Consumable item data - tracks usage and duration
 */
export interface ConsumableData {
  itemId: ItemType;
  remainingUses: number;     // How many uses/rounds left
  isActive: boolean;         // Whether currently active
}

export interface ItemDefinition {
  id: ItemType;
  name: string;
  description: string;
  rarity: ItemRarity;
  pool: ItemPool;           // Where this item can appear
  basePrice?: number;       // Base price (multiplied by rarity multiplier for store)
  isConsumable?: boolean;   // Whether this item has limited uses
  maxUses?: number;         // Maximum uses for consumable items
  // Effects when collected
  effect: {
    type: "add_dice" | "add_card" | "add_decoration" | "modify_stats" | "add_consumable" | "passive_effect";
    maxValue?: number; // For dice: 1=thumbtack, 2=coin, 3=d3, 4=d4, 6=d6
    cardType?: "tower" | "sun" | "moon"; // For cards
    statModifier?: "luck" | "reroll"; // For stat modifications
    passiveEffectType?: "corruption_per_roll" | "corruption_scaling" | "combo_multiplier"; // For passive effects
  };
}

export interface PlayerInventory {
  // Dice counts by type
  dice: {
    d6: number;
    coins: number;
    nickels: number;           // 5-cent coin (currency)
    thumbtacks: number;
    d3: number;
    d4: number;
    d8: number;
    d10: number;
    d12: number;
    d20: number;
    golden_pyramid: number;    // D3 that generates coins
    caltrop: number;           // D4 with unique physics
    casino_reject: number;     // Rigged D6 (weighted high)
    weighted_die: number;      // Special d6 with higher avg value
    loaded_coin: number;       // Biased coin
    cursed_die: number;        // D6 that adds corruption but rolls high
    split_die: number;         // D6 that can split into 2 D3s
    mirror_die: number;        // D6 that copies another die's value
    rigged_die: number;        // d6 that always rolls high
  };

  // Cards owned
  cards: {
    tower: boolean;
    sun: boolean;
    moon: boolean;
  };

  // Decorations
  decorations: {
    hourglass: boolean;
  };

  // Consumable items
  consumables: ConsumableData[];

  // Passive effect items (always active once owned)
  passiveEffects: {
    cigarette: number;        // Cigarette count (max 20, one pack)
  };

  // Player stats (for future expansion)
  stats: {
    luck: number;              // Affects rarity drop rates (0-100)
    rerolls: number;           // Extra reroll tokens
    corruptionPerRoll: number; // Additional corruption added per dice throw
  };
}

// ===== ITEM DEFINITIONS =====

export const ITEM_POOL: ItemDefinition[] = [
  // ===== COMMON - Basic dice, available from day 1 =====
  {
    id: "thumbtack",
    name: "Thumbtack",
    description: "A simple thumbtack. Always lands tip-up. Adds 1 point.",
    rarity: "common",
    pool: "store",
    basePrice: 15,
    effect: {
      type: "add_dice",
      maxValue: 1
    }
  },
  {
    id: "coin",
    name: "Penny",
    description: "A copper penny. Heads or tails, worth 1-2 cents.",
    rarity: "common",
    pool: "store",
    basePrice: 50,
    effect: {
      type: "add_dice",
      maxValue: 2
    }
  },
  {
    id: "nickel",
    name: "Nickel",
    description: "A 5-cent coin. Rolls 5 or 10 cents.",
    rarity: "common",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 2
    }
  },
  {
    id: "cigarette",
    name: "Cigarette",
    description: "Looks cool, though.",
    rarity: "common",
    pool: "reward",
    effect: {
      type: "passive_effect",
      passiveEffectType: "corruption_per_roll"
    }
  },
  {
    id: "incense",
    name: "Incense Stick",
    description: "Consumable (3 uses). Score buckets combo'd back-to-back gain +15% per combo.",
    rarity: "common",
    pool: "reward",
    isConsumable: true,
    maxUses: 3,
    effect: {
      type: "add_consumable",
      passiveEffectType: "combo_multiplier"
    }
  },

  // ===== UNCOMMON - Better dice, available from day 2 =====
  {
    id: "d3",
    name: "Triangular Die",
    description: "A three-sided die. Rolls 1-3 points.",
    rarity: "common",
    pool: "both",
    basePrice: 100,
    effect: {
      type: "add_dice",
      maxValue: 3
    }
  },
  {
    id: "d4",
    name: "Pyramid Die",
    description: "A four-sided die. Rolls 1-4 points.",
    rarity: "uncommon",
    pool: "both",
    basePrice: 200,
    effect: {
      type: "add_dice",
      maxValue: 4
    }
  },
  {
    id: "d6",
    name: "Classic Die",
    description: "A standard six-sided die. Rolls 1-6 points.",
    rarity: "uncommon",
    pool: "both",
    basePrice: 500,
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "d8",
    name: "Octahedron Die",
    description: "An eight-sided die. Rolls 1-8 points.",
    rarity: "uncommon",
    pool: "store",
    basePrice: 70,
    effect: {
      type: "add_dice",
      maxValue: 8
    }
  },

  // ===== RARE - Special dice and first tarot, available from day 4 =====
  {
    id: "golden_pyramid",
    name: "Golden Pyramid",
    description: "A gilded D3 that generates 1-3 coins on each roll.",
    rarity: "rare",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 3
    }
  },
  {
    id: "caltrop",
    name: "Caltrop",
    description: "A sharp D4 with unpredictable bounces.",
    rarity: "rare",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 4
    }
  },
  {
    id: "d10",
    name: "Decahedron Die",
    description: "A ten-sided die. Rolls 1-10 points.",
    rarity: "rare",
    pool: "store",
    basePrice: 120,
    effect: {
      type: "add_dice",
      maxValue: 10
    }
  },
  {
    id: "loaded_coin",
    name: "Loaded Coin",
    description: "A rigged coin that favors heads. Usually rolls 2.",
    rarity: "rare",
    pool: "store",
    basePrice: 80,
    effect: {
      type: "add_dice",
      maxValue: 2
    }
  },
  {
    id: "tower_card",
    name: "The Tower - Tarot",
    description: "Dice landing here gain 1.2x score multiplier.",
    rarity: "rare",
    pool: "reward", // Only appears as reward, not in store
    effect: {
      type: "add_card",
      cardType: "tower"
    }
  },

  // ===== EPIC - Powerful items, available from day 7 =====
  {
    id: "casino_reject",
    name: "Casino Reject",
    description: "Banned from casinos. This D6 mysteriously favors high rolls.",
    rarity: "epic",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "cursed_die",
    name: "Cursed Die",
    description: "Rolls high but adds corruption. +5% corruption per roll.",
    rarity: "epic",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "d12",
    name: "Dodecahedron Die",
    description: "A twelve-sided die. Rolls 1-12 points.",
    rarity: "epic",
    pool: "store",
    basePrice: 180,
    effect: {
      type: "add_dice",
      maxValue: 12
    }
  },
  {
    id: "weighted_die",
    name: "Weighted Die",
    description: "A d6 weighted to roll higher. Averages 4-5 instead of 3.5.",
    rarity: "epic",
    pool: "store",
    basePrice: 100,
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "sun_card",
    name: "The Sun - Tarot",
    description: "Dice landing here gain 1.5x score multiplier.",
    rarity: "uncommon",
    pool: "reward",
    effect: {
      type: "add_card",
      cardType: "sun"
    }
  },
  {
    id: "hourglass",
    name: "Ancient Hourglass",
    description: "Slows time. Grants +1 attempt per round.",
    rarity: "epic",
    pool: "reward",
    effect: {
      type: "add_decoration"
    }
  },

  // ===== LEGENDARY - Game-changing items, available from day 10 =====
  {
    id: "d20",
    name: "Icosahedron Die",
    description: "The legendary twenty-sided die. Rolls 1-20 points.",
    rarity: "legendary",
    pool: "store",
    basePrice: 300,
    effect: {
      type: "add_dice",
      maxValue: 20
    }
  },
  {
    id: "split_die",
    name: "Bifurcating Die",
    description: "A D6 that splits into two D3s mid-roll. Doubles your chances.",
    rarity: "legendary",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "mirror_die",
    name: "Mirror Die",
    description: "Copies the value of another random die. Perfect synchronization.",
    rarity: "legendary",
    pool: "reward",
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "rigged_die",
    name: "Rigged Die",
    description: "A d6 that always rolls 5 or 6. Impossibly lucky.",
    rarity: "legendary",
    pool: "store",
    basePrice: 200,
    effect: {
      type: "add_dice",
      maxValue: 6
    }
  },
  {
    id: "moon_card",
    name: "The Moon - Tarot",
    description: "Dice landing here gain 2.0x score multiplier. Mysterious power.",
    rarity: "legendary",
    pool: "reward",
    effect: {
      type: "add_card",
      cardType: "moon"
    }
  },
  {
    id: "lucky_charm",
    name: "Rabbit's Foot Charm",
    description: "Permanently increases luck by 25. Better item drops!",
    rarity: "legendary",
    pool: "reward",
    effect: {
      type: "modify_stats",
      statModifier: "luck"
    }
  }
];

// ===== INVENTORY MANAGEMENT =====

export const INITIAL_INVENTORY: PlayerInventory = {
  dice: {
    d6: 2,              // Start with 2 standard dice
    coins: 1,           // Start with 1 coin
    nickels: 0,
    thumbtacks: 0,
    d3: 0,
    d4: 0,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
    golden_pyramid: 0,
    caltrop: 0,
    casino_reject: 0,
    weighted_die: 0,
    loaded_coin: 0,
    cursed_die: 0,
    split_die: 0,
    mirror_die: 0,
    rigged_die: 0
  },
  cards: {
    tower: false,
    sun: false,
    moon: false
  },
  decorations: {
    hourglass: false
  },
  consumables: [],
  passiveEffects: {
    cigarette: 0
  },
  stats: {
    luck: 0,            // Base luck, can be increased by items
    rerolls: 0,         // Extra reroll tokens
    corruptionPerRoll: 0 // Additional corruption per roll (from cigarette)
  }
};

/**
 * Apply an item's effect to the inventory
 */
export function applyItemToInventory(
  inventory: PlayerInventory,
  item: ItemDefinition
): PlayerInventory {
  const newInventory = { ...inventory };

  switch (item.effect.type) {
    case "add_dice":
      newInventory.dice = { ...newInventory.dice };

      // Map item ID to dice type - handle special dice by ID first
      const diceTypeMap: Record<string, keyof typeof newInventory.dice> = {
        "weighted_die": "weighted_die",
        "loaded_coin": "loaded_coin",
        "rigged_die": "rigged_die",
        "nickel": "nickels",
        "golden_pyramid": "golden_pyramid",
        "caltrop": "caltrop",
        "casino_reject": "casino_reject",
        "cursed_die": "cursed_die",
        "split_die": "split_die",
        "mirror_die": "mirror_die"
      };

      if (diceTypeMap[item.id]) {
        newInventory.dice[diceTypeMap[item.id]] += 1;
      } else {
        // Standard dice based on maxValue
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
          case 8:
            newInventory.dice.d8 += 1;
            break;
          case 10:
            newInventory.dice.d10 += 1;
            break;
          case 12:
            newInventory.dice.d12 += 1;
            break;
          case 20:
            newInventory.dice.d20 += 1;
            break;
        }
      }
      break;

    case "add_card":
      newInventory.cards = { ...newInventory.cards };
      if (item.effect.cardType === "tower") {
        newInventory.cards.tower = true;
      } else if (item.effect.cardType === "sun") {
        newInventory.cards.sun = true;
      } else if (item.effect.cardType === "moon") {
        newInventory.cards.moon = true;
      }
      break;

    case "add_decoration":
      newInventory.decorations = { ...newInventory.decorations };
      if (item.id === "hourglass") {
        newInventory.decorations.hourglass = true;
      }
      break;

    case "add_consumable":
      // Add consumable with max uses
      newInventory.consumables = [...newInventory.consumables];
      newInventory.consumables.push({
        itemId: item.id,
        remainingUses: item.maxUses || 1,
        isActive: false
      });
      console.log("✨ Added consumable:", item.name, "with", item.maxUses, "uses");
      break;

    case "passive_effect":
      newInventory.passiveEffects = { ...newInventory.passiveEffects };
      newInventory.stats = { ...newInventory.stats };

      if (item.id === "cigarette") {
        const currentCount = newInventory.passiveEffects.cigarette;
        if (currentCount < 20) {
          newInventory.passiveEffects.cigarette = currentCount + 1;
          newInventory.stats.corruptionPerRoll += 0.01; // +1% corruption per roll
          console.log(`🚬 Cigarette added (${currentCount + 1}/20) - +1% corruption per roll`);
        } else {
          console.log("🚬 Already at max cigarettes (20/20)");
        }
      }
      break;

    case "modify_stats":
      newInventory.stats = { ...newInventory.stats };
      if (item.effect.statModifier === "luck") {
        newInventory.stats.luck += 25; // Rabbit's foot gives +25 luck
      } else if (item.effect.statModifier === "reroll") {
        newInventory.stats.rerolls += 1;
      }
      break;
  }

  return newInventory;
}

/**
 * Check if an item can be offered based on inventory and pool restrictions
 */
export function canOfferItem(
  inventory: PlayerInventory,
  item: ItemDefinition,
  pool: "reward" | "store",
  currentDay: number
): boolean {
  // Check if item is available in this pool
  if (item.pool !== "both" && item.pool !== pool) {
    return false;
  }

  // Check if rarity tier is unlocked for current day
  const rarityConfig = RARITY_CONFIGS[item.rarity];
  if (currentDay < rarityConfig.minDay) {
    return false;
  }

  // Store items must have a price
  if (pool === "store" && !item.basePrice) {
    return false;
  }

  // Cards can only be offered once
  if (item.effect.type === "add_card") {
    if (item.effect.cardType === "tower" && inventory.cards.tower) {
      return false;
    }
    if (item.effect.cardType === "sun" && inventory.cards.sun) {
      return false;
    }
    if (item.effect.cardType === "moon" && inventory.cards.moon) {
      return false;
    }
  }

  // Decorations can only be offered once
  if (item.effect.type === "add_decoration") {
    if (item.id === "hourglass" && inventory.decorations.hourglass) {
      return false;
    }
  }

  // Stat modifiers can only be offered once (for now)
  if (item.effect.type === "modify_stats") {
    if (item.effect.statModifier === "luck" && inventory.stats.luck >= 25) {
      return false; // Already have luck charm
    }
  }

  // Dice can always be offered (you can collect more)
  return true;
}

/**
 * Calculate the effective weight for an item based on rarity, day, and luck
 */
function calculateItemWeight(
  item: ItemDefinition,
  currentDay: number,
  luckModifier: number = 0
): number {
  const rarityConfig = RARITY_CONFIGS[item.rarity];

  // Start with base weight
  let weight = rarityConfig.baseWeight;

  // Apply luck modifier (scaled by rarity's luck multiplier)
  const luckBonus = luckModifier * rarityConfig.luckMultiplier * 0.01; // Convert luck to multiplier
  weight *= (1 + luckBonus);

  // Progressive rarity scaling: uncommon items start rare on day 1, become common by day 7
  const daysUnlocked = Math.max(0, currentDay - rarityConfig.minDay);

  if (item.rarity === "uncommon") {
    // On day 1-2, uncommon items are 30% as likely
    // By day 7, they're at full weight (100%)
    const dayProgress = Math.min(currentDay - 1, 6) / 6; // 0.0 on day 1, 1.0 on day 7
    const rarityMultiplier = 0.3 + (0.7 * dayProgress); // Scales from 30% to 100%
    weight *= rarityMultiplier;
  } else if (daysUnlocked > 0) {
    // For other rarities, each day past unlock adds a moderate bonus
    const unlockBonus = Math.min(daysUnlocked * 0.15, 0.75); // Cap at 75% bonus
    weight *= (1 + unlockBonus);
  }

  return weight;
}

/**
 * Generate store items with weighted rarity selection
 */
export function generateStoreChoices(
  inventory: PlayerInventory,
  currentDay: number,
  count: number = 5
): ItemDefinition[] {
  // Week 1 (days 1-7): Fixed store layout
  if (currentDay >= 1 && currentDay <= 7) {
    const week1Items: ItemType[] = ["thumbtack", "coin", "d3", "d4", "d6"];
    const choices: ItemDefinition[] = [];

    for (const itemId of week1Items) {
      const item = getItemById(itemId);
      if (item) {
        choices.push(item);
      }
    }

    console.log("🏪 Week 1 store (Day " + currentDay + "):", choices.map(c => c.name + " - " + (c.basePrice || 0) + "¢"));
    return choices;
  }

  // Week 2+: Weighted random selection
  const availableItems = ITEM_POOL.filter((item) =>
    canOfferItem(inventory, item, "store", currentDay)
  );

  if (availableItems.length === 0) {
    console.warn("No store items available!");
    return [];
  }

  const choices: ItemDefinition[] = [];
  const usedIds = new Set<ItemType>();
  const luckModifier = inventory.stats.luck;

  while (choices.length < count && usedIds.size < availableItems.length) {
    // Calculate weights for remaining items
    const remainingItems = availableItems.filter(
      (item) => !usedIds.has(item.id)
    );

    const itemWeights = remainingItems.map((item) => ({
      item,
      weight: calculateItemWeight(item, currentDay, luckModifier)
    }));

    const totalWeight = itemWeights.reduce((sum, iw) => sum + iw.weight, 0);

    // Weighted random selection
    let random = Math.random() * totalWeight;
    let selectedItem: ItemDefinition | null = null;

    for (const { item, weight } of itemWeights) {
      random -= weight;
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

  console.log("🏪 Generated store choices (Day " + currentDay + ", Luck " + luckModifier + "):", choices.map(c => c.name + " (" + c.rarity + ")"));
  return choices;
}
/**
 * Generate reward item choices with weighted rarity selection
 * These are the items shown at the end of each day
 */
export function generateItemChoices(
  inventory: PlayerInventory,
  currentDay: number,
  count: number = 3
): ItemDefinition[] {
  // Filter items available for rewards
  const availableItems = ITEM_POOL.filter((item) =>
    canOfferItem(inventory, item, "reward", currentDay)
  );

  if (availableItems.length === 0) {
    console.warn("No reward items available!");
    return [];
  }

  const choices: ItemDefinition[] = [];
  const usedIds = new Set<ItemType>();
  const luckModifier = inventory.stats.luck;

  while (choices.length < count && usedIds.size < availableItems.length) {
    // Calculate weights for remaining items
    const remainingItems = availableItems.filter(
      (item) => !usedIds.has(item.id)
    );

    const itemWeights = remainingItems.map((item) => ({
      item,
      weight: calculateItemWeight(item, currentDay, luckModifier)
    }));

    const totalWeight = itemWeights.reduce((sum, iw) => sum + iw.weight, 0);

    // Weighted random selection
    let random = Math.random() * totalWeight;
    let selectedItem: ItemDefinition | null = null;

    for (const { item, weight } of itemWeights) {
      random -= weight;
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

  console.log("🎁 Generated reward choices (Day " + currentDay + ", Luck " + luckModifier + "):", choices.map(c => c.name + " (" + c.rarity + ")"));
  return choices;
}

/**
 * Get calculated price for an item in the store (basePrice * rarity multiplier)
 */
export function getItemPrice(item: ItemDefinition): number {
  if (!item.basePrice) {
    return 0;
  }
  const rarityConfig = RARITY_CONFIGS[item.rarity];
  return Math.floor(item.basePrice * rarityConfig.priceMultiplier);
}

/**
 * Get item definition by ID
 */
export function getItemById(id: ItemType): ItemDefinition | undefined {
  return ITEM_POOL.find((item) => item.id === id);
}

// ===== CONSUMABLE MANAGEMENT =====

/**
 * Activate a consumable item
 */
export function activateConsumable(
  inventory: PlayerInventory,
  itemId: ItemType
): PlayerInventory {
  const newInventory = { ...inventory };
  newInventory.consumables = [...inventory.consumables];

  const consumable = newInventory.consumables.find((c) => c.itemId === itemId);
  if (!consumable) {
    console.warn("Consumable not found:", itemId);
    return inventory;
  }

  if (consumable.remainingUses <= 0) {
    console.warn("Consumable has no remaining uses:", itemId);
    return inventory;
  }

  // Activate the consumable
  consumable.isActive = true;
  console.log("🔥 Activated consumable:", itemId, "- Remaining uses:", consumable.remainingUses);

  return newInventory;
}

/**
 * Deactivate a consumable (when round ends or effect wears off)
 */
export function deactivateConsumable(
  inventory: PlayerInventory,
  itemId: ItemType
): PlayerInventory {
  const newInventory = { ...inventory };
  newInventory.consumables = [...inventory.consumables];

  const consumable = newInventory.consumables.find((c) => c.itemId === itemId);
  if (!consumable) {
    return inventory;
  }

  consumable.isActive = false;
  consumable.remainingUses -= 1;

  console.log("⏹️ Deactivated consumable:", itemId, "- Remaining uses:", consumable.remainingUses);

  // Remove consumable if out of uses
  if (consumable.remainingUses <= 0) {
    newInventory.consumables = newInventory.consumables.filter((c) => c.itemId !== itemId);
    console.log("🗑️ Consumed all uses of:", itemId);
  }

  return newInventory;
}

/**
 * Check if a consumable is currently active
 */
export function isConsumableActive(
  inventory: PlayerInventory,
  itemId: ItemType
): boolean {
  const consumable = inventory.consumables.find((c) => c.itemId === itemId);
  return consumable?.isActive || false;
}

/**
 * Get all active consumables
 */
export function getActiveConsumables(inventory: PlayerInventory): ConsumableData[] {
  return inventory.consumables.filter((c) => c.isActive);
}
