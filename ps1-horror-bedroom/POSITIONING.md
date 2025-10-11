# Object Positioning System

## Overview

This document explains how to position and move 3D objects in the scene efficiently.

## Current System

### Centralized Positioning with Group

Each model component now uses a `<group position={...}>` wrapper to contain all its child meshes. This means **you only need to change one position value** to move the entire object.

### Bureau Example

```tsx
// Bureau.tsx - lines 28-29
const BUREAU_POSITION: [number, number, number] = [3, 0.8, -4.1];

return (
  <group position={BUREAU_POSITION}>
    {/* All child meshes use relative positions (0,0,0) or offsets */}
    <mesh position={[0, 0, 0]}>...</mesh>
    <mesh position={[0, DRAWER_OFFSET_Y, DRAWER_OFFSET_Z]}>...</mesh>
  </group>
);
```

**To move the entire bureau**: Just change the `BUREAU_POSITION` values.

### Dependent Objects (Ashtray)

The ashtray sits on top of the bureau, so it references the bureau's position:

```tsx
// Ashtray.tsx - lines 67-70
const BUREAU_POSITION_X = 3;
const BUREAU_POSITION_Y = 0.8;
const BUREAU_POSITION_Z = -4.1; // Keep this in sync with Bureau.tsx!
const BUREAU_HEIGHT = 1.2;

// Ashtray calculates its position relative to bureau
const posY = BUREAU_POSITION_Y + BUREAU_HEIGHT / 2 + 0.05;
```

**Important**: When you change `BUREAU_POSITION` in Bureau.tsx, remember to update the Z value in Ashtray.tsx too!

## Shared Constants (Future Improvement)

I've created `src/constants/modelPositions.ts` that exports shared position constants:

```tsx
export const BUREAU = {
  position: [3, 0.8, -3] as [number, number, number],
  dimensions: {
    width: 1.8,
    height: 1.2,
    depth: 0.8,
  },
  get topSurfaceY() {
    return this.position[1] + this.dimensions.height / 2;
  },
};
```

### To use shared constants:

1. **Update Bureau.tsx** to import from modelPositions:
```tsx
import { BUREAU } from '../../constants/modelPositions';

const BUREAU_POSITION = BUREAU.position;
const BUREAU_HEIGHT = BUREAU.dimensions.height;
```

2. **Update Ashtray.tsx** to import the same:
```tsx
import { BUREAU } from '../../constants/modelPositions';

const posX = BUREAU.position[0];
const posY = BUREAU.topSurfaceY + 0.05;
const posZ = BUREAU.position[2];
```

3. **Update modelPositions.ts** when you want to move the bureau - both components will update automatically!

## Best Practices

### For Single Objects
- Use `<group position={[x, y, z]}>` wrapper
- All child meshes use relative positions
- Change one value to move the entire object

### For Dependent Objects
- Either manually sync positions (current approach)
- Or import from shared constants (recommended for future)

### Adding New Objects

When adding a new object to the scene:

1. **Standalone object** (bed, tv stand, etc.):
   ```tsx
   const OBJECT_POSITION: [number, number, number] = [x, y, z];

   return (
     <group position={OBJECT_POSITION}>
       {/* All meshes with relative positions */}
     </group>
   );
   ```

2. **Object on another object** (picture on wall, lamp on table):
   - Reference the parent object's position
   - Calculate relative offset
   - Add helpful comments about dependencies

## Quick Reference

Current object positions (as of latest changes):

```
Bureau:     [3, 0.8, -4.1]
Ashtray:    [3, 1.45, -4.1] (on top of bureau)
Bed:        [-2, 0.5, -2]
TV Stand:   [0, 0.4, -4.5]
Window:     [3, 2.5, -4.9]
```

## Example: Moving the Bureau

**✅ IMPLEMENTED - Using shared constants:**
1. Edit `BUREAU.position` in `src/constants/modelPositions.ts` line 10
2. Both Bureau and Ashtray update automatically!
3. HMR updates immediately!

```typescript
// In modelPositions.ts
export const BUREAU = {
  position: [3, 0.8, -4.1] as [number, number, number],  // Change this!
  dimensions: {
    width: 1.8,
    height: 1.2,
    depth: 0.8,
  },
  drawer: {
    width: 1.6,
    height: 0.45,
    depth: 0.08,
  },
};
```

Both `Bureau.tsx` and `Ashtray.tsx` now import from this shared constant, so changing the position in one place automatically updates both objects!
