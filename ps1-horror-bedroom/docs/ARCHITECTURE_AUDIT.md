# Architecture Audit Report
**PS1 Horror Dice Game - Current State Analysis**

Generated: 2025-10-19

---

## Executive Summary

This codebase has grown organically with multiple interconnected systems. While functional, it exhibits several architectural concerns that will impact long-term maintainability and feature development:

- **High coupling** between App.tsx and multiple systems
- **Inconsistent state management** (mix of Context, props, local state)
- **Blurred boundaries** between UI and business logic
- **Data flow complexity** with prop drilling and circular dependencies
- **Limited modularity** making testing and feature additions difficult

---

## Current Folder Structure

```
src/
├── assets/              # Static assets (textures)
├── components/          # React components (MIXED: UI + logic)
│   ├── camera/         # Camera system
│   ├── dice/           # Dice rendering components
│   ├── house/          # 3D environment models
│   ├── lighting/       # Lighting setup
│   ├── models/         # Game object 3D models (Dice, Items, Room objects)
│   ├── physics/        # Physics wrappers
│   └── ui/             # 2D UI overlays
├── config/             # Configuration files
├── constants/          # Game constants
├── contexts/           # React Context (GameState only)
├── hooks/              # Custom React hooks
├── shaders/            # WebGL shaders
├── systems/            # Core game logic (BEST organized)
│   └── modifiers/      # Dice transformation system
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

---

## System Analysis

### 1. **Dice System**
**Files:**
- `src/components/dice/` - Dice rendering components (D3, D4, D6, Coin, Thumbtack)
- `src/components/models/Dice.tsx` - Main dice physics component
- `src/components/models/DiceManager.tsx` - Dice collection manager
- `src/systems/diceTransformationSystem.ts` - Transformation logic
- `src/types/dice.types.ts` - Type definitions

**Dependencies:**
- ❌ Heavy coupling with `DiceManager.tsx` (500+ lines, multiple responsibilities)
- ❌ Physics logic embedded in React components
- ❌ Scoring logic mixed into `DiceManager`
- ✅ Good: Transformation system is separate

**Issues:**
- Dice rendering, physics, and game logic are intertwined
- `DiceManager.tsx` handles: dice spawning, physics, scoring, currency, transformations
- No clear data model - uses React state and refs

---

### 2. **Scoring System**
**Files:**
- `src/systems/scoringSystem.ts` - Core scoring logic (446 lines)

**Dependencies:**
- ✅ Relatively independent
- ⚠️ Imports `TimeOfDay` from `gameStateSystem` (circular potential)
- ❌ Called directly from `gameStateSystem` and `DiceManager`

**Issues:**
- Good separation, but tightly coupled to game state reducer
- No event-based communication
- Combo tracking logic embedded, not extensible

---

### 3. **Item System**
**Files:**
- `src/systems/itemSystem.ts` - Item definitions and logic
- `src/components/models/` - 3D item models (Cigarette, Incense, etc.)
- `src/components/ui/ItemChoiceMenu.tsx` - UI for selecting items

**Dependencies:**
- ❌ Item effects are scattered across multiple files:
  - Cigarette bonus in `App.tsx`
  - Incense combo in `scoringSystem.ts` and `GameStateContext`
  - Transformations in `diceTransformationSystem.ts`
- ❌ Item state managed in `App.tsx` local state AND game context

**Issues:**
- No unified item effect system
- Effects hardcoded in different locations
- Difficult to add new items without modifying multiple files

---

### 4. **Game State System**
**Files:**
- `src/systems/gameStateSystem.ts` - Reducer and state types (350+ lines)
- `src/contexts/GameStateContext.tsx` - React Context wrapper

**Dependencies:**
- ✅ Centralized via Context
- ❌ But `App.tsx` also has parallel local state:
  - `diceCount`, `coinCount`, `nickelCount`, etc.
  - `inventory` managed separately
  - `balances` via `useWallet` hook

**Issues:**
- **Split brain problem**: Game state in Context, but other critical state in App.tsx
- Props drilled through many levels
- No clear single source of truth

---

### 5. **Transformation/Synergy System**
**Files:**
- `src/systems/diceTransformationSystem.ts` - Transformation logic
- `src/systems/modifiers/ModifierEngine.ts` - Modifier application engine
- `src/config/modifiers.config.ts` - Modifier definitions

**Dependencies:**
- ✅ Well-separated into its own system
- ⚠️ Uses registry pattern (good)
- ❌ Applied in `DiceManager.tsx` (should be in system layer)

**Issues:**
- Good foundation but not fully leveraged
- Modifier application mixed with rendering logic

---

### 6. **UI Layer**
**Files:**
- `src/components/ui/` - UI components
- `src/App.tsx` - Root component (500+ lines)

**Dependencies:**
- ❌ **App.tsx is God Object**:
  - Manages state for dice counts, inventory, wallet, camera, dev panel
  - Handles events from Scene, DiceManager, ItemChoice
  - Coordinates between 5+ different systems
  - Heavy prop drilling to child components

**Issues:**
- UI components tightly coupled to App.tsx state shape
- Business logic in UI components (e.g., `DiceManager` calculates scores)
- No separation of concerns

---

## State Management Analysis

### Current State Distribution:

1. **GameStateContext** (via reducer)
   - Scoring data
   - Time of day progression
   - Attempts, rounds, days
   - Daily targets
   - Corruption level
   - Game phase

2. **App.tsx Local State**
   - Dice counts (d6, d4, d3, coin, nickel, thumbtack)
   - Inventory items
   - Camera mode
   - Dev panel visibility
   - Dice settled status
   - Hovered items

3. **Custom Hooks**
   - `useWallet` - Currency management (separate from game state)
   - `usePersistence` - LocalStorage integration
   - `useCorruptionMaterial` - Visual corruption effects

4. **Component Local State**
   - `DiceManager` - Dice instances, physics refs
   - `Scene` - 3D scene state
   - `GameHUD` - Animation state

### Issues:
- **No single source of truth**
- **Unclear ownership** of state
- **Synchronization problems** between different state sources
- **Difficult to debug** - state scattered across app

---

## Coupling & Dependency Issues

### High-Coupling Hotspots:

1. **App.tsx ↔ Everything**
   - Imports from 10+ different modules
   - Manages state for 5+ systems
   - Event handler explosion (15+ callbacks)

2. **DiceManager.tsx ↔ Multiple Systems**
   - Handles dice physics AND scoring AND currency AND transformations
   - Direct imports of multiple systems
   - 500+ lines doing too much

3. **Circular Dependencies:**
   - `gameStateSystem.ts` imports from `scoringSystem.ts`
   - `scoringSystem.ts` imports from `gameStateSystem.ts` (TimeOfDay type)
   - Solution: Shared types file needed

4. **Tight UI-Logic Coupling:**
   - `GameHUD` has scoring display logic
   - `ItemChoiceMenu` has item purchase logic
   - `Scene` manages game phase transitions

---

## Data Flow Analysis

### Current Flow (Problematic):

```
User Input
    ↓
App.tsx (Event Handler)
    ↓
Multiple State Updates (Context + Local)
    ↓
Props Drilled to Children
    ↓
Child Components Re-render
    ↓
Side Effects in Components
    ↓
Callbacks Back to App.tsx
    ↓
More State Updates
```

### Problems:
- **Unidirectional flow violated** - callbacks create circular data flow
- **No clear event bus** - everything goes through App.tsx
- **State updates trigger cascade** - difficult to predict what changes
- **Side effects scattered** - no centralized effect handling

---

## Recommendations Summary

### Critical (Must Fix):
1. **Split App.tsx** - Extract state management to proper layer
2. **Unified State Management** - Single source of truth (enhanced Context or Zustand)
3. **Decouple DiceManager** - Separate rendering from business logic
4. **Event Bus** - Centralized event system for cross-system communication

### High Priority:
5. **Data Models** - Create clear TypeScript models for all entities
6. **System Boundaries** - Clear interfaces between systems
7. **Item Effect System** - Unified, extensible item effect engine

### Medium Priority:
8. **Testing Layer** - Systems should be testable in isolation
9. **Type Safety** - Stricter types, less `any`
10. **Documentation** - Each system needs clear API docs

---

## Proposed Architecture (Next Steps)

See `ARCHITECTURE_REDESIGN.md` for the proposed new architecture that addresses these issues.

---

## Metrics

- **Total Files**: ~75 TypeScript files
- **Systems**: 7 major systems identified
- **App.tsx Lines**: ~500 lines (should be <200)
- **DiceManager.tsx Lines**: ~800 lines (should be <200)
- **State Sources**: 4+ different state management patterns
- **Coupling Score**: 🔴 High (7/10)
- **Modularity Score**: 🟡 Medium (4/10)
- **Testability**: 🔴 Low (2/10)
