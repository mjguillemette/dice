/**
 * Dice Receptacle Configuration
 *
 * Centralized configuration for the dice receptacle (dice tray).
 * Used by both the DiceReceptacle component and DiceManager to ensure
 * collision detection matches visual geometry.
 */

// Receptacle position in world space
export const RECEPTACLE_POSITION: [number, number, number] = [0.28, 0.62, 2.2];

// Receptacle dimensions (in meters) - Base values
const BASE_RECEPTACLE_DIMENSIONS = {
  width: .84,
  depth: .72,
  baseThickness: 0.042,
  wallHeight: 0.1,
  wallThickness: 0.05
};

// Mutable copy for runtime adjustments
export let RECEPTACLE_DIMENSIONS = { ...BASE_RECEPTACLE_DIMENSIONS };

// Dev-adjustable collision bounds offsets (added to calculated bounds)
export let COLLISION_BOUNDS_OFFSET = {
  minX: 0,
  maxX: 0,
  minZ: 0,
  maxZ: 0,
  wallHeight: 0,  // Offset for wall height
  depth: 0         // Offset for floor depth
};

/**
 * Update collision bounds offset (for dev panel controls)
 */
export function updateCollisionBoundsOffset(offsets: Partial<typeof COLLISION_BOUNDS_OFFSET>) {
  COLLISION_BOUNDS_OFFSET = { ...COLLISION_BOUNDS_OFFSET, ...offsets };
}

/**
 * Update receptacle dimensions (for dev panel controls)
 */
export function updateReceptacleDimensions(dimensions: Partial<typeof RECEPTACLE_DIMENSIONS>) {
  RECEPTACLE_DIMENSIONS = { ...RECEPTACLE_DIMENSIONS, ...dimensions };
}

/**
 * Calculate the 2D bounds of the receptacle for dice detection
 * Returns the inner area where dice should land (between the walls)
 */
export function getReceptacleBounds() {
  const [x, _y, z] = RECEPTACLE_POSITION;
  const { width, depth, wallThickness } = RECEPTACLE_DIMENSIONS;

  // Inner dimensions (subtract wall thickness from each side)
  const innerWidth = width - wallThickness * 2;
  const innerDepth = depth - wallThickness * 2;

  return {
    minX: x - innerWidth / 2 + COLLISION_BOUNDS_OFFSET.minX,
    maxX: x + innerWidth / 2 + COLLISION_BOUNDS_OFFSET.maxX,
    minZ: z - innerDepth / 2 + COLLISION_BOUNDS_OFFSET.minZ,
    maxZ: z + innerDepth / 2 + COLLISION_BOUNDS_OFFSET.maxZ
  };
}

/**
 * Get the Y position of the receptacle floor (where dice should settle)
 */
export function getReceptacleFloorY(): number {
  const [, y] = RECEPTACLE_POSITION;
  const { baseThickness } = RECEPTACLE_DIMENSIONS;
  return y + baseThickness;
}

/**
 * Get position for tower card (top-right corner of receptacle)
 * Card dimensions: width 0.165, length 0.295
 */
export function getTowerCardPosition(): [number, number, number] {
  const [x, y, z] = RECEPTACLE_POSITION;
  const { width, depth, baseThickness, wallThickness } = RECEPTACLE_DIMENSIONS;

  // Place card in top-right corner inside the receptacle walls
  const innerWidth = width - wallThickness * 12;
  const innerDepth = depth - wallThickness * 20;

  return [
    x + innerWidth / 2 - 1.405 / 3.05 - 0.05, // Right edge minus half card width minus margin
    y + baseThickness + 0.01, // On top of felt surface
    z - innerDepth / 1.6 + 0.245 / 3 - 0.02 // Top edge minus half card length minus margin
  ];
}

/**
 * Get position for sun card (bottom-left corner of receptacle)
 * Card dimensions: width 0.165, length 0.295
 */
export function getSunCardPosition(): [number, number, number] {
  const [x, y, z] = RECEPTACLE_POSITION;
  const { width, depth, baseThickness, wallThickness } = RECEPTACLE_DIMENSIONS;

  // Place card in bottom-left corner inside the receptacle walls
  const innerWidth = width - wallThickness * 12;
  const innerDepth = depth - wallThickness * 20;

  return [
    x - innerWidth / 2 + 0.465 / 4 + 0.06, // Left edge plus half card width plus margin
    y + baseThickness + 0.012, // On top of felt surface
    z + innerDepth / 1 - 0.295 / 4 + 0.59 // Bottom edge plus half card length plus margin
  ];
}

// Backward compatibility - use tower card as default
export function getCardPosition(): [number, number, number] {
  return getTowerCardPosition();
}

/**
 * Get position for thumb tack decoration
 */
export function getThumbPosition(): [number, number, number] {
  const [x, y, z] = RECEPTACLE_POSITION;
  const { baseThickness } = RECEPTACLE_DIMENSIONS;

  // Place thumb on right side of receptacle, on the felt
  return [
    x + 0.32, // Slightly right of center
    y + baseThickness + 0.016, // On felt surface
    z + 0.11 // Slightly toward back
  ];
}

/**
 * Get position for hourglass
 * Places it on the left side of the receptacle
 */
export function getHourglassPosition(): [number, number, number] {
  const [x, y, z] = RECEPTACLE_POSITION;
  const { width, baseThickness, wallThickness } = RECEPTACLE_DIMENSIONS;

  // Place hourglass on left side of receptacle, on the felt
  const innerWidth = width - wallThickness * 2;
  const hourglassHeight = 0.08;

  return [
    x - innerWidth / 2 - 0.08, // Left side with margin
    y + baseThickness + hourglassHeight / 2, // On felt surface, accounting for hourglass height
    z - 0.15 // Slightly toward front
  ];
}

/**
 * Get the 2D bounds for a card (for dice detection)
 * Must match the final position after Card.tsx modifications
 */
export function getCardBoundsForPosition(position: [number, number, number]) {
  const [x, _y, z] = position;
  const cardWidth = 0.165;
  const cardLength = 0.295;

  // Card.tsx applies these same transformations, so we match them here
  const finalX = x + cardWidth / 2;
  const finalZ = z - cardLength / 2;

  return {
    minX: finalX - cardWidth / 2,
    maxX: finalX + cardWidth / 2,
    minZ: finalZ - cardLength / 2,
    maxZ: finalZ + cardLength / 2
  };
}

// Backward compatibility - use tower card bounds as default
export function getCardBounds() {
  return getCardBoundsForPosition(getTowerCardPosition());
}

export function getTowerCardBounds() {
  return getCardBoundsForPosition(getTowerCardPosition());
}

export function getSunCardBounds() {
  return getCardBoundsForPosition(getSunCardPosition());
}
