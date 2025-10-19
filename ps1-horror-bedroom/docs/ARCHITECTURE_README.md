# Architecture Documentation
**PS1 Horror Dice Game - Modular System Architecture**

---

## Overview

This document describes the modular architecture of the PS1 Horror Dice Game. The system is designed around core principles of **separation of concerns**, **modularity**, and **testability**.

---

## Architecture Layers

```
┌─────────────────────────────────────┐
│        Presentation Layer           │  React components (UI only)
├─────────────────────────────────────┤
│      State Management Layer         │  Zustand store (centralized state)
├─────────────────────────────────────┤
│       Business Logic Layer          │  Core systems (pure TypeScript)
├─────────────────────────────────────┤
│          Data Layer                 │  Models and types
└─────────────────────────────────────┘
         ↕ Event Bus (cross-cutting)
```

---

## Directory Structure

```
src/
├── core/                          # Business logic (no React dependencies)
│   ├── models/                   # Data models
│   │   ├── Dice.model.ts        # Dice domain model
│   │   ├── Item.model.ts        # Item & effect models
│   │   ├── Score.model.ts       # Scoring models
│   │   ├── GameState.model.ts   # Game state models
│   │   └── index.ts             # Barrel export
│   │
│   ├── systems/                  # Game systems
│   │   ├── dice/
│   │   │   ├── DiceSystem.ts          # Dice management
│   │   │   ├── DicePhysics.ts         # Physics calculations
│   │   │   └── DiceTransformations.ts # Transformation logic
│   │   │
│   │   ├── scoring/
│   │   │   ├── ScoringSystem.ts       # Score calculation
│   │   │   ├── ComboTracker.ts        # Combo/streak tracking
│   │   │   └── ScoreRules.ts          # Yahtzee rules
│   │   │
│   │   ├── items/
│   │   │   ├── ItemSystem.ts          # Item management
│   │   │   ├── ItemEffects.ts         # Effect engine
│   │   │   ├── ItemRegistry.ts        # Item definitions
│   │   │   └── effects/               # Individual effects
│   │   │       ├── BaseEffect.ts
│   │   │       ├── CigaretteEffect.ts
│   │   │       └── IncenseEffect.ts
│   │   │
│   │   ├── progression/
│   │   │   ├── TimeSystem.ts          # Day/night cycle
│   │   │   ├── CorruptionSystem.ts    # Corruption mechanics
│   │   │   └── TargetSystem.ts        # Daily goals
│   │   │
│   │   ├── economy/
│   │   │   ├── CurrencySystem.ts      # Money management
│   │   │   └── ShopSystem.ts          # Store logic
│   │   │
│   │   └── modifiers/
│   │       ├── ModifierEngine.ts      # Modifier application
│   │       └── ModifierRegistry.ts    # Modifier definitions
│   │
│   ├── services/                 # Cross-cutting services
│   │   ├── EventBus.ts          # Event system
│   │   ├── Logger.ts            # Logging
│   │   └── Persistence.ts       # Save/load
│   │
│   └── utils/                   # Pure utility functions
│       ├── dice.utils.ts
│       ├── math.utils.ts
│       └── random.utils.ts
│
├── state/                        # State management (Zustand)
│   ├── store.ts                 # Main store configuration
│   ├── slices/                  # State slices by domain
│   │   ├── gameSlice.ts
│   │   ├── diceSlice.ts
│   │   ├── scoreSlice.ts
│   │   ├── itemSlice.ts
│   │   └── uiSlice.ts
│   │
│   ├── actions/                 # Action creators
│   │   ├── gameActions.ts
│   │   ├── diceActions.ts
│   │   └── itemActions.ts
│   │
│   └── selectors/               # Memoized selectors
│       ├── gameSelectors.ts
│       └── scoreSelectors.ts
│
├── presentation/                 # React UI layer
│   ├── components/              # Presentational components
│   │   ├── game/               # 3D game components
│   │   ├── ui/                 # 2D UI components
│   │   └── common/             # Shared components
│   │
│   ├── containers/              # Smart components (connected to store)
│   │   ├── GameContainer.tsx
│   │   ├── DiceContainer.tsx
│   │   └── ScoreContainer.tsx
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useGameState.ts
│   │   ├── useDicePhysics.ts
│   │   └── useScoring.ts
│   │
│   └── views/                   # Top-level views
│       ├── GameView.tsx
│       ├── MenuView.tsx
│       └── StoreView.tsx
│
├── config/                       # Configuration files
├── constants/                    # Game constants
├── assets/                       # Static assets
├── types/                        # Shared TypeScript types
└── App.tsx                      # Thin app shell
```

---

## Core Systems

### 1. Dice System
**Location**: `src/core/systems/dice/`

**Responsibilities**:
- Spawn and manage dice
- Calculate physics (rolling, settling)
- Detect face values
- Apply transformations
- Track modifiers

**API**:
```typescript
class DiceSystem {
  createDice(config: DiceSpawnConfig): DiceModel[]
  rollDice(diceIds: string[], force: Vector3): void
  checkSettled(diceIds: string[]): boolean
  getDiceResults(): DiceRollResult[]
  applyTransformation(diceId: string, transformation: Transformation): void
}
```

**Events Emitted**:
- `dice:spawned`
- `dice:rolled`
- `dice:settled`
- `dice:transformed`

---

### 2. Scoring System
**Location**: `src/core/systems/scoring/`

**Responsibilities**:
- Calculate scores from dice results
- Apply multipliers
- Track combos/streaks
- Enforce game rules (Yahtzee-style)

**API**:
```typescript
class ScoringSystem {
  calculateScores(input: ScoreCalculationInput): ScoreModel[]
  applyMultipliers(scores: ScoreModel[], multipliers: ScoreMultiplier[]): ScoreModel[]
  trackCombo(category: ScoreCategory, previousScores: ScoreModel[]): number
  getHighestScore(scores: ScoreModel[]): ScoreModel
}
```

**Events Emitted**:
- `score:calculated`
- `score:achieved`
- `score:combo`
- `score:multi_combo`

---

### 3. Item System
**Location**: `src/core/systems/items/`

**Responsibilities**:
- Manage player inventory
- Register item definitions
- Apply item effects
- Handle consumables and passive items

**API**:
```typescript
class ItemSystem {
  registerItem(item: ItemModel): void
  activateItem(itemId: string): void
  deactivateItem(itemId: string): void
  applyEffects(context: EffectContext): EffectResult
  getActiveItems(): ItemModel[]
}
```

**Effect Engine**:
All item effects implement the `BaseEffect` interface:
```typescript
abstract class BaseEffect {
  abstract apply(context: EffectContext): EffectResult
  abstract canApply(context: EffectContext): boolean
}
```

**Events Emitted**:
- `item:purchased`
- `item:activated`
- `item:expired`
- `item:effect_applied`

---

### 4. Progression System
**Location**: `src/core/systems/progression/`

**Responsibilities**:
- Manage day/night cycle
- Track corruption
- Set daily targets
- Handle time advancement

**API**:
```typescript
class ProgressionSystem {
  advanceTime(): TimeOfDay | null
  increaseCorruption(amount: number): void
  calculateDailyTarget(day: number): number
  checkGameOver(): boolean
}
```

---

### 5. Economy System
**Location**: `src/core/systems/economy/`

**Responsibilities**:
- Manage currency
- Handle shop/store
- Calculate prices
- Process purchases

**API**:
```typescript
class CurrencySystem {
  addCurrency(amount: number): void
  spendCurrency(amount: number): boolean
  getCurrency(): number
}

class ShopSystem {
  generateItems(day: number, count: number): ItemModel[]
  refreshShop(cost: number): void
  purchaseItem(itemId: string, currency: number): PurchaseResult
}
```

---

## State Management

### Zustand Store

**Why Zustand?**
- Simple API, less boilerplate than Redux
- Built-in TypeScript support
- DevTools integration
- Middleware support (persistence, logging)
- No Provider hell

### Store Structure

```typescript
interface GameStore {
  // State slices
  game: GameStateModel;
  dice: DiceModel[];
  scores: ScoreModel[];
  inventory: ItemModel[];
  currency: number;

  // Actions
  actions: {
    // Game
    startGame: () => void;
    endGame: () => void;

    // Dice
    rollDice: () => void;
    settleDice: (results: DiceResult[]) => void;

    // Scores
    calculateScores: (diceResults: DiceResult[]) => void;

    // Items
    addItem: (item: ItemModel) => void;
    activateItem: (itemId: string) => void;

    // Currency
    addCurrency: (amount: number) => void;
  };
}
```

### Usage in Components

```typescript
// Select specific state (re-renders only when that state changes)
const corruption = useGameStore(state => state.game.corruption);
const scores = useGameStore(state => state.scores);

// Select actions
const { rollDice, calculateScores } = useGameStore(state => state.actions);

// Use in handler
const handleRoll = () => {
  rollDice();
};
```

---

## Event Bus

### Purpose

Decouple systems that need to react to events but shouldn't directly call each other.

### API

```typescript
// Subscribe to event
const subscription = eventBus.on('dice:settled', (event) => {
  console.log('Dice settled!', event.payload);
});

// Emit event
eventBus.emit('score:calculated', { scores, total: 150 });

// Subscribe once (auto-unsubscribe)
eventBus.once('game:ended', (event) => {
  saveGame();
});

// Unsubscribe
subscription.unsubscribe();
```

### Event Types

See `src/core/services/EventBus.ts` for full list of event types.

### Common Patterns

**Pattern 1: System reacts to another system's events**
```typescript
// ScoringSystem emits when scores calculated
eventBus.emit('score:calculated', { scores });

// ItemSystem listens and applies effects
eventBus.on('score:calculated', (event) => {
  const modifiedScores = itemSystem.applyEffects({
    type: 'score_modifier',
    scores: event.payload.scores
  });
});
```

**Pattern 2: UI reacts to system events**
```typescript
// In a React component
useEffect(() => {
  const sub = eventBus.on('score:combo', (event) => {
    showComboAnimation(event.payload.comboCount);
  });

  return () => sub.unsubscribe();
}, []);
```

---

## Data Flow

### Unidirectional Flow

```
User Action (UI)
    ↓
Action Dispatcher (Zustand)
    ↓
State Update + Business Logic (Systems)
    ↓
Event Emitted (EventBus)
    ↓
Side Effects (Other Systems Listen)
    ↓
More State Updates (if needed)
    ↓
React Re-renders (automatic via Zustand)
```

### Example: Rolling Dice

```typescript
// 1. User clicks "Roll"
<button onClick={() => useGameStore.getState().actions.rollDice()}>
  Roll Dice
</button>

// 2. Action executed in store
rollDice: () => {
  const { dice } = get();

  // Call dice system
  diceSystem.rollDice(dice.map(d => d.id));

  // Update state
  set(state => ({
    dice: diceSystem.getDice(),
    game: { ...state.game, currentAttempt: state.game.currentAttempt + 1 }
  }));

  // Emit event
  eventBus.emit('dice:rolled', { diceIds: dice.map(d => d.id) });
}

// 3. Physics system settles dice (in 3D component)
useFrame(() => {
  if (diceSystem.checkSettled()) {
    const results = diceSystem.getDiceResults();
    useGameStore.getState().actions.settleDice(results);
  }
});

// 4. Settle action
settleDice: (results) => {
  // Update dice state
  set({ dice: results });

  // Calculate scores
  const scores = scoringSystem.calculateScores({
    diceResults: results,
    // ...
  });

  set({ scores });

  // Emit event
  eventBus.emit('dice:settled', { results, scores });
}

// 5. UI automatically updates (Zustand subscription)
function ScoreDisplay() {
  const scores = useGameStore(state => state.scores);
  return <div>{scores.map(renderScore)}</div>;
}
```

---

## Testing Strategy

### Unit Tests (Pure Logic)

```typescript
// src/core/systems/dice/DiceSystem.test.ts
describe('DiceSystem', () => {
  it('should create dice with correct properties', () => {
    const system = new DiceSystem();
    const dice = system.createDice({ type: 'd6', count: 2 });

    expect(dice).toHaveLength(2);
    expect(dice[0].type).toBe('d6');
    expect(dice[0].faceValue).toBeNull();
  });
});
```

### Integration Tests (Store)

```typescript
// src/state/store.test.ts
describe('Game Store', () => {
  it('should start game correctly', () => {
    const { startGame } = useGameStore.getState().actions;
    startGame();

    const phase = useGameStore.getState().game.phase;
    expect(phase).toBe('rolling');
  });
});
```

### Component Tests (React Testing Library)

```typescript
// src/presentation/components/ui/ScoreDisplay.test.tsx
describe('ScoreDisplay', () => {
  it('renders scores correctly', () => {
    const scores = [createScore('pair', { finalValue: 10, achieved: true })];

    render(<ScoreDisplay scores={scores} onScoreClick={jest.fn()} />);

    expect(screen.getByText(/pair/i)).toBeInTheDocument();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });
});
```

---

## Best Practices

### 1. Core Systems Should Be Pure

❌ **Bad**: System depends on React
```typescript
class DiceSystem {
  constructor(private ref: React.RefObject) {} // NO!
}
```

✅ **Good**: System is pure TypeScript
```typescript
class DiceSystem {
  constructor(private config: DiceConfig) {} // YES!
}
```

### 2. Use Events for Cross-System Communication

❌ **Bad**: Direct coupling
```typescript
class ScoringSystem {
  calculateScores() {
    // Direct call to item system
    itemSystem.applyEffects(); // NO!
  }
}
```

✅ **Good**: Event-based
```typescript
class ScoringSystem {
  calculateScores() {
    eventBus.emit('score:calculated', { scores }); // YES!
  }
}

// Elsewhere
eventBus.on('score:calculated', (event) => {
  itemSystem.applyEffects(event.payload);
});
```

### 3. Components Should Be Thin

❌ **Bad**: Business logic in component
```typescript
function GameHUD() {
  const calculateBonus = () => {
    // 50 lines of calculation logic // NO!
  };
}
```

✅ **Good**: Logic in system, component just displays
```typescript
function GameHUD() {
  const bonus = useGameStore(state => state.game.bonus); // YES!
  return <div>{bonus}</div>;
}
```

### 4. Use Type-Safe Models

❌ **Bad**: Loose typing
```typescript
function rollDice(dice: any[]) {} // NO!
```

✅ **Good**: Strict types
```typescript
function rollDice(dice: DiceModel[]) {} // YES!
```

---

## FAQs

### Q: Why not just use Redux?
**A**: Zustand has less boilerplate, simpler API, and better TypeScript support. It's easier to learn and use for this project size.

### Q: Do I always need to use the EventBus?
**A**: No. Use it for cross-system communication. Within a system or for UI → Store, just call functions directly.

### Q: Can I mix old and new architecture?
**A**: Yes! During migration, old code can coexist with new. Just make sure new features use the new architecture.

### Q: Where should I put 3D rendering logic?
**A**: Rendering stays in React components (`src/presentation/components/game/`). Only business logic moves to `core/`.

### Q: How do I add a new item?
1. Define effect in `src/core/systems/items/effects/`
2. Register in `ItemRegistry.ts`
3. Done! No other changes needed.

---

## Further Reading

- [Architecture Audit](./ARCHITECTURE_AUDIT.md) - Current state analysis
- [Architecture Redesign](./ARCHITECTURE_REDESIGN.md) - Detailed proposal
- [Migration Guide](./MIGRATION_GUIDE.md) - Step-by-step migration
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

**Last Updated**: 2025-10-19
**Version**: 1.0
