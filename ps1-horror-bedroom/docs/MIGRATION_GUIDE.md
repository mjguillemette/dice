## Migration Guide
**Refactoring to Modular Architecture**

This guide provides step-by-step instructions for migrating the codebase to the new modular architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Phases](#migration-phases)
4. [Phase 1: Foundation](#phase-1-foundation)
5. [Phase 2: Extract Core Systems](#phase-2-extract-core-systems)
6. [Phase 3: State Management](#phase-3-state-management)
7. [Phase 4: UI Refactor](#phase-4-ui-refactor)
8. [Phase 5: Testing & Cleanup](#phase-5-testing--cleanup)
9. [Rollback Strategy](#rollback-strategy)
10. [Common Pitfalls](#common-pitfalls)

---

## Overview

### Migration Strategy: **Gradual**

We will NOT do a "big bang" rewrite. Instead:
- ✅ New code uses new architecture
- ✅ Old code continues to work
- ✅ Migrate piece-by-piece
- ✅ Test after each piece
- ✅ Can stop at any point

### Timeline

- **Phase 1**: ✅ Complete (Foundation - models, event bus)
- **Phase 2**: 1-2 weeks (Extract systems)
- **Phase 3**: 1 week (State migration)
- **Phase 4**: 1 week (UI refactor)
- **Phase 5**: 1 week (Testing & cleanup)

**Total**: ~4-5 weeks for complete migration

---

## Prerequisites

### ✅ Already Complete

1. Core models defined (`src/core/models/`)
2. EventBus implemented (`src/core/services/EventBus.ts`)
3. Architecture documentation written
4. Audit completed

### 📦 To Install

```bash
# If choosing Zustand for state management
npm install zustand

# For dev tools
npm install --save-dev @types/node
```

---

## Migration Phases

### Phase 1: Foundation ✅ COMPLETE

**Status**: ✅ Done

**What was completed**:
- Created `src/core/models/` with unified data models
- Created `src/core/services/EventBus.ts`
- Documented current architecture
- Designed new architecture

---

### Phase 2: Extract Core Systems

**Goal**: Move business logic out of React components into pure TypeScript modules

#### Step 2.1: Create DiceSystem

**Where**: `src/core/systems/dice/DiceSystem.ts`

**Extract from**:
- `src/components/models/DiceManager.tsx` (lines handling dice logic)
- `src/components/models/Dice.tsx` (face detection logic)

**What to move**:
```typescript
// Create DiceSystem.ts
export class DiceSystem {
  // Move dice spawning logic from DiceManager
  createDice(config: DiceSpawnConfig): DiceModel[] { }

  // Move settling detection from DiceManager
  checkSettled(dice: DiceModel[]): boolean { }

  // Move face value detection from Dice.tsx
  detectFaceValue(rotation: Quaternion, diceType: DiceType): number { }

  // Move edge landing detection from Dice.tsx
  detectEdgeLanding(rotation: Quaternion): boolean { }
}
```

**How to migrate**:
1. Create new `DiceSystem.ts`
2. Copy logic from old files
3. Remove React dependencies (no hooks, no JSX)
4. Update to use new `DiceModel` types
5. Add unit tests
6. Keep old code working by calling new system from old components

**Testing**:
```typescript
// src/core/systems/dice/DiceSystem.test.ts
import { DiceSystem } from './DiceSystem';

describe('DiceSystem', () => {
  it('should create dice with correct type', () => {
    const system = new DiceSystem();
    const dice = system.createDice({ type: 'd6', count: 2 });
    expect(dice).toHaveLength(2);
    expect(dice[0].type).toBe('d6');
  });
});
```

---

#### Step 2.2: Extract ScoringSystem

**Where**: `src/core/systems/scoring/ScoringSystem.ts`

**Extract from**:
- `src/systems/scoringSystem.ts` (already mostly pure!)

**What to do**:
1. Move `src/systems/scoringSystem.ts` → `src/core/systems/scoring/ScoringSystem.ts`
2. Update to use new `ScoreModel` types
3. Remove dependency on `gameStateSystem.ts` (circular dependency)
4. Extract combo tracking to `ComboTracker.ts`
5. Extract score rules to `ScoreRules.ts`

**Example refactor**:
```typescript
// Before (in scoringSystem.ts)
import type { TimeOfDay } from "./gameStateSystem";

// After (in ScoringSystem.ts)
import type { TimeOfDay } from "../../models/Score.model";
```

---

#### Step 2.3: Create ItemSystem with Effect Engine

**Where**: `src/core/systems/items/ItemSystem.ts`

**Extract from**:
- `src/systems/itemSystem.ts`
- Item effect logic scattered in `App.tsx`, `DiceManager.tsx`, `scoringSystem.ts`

**Create new structure**:
```
src/core/systems/items/
├── ItemSystem.ts           # Main item management
├── ItemEffects.ts          # Effect application engine
├── ItemRegistry.ts         # Item definitions
└── effects/
    ├── BaseEffect.ts       # Abstract effect class
    ├── CigaretteEffect.ts  # Cigarette implementation
    ├── IncenseEffect.ts    # Incense implementation
    └── HourglassEffect.ts  # Hourglass implementation
```

**How to create extensible effects**:
```typescript
// BaseEffect.ts
export abstract class BaseEffect {
  abstract apply(context: EffectContext): EffectResult;
  abstract canApply(context: EffectContext): boolean;
}

// CigaretteEffect.ts
export class CigaretteEffect extends BaseEffect {
  apply(context: EffectContext): EffectResult {
    const bonus = Math.floor(context.gameState.corruption * 10);
    return {
      success: true,
      modifiedValue: context.currentScore + bonus,
      message: `Cigarette bonus: +${bonus}`
    };
  }
}
```

**Register effects**:
```typescript
// ItemRegistry.ts
export const ITEM_REGISTRY: Record<ItemType, ItemModel> = {
  cigarette: {
    id: 'cigarette',
    type: 'cigarette',
    name: 'Cigarette',
    effects: [
      {
        id: 'cigarette_corruption_bonus',
        type: 'score_multiplier',
        trigger: 'on_score',
        // ...
      }
    ],
    // ...
  }
};
```

---

#### Step 2.4: Extract Other Systems

Repeat similar process for:
- **CurrencySystem** (from `useWallet` hook)
- **ProgressionSystem** (from `GameStateContext`)
- **CorruptionSystem** (from `corruptionSystem.ts`)

---

### Phase 3: State Management

**Goal**: Replace fragmented state with unified Zustand store

#### Step 3.1: Install Zustand

```bash
npm install zustand
```

#### Step 3.2: Create Store Structure

```
src/state/
├── store.ts              # Main store
├── slices/
│   ├── gameSlice.ts     # Game phase, rounds, etc.
│   ├── diceSlice.ts     # Dice state
│   ├── scoreSlice.ts    # Scoring state
│   ├── itemSlice.ts     # Inventory
│   └── uiSlice.ts       # UI state
├── actions/
│   ├── gameActions.ts
│   ├── diceActions.ts
│   └── itemActions.ts
└── selectors/
    ├── gameSelectors.ts
    └── scoreSelectors.ts
```

#### Step 3.3: Create Game Slice

```typescript
// src/state/slices/gameSlice.ts
import type { StateCreator } from 'zustand';
import type { GameStateModel } from '../../core/models';

export interface GameSlice {
  game: GameStateModel;
  actions: {
    startGame: () => void;
    endGame: () => void;
    advanceRound: () => void;
  };
}

export const createGameSlice: StateCreator<GameSlice> = (set, get) => ({
  game: createGameState(),

  actions: {
    startGame: () => {
      set(state => ({
        game: {
          ...state.game,
          phase: 'rolling',
          gameStartedAt: Date.now()
        }
      }));
      eventBus.emit('game:started', {});
    },

    endGame: () => {
      set(state => ({
        game: { ...state.game, phase: 'game_over' }
      }));
      eventBus.emit('game:ended', {});
    },

    advanceRound: () => {
      set(state => ({
        game: {
          ...state.game,
          currentRound: state.game.currentRound + 1,
          currentAttempt: 0
        }
      }));
    }
  }
});
```

#### Step 3.4: Combine Slices into Store

```typescript
// src/state/store.ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createGameSlice, type GameSlice } from './slices/gameSlice';
import { createDiceSlice, type DiceSlice } from './slices/diceSlice';
// ... other slices

type GameStore = GameSlice & DiceSlice & ScoreSlice & ItemSlice;

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createGameSlice(...args),
        ...createDiceSlice(...args),
        // ... other slices
      }),
      { name: 'ps1-horror-dice-game' }
    )
  )
);

// Convenience selectors
export const selectGame = (state: GameStore) => state.game;
export const selectDice = (state: GameStore) => state.dice;
export const selectScores = (state: GameStore) => state.scores;
```

#### Step 3.5: Migrate App.tsx State

**Before**:
```typescript
// App.tsx - lots of local state
const [diceCount, setDiceCount] = useState(2);
const [coinCount, setCoinCount] = useState(1);
const [inventory, setInventory] = useState(INITIAL_INVENTORY);
```

**After**:
```typescript
// App.tsx - just selectors
const game = useGameStore(selectGame);
const dice = useGameStore(selectDice);
const inventory = useGameStore(state => state.inventory);
const { startGame, rollDice } = useGameStore(state => state.actions);
```

**Migration steps**:
1. Move one piece of state at a time
2. Test after each move
3. Remove old state once Zustand version works

---

### Phase 4: UI Refactor

**Goal**: Separate presentation from logic

#### Step 4.1: Create Container Components

**Pattern**: Smart/Dumb component split

```
src/presentation/
├── components/
│   └── ui/
│       └── ScoreDisplay.tsx    # Dumb (presentation only)
└── containers/
    └── ScoreContainer.tsx      # Smart (connects to store)
```

**Example**:
```typescript
// components/ui/ScoreDisplay.tsx (DUMB)
interface ScoreDisplayProps {
  scores: ScoreModel[];
  onScoreClick: (category: ScoreCategory) => void;
}

export const ScoreDisplay = ({ scores, onScoreClick }: ScoreDisplayProps) => {
  return (
    <div>
      {scores.map(score => (
        <div key={score.category} onClick={() => onScoreClick(score.category)}>
          {score.category}: {score.finalValue}
        </div>
      ))}
    </div>
  );
};

// containers/ScoreContainer.tsx (SMART)
export const ScoreContainer = () => {
  const scores = useGameStore(state => state.scores);
  const { selectScore } = useGameStore(state => state.actions);

  return <ScoreDisplay scores={scores} onScoreClick={selectScore} />;
};
```

#### Step 4.2: Slim Down App.tsx

**Goal**: App.tsx should be < 100 lines

**Before**:
```typescript
// App.tsx (500+ lines with tons of logic)
function AppContent() {
  // 50+ lines of state
  // 100+ lines of handlers
  // 300+ lines of JSX
}
```

**After**:
```typescript
// App.tsx (< 100 lines, just composition)
function AppContent() {
  const phase = useGameStore(state => state.game.phase);

  return (
    <>
      {phase === 'menu' && <MenuView />}
      {phase === 'rolling' && <GameView />}
      {phase === 'store' && <StoreView />}
    </>
  );
}
```

---

### Phase 5: Testing & Cleanup

#### Step 5.1: Write Unit Tests

```typescript
// src/core/systems/dice/DiceSystem.test.ts
import { DiceSystem } from './DiceSystem';

describe('DiceSystem', () => {
  let system: DiceSystem;

  beforeEach(() => {
    system = new DiceSystem();
  });

  test('creates dice with correct properties', () => {
    const dice = system.createDice({ type: 'd6', count: 1 });
    expect(dice[0].type).toBe('d6');
    expect(dice[0].faceValue).toBeNull();
  });

  test('detects face value correctly for d6', () => {
    // Test face detection logic
  });
});
```

#### Step 5.2: Integration Tests

```typescript
// src/state/store.test.ts
import { useGameStore } from './store';

describe('Game Store', () => {
  beforeEach(() => {
    useGameStore.setState(getInitialState());
  });

  test('starting game changes phase', () => {
    const { startGame } = useGameStore.getState().actions;
    startGame();
    expect(useGameStore.getState().game.phase).toBe('rolling');
  });
});
```

#### Step 5.3: Remove Old Code

Once new systems are working and tested:
1. Delete old implementations
2. Remove dead imports
3. Clean up unused files
4. Update documentation

---

## Rollback Strategy

If something goes wrong:

### Git Strategy

```bash
# Create migration branch
git checkout -b refactor/modular-architecture

# Make commits frequently
git commit -m "Step 2.1: Create DiceSystem"
git commit -m "Step 2.2: Extract ScoringSystem"

# If need to rollback
git revert <commit-hash>
# or
git reset --hard <good-commit>
```

### Feature Flags

```typescript
// config/features.ts
export const FEATURES = {
  USE_NEW_DICE_SYSTEM: false,  // Toggle new vs old
  USE_ZUSTAND_STORE: false,
  USE_EVENT_BUS: true
};

// In code
if (FEATURES.USE_NEW_DICE_SYSTEM) {
  diceSystem.rollDice();
} else {
  // Old logic
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Trying to Migrate Everything at Once

**Problem**: Attempting "big bang" rewrite breaks everything

**Solution**: Migrate incrementally, keep old code working

### ❌ Pitfall 2: Not Testing After Each Step

**Problem**: Break something early, don't discover until much later

**Solution**: Test after EVERY step, commit frequently

### ❌ Pitfall 3: Forgetting to Remove Old Code

**Problem**: Codebase grows, now have two implementations of everything

**Solution**: Delete old code once new version is proven

### ❌ Pitfall 4: Breaking Saved Games

**Problem**: Changing state structure breaks existing saves

**Solution**: Implement migration logic in load function

```typescript
// Handle old save format
if (saveData.version === '0.1') {
  return migrateSaveV01ToV10(saveData);
}
```

### ❌ Pitfall 5: Over-Engineering

**Problem**: Adding abstractions that aren't needed

**Solution**: Follow YAGNI (You Aren't Gonna Need It), only add what's currently needed

---

## Checklist

### Phase 1: Foundation ✅
- [x] Create core models
- [x] Implement EventBus
- [x] Document architecture
- [x] Audit current code

### Phase 2: Extract Systems
- [ ] Create DiceSystem
- [ ] Extract ScoringSystem
- [ ] Create ItemSystem with effects
- [ ] Create CurrencySystem
- [ ] Create ProgressionSystem

### Phase 3: State Management
- [ ] Install Zustand
- [ ] Create store structure
- [ ] Migrate App.tsx state
- [ ] Remove GameStateContext

### Phase 4: UI Refactor
- [ ] Create container components
- [ ] Split smart/dumb components
- [ ] Slim down App.tsx
- [ ] Remove prop drilling

### Phase 5: Testing & Cleanup
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Remove old code
- [ ] Update documentation

---

## Next Steps

1. **Review this guide** with team
2. **Start Phase 2.1**: Create DiceSystem
3. **Test thoroughly**
4. **Commit and continue**

Good luck! 🚀
