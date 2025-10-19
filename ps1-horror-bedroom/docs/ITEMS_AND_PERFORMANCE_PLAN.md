# Items & Performance Implementation Plan
**Complete Implementation Guide**

Date: 2025-10-19

---

## Part 1: Missing Items & Models

### 🎯 Objective
Ensure all items defined in itemSystem.ts have 3D models and can be properly thrown.

### 📊 Current State
- **Total Items Defined**: 27
- **Items with Models**: 8 (30%)
- **Missing Models**: 19 (70%)

### ✅ Phase 1: Create Missing Core Dice Models

#### 1.1 D8 (Octahedron)
**File**: `src/components/dice/D8.tsx`
```typescript
// Octahedron geometry
// 8 triangular faces
// Numbers 1-8
```

#### 1.2 D10 (Pentagonal Trapezohedron)
**File**: `src/components/dice/D10.tsx`
```typescript
// 10-sided die (pentagonal trapezohedron)
// Numbers 0-9 or 1-10
```

#### 1.3 D12 (Dodecahedron)
**File**: `src/components/dice/D12.tsx`
```typescript
// 12 pentagonal faces
// Numbers 1-12
```

#### 1.4 D20 (Icosahedron)
**File**: `src/components/dice/D20.tsx`
```typescript
// 20 triangular faces
// Numbers 1-20
```

**Implementation Approach**:
1. Use Three.js built-in geometries or custom BufferGeometry
2. Apply PS1-style low-poly aesthetic
3. Add face numbering via texture or geometry
4. Implement proper physics collision shapes
5. Add to dice type registry

---

### ✅ Phase 2: Dice Variants (Reuse Base Geometry)

#### 2.1 Golden Pyramid (D3 variant)
- Reuse D3 geometry
- Apply gold metallic material
- Add particle effects (sparkles)
- Special effect: Generates coins on roll

#### 2.2 Caltrop (D4 variant)
- Reuse D4 geometry
- Apply sharp/spiky material
- Different physics properties (more chaotic bounces)

#### 2.3 Loaded Coin (Coin variant)
- Reuse Coin geometry
- Add weighted visual (darker on one side)
- Bias physics to favor heads

#### 2.4 Casino Reject, Weighted Die, Cursed Die (D6 variants)
- Reuse D6 geometry
- Different materials:
  - Casino Reject: Faded, worn texture
  - Weighted Die: Asymmetric coloring
  - Cursed Die: Dark, ominous material with corruption effects

---

### ✅ Phase 3: Card Variants

**Extend** `src/components/models/Card.tsx`:

```typescript
interface CardProps {
  cardType: 'tower' | 'sun' | 'moon';
  // ... existing props
}

// Different materials/effects per card type
const cardConfigs = {
  tower: { color: '#8B4513', glow: 'red' },
  sun: { color: '#FFD700', glow: 'yellow' },
  moon: { color: '#C0C0C0', glow: 'blue' }
};
```

---

### ✅ Phase 4: Other Missing Items

#### 4.1 Nickel (Coin variant)
- Reuse Coin geometry
- Larger scale (1.2x)
- Silver material
- Different value display (5¢/10¢)

#### 4.2 Lucky Charm
**File**: `src/components/models/LuckyCharm.tsx`
- Small clover or horseshoe model
- Glow effect
- Not throwable (passive item)

---

### ✅ Phase 5: Inventory Integration

**Ensure all dice types are properly added**:

1. **Update PlayerInventory interface** (`src/systems/itemSystem.ts`):
```typescript
export interface PlayerInventory {
  dice: {
    d6: number;
    d4: number;
    d3: number;
    d8: number;    // ADD
    d10: number;   // ADD
    d12: number;   // ADD
    d20: number;   // ADD
    coins: number;
    nickels: number;  // ADD
    thumbtacks: number;
    // Variants
    golden_pyramids: number;  // ADD
    caltrops: number;          // ADD
    loaded_coins: number;      // ADD
    // ... etc
  };
  // ... rest
}
```

2. **Update applyItemToInventory function**:
```typescript
case "d8":
  return {
    ...inventory,
    dice: { ...inventory.dice, d8: inventory.dice.d8 + 1 }
  };
```

3. **Update DiceManager to spawn all types**:
```typescript
// In DiceManager.tsx
const diceToSpawn = [
  ...Array(d6Count).fill('d6'),
  ...Array(d4Count).fill('d4'),
  ...Array(d3Count).fill('d3'),
  ...Array(d8Count).fill('d8'),  // ADD
  ...Array(d10Count).fill('d10'), // ADD
  // ... etc
];
```

---

## Part 2: Performance Optimization

### 🎯 Objectives
- 60+ FPS during normal gameplay
- No lag when loading new assets
- Stable physics with multiple dice
- Real-time performance monitoring

---

### ✅ Phase 1: Performance Audit

#### 1.1 Audit Current Bottlenecks

**Tools to use**:
- React DevTools Profiler
- Chrome Performance tab
- Three.js Stats
- Rapier Physics profiler

**Areas to check**:
1. **Rendering**:
   - Component re-render frequency
   - Three.js draw calls
   - Shader complexity
   - Texture sizes

2. **Physics**:
   - Active colliders count
   - Physics update frequency
   - Collision detection complexity

3. **React Updates**:
   - Unnecessary re-renders
   - Large prop objects
   - Context updates triggering cascades

**Create audit report** with:
- FPS measurements (current vs target)
- Draw call counts
- Memory usage
- Identified bottlenecks

---

### ✅ Phase 2: Lazy Loading & Code Splitting

#### 2.1 Lazy Load 3D Models

```typescript
// Before
import Hourglass from './models/Hourglass';
import BoardGame from './models/BoardGame';

// After
const Hourglass = lazy(() => import('./models/Hourglass'));
const BoardGame = lazy(() => import('./models/BoardGame'));

// In Scene.tsx
<Suspense fallback={null}>
  {showHourglass && <Hourglass />}
</Suspense>
```

#### 2.2 Dynamic Imports for Dice Types

```typescript
// src/components/dice/index.ts
export const loadDiceComponent = async (type: DiceType) => {
  switch (type) {
    case 'd6':
      return (await import('./D6')).default;
    case 'd4':
      return (await import('./D4')).default;
    // ... etc
  }
};
```

#### 2.3 Lazy Load Game Systems

```typescript
// Only load when needed
const ItemChoiceMenu = lazy(() => import('./ui/ItemChoiceMenu'));
const Store = lazy(() => import('./ui/Store'));
```

---

### ✅ Phase 3: Reduce React Re-renders

#### 3.1 Memoize Expensive Components

```typescript
// Before
export function GameHUD(props) {
  // ... renders on every parent update
}

// After
export const GameHUD = memo(function GameHUD(props) {
  // ... only renders when props change
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.scores === nextProps.scores &&
         prevProps.corruption === nextProps.corruption;
});
```

#### 3.2 Use useMemo for Expensive Calculations

```typescript
// Before
function ScoreDisplay() {
  const totalScore = scores.reduce((sum, s) => sum + s.value, 0);  // Runs every render!
}

// After
function ScoreDisplay() {
  const totalScore = useMemo(
    () => scores.reduce((sum, s) => sum + s.value, 0),
    [scores]  // Only recalculate when scores change
  );
}
```

#### 3.3 Optimize Context Updates

```typescript
// Split large contexts into smaller ones
// Before: One big GameStateContext
// After: Separate contexts
<GamePhaseContext>
  <ScoringContext>
    <InventoryContext>
      <App />
    </InventoryContext>
  </ScoringContext>
</GamePhaseContext>
```

---

### ✅ Phase 4: Optimize 3D Models

#### 4.1 Reduce Poly Count

**Guidelines**:
- Dice: < 200 triangles each
- Small objects (cigarette, coin): < 50 triangles
- Room objects: < 500 triangles
- Total scene: < 5000 triangles

**Tools**:
- Blender decimation modifier
- Manual retopology for complex shapes

#### 4.2 Optimize Textures

```typescript
// Reduce texture sizes
// Before: 2048x2048 textures
// After: 512x512 or 256x256 for PS1 aesthetic

// Use texture atlases
// Combine multiple small textures into one atlas
```

#### 4.3 Implement LOD (Level of Detail)

```typescript
import { Lod } from '@react-three/drei';

<Lod distances={[0, 5, 10]}>
  <mesh>
    <detailedGeometry /> {/* Close */}
  </mesh>
  <mesh>
    <mediumGeometry />  {/* Mid */}
  </mesh>
  <mesh>
    <simpleGeometry />  {/* Far */}
  </mesh>
</Lod>
```

#### 4.4 Reduce Draw Calls

```typescript
// Instance repeated objects
import { Instances, Instance } from '@react-three/drei';

<Instances>
  <boxGeometry />
  <meshBasicMaterial />
  {dice.map(die => (
    <Instance key={die.id} position={die.position} />
  ))}
</Instances>
```

---

### ✅ Phase 5: Optimize Physics

#### 5.1 Batch Physics Updates

```typescript
// In DiceManager
useFrame(() => {
  // Batch all physics reads in one frame
  const updates = dice.map(die => ({
    id: die.id,
    position: die.rigidBody.translation(),
    rotation: die.rigidBody.rotation()
  }));

  // Single state update
  setDiceStates(updates);
});
```

#### 5.2 Limit Active Colliders

```typescript
// Disable colliders for settled dice
useEffect(() => {
  if (isSettled) {
    rigidBodyRef.current?.setBodyType('fixed');  // Stop physics
  }
}, [isSettled]);
```

#### 5.3 Simplify Collision Shapes

```typescript
// Use simple shapes
// Before: ConvexHull (expensive)
// After: Box or Sphere collider (cheap)

<RigidBody colliders="ball">  {/* Simple sphere */}
  <mesh>
    <icosahedronGeometry />  {/* Visual can be complex */}
  </mesh>
</RigidBody>
```

#### 5.4 Reduce Physics Update Rate

```typescript
// In physics config
<Physics
  gravity={[0, -9.81, 0]}
  timeStep={1 / 60}  // Default
  // Reduce for better performance if needed
  // timeStep={1 / 30}  // Half rate
>
```

---

### ✅ Phase 6: Performance Monitor

**Add FPS/Performance Overlay to DevPanel**:

#### 6.1 Create PerformanceMonitor Component

```typescript
// src/components/ui/PerformanceMonitor.tsx
import { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16);
  const [drawCalls, setDrawCalls] = useState(0);
  const [triangles, setTriangles] = useState(0);

  let lastTime = performance.now();
  let frames = 0;

  useFrame(({ gl }) => {
    frames++;
    const now = performance.now();

    if (now >= lastTime + 1000) {
      setFps(frames);
      setFrameTime((now - lastTime) / frames);
      setDrawCalls(gl.info.render.calls);
      setTriangles(gl.info.render.triangles);

      frames = 0;
      lastTime = now;
    }
  });

  return (
    <div className="performance-monitor">
      <div>FPS: {fps}</div>
      <div>Frame Time: {frameTime.toFixed(2)}ms</div>
      <div>Draw Calls: {drawCalls}</div>
      <div>Triangles: {triangles}</div>
    </div>
  );
}
```

#### 6.2 Add to DevPanel

```typescript
// In DevPanel.tsx
import { PerformanceMonitor } from './ui/PerformanceMonitor';

<div className="dev-tab">
  <h2>Performance</h2>
  <PerformanceMonitor />
</div>
```

---

## Implementation Timeline

### Week 1: Missing Items
- Day 1-2: Create D8, D10 models
- Day 3: Create D12, D20 models
- Day 4: Implement dice variants (materials)
- Day 5: Card variants, inventory integration

### Week 2: Performance - Rendering
- Day 1: Performance audit
- Day 2: Implement lazy loading
- Day 3: Memoization and re-render optimization
- Day 4: 3D model optimization (poly count, textures)
- Day 5: LOD and draw call reduction

### Week 3: Performance - Physics & Monitoring
- Day 1-2: Physics optimization
- Day 3: Performance monitor implementation
- Day 4: Testing and benchmarking
- Day 5: Final optimizations and polish

---

## Acceptance Criteria

### Items & Models
- [ ] All 27 items have 3D models or use variants
- [ ] All dice types can be added to inventory
- [ ] All dice types can be spawned and thrown
- [ ] Variants have distinct visual appearance
- [ ] Cards have different effects/appearance

### Performance
- [ ] Game runs at 60+ FPS during normal gameplay
- [ ] No lag when spawning new dice
- [ ] No lag when loading new scenes/menus
- [ ] Physics remains stable with 10+ dice
- [ ] DevPanel shows real-time FPS/metrics
- [ ] Memory usage remains stable (no leaks)
- [ ] Draw calls < 100 per frame
- [ ] Triangles < 10,000 per frame

---

## Testing Checklist

### Items Testing
- [ ] Test each dice type can be purchased
- [ ] Test each dice type appears in inventory
- [ ] Test each dice type can be thrown
- [ ] Test dice variants have correct behavior
- [ ] Test cards display correctly
- [ ] Test special items (hourglass, cigarette, incense)

### Performance Testing
- [ ] Measure FPS with 2 dice (baseline)
- [ ] Measure FPS with 10 dice
- [ ] Measure FPS with 20 dice
- [ ] Test loading time for each scene
- [ ] Test memory usage over 30 minute session
- [ ] Profile with React DevTools
- [ ] Profile with Chrome Performance
- [ ] Test on low-end hardware

---

## Notes

- Prioritize core dice (d8, d10) over variants
- Use instancing for repeated geometry
- Consider using texture atlases for all dice numbers
- Keep PS1 aesthetic (low poly, pixelated textures)
- Test performance on target hardware frequently

