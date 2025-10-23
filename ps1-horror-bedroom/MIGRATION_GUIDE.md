# Migration Guide: Old Architecture → New Architecture

This guide helps you migrate from the current implementation to the new scalable architecture, which now includes a combat system.

## Overview

The new architecture introduces:
- **Type-safe dice definitions** in `src/config/dice.config.ts`
- **Composable modifier system** in `src/config/modifiers.config.ts`
- **ModifierEngine** for applying effects
- **Configuration-driven approach** for easy extension
- **Combat System** with enemies and player actions.

## Migration Strategy

### Phase 1: Add New Systems (Non-Breaking)

1. Keep existing code running
2. Add new types, configs, and ModifierEngine alongside
3. Gradually migrate components one at a time
4. Test each migration step

### Phase 2: Migrate Components

1. DiceManager → Use new ModifierEngine
2. Dice → Use type definitions from config
3. Card components → Use new modifier system

### Phase 3: Integrate Combat System
1. Add `combatSystem.ts` and `enemySystem.ts`.
2. Create enemy components in `src/components/enemies/`.
3. Integrate combat logic into the main game loop.

### Phase 4: Remove Old Code

1. Delete old diceTransformationSystem.ts (replaced by ModifierEngine)
2. Clean up unused transformation logic
3. Remove deprecated helper functions

## Step-by-Step Migration

### Step 1: Integrate ModifierEngine into DiceManager

**File: `src/components/models/DiceManager.tsx`**

```tsx
// Add import
import { getModifierEngine } from '../../systems/modifiers/ModifierEngine';
import type { GameContext } from '../../types/modifier.types';

// In DiceManager component
const modifierEngine = useMemo(() => {
  const context: GameContext = {
    timeOfDay: timeOfDay as "morning" | "midday" | "night",
    hellFactor: 0,  // Get from corruption system
    currentAttempt: 0,  // Get from game state
    successfulRolls: 0,  // Get from game state
    daysMarked: 0,  // Get from game state
    phase: "idle",
  };
  return getModifierEngine(context);
}, []);

// Update context when game state changes
useEffect(() => {
  modifierEngine.updateContext({
    timeOfDay: timeOfDay as "morning" | "midday" | "night",
    // ... other context updates
  });
}, [timeOfDay, modifierEngine]);

// Replace calculateTransformationEffects
const calculateModifierEffects = (diceInstance: DiceInstance) => {
  const composedEffects = modifierEngine.composeModifiers(diceInstance);

  return {
    sizeMultiplier: composedEffects.physics.sizeMultiplier,
    massMultiplier: composedEffects.physics.massMultiplier,
    scoreMultiplier: composedEffects.score.scoreMultiplier,
    emissiveIntensity: composedEffects.visual.emissiveIntensity || 0,
    emissive: composedEffects.visual.emissiveColor || 0,
  };
};

// Use new function instead of old calculateTransformationEffects
const effects = calculateModifierEffects(diceInstance);
```

### Step 2: Use Dice Type Registry

**File: `src/components/models/DiceManager.tsx`**

```tsx
import { getDiceDefinition } from '../../config/dice.config';

// When creating a new die
function createDie(typeId: DiceTypeId): DiceInstance {
  const definition = getDiceDefinition(typeId);
  if (!definition) {
    throw new Error(`Unknown dice type: ${typeId}`);
  }

  return {
    id: nextDiceId++,
    typeId,
    position: [0, 2, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    settled: false,
    outOfBounds: false,
    transformations: [],
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };
}
```

### Step 3: Replace Old Transformation System

**File: `src/systems/diceTransformationSystem.ts` → DEPRECATED**

Replace all usages with new ModifierEngine:

```tsx
// OLD WAY
import { DiceTransformation } from '../systems/diceTransformationSystem';
const transformation: DiceTransformation = {
  type: 'tower_boost',
  appliedAt: Date.now(),
  sizeMultiplier: 1.5,
  massMultiplier: 2.0,
  scoreMultiplier: 2.0,
  // ...
};

// NEW WAY
import { MODIFIER_REGISTRY } from '../config/modifiers.config';
const modifierDef = MODIFIER_REGISTRY.get('tower_boost');
// ModifierEngine handles composition automatically
```

### Step 4: Update Card Collision Handlers

**File: `src/components/models/Card.tsx`**

```tsx
// OLD WAY
onDiceEnter={(diceId) => {
  diceManagerRef.current.applyCardTransformation?.(diceId, "tower");
}}

// NEW WAY - Same interface, but uses new modifier system internally
onDiceEnter={(diceId) => {
  diceManagerRef.current.applyModifier?.(diceId, "tower_boost");
}}
```

**File: `src/components/models/DiceManager.tsx`**

```tsx
// Add new method to DiceManager
const applyModifier = useCallback((diceId: number, modifierId: string) => {
  setDice(prevDice =>
    prevDice.map(d => {
      if (d.id !== diceId) return d;

      // Check if modifier already applied (prevent duplicates)
      const hasModifier = d.transformations.some(t => t.type === modifierId);
      if (hasModifier) {
        console.log(`Modifier ${modifierId} already applied to die ${diceId}`);
        return d;
      }

      // Get modifier definition
      const modifierDef = MODIFIER_REGISTRY.get(modifierId);
      if (!modifierDef) {
        console.error(`Unknown modifier: ${modifierId}`);
        return d;
      }

      // Add transformation (keeping old structure for now)
      const transformation: DiceTransformation = {
        type: modifierId as TransformationType,
        appliedAt: Date.now(),
        sizeMultiplier: modifierDef.effects.physics?.sizeMultiplier,
        massMultiplier: modifierDef.effects.physics?.massMultiplier,
        scoreMultiplier: modifierDef.effects.score?.scoreMultiplier,
        emissive: modifierDef.effects.visual?.emissiveColor as number,
        emissiveIntensity: modifierDef.effects.visual?.emissiveIntensity,
      };

      return {
        ...d,
        transformations: [...d.transformations, transformation],
      };
    })
  );
}, []);

// Expose via ref
useImperativeHandle(ref, () => ({
  // ... existing methods
  applyModifier,
}));
```

### Step 5: Optimize GameHUD Component

**File: `src/components/ui/GameHUD.tsx`**

```tsx
import { memo, useMemo } from 'react';

// Add comparison functions
function scoresEqual(a: ScoreCategoryData[], b: ScoreCategoryData[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].achieved !== b[i].achieved || a[i].score !== b[i].score) {
      return false;
    }
  }
  return true;
}

// Wrap component with memo
export const GameHUD = memo(function GameHUD(props: GameHUDProps) {
  // Memoize expensive renders
  const scoreItems = useMemo(() =>
    props.scores.map((score) => (
      <div key={score.category} className={`score-item ${score.achieved ? "achieved" : "locked"}`}>
        {/* ... */}
      </div>
    )),
    [props.scores]
  );

  return (
    <div className="game-hud">
      {scoreItems}
      {/* ... rest of component */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.timeOfDay === nextProps.timeOfDay &&
    prevProps.currentAttempts === nextProps.currentAttempts &&
    prevProps.currentScore === nextProps.currentScore &&
    prevProps.balance === nextProps.balance &&
    scoresEqual(prevProps.scores, nextProps.scores)
  );
});
```

### Step 6: Add useCallback to App.tsx Event Handlers

**File: `src/App.tsx`**

```tsx
import { useCallback } from 'react';

// Wrap all event handlers
const handleDiceSettled = useCallback((diceValues?: number[]) => {
  setDiceSettled(true);
  onDiceSettled(diceValues);
}, [onDiceSettled]);

const handleSuccessfulRoll = useCallback(() => {
  if (diceScore > 0) {
    setRollHistory((prev) => [...prev, diceScore]);
  }
  setDiceScore(0);
  setDiceSettled(false);
  onSuccessfulRoll();
}, [diceScore, onSuccessfulRoll]);

const handleFailedRoll = useCallback(() => {
  setRollHistory((prev) => [...prev, diceScore]);
  setDiceScore(0);
  setDiceSettled(false);
  onFailedRoll();
}, [diceScore, onFailedRoll]);

const handleItemSelected = useCallback((item: ItemDefinition) => {
  const newInventory = applyItemToInventory(inventory, item);
  setInventory(newInventory);
  setItemChoices([]);
  onItemSelected();
}, [inventory, onItemSelected]);
```

## Testing Each Step

After each migration step:

1. **Run the dev server**: `npm run dev`
2. **Test dice throwing**: Verify physics work correctly
3. **Test modifiers**: Check Tower/Sun cards apply correctly
4. **Check console**: Look for errors or warnings
5. **Test performance**: Should be same or better

## Rollback Plan

If something breaks:

1. **Revert the specific file**: `git checkout HEAD -- src/path/to/file.tsx`
2. **Check git diff**: See what changed
3. **Fix incrementally**: Don't migrate everything at once

## New Features Enabled by Migration

Once migrated, you can easily:

### Add a New Dice Type

```tsx
// In src/config/dice.config.ts
export const D10: DiceTypeDefinition = {
  id: "d10",
  name: "D10",
  faces: 10,
  physics: { mass: 1.2, size: 0.16, friction: 0.6, restitution: 0.35 },
  visual: { geometry: "cylinder", material: { color: 0x00ff00 } },
  scoring: { baseMultiplier: 1.0 },
  rarity: "rare",
  unlocked: false,
};

// Add to registry
DICE_REGISTRY.set("d10", D10);
```

### Add a New Modifier

```tsx
// In src/config/modifiers.config.ts
export const DOUBLE_OR_NOTHING: ModifierDefinition = {
  id: "double_or_nothing",
  type: "custom",
  name: "Double or Nothing",
  description: "50% chance to double score, 50% chance to get 0",
  effects: {
    behavior: {
      onScore: (die, baseScore) => {
        return Math.random() < 0.5 ? baseScore * 2 : 0;
      },
    },
  },
  stacking: "none",
  rarity: "legendary",
};

// Add to registry
MODIFIER_REGISTRY.set("double_or_nothing", DOUBLE_OR_NOTHING);
```

### Create Complex Modifier Combos

```tsx
// Modifiers automatically compose!
// Apply multiple to same die:
applyModifier(diceId, "tower_boost");   // 2x score
applyModifier(diceId, "blessed");       // +1
applyModifier(diceId, "lucky");         // Reroll 1s

// Final score = (baseValue + 1) * 2, with reroll on 1
```

## Checklist

- [ ] Create new type files (`dice.types.ts`, `modifier.types.ts`, `combat.types.ts`)
- [ ] Create config files (`dice.config.ts`, `modifiers.config.ts`)
- [ ] Create ModifierEngine
- [ ] Create `combatSystem.ts` and `enemySystem.ts`
- [ ] Update DiceManager to use ModifierEngine
- [ ] Update Card collision handlers
- [ ] Add React.memo to GameHUD
- [ ] Add useCallback to App.tsx handlers
- [ ] Test thoroughly
- [ ] Remove old diceTransformationSystem.ts
- [ ] Update documentation

## Questions?

Check:
- `ARCHITECTURE.md` - System design
- `PERFORMANCE.md` - Optimization techniques
- `src/types/` - Type definitions
- `src/config/` - Configuration examples
