# Architecture Redesign Proposal
**PS1 Horror Dice Game - Modular, Scalable Architecture**

Version: 1.0
Date: 2025-10-19

---

## Goals

1. **Modularity** - Each system operates independently with clear interfaces
2. **Scalability** - Easy to add new features without refactoring existing code
3. **Testability** - Systems can be tested in isolation
4. **Predictability** - Clear, unidirectional data flow
5. **Maintainability** - Code is organized by domain, not by file type

---

## Core Principles

### 1. **Separation of Concerns**
- **Presentation Layer** - React components (rendering only)
- **Business Logic Layer** - Core game systems (no React dependencies)
- **State Management Layer** - Centralized state with clear actions
- **Data Layer** - Type-safe models and schemas

### 2. **Dependency Inversion**
- Systems depend on interfaces, not implementations
- Core logic has no knowledge of React or rendering
- UI adapts to business logic, not vice versa

### 3. **Event-Driven Communication**
- Systems communicate via events, not direct calls
- Event bus for cross-system notifications
- Reduces coupling, enables plugin architecture

### 4. **Single Source of Truth**
- All game state in one centralized store
- Derived state computed, never duplicated
- Clear ownership of each piece of state

---

## New Folder Structure

```
src/
├── core/                      # ✨ NEW: Pure business logic (no React)
│   ├── models/               # Data models and types
│   │   ├── Dice.model.ts
│   │   ├── Item.model.ts
│   │   ├── Score.model.ts
│   │   ├── GameState.model.ts
│   │   └── index.ts
│   │
│   ├── systems/              # Game systems (renamed from src/systems)
│   │   ├── dice/
│   │   │   ├── DiceSystem.ts          # Dice rolling logic
│   │   │   ├── DicePhysics.ts         # Physics calculations
│   │   │   └── DiceTransformations.ts # Transformation effects
│   │   │
│   │   ├── scoring/
│   │   │   ├── ScoringSystem.ts       # Score calculation
│   │   │   ├── ComboTracker.ts        # Combo/streak logic
│   │   │   └── ScoreRules.ts          # Yahtzee-style rules
│   │   │
│   │   ├── items/
│   │   │   ├── ItemSystem.ts          # Item management
│   │   │   ├── ItemEffects.ts         # Effect engine
│   │   │   ├── ItemRegistry.ts        # Item definitions
│   │   │   └── effects/               # Individual item effects
│   │   │       ├── CigaretteEffect.ts
│   │   │       ├── IncenseEffect.ts
│   │   │       └── BaseEffect.ts
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
│   ├── services/             # ✨ NEW: Cross-cutting services
│   │   ├── EventBus.ts      # Event system
│   │   ├── Logger.ts        # Logging service
│   │   └── Persistence.ts   # Save/load logic
│   │
│   └── utils/               # Pure utility functions
│       ├── dice.utils.ts
│       ├── math.utils.ts
│       └── random.utils.ts
│
├── state/                    # ✨ NEW: State management layer
│   ├── store.ts             # Main store setup (Zustand or Context)
│   ├── slices/              # State slices by domain
│   │   ├── gameSlice.ts    # Game phase, rounds, attempts
│   │   ├── diceSlice.ts    # Dice state
│   │   ├── scoreSlice.ts   # Scoring state
│   │   ├── itemSlice.ts    # Inventory state
│   │   └── uiSlice.ts      # UI-specific state
│   │
│   ├── actions/             # Action creators
│   │   ├── gameActions.ts
│   │   ├── diceActions.ts
│   │   └── itemActions.ts
│   │
│   └── selectors/           # Memoized selectors
│       ├── gameSelectors.ts
│       ├── diceSelectors.ts
│       └── scoreSelectors.ts
│
├── presentation/             # ✨ NEW: React presentation layer
│   ├── components/          # Renamed from src/components
│   │   ├── game/           # Game-specific 3D components
│   │   │   ├── dice/      # Dice renderers
│   │   │   ├── environment/ # Room, lights, etc.
│   │   │   └── items/     # 3D item models
│   │   │
│   │   ├── ui/            # 2D UI components
│   │   │   ├── HUD/
│   │   │   ├── menus/
│   │   │   └── overlays/
│   │   │
│   │   └── common/        # Shared components
│   │
│   ├── containers/         # ✨ NEW: Smart components (connect to state)
│   │   ├── GameContainer.tsx
│   │   ├── DiceContainer.tsx
│   │   ├── ScoreContainer.tsx
│   │   └── InventoryContainer.tsx
│   │
│   ├── hooks/             # React hooks
│   │   ├── useGameState.ts
│   │   ├── useDicePhysics.ts
│   │   ├── useScoring.ts
│   │   └── useItems.ts
│   │
│   └── views/             # ✨ NEW: Top-level views
│       ├── GameView.tsx
│       ├── MenuView.tsx
│       └── StoreView.tsx
│
├── config/                # Configuration (keep as-is)
├── constants/             # Constants (keep as-is)
├── assets/                # Static assets (keep as-is)
├── types/                 # Shared types (keep as-is)
└── App.tsx               # Thin app shell (< 100 lines)
```

---

## Data Models

### Core Models (TypeScript Interfaces)

```typescript
// src/core/models/Dice.model.ts
export interface DiceModel {
  id: string;
  type: DiceType;
  faceValue: number | null;
  position: Vector3;
  rotation: Quaternion;
  modifiers: Modifier[];
  transformations: Transformation[];
  isSettled: boolean;
}

// src/core/models/Item.model.ts
export interface ItemModel {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  rarity: Rarity;
  cost: number;
  effects: ItemEffect[];
  isActive: boolean;
  isConsumable: boolean;
  usesRemaining?: number;
}

// src/core/models/Score.model.ts
export interface ScoreModel {
  category: ScoreCategory;
  value: number;
  achieved: boolean;
  diceUsed: string[]; // Dice IDs
  multiplier: number;
  comboCount: number;
  timestamp: number;
}

// src/core/models/GameState.model.ts
export interface GameStateModel {
  phase: GamePhase;
  currentDay: number;
  currentTime: TimeOfDay;
  currentRound: number;
  currentAttempt: number;
  maxAttempts: number;
  corruption: number;
  dailyTarget: number;
  dailyBestScore: number;
}
```

---

## State Management: Zustand Store

**Why Zustand?**
- Simpler than Redux, more powerful than Context
- No Provider hell
- Easy to test
- TypeScript-first
- Middleware support (persistence, devtools)

### Store Structure

```typescript
// src/state/store.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface GameStore {
  // State slices
  game: GameStateModel;
  dice: DiceModel[];
  scores: ScoreModel[];
  inventory: ItemModel[];
  currency: number;

  // Actions
  actions: {
    // Game actions
    startGame: () => void;
    endGame: () => void;
    advanceTime: () => void;

    // Dice actions
    rollDice: () => void;
    settleDice: (results: DiceResult[]) => void;
    transformDice: (diceId: string, transformation: Transformation) => void;

    // Score actions
    calculateScores: (diceResults: DiceResult[]) => void;
    applyComboBonus: (category: ScoreCategory) => void;

    // Item actions
    addItem: (item: ItemModel) => void;
    removeItem: (itemId: string) => void;
    activateItem: (itemId: string) => void;
    applyItemEffects: () => void;

    // Currency actions
    addCurrency: (amount: number) => void;
    spendCurrency: (amount: number) => boolean;
  };
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        game: createInitialGameState(),
        dice: [],
        scores: [],
        inventory: [],
        currency: 0,

        actions: {
          // Implementation...
        }
      }),
      { name: 'ps1-horror-dice' }
    )
  )
);
```

---

## Event Bus System

**Purpose**: Decouple systems that need to react to events but shouldn't directly call each other.

```typescript
// src/core/services/EventBus.ts

type EventType =
  | 'dice:rolled'
  | 'dice:settled'
  | 'dice:transformed'
  | 'score:calculated'
  | 'score:combo'
  | 'item:activated'
  | 'item:expired'
  | 'game:phase_changed'
  | 'corruption:increased'
  | 'currency:changed';

interface Event<T = any> {
  type: EventType;
  payload: T;
  timestamp: number;
}

class EventBus {
  private listeners: Map<EventType, Set<(event: Event) => void>>;

  on(type: EventType, handler: (event: Event) => void) {
    // Subscribe to event
  }

  off(type: EventType, handler: (event: Event) => void) {
    // Unsubscribe
  }

  emit(type: EventType, payload: any) {
    // Emit event to all subscribers
  }
}

export const eventBus = new EventBus();
```

**Usage Example:**

```typescript
// Item system listens for dice settled
eventBus.on('dice:settled', (event) => {
  const { diceResults } = event.payload;
  applyPassiveItemEffects(diceResults);
});

// Scoring system emits combo events
eventBus.emit('score:combo', {
  category: 'two_pair',
  comboCount: 3,
  multiplier: 1.45
});
```

---

## System Interfaces

### 1. Dice System

```typescript
// src/core/systems/dice/DiceSystem.ts

export interface IDiceSystem {
  // Dice management
  createDice(type: DiceType, count: number): DiceModel[];
  removeDice(diceId: string): void;

  // Physics
  rollDice(diceIds: string[], force: Vector3): void;
  checkSettled(diceIds: string[]): boolean;
  getDiceResults(): DiceResult[];

  // Transformations
  applyTransformation(diceId: string, transformation: Transformation): void;
  getActiveTransformations(diceId: string): Transformation[];
}

export class DiceSystem implements IDiceSystem {
  private dice: Map<string, DiceModel>;
  private physics: DicePhysics;
  private transformations: DiceTransformations;

  // Implementation...
}
```

### 2. Scoring System

```typescript
// src/core/systems/scoring/ScoringSystem.ts

export interface IScoringSystem {
  calculateScores(diceResults: DiceResult[]): ScoreModel[];
  applyMultipliers(scores: ScoreModel[], multipliers: Multiplier[]): ScoreModel[];
  trackCombo(category: ScoreCategory, previousScores: ScoreModel[]): number;
  getHighestScore(scores: ScoreModel[]): ScoreModel;
}

export class ScoringSystem implements IScoringSystem {
  private rules: ScoreRules;
  private comboTracker: ComboTracker;

  // Implementation...
}
```

### 3. Item System

```typescript
// src/core/systems/items/ItemSystem.ts

export interface IItemSystem {
  registerItem(item: ItemModel): void;
  activateItem(itemId: string): void;
  deactivateItem(itemId: string): void;
  applyEffects(context: EffectContext): EffectResult;
  getActiveItems(): ItemModel[];
}

export class ItemSystem implements IItemSystem {
  private items: Map<string, ItemModel>;
  private effectEngine: ItemEffects;

  // Implementation...
}
```

---

## Data Flow

### New Unidirectional Flow:

```
User Action (UI)
    ↓
Action Dispatcher (Zustand)
    ↓
State Update + Side Effects
    ↓
Event Emitted (EventBus)
    ↓
Systems React to Events
    ↓
More State Updates (if needed)
    ↓
React Components Re-render (automatically via Zustand)
```

### Example: Rolling Dice

```typescript
// 1. User clicks "Roll" button
<button onClick={() => useGameStore.getState().actions.rollDice()}>
  Roll Dice
</button>

// 2. Action executed in store
rollDice: () => {
  const { dice, game } = get();

  // Call dice system
  const results = diceSystem.rollDice(dice.map(d => d.id));

  // Update state
  set(state => ({
    dice: results,
    game: { ...game, currentAttempt: game.currentAttempt + 1 }
  }));

  // Emit event
  eventBus.emit('dice:rolled', { results });
}

// 3. Dice settle (detected by physics system)
settleDice: (results: DiceResult[]) => {
  // Update dice state
  set({ dice: results });

  // Calculate scores
  const scores = scoringSystem.calculateScores(results);
  set({ scores });

  // Apply item effects
  const modifiedScores = itemSystem.applyEffects({
    type: 'score_modifier',
    scores
  });
  set({ scores: modifiedScores });

  // Emit event
  eventBus.emit('dice:settled', { results, scores: modifiedScores });
}

// 4. UI automatically updates (Zustand subscription)
function ScoreDisplay() {
  const scores = useGameStore(state => state.scores);
  return <div>{scores.map(renderScore)}</div>;
}
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)
- ✅ Create new folder structure
- ✅ Define core models
- ✅ Set up Zustand store
- ✅ Implement EventBus
- ✅ Write migration guide

### Phase 2: Core Systems (Week 2-3)
- Extract DiceSystem from DiceManager.tsx
- Extract ScoringSystem (already mostly done)
- Create ItemSystem with effect engine
- Implement CurrencySystem
- Create ProgressionSystem

### Phase 3: State Migration (Week 4)
- Move GameStateContext to Zustand
- Migrate App.tsx local state to store
- Remove prop drilling
- Connect components to store

### Phase 4: UI Refactor (Week 5)
- Create container components
- Split presentation from logic
- Implement hooks for each system
- Clean up App.tsx

### Phase 5: Testing & Polish (Week 6)
- Write unit tests for systems
- Integration tests for store
- Performance optimization
- Documentation

---

## Benefits

### For Developers:
- **Easier to understand** - Clear system boundaries
- **Easier to test** - Pure functions, no React deps in core logic
- **Easier to extend** - Plugin architecture via events
- **Better TypeScript** - Strict types, fewer `any`

### For Features:
- **Add new items** - Just implement `ItemEffect` interface
- **Add new dice** - Register in DiceSystem, no other changes
- **Add new scores** - Extend ScoreRules
- **Add new modifiers** - Register in ModifierEngine

### For Performance:
- **Better memoization** - Zustand selectors
- **Reduced re-renders** - Fine-grained subscriptions
- **Lazy loading** - Systems loaded on demand

---

## Next Steps

1. Review this proposal with team
2. Get approval on architecture direction
3. Create detailed migration tasks
4. Start Phase 1 implementation
5. Iterate based on learnings

---

## Questions to Answer

1. **Zustand vs Context API?** - Recommendation: Zustand for better DX and performance
2. **Strict migration timeline?** - Recommendation: Gradual, feature-by-feature
3. **Breaking changes?** - Recommendation: Keep old code working during migration
4. **Testing strategy?** - Recommendation: Write tests for new code, refactor old code to match

---

