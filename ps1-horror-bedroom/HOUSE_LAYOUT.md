# Split Level House Layout

## Overview

The house is now a traditional split-level design with 3 distinct floor levels connected by staircases. The existing bedroom remains the focal point on the upper level.

## Architecture

### Upper Level (Y: 0)
**Bedroom + Hallway**
- **Bedroom**: 10x10 space centered at (0, 0, 0) - contains all existing furniture (bed, bureau, TV stand, etc.)
- **Hallway**: 3x4 space at (0, 0, 6) - connects bedroom to stairs leading down to entry level
- Height: Floor at Y=0, ceiling at Y=5

### Entry Level (Y: -1.4)
**Main living area - half floor down from bedroom**
- **Living Room**: 8x10 space at (-6, -1.4, 0) - empty, ready for furniture
- **Dining Area**: 6x6 space at (6, -1.4, -3) - empty, ready for furniture
- **Kitchen**: 6x6 space at (6, -1.4, 4) - empty, ready for furniture
- **Entryway**: 4x4 space at (0, -1.4, 8) - connects to outside door
- Height: Floor at Y=-1.4, ceiling at Y=3.6

### Lower Level (Y: -2.8)
**Basement area - another half floor down**
- **Family Room**: 10x12 space at (-5, -2.8, 0) - empty, ready for furniture
- **Utility Room**: 6x6 space at (5, -2.8, 0) - empty, ready for appliances
- **Storage**: 6x4 space at (5, -2.8, -5) - empty storage area
- Height: Floor at Y=-2.8, ceiling at Y=2.2

### Staircases
- **Upper to Entry**: Connects bedroom hallway (0, 0, 8) to entry level (0, -1.4, 11)
  - 7 steps with railings
- **Entry to Lower**: Connects living room area (-10, -1.4, -5) to basement (-10, -2.8, -8)
  - 7 steps with railings

## Coordinate System

```
X-axis: -14 (far left) to +10 (far right)
Y-axis: -2.8 (basement) to +5 (bedroom ceiling)
Z-axis: -10 (front) to +13 (back)
```

## File Structure

All house-related code is organized in modular components:

### Constants (`src/constants/modelPositions.ts`)
- `UPPER_LEVEL` - Bedroom and hallway dimensions/positions
- `ENTRY_LEVEL` - Living, dining, kitchen, entryway dimensions/positions
- `LOWER_LEVEL` - Family room, utility, storage dimensions/positions
- `STAIRS` - Staircase positions and dimensions
- `HOUSE_BOUNDS` - Overall playable area bounds
- `WALL_THICKNESS` - Standard wall thickness (0.15m)

### Components (`src/components/house/`)
- **Wall.tsx** - Reusable wall component with corruption material
- **Floor.tsx** - Reusable floor/ceiling component with corruption material
- **Staircase.tsx** - Reusable staircase with steps and railings
- **House.tsx** - Main house component that assembles all rooms using the above components

### Systems (`src/systems/`)
- **collisionSystem.ts** - AABB collision detection for walls and furniture
  - `initializeCollisionBoxes()` - Sets up all collision boxes
  - `checkCollision()` - Tests player position against walls/objects
  - Prevents player from walking through walls or furniture

## Camera System

### Free Camera Mode
- **Starting Position**: (0, 1.6, 0) - center of bedroom at player eye height
- **Movement**: WASD for navigation
  - W/S: Forward/backward
  - A/D: Strafe left/right (perpendicular to camera facing)
- **Mouse Look**: Standard FPS camera (YXZ Euler order, no gimbal lock)
- **Collision**: Player cannot walk through walls or furniture
- **Bounds**: Can explore entire house (-14 to 10 X, -10 to 13 Z)

### Cinematic Mode
- Unchanged - still cycles through bedroom camera angles

## Adding Furniture

To add furniture to any room:

1. **Create the model component** in `src/components/models/`
2. **Add position constants** to `modelPositions.ts`
3. **Add collision box** to `collisionSystem.ts` in `initializeCollisionBoxes()`
4. **Import and render** in `Scene.tsx`

Example:
```typescript
// In modelPositions.ts
export const COUCH = {
  position: [-6, -1.4 + 0.4, 0] as [number, number, number],
  dimensions: { width: 2, height: 0.8, depth: 1 },
} as const;

// In collisionSystem.ts (inside initializeCollisionBoxes)
COLLISION_BOXES.push(
  createAABB(
    COUCH.position[0],
    COUCH.position[1],
    COUCH.position[2],
    COUCH.dimensions.width,
    COUCH.dimensions.height,
    COUCH.dimensions.depth
  )
);

// In Scene.tsx
import Couch from './models/Couch';
// ...
<Couch hellFactor={hellFactor} />
```

## Expansion Notes

The system is designed to be easily expandable:

- **Add rooms**: Create new entries in `ENTRY_LEVEL` or `LOWER_LEVEL` constants, then render walls/floors in `House.tsx`
- **Add floors**: Create new level constants (e.g., `SECOND_FLOOR`) and staircases connecting them
- **Modify layout**: Change position/dimension values in `modelPositions.ts` - collision boxes will need manual updates
- **Add doors**: Remove wall sections by commenting out specific Wall components, or create a Door component
- **Add windows**: Use the existing Window component or create new variants

## Current State

The house structure is complete but empty:
- ✅ All walls, floors, and ceilings in place
- ✅ Two staircases connecting all three levels
- ✅ Collision detection working for walls and furniture
- ✅ Camera can explore entire house
- ⬜ Entry level rooms are empty (ready for furniture)
- ⬜ Lower level rooms are empty (ready for furniture)
- ⬜ No doors or windows (except bedroom window)
- ⬜ Lighting only configured for bedroom

## Next Steps

Consider adding:
1. Furniture for living room (couch, coffee table, TV)
2. Furniture for dining area (table, chairs)
3. Kitchen appliances and cabinets
4. Doors between rooms
5. Windows for natural lighting on entry level
6. Lighting configuration for new rooms
7. Decorations and details for atmosphere
8. Basement atmosphere (darker, more oppressive)
