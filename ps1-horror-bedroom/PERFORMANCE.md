## Performance Optimization Guide

This guide provides specific, actionable optimizations for the dice game.

## 1. React Component Optimization

### Current Issues
- Props drilling causes unnecessary re-renders
- GameHUD re-renders on every frame when dice move
- DiceManager creates new instances on every render

### Solutions

#### A. Memoize GameHUD Component

```tsx
// Before
export function GameHUD({ scores, timeOfDay, currentAttempts, ... }: GameHUDProps) {
  return <div className="game-hud">...</div>;
}

// After - Only re-render when props actually change
export const GameHUD = React.memo(function GameHUD({
  scores,
  timeOfDay,
  currentAttempts,
  ...props
}: GameHUDProps) {
  return <div className="game-hud">...</div>;
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific values changed
  return (
    prevProps.timeOfDay === nextProps.timeOfDay &&
    prevProps.currentAttempts === nextProps.currentAttempts &&
    prevProps.currentScore === nextProps.currentScore &&
    prevProps.isSettled === nextProps.isSettled &&
    prevProps.balance === nextProps.balance &&
    prevProps.hoveredDice?.id === nextProps.hoveredDice?.id &&
    arraysEqual(prevProps.scores, nextProps.scores)
  );
});
```

#### B. Memoize Expensive Calculations

```tsx
// In DiceManager.tsx
const transformationEffects = useMemo(() =>
  calculateTransformationEffects(dice.transformations),
  [dice.transformations]  // Only recalculate when transformations change
);

const scoreWithMultiplier = useMemo(() =>
  dice.value !== undefined && dice.settled
    ? Math.round(dice.value * transformationEffects.scoreMultiplier)
    : undefined,
  [dice.value, dice.settled, transformationEffects.scoreMultiplier]
);
```

#### C. Use useCallback for Event Handlers

```tsx
// In App.tsx
const handleDiceSettled = useCallback((diceValues?: number[]) => {
  setDiceSettled(true);
  onDiceSettled(diceValues);
}, [onDiceSettled]);  // Dependency array - only recreate if onDiceSettled changes
```

### Implementation in GameHUD.tsx

```tsx
import { memo, useMemo } from 'react';

// Helper for score comparison
function scoresEqual(a: ScoreCategoryData[], b: ScoreCategoryData[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].achieved !== b[i].achieved || a[i].score !== b[i].score) {
      return false;
    }
  }
  return true;
}

// Helper for dice data comparison
function diceDataEqual(
  a: DiceData | null,
  b: DiceData | null
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.id === b.id && a.score === b.score;
}

export const GameHUD = memo(function GameHUD({
  scores,
  timeOfDay,
  currentAttempts,
  maxAttempts,
  currentScore,
  isSettled,
  balance,
  hoveredDice
}: GameHUDProps) {
  // Memoize the score list rendering
  const scoreItems = useMemo(() =>
    scores.map((score) => (
      <div
        key={score.category}
        className={`score-item ${score.achieved ? "achieved" : "locked"}`}
      >
        {/* ... score item content */}
      </div>
    )),
    [scores]
  );

  // Memoize the attempt dots
  const attemptDots = useMemo(() =>
    Array.from({ length: maxAttempts }).map((_, i) => (
      <div
        key={i}
        className={`attempt-dot ${i < currentAttempts ? 'used' : ''}`}
      />
    )),
    [currentAttempts, maxAttempts]
  );

  return (
    <div className="game-hud">
      {/* ... use memoized elements */}
      {scoreItems}
      {attemptDots}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.timeOfDay === nextProps.timeOfDay &&
    prevProps.currentAttempts === nextProps.currentAttempts &&
    prevProps.maxAttempts === nextProps.maxAttempts &&
    prevProps.currentScore === nextProps.currentScore &&
    prevProps.isSettled === nextProps.isSettled &&
    prevProps.balance === nextProps.balance &&
    scoresEqual(prevProps.scores, nextProps.scores) &&
    diceDataEqual(prevProps.hoveredDice, nextProps.hoveredDice)
  );
});
```

## 2. Three.js & React Three Fiber Optimization

### A. InstancedMesh for Multiple Dice

```tsx
// Instead of creating individual meshes for each die
// Use InstancedMesh when dice share the same geometry/material

import { useRef, useMemo } from 'react';
import { InstancedMesh } from 'three';

function DicePool({ count }: { count: number }) {
  const meshRef = useRef<InstancedMesh>(null);

  // Update instance matrices instead of creating new meshes
  useFrame(() => {
    if (!meshRef.current) return;

    dice.forEach((die, index) => {
      const matrix = new THREE.Matrix4();
      matrix.setPosition(die.position.x, die.position.y, die.position.z);
      meshRef.current!.setMatrixAt(index, matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial color="white" />
    </instancedMesh>
  );
}
```

### B. Reduce Draw Calls

```tsx
// Group static geometry into fewer meshes
// Use BufferGeometry instead of Geometry

const geometry = useMemo(() => {
  const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  // Optimize geometry
  geo.computeBoundingSphere();
  return geo;
}, []);
```

### C. Frustum Culling

```tsx
// Let Three.js automatically cull objects outside the camera view
// Ensure meshes have proper bounding spheres

mesh.geometry.computeBoundingSphere();
mesh.frustumCulled = true;  // Default, but be explicit
```

## 3. Physics Optimization (Rapier)

### A. Collision Groups

```tsx
// Use collision groups to prevent unnecessary collision checks

// Ground group
const GROUND_GROUP = 1;
const GROUND_MASK = 0xFFFF;

// Dice group
const DICE_GROUP = 2;
const DICE_MASK = GROUND_GROUP | DICE_GROUP;  // Collide with ground and other dice

// Card group
const CARD_GROUP = 4;
const CARD_MASK = DICE_GROUP;  // Only collide with dice

<RigidBody
  collisionGroups={DICE_GROUP}
  solverGroups={DICE_MASK}
>
  {/* Die mesh */}
</RigidBody>
```

### B. Sleep States

```tsx
// Let physics engine sleep settled dice

<RigidBody
  canSleep={true}
  sleepThreshold={0.1}  // Lower = more aggressive sleeping
>
  {/* Die mesh */}
</RigidBody>
```

### C. Simplified Collision Shapes

```tsx
// For visual meshes with complex geometry, use simplified collision shapes

// Visual mesh (detailed)
<mesh geometry={complexDiceGeometry} />

// Collision shape (simple box)
<CuboidCollider args={[0.075, 0.075, 0.075]} />
```

## 4. State Management Optimization

### A. Split Context to Prevent Cascading Re-renders

```tsx
// Instead of one large context
<GameStateContext>
  <UIContext>
    <DiceContext>
      <App />
    </DiceContext>
  </UIContext>
</GameStateContext>

// This way, changing UI state doesn't re-render dice physics
```

### B. Use Zustand or Jotai for Fine-grained Reactivity

```tsx
import create from 'zustand';

// Only components that use specific slices re-render
const useGameStore = create((set) => ({
  score: 0,
  attempts: 0,
  updateScore: (score) => set({ score }),
  incrementAttempts: () => set((state) => ({ attempts: state.attempts + 1 })),
}));

// Component only re-renders when score changes, not attempts
function ScoreDisplay() {
  const score = useGameStore((state) => state.score);
  return <div>{score}</div>;
}
```

## 5. Measurement & Profiling

### A. React DevTools Profiler

```bash
# In development, use React DevTools
# 1. Record a session while throwing dice
# 2. Look for components that render unnecessarily
# 3. Add React.memo to those components
```

### B. Chrome Performance Tab

```
1. Open Chrome DevTools
2. Performance tab
3. Record while playing
4. Look for:
   - Long tasks (>50ms)
   - Lots of garbage collection
   - Layout thrashing
```

### C. Stats.js for FPS Monitoring

```tsx
import Stats from 'three/examples/jsm/libs/stats.module';

useEffect(() => {
  const stats = Stats();
  document.body.appendChild(stats.dom);

  function animate() {
    stats.begin();
    // Your render loop
    stats.end();
    requestAnimationFrame(animate);
  }
  animate();

  return () => document.body.removeChild(stats.dom);
}, []);
```

## 6. Quick Wins

### Immediate Optimizations (< 1 hour)

1. **Add React.memo to GameHUD**
   - File: `src/components/ui/GameHUD.tsx`
   - Wrap export with `React.memo`
   - Add custom comparison function

2. **Memoize score calculations**
   - File: `src/components/models/DiceManager.tsx`
   - Wrap `calculateTransformationEffects` in `useMemo`

3. **Use useCallback for event handlers in App.tsx**
   - All `handle*` functions should use `useCallback`

4. **Enable physics sleeping**
   - File: `src/components/models/Dice.tsx`
   - Add `canSleep={true}` to RigidBody

### Medium Optimizations (1-4 hours)

1. **Implement object pooling for dice**
   - Create DicePool class that pre-allocates dice
   - Reuse dice instances instead of creating new ones

2. **Split game context**
   - Separate UI state from game logic state
   - Prevents unnecessary re-renders

3. **Batch physics updates**
   - Update multiple dice in a single frame
   - Use `useFrame` hook efficiently

### Long-term Optimizations (> 1 day)

1. **InstancedMesh for standard dice**
   - Only when you have many dice of the same type
   - Significant performance boost for 20+ dice

2. **Web Workers for score calculation**
   - Offload heavy calculations to worker thread
   - Keep main thread responsive

3. **LOD (Level of Detail)**
   - Use simpler geometry for distant dice
   - Switch to detailed geometry when close

## 7. Performance Targets

- **60 FPS** with 10 dice
- **30 FPS** with 50 dice
- **< 16ms** frame time during normal gameplay
- **< 100ms** for score calculation
- **< 5 React re-renders** per dice throw

## 8. Common Pitfalls

❌ Creating new functions in render
```tsx
// BAD
<button onClick={() => handleClick(id)}>
```

✅ Use useCallback
```tsx
// GOOD
const handleClickWithId = useCallback(() => handleClick(id), [id]);
<button onClick={handleClickWithId}>
```

❌ Large objects in dependency arrays
```tsx
// BAD - will re-run every render
useEffect(() => {}, [largeObject]);
```

✅ Extract specific values
```tsx
// GOOD
useEffect(() => {}, [largeObject.specificValue]);
```

❌ Inline object creation
```tsx
// BAD - creates new object every render
<Component style={{ color: 'red' }} />
```

✅ Extract to constant
```tsx
// GOOD
const style = { color: 'red' };
<Component style={style} />
```
