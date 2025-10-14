/**
 * Model Positions and Dimensions
 *
 * Central configuration for all 3D model positions and dimensions.
 * This ensures consistency when objects need to reference each other's positions.
 */

// Bureau (Dresser)
export const BUREAU = {
  position: [3, 0.8, -4.1] as [number, number, number],
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
  // Helper to get top surface Y position
  get topSurfaceY() {
    return this.position[1] + this.dimensions.height / 2;
  },
} as const;

// Bed
export const BED = {
  position: [-2, 0.5, -2] as [number, number, number],
  dimensions: {
    width: 3,
    height: 0.4,
    depth: 4,
  },
} as const;

// TV Stand
export const TV_STAND = {
  position: [0, 0.4, -4.5] as [number, number, number],
  dimensions: {
    width: 2.5,
    height: 0.8,
    depth: 0.8,
  },
} as const;

// Coffee Table (in second room)
export const COFFEE_TABLE = {
  position: [0, 0.0, 2.3] as [number, number, number], // Center of second room
  dimensions: {
    width: 1.8, // X dimension
    height: 0.5, // Y dimension (table height)
    depth: 1.2, // Z dimension
  },
  legWidth: 0.08,
  legHeight: 0.45,
  // Helper to get top surface Y position
  get topSurfaceY() {
    return this.position[1] + this.dimensions.height / 2;
  },
} as const;

// Window
export const WINDOW = {
  position: [3, 2.5, -4.9] as [number, number, number],
  dimensions: {
    width: 2,
    height: 2,
    depth: 0.2,
  },
} as const;

// Ceiling Light
export const CEILING_LIGHT = {
  position: [0, 4.7, 0] as [number, number, number],
} as const;

// Room bounds for reference
export const ROOM_BOUNDS = {
  x: { min: -5, max: 5 },
  y: { min: 0, max: 5 },
  z: { min: -5, max: 5 },
} as const;

/**
 * SPLIT LEVEL HOUSE LAYOUT
 *
 * Traditional split level house with 3 levels:
 * - Upper Level (Y: 0): Bedroom area (existing bedroom)
 * - Entry Level (Y: -1.4): Living room, dining area, kitchen
 * - Lower Level (Y: -2.8): Family room, utility room
 *
 * Each level is offset by half a story (~1.4m) with stairs connecting them
 */

// Wall thickness constant
export const WALL_THICKNESS = 0.15;

// Upper Level (Bedroom Floor - Y: 0)
export const UPPER_LEVEL = {
  floorY: 0,
  ceilingY: 5,
  bedroom: {
    // Existing bedroom remains centered around (0, 0, 0)
    center: [0, 0, 0] as [number, number, number],
    dimensions: {
      width: 10,  // X: -5 to 5
      depth: 10,  // Z: -5 to 5
    },
  },
  hallway: {
    // Hallway connecting bedroom to stairs
    center: [0, 0, 6] as [number, number, number],
    dimensions: {
      width: 3,
      depth: 4,
    },
  },
} as const;

// Entry Level (Main Floor - Y: -1.4)
export const ENTRY_LEVEL = {
  floorY: -1.4,
  ceilingY: 3.6,
  livingRoom: {
    center: [-6, -1.4, 0] as [number, number, number],
    dimensions: {
      width: 8,
      depth: 10,
    },
  },
  diningArea: {
    center: [6, -1.4, -3] as [number, number, number],
    dimensions: {
      width: 6,
      depth: 6,
    },
  },
  kitchen: {
    center: [6, -1.4, 4] as [number, number, number],
    dimensions: {
      width: 6,
      depth: 6,
    },
  },
  entryway: {
    center: [0, -1.4, 8] as [number, number, number],
    dimensions: {
      width: 4,
      depth: 4,
    },
  },
} as const;

// Lower Level (Basement - Y: -2.8)
export const LOWER_LEVEL = {
  floorY: -2.8,
  ceilingY: 2.2,
  familyRoom: {
    center: [-5, -2.8, 0] as [number, number, number],
    dimensions: {
      width: 10,
      depth: 12,
    },
  },
  utilityRoom: {
    center: [5, -2.8, 0] as [number, number, number],
    dimensions: {
      width: 6,
      depth: 6,
    },
  },
  storage: {
    center: [5, -2.8, -5] as [number, number, number],
    dimensions: {
      width: 6,
      depth: 4,
    },
  },
} as const;

// Stairwell positions
export const STAIRS = {
  // Upper to Entry staircase
  upperToEntry: {
    topPosition: [0, 0, 8] as [number, number, number],
    bottomPosition: [0, -1.4, 11] as [number, number, number],
    width: 2.5,
    steps: 7,
    stepHeight: 0.2,
    stepDepth: 0.3,
  },
  // Entry to Lower staircase
  entryToLower: {
    topPosition: [-10, -1.4, -5] as [number, number, number],
    bottomPosition: [-10, -2.8, -8] as [number, number, number],
    width: 2.5,
    steps: 7,
    stepHeight: 0.2,
    stepDepth: 0.3,
  },
} as const;

// Overall house bounds
export const HOUSE_BOUNDS = {
  x: { min: -14, max: 10 },
  y: { min: -2.8, max: 5 },
  z: { min: -10, max: 13 },
} as const;
