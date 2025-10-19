# Tooltip & Special Dice - Unfinished Work

**Date**: 2025-10-19
**Status**: INCOMPLETE - Session limit reached

---

## Problem Summary

1. **Tooltip enhancements not working**: Caltrop shows as "D4" instead of "Caltrop" with description
2. **Special dice not spawning**: Special dice (caltrop, golden_pyramid, etc.) tracked in inventory but don't spawn
3. **Missing placeholder models**: Many item choice items show without 3D models

---

## Work Completed ✅

### 1. Tooltip UI Enhancement (Frontend Only)
**Files Modified**:
- `src/components/ui/DiceInfo.tsx` - Added special dice info dictionary, descriptions, currency display
- `src/components/ui/DiceInfo.css` - Added styling for descriptions and currency
- `src/components/Scene.tsx` - Added currencyEarned to hover interface
- `src/components/models/Dice.tsx` - Added currencyEarned prop and userData
- `src/components/models/DiceManager.tsx` - Partially updated (INCOMPLETE)

**What Works**:
- Tooltip component has all the display logic for special dice names/descriptions
- Currency tracking in DiceManager calculates and stores amounts
- CSS styling is complete

**What Doesn't Work**:
- Special dice types never reach the tooltip because they're not spawned correctly
- DiceManager types partially updated but spawning chain incomplete

---

## Critical Missing Work 🚨

### PHASE 1: Complete DiceManager Integration

**File**: `src/components/models/DiceManager.tsx`

#### Step 1.1: Update updateDicePool interface
Currently only handles basic dice. Need to add:

```typescript
updateDicePool: (newCounts: {
  d6: number;
  coins: number;
  nickels: number;
  d3: number;
  d4: number;
  d8: number;
  d10: number;
  d12: number;
  d20: number;
  thumbtacks: number;
  // ADD THESE:
  golden_pyramid: number;
  caltrop: number;
  casino_reject: number;
  weighted_die: number;
  loaded_coin: number;
  cursed_die: number;
  split_die: number;
  mirror_die: number;
  rigged_die: number;
}) => void;
```

#### Step 1.2: Update updateDicePool implementation
Around line 527-570, need to add tracking for special dice:

```typescript
const totalByType = {
  d6: prev.filter((d) => d.type === "d6").length,
  coin: prev.filter((d) => d.type === "coin").length,
  // ... existing types ...
  // ADD:
  golden_pyramid: prev.filter((d) => d.type === "golden_pyramid").length,
  caltrop: prev.filter((d) => d.type === "caltrop").length,
  casino_reject: prev.filter((d) => d.type === "casino_reject").length,
  weighted_die: prev.filter((d) => d.type === "weighted_die").length,
  loaded_coin: prev.filter((d) => d.type === "loaded_coin").length,
  cursed_die: prev.filter((d) => d.type === "cursed_die").length,
  split_die: prev.filter((d) => d.type === "split_die").length,
  mirror_die: prev.filter((d) => d.type === "mirror_die").length,
  rigged_die: prev.filter((d) => d.type === "rigged_die").length,
};

// And add to types array:
const types: Array<{...}> = [
  // ... existing types ...
  { type: "golden_pyramid", current: totalByType.golden_pyramid, target: newCounts.golden_pyramid },
  { type: "caltrop", current: totalByType.caltrop, target: newCounts.caltrop },
  { type: "casino_reject", current: totalByType.casino_reject, target: newCounts.casino_reject },
  { type: "weighted_die", current: totalByType.weighted_die, target: newCounts.weighted_die },
  { type: "loaded_coin", current: totalByType.loaded_coin, target: newCounts.loaded_coin },
  { type: "cursed_die", current: totalByType.cursed_die, target: newCounts.cursed_die },
  { type: "split_die", current: totalByType.split_die, target: newCounts.split_die },
  { type: "mirror_die", current: totalByType.mirror_die, target: newCounts.mirror_die },
  { type: "rigged_die", current: totalByType.rigged_die, target: newCounts.rigged_die },
];
```

#### Step 1.3: Update useEffect sync
Around line 666-691, add all special dice to the sync:

```typescript
useEffect(() => {
  updateDicePool({
    d6: diceCount,
    coins: coinCount,
    nickels: nickelCount,
    d3: d3Count,
    d4: d4Count,
    d8: d8Count,
    d10: d10Count,
    d12: d12Count,
    d20: d20Count,
    thumbtacks: thumbTackCount,
    // ADD:
    golden_pyramid: goldenPyramidCount,
    caltrop: caltropCount,
    casino_reject: casinoRejectCount,
    weighted_die: weightedDieCount,
    loaded_coin: loadedCoinCount,
    cursed_die: cursedDieCount,
    split_die: splitDieCount,
    mirror_die: mirrorDieCount,
    rigged_die: riggedDieCount,
  });
}, [
  diceCount,
  coinCount,
  nickelCount,
  d3Count,
  d4Count,
  d8Count,
  d10Count,
  d12Count,
  d20Count,
  thumbTackCount,
  // ADD:
  goldenPyramidCount,
  caltropCount,
  casinoRejectCount,
  weightedDieCount,
  loadedCoinCount,
  cursedDieCount,
  splitDieCount,
  mirrorDieCount,
  riggedDieCount,
  updateDicePool
]);
```

---

### PHASE 2: Scene.tsx Integration

**File**: `src/components/Scene.tsx`

#### Step 2.1: Add special dice props to SceneProps interface
Around line 53-62:

```typescript
interface SceneProps {
  diceCount: number;
  coinCount: number;
  nickelCount: number;
  d3Count: number;
  d4Count: number;
  d8Count: number;
  d10Count: number;
  d12Count: number;
  d20Count: number;
  thumbTackCount: number;
  // ADD:
  goldenPyramidCount: number;
  caltropCount: number;
  casinoRejectCount: number;
  weightedDieCount: number;
  loadedCoinCount: number;
  cursedDieCount: number;
  splitDieCount: number;
  mirrorDieCount: number;
  riggedDieCount: number;
  // ... rest of props
}
```

#### Step 2.2: Add to destructuring
Around line 111-125:

```typescript
export function Scene({
  onCameraNameChange,
  onHellFactorChange,
  onAutoCorruptionChange,
  onCursorLockChange,
  diceCount,
  coinCount,
  nickelCount,
  d3Count,
  d4Count,
  d8Count,
  d10Count,
  d12Count,
  d20Count,
  thumbTackCount,
  // ADD:
  goldenPyramidCount,
  caltropCount,
  casinoRejectCount,
  weightedDieCount,
  loadedCoinCount,
  cursedDieCount,
  splitDieCount,
  mirrorDieCount,
  riggedDieCount,
  // ... rest
}: SceneProps) {
```

#### Step 2.3: Pass to DiceManager
Around line 777-788, add all special dice props:

```typescript
<DiceManager
  ref={diceManagerRef}
  diceCount={diceCount}
  coinCount={coinCount}
  nickelCount={nickelCount}
  d3Count={d3Count}
  d4Count={d4Count}
  d8Count={d8Count}
  d10Count={d10Count}
  d12Count={d12Count}
  d20Count={d20Count}
  thumbTackCount={thumbTackCount}
  goldenPyramidCount={goldenPyramidCount}
  caltropCount={caltropCount}
  casinoRejectCount={casinoRejectCount}
  weightedDieCount={weightedDieCount}
  loadedCoinCount={loadedCoinCount}
  cursedDieCount={cursedDieCount}
  splitDieCount={splitDieCount}
  mirrorDieCount={mirrorDieCount}
  riggedDieCount={riggedDieCount}
  // ... rest of props
/>
```

---

### PHASE 3: App.tsx Integration

**File**: `src/App.tsx`

#### Step 3.1: Add state variables
Around line 42-51, add:

```typescript
const [diceCount, setDiceCount] = useState(2);
const [coinCount, setCoinCount] = useState(1);
const [nickelCount, setNickelCount] = useState(0);
const [d3Count, setD3Count] = useState(0);
const [d4Count, setD4Count] = useState(0);
const [d8Count, setD8Count] = useState(0);
const [d10Count, setD10Count] = useState(0);
const [d12Count, setD12Count] = useState(0);
const [d20Count, setD20Count] = useState(0);
const [thumbTackCount, setThumbTackCount] = useState(2);
// ADD:
const [goldenPyramidCount, setGoldenPyramidCount] = useState(0);
const [caltropCount, setCaltropCount] = useState(0);
const [casinoRejectCount, setCasinoRejectCount] = useState(0);
const [weightedDieCount, setWeightedDieCount] = useState(0);
const [loadedCoinCount, setLoadedCoinCount] = useState(0);
const [cursedDieCount, setCursedDieCount] = useState(0);
const [splitDieCount, setSplitDieCount] = useState(0);
const [mirrorDieCount, setMirrorDieCount] = useState(0);
const [riggedDieCount, setRiggedDieCount] = useState(0);
```

#### Step 3.2: Update inventory sync useEffect
Around line 217-230:

```typescript
useEffect(() => {
  setDiceCount(inventory.dice.d6);
  setCoinCount(inventory.dice.coins);
  setNickelCount(inventory.dice.nickels);
  setThumbTackCount(inventory.dice.thumbtacks);
  setD3Count(inventory.dice.d3);
  setD4Count(inventory.dice.d4);
  setD8Count(inventory.dice.d8);
  setD10Count(inventory.dice.d10);
  setD12Count(inventory.dice.d12);
  setD20Count(inventory.dice.d20);
  // ADD:
  setGoldenPyramidCount(inventory.dice.golden_pyramid);
  setCaltropCount(inventory.dice.caltrop);
  setCasinoRejectCount(inventory.dice.casino_reject);
  setWeightedDieCount(inventory.dice.weighted_die);
  setLoadedCoinCount(inventory.dice.loaded_coin);
  setCursedDieCount(inventory.dice.cursed_die);
  setSplitDieCount(inventory.dice.split_die);
  setMirrorDieCount(inventory.dice.mirror_die);
  setRiggedDieCount(inventory.dice.rigged_die);
  setTowerCardEnabled(inventory.cards.tower);
  setSunCardEnabled(inventory.cards.sun);
}, [inventory]);
```

#### Step 3.3: Pass to Scene component
Around line 476-485:

```typescript
<Scene
  onCameraNameChange={setCameraName}
  onHellFactorChange={setHellFactor}
  onAutoCorruptionChange={_setAutoCorruption}
  onCursorLockChange={setIsCursorLocked}
  diceCount={diceCount}
  coinCount={coinCount}
  nickelCount={nickelCount}
  d3Count={d3Count}
  d4Count={d4Count}
  d8Count={d8Count}
  d10Count={d10Count}
  d12Count={d12Count}
  d20Count={d20Count}
  thumbTackCount={thumbTackCount}
  goldenPyramidCount={goldenPyramidCount}
  caltropCount={caltropCount}
  casinoRejectCount={casinoRejectCount}
  weightedDieCount={weightedDieCount}
  loadedCoinCount={loadedCoinCount}
  cursedDieCount={cursedDieCount}
  splitDieCount={splitDieCount}
  mirrorDieCount={mirrorDieCount}
  riggedDieCount={riggedDieCount}
  // ... rest of props
/>
```

---

### PHASE 4: Create Placeholder 3D Models

**Problem**: Special dice currently use base dice geometry (caltrop uses D4, golden_pyramid uses D3, etc.)

**Solution Options**:

#### Option A: Quick Fix - Reuse existing models with visual variants
For each special die, use the base geometry but with different materials/colors:

1. **Create variant components** in `src/components/dice/`:
   - `Caltrop.tsx` - Reuse D4 geometry, dark metallic material
   - `GoldenPyramid.tsx` - Reuse D3 geometry, gold material with sparkle
   - `LoadedCoin.tsx` - Reuse Coin geometry, different texture
   - `CasinoReject.tsx` - Reuse D6 geometry, casino-themed texture
   - `WeightedDie.tsx` - Reuse D6 geometry, heavy/dark material
   - `CursedDie.tsx` - Reuse D6 geometry, dark red/black material
   - `SplitDie.tsx` - Reuse D6 geometry, cracked texture
   - `MirrorDie.tsx` - Reuse D6 geometry, reflective material
   - `RiggedDie.tsx` - Reuse D6 geometry, special texture

2. **Update DiceManager** to use correct components based on type

#### Option B: Proper Models (Future Work)
Create unique 3D models for each special die in Blender

---

### PHASE 5: Item Choice Placeholder Models

**Problem**: Items in ItemChoice view show without 3D models

**File to Check**: `src/components/models/ItemChoice.tsx`

**Items Missing Models**:
- Most consumables (cigarette, incense)
- Cards (tower, sun, moon)
- Decorations (hourglass, lucky_charm)
- Special dice (all of them)

**Quick Fix**:
Create simple placeholder geometries:
- Cigarette: Cylinder
- Incense: Cone
- Cards: Thin boxes with textures
- Hourglass: Two cones connected
- Dice: Use existing dice components

---

## Testing Checklist

After completing the above work, test:

1. **Select Caltrop from item choice**
   - [ ] Caltrop spawns (not plain D4)
   - [ ] Tooltip shows "Caltrop" name
   - [ ] Tooltip shows description "A sharp D4 with unpredictable bounces"
   - [ ] Die rolls correctly (1-4 values)

2. **Select Golden Pyramid**
   - [ ] Spawns with gold appearance
   - [ ] Tooltip shows "Golden Pyramid" name
   - [ ] Tooltip shows coin generation description
   - [ ] Generates coins on roll

3. **Select Loaded Coin**
   - [ ] Spawns as coin variant
   - [ ] Tooltip shows "Loaded Coin" name
   - [ ] Currency earned displays in tooltip
   - [ ] Favors heads (rolls 2 more often)

4. **Item Choice View**
   - [ ] All items show 3D models (or placeholders)
   - [ ] No missing/broken model errors

---

## Current Build Status

Last checked: 2025-10-19

- TypeScript compilation: **PASSED** (but incomplete implementation)
- Dev server: **RUNNING**
- **Known Issues**:
  - Special dice spawn as base types (caltrop → d4)
  - Tooltips show base names instead of special names
  - Many items missing 3D models in ItemChoice

---

## Priority Order

**CRITICAL (Do First)**:
1. Complete Phase 1 (DiceManager)
2. Complete Phase 2 (Scene)
3. Complete Phase 3 (App)

**HIGH**:
4. Complete Phase 4 Option A (Quick placeholder models)
5. Test all special dice

**MEDIUM**:
6. Complete Phase 5 (ItemChoice models)

**LOW (Future)**:
7. Phase 4 Option B (Proper unique models)

---

## Code Snippets for Reference

### How to create a variant dice component

```typescript
// src/components/dice/Caltrop.tsx
import * as THREE from "three";
import DiceBase from "./DiceBase";
import type { DiceProps, DiceHandle } from "./Dice.types";
import { forwardRef, useMemo } from "react";
import { ConeCollider } from "@react-three/rapier";

const Caltrop = forwardRef<DiceHandle, DiceProps>((props, ref) => {
  const baseDiceSize = 0.025 * (props.sizeMultiplier ?? 1);

  const { geometry, materials } = useMemo(() => {
    // Reuse D4 geometry
    const geo = new THREE.TetrahedronGeometry(baseDiceSize, 0);

    // Dark metallic material for "sharp" look
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.2,
      metalness: 0.8
    });

    return { geometry: geo, materials: [mat, mat, mat, mat] };
  }, [baseDiceSize]);

  return (
    <DiceBase
      ref={ref}
      {...props}
      maxValue={4}
      geometry={<primitive object={geometry} />}
      collider={<ConeCollider args={[baseDiceSize * 0.8, baseDiceSize * 1.2]} />}
      materials={materials}
    />
  );
});

Caltrop.displayName = "DiceCaltrop";
export default Caltrop;
```

Then export from `src/components/dice/index.ts` and use in Dice.tsx or DiceManager.tsx based on diceType.

---

**Next Session**: Start with Phase 1, Step 1.1
