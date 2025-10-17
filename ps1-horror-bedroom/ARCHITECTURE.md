# Architecture Improvements & Scalability Plan

## Overview
This document outlines the architectural improvements for performance, maintainability, and scalability as the game grows to include many dice types and items with unique physics and scoring modifiers.

## 1. Performance Optimizations

### Current Bottlenecks
- **Dice rendering**: Each die creates its own mesh and material
- **Physics calculations**: Individual RigidBody per die
- **React re-renders**: Props drilling and unnecessary component updates
- **Score calculations**: Recalculated on every frame

### Solutions

#### A. Object Pooling for Dice
- Pre-allocate dice instances and reuse them
- Reduce garbage collection pressure
- Batch geometry updates using InstancedMesh for non-transformed dice

#### B. React Performance
- Memoize components with `React.memo`
- Use `useMemo` for expensive calculations
- Implement `useCallback` for event handlers
- Context splitting to prevent cascading re-renders

#### C. Physics Optimizations
- Use collision groups for selective collision detection
- Implement sleep states for settled dice
- Batch physics updates

## 2. Code Structure & Maintainability

### New Architecture

```
src/
├── systems/
│   ├── dice/
│   │   ├── DiceTypeRegistry.ts        # Central dice type definitions
│   │   ├── DicePhysicsSystem.ts       # Physics behavior per type
│   │   ├── DiceRenderSystem.ts        # Rendering behavior per type
│   │   └── DicePoolManager.ts         # Object pooling
│   ├── modifiers/
│   │   ├── ModifierRegistry.ts        # All modifier types
│   │   ├── ModifierEngine.ts          # Apply/compose modifiers
│   │   └── effects/                   # Individual effect implementations
│   │       ├── PhysicsEffects.ts
│   │       ├── ScoreEffects.ts
│   │       └── VisualEffects.ts
│   ├── items/
│   │   ├── ItemTypeRegistry.ts        # Central item definitions
│   │   └── ItemEffectSystem.ts        # Item behaviors
│   └── core/
│       ├── gameStateSystem.ts         # Existing
│       ├── scoringSystem.ts           # Existing
│       └── EventBus.ts                # New: Decoupled event system
├── config/
│   ├── dice.config.ts                 # All dice type definitions
│   ├── items.config.ts                # All item definitions
│   ├── modifiers.config.ts            # All modifier definitions
│   └── physics.config.ts              # Physics constants
└── types/
    ├── dice.types.ts                  # Dice type definitions
    ├── modifier.types.ts              # Modifier type definitions
    └── item.types.ts                  # Item type definitions
```

## 3. Scalable Dice & Item System

### Dice Type System

```typescript
// Example dice type definition
interface DiceTypeDefinition {
  id: string;
  name: string;
  faces: number;

  // Physics properties
  physics: {
    mass: number;
    size: number;
    friction: number;
    restitution: number;
    angularDamping?: number;
  };

  // Visual properties
  visual: {
    geometry: 'box' | 'icosahedron' | 'custom';
    material: MaterialConfig;
    shader?: ShaderConfig;
  };

  // Scoring
  scoreMultiplier: number;
  baseValue: (faceValue: number) => number;

  // Special behaviors
  onLand?: (die: DiceInstance) => void;
  onSettle?: (die: DiceInstance) => void;
  modifiers?: string[];  // Default modifiers
}
```

### Modifier System

```typescript
// Composable modifier system
interface Modifier {
  id: string;
  type: ModifierType;

  // What does this modify?
  effects: {
    physics?: PhysicsEffect;
    score?: ScoreEffect;
    visual?: VisualEffect;
    behavior?: BehaviorEffect;
  };

  // How modifiers stack
  stacking: 'replace' | 'add' | 'multiply' | 'max' | 'none';

  // Conditions
  condition?: (die: DiceInstance, context: GameContext) => boolean;

  // Lifecycle
  onApply?: (die: DiceInstance) => void;
  onRemove?: (die: DiceInstance) => void;
}

// Example: Tower card modifier
const towerCardModifier: Modifier = {
  id: 'tower_boost',
  type: 'tarot_boost',
  effects: {
    physics: {
      massMultiplier: 2.0,
      sizeMultiplier: 1.5
    },
    score: {
      scoreMultiplier: 2.0
    },
    visual: {
      emissiveColor: 0x8a2be2,
      emissiveIntensity: 0.5
    }
  },
  stacking: 'none'
};
```

### Item System

```typescript
interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  price?: number;

  // What does this item do?
  effect: ItemEffect;

  // When does it trigger?
  trigger: 'on_purchase' | 'passive' | 'on_roll' | 'on_settle';

  // How many can you have?
  maxStack: number;

  // Visual representation
  icon: string;
  model?: string;
}

// Example: Add a die to inventory
const extraD6: ItemDefinition = {
  id: 'd6_extra',
  name: 'Extra D6',
  description: 'Add an additional D6 to your dice pool',
  price: 50,
  effect: {
    type: 'modify_inventory',
    dice: { d6: 1 }
  },
  trigger: 'on_purchase',
  maxStack: 10
};

// Example: All dice get +1
const blessedAmulet: ItemDefinition = {
  id: 'blessed_amulet',
  name: 'Blessed Amulet',
  description: 'All dice gain +1 to their roll',
  price: 200,
  effect: {
    type: 'apply_modifier',
    modifier: 'blessed',
    target: 'all_dice'
  },
  trigger: 'passive',
  maxStack: 1
};
```

## 4. Implementation Priority

### Phase 1: Type System & Configuration (Week 1)
1. Create type definitions (dice.types.ts, modifier.types.ts, item.types.ts)
2. Create configuration files (dice.config.ts, modifiers.config.ts, items.config.ts)
3. Migrate existing dice types to new system

### Phase 2: Modifier Engine (Week 1-2)
1. Build ModifierRegistry and ModifierEngine
2. Implement effect composition
3. Migrate existing transformations to new modifier system

### Phase 3: Performance (Week 2)
1. Implement object pooling for dice
2. Add React.memo and useMemo where needed
3. Optimize physics with collision groups

### Phase 4: Item System Refactor (Week 2-3)
1. Refactor itemSystem.ts to use new architecture
2. Create ItemEffectSystem for applying item effects
3. Migrate existing items to new definitions

### Phase 5: Event System (Week 3)
1. Create EventBus for decoupled communication
2. Replace prop drilling with events where appropriate
3. Add event logging/debugging

## 5. Testing & Validation

- Unit tests for modifier composition
- Performance benchmarks for object pooling
- Integration tests for dice + modifier combinations
- Stress test with 50+ dice

## 6. Future Enhancements

- Save/load system for dice configurations
- Dice crafting system (combine modifiers)
- Item synergies (multiple items interact)
- Achievement system (unlock new dice/items)
- Procedural dice generation
