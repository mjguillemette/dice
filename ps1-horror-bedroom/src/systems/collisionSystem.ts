import * as THREE from 'three';
import {
  WALL_THICKNESS,
  BED,
  BUREAU,
  TV_STAND,
  COFFEE_TABLE,
} from '../constants/modelPositions';

/**
 * Axis-Aligned Bounding Box for collision detection
 */
export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * Player collision capsule (simplified as box for now)
 */
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.8;

/**
 * Create an AABB from center position and dimensions
 */
function createAABB(
  centerX: number,
  centerY: number,
  centerZ: number,
  width: number,
  height: number,
  depth: number
): AABB {
  return {
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minY: centerY - height / 2,
    maxY: centerY + height / 2,
    minZ: centerZ - depth / 2,
    maxZ: centerZ + depth / 2,
  };
}

/**
 * Check if two AABBs intersect
 */
function aabbIntersects(a: AABB, b: AABB): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}

/**
 * All static collision boxes in the world
 */
const COLLISION_BOXES: AABB[] = [];

/**
 * Initialize collision boxes for the entire house
 */
export function initializeCollisionBoxes(): void {
  COLLISION_BOXES.length = 0; // Clear existing

  // ===== BEDROOM WALLS =====
  // Left wall (with window cutout) - 4 segments around the window
  COLLISION_BOXES.push(createAABB(-5, 0.75, 0, WALL_THICKNESS, 1.5, 10)); // Bottom
  COLLISION_BOXES.push(createAABB(-5, 4, 0, WALL_THICKNESS, 2, 10)); // Top
  COLLISION_BOXES.push(createAABB(-5, 2.25, -3.75, WALL_THICKNESS, 1.5, 4.5)); // Left of window
  COLLISION_BOXES.push(createAABB(-5, 2.25, 3.75, WALL_THICKNESS, 1.5, 4.5)); // Right of window

  // Right wall (with window cutout) - 4 segments around the window
  COLLISION_BOXES.push(createAABB(5, 0.75, 0, WALL_THICKNESS, 1.5, 10)); // Bottom
  COLLISION_BOXES.push(createAABB(5, 4, 0, WALL_THICKNESS, 2, 10)); // Top
  COLLISION_BOXES.push(createAABB(5, 2.25, -3.75, WALL_THICKNESS, 1.5, 4.5)); // Left of window
  COLLISION_BOXES.push(createAABB(5, 2.25, 3.75, WALL_THICKNESS, 1.5, 4.5)); // Right of window

  // Back wall
  COLLISION_BOXES.push(createAABB(0, 2.5, -5, 10, 5, WALL_THICKNESS));

  // Front wall with 1.2m wide x 2.64m tall door opening in center
  // Left segment (from -5 to -0.6)
  COLLISION_BOXES.push(createAABB(-2.8, 2.5, 5, 4.4, 5, WALL_THICKNESS));
  // Right segment (from 0.6 to 5)
  COLLISION_BOXES.push(createAABB(2.8, 2.5, 5, 4.4, 5, WALL_THICKNESS));
  // Above door segment (from 2.64m to 5m ceiling height)
  COLLISION_BOXES.push(createAABB(0, 3.82, 5, 1.2, 6, WALL_THICKNESS));

  // ===== SECOND ROOM WALLS =====
  const roomWidth = 10;
  const roomDepth = 10;
  const roomCenterZ = 5 + roomDepth / 2; // 5 + 5 = 10

  // Left wall (with window cutout)
  COLLISION_BOXES.push(createAABB(-roomWidth / 2, 0.75, roomCenterZ, WALL_THICKNESS, 1.5, roomDepth));
  COLLISION_BOXES.push(createAABB(-roomWidth / 2, 4, roomCenterZ, WALL_THICKNESS, 2, roomDepth));
  COLLISION_BOXES.push(createAABB(-roomWidth / 2, 2.25, roomCenterZ - 3.75, WALL_THICKNESS, 1.5, 4.5));
  COLLISION_BOXES.push(createAABB(-roomWidth / 2, 2.25, roomCenterZ + 3.75, WALL_THICKNESS, 1.5, 4.5));

  // Right wall (with window cutout)
  COLLISION_BOXES.push(createAABB(roomWidth / 2, 0.75, roomCenterZ, WALL_THICKNESS, 1.5, roomDepth));
  COLLISION_BOXES.push(createAABB(roomWidth / 2, 4, roomCenterZ, WALL_THICKNESS, 2, roomDepth));
  COLLISION_BOXES.push(createAABB(roomWidth / 2, 2.25, roomCenterZ - 3.75, WALL_THICKNESS, 1.5, 4.5));
  COLLISION_BOXES.push(createAABB(roomWidth / 2, 2.25, roomCenterZ + 3.75, WALL_THICKNESS, 1.5, 4.5));

  // Back wall (with window cutout)
  COLLISION_BOXES.push(createAABB(0, 0.75, 5 + roomDepth, roomWidth, 1.5, WALL_THICKNESS));
  COLLISION_BOXES.push(createAABB(0, 4, 5 + roomDepth, roomWidth, 2, WALL_THICKNESS));
  COLLISION_BOXES.push(createAABB(-3.75, 2.25, 5 + roomDepth, 4.5, 1.5, WALL_THICKNESS));
  COLLISION_BOXES.push(createAABB(3.75, 2.25, 5 + roomDepth, 4.5, 1.5, WALL_THICKNESS));

  // ===== FURNITURE COLLISION =====

  // Bed
  COLLISION_BOXES.push(
    createAABB(
      BED.position[0],
      BED.position[1],
      BED.position[2],
      BED.dimensions.width,
      BED.dimensions.height,
      BED.dimensions.depth
    )
  );

  // Bureau
  COLLISION_BOXES.push(
    createAABB(
      BUREAU.position[0],
      BUREAU.position[1],
      BUREAU.position[2],
      BUREAU.dimensions.width,
      BUREAU.dimensions.height,
      BUREAU.dimensions.depth
    )
  );

  // TV Stand
  COLLISION_BOXES.push(
    createAABB(
      TV_STAND.position[0],
      TV_STAND.position[1],
      TV_STAND.position[2],
      TV_STAND.dimensions.width,
      TV_STAND.dimensions.height,
      TV_STAND.dimensions.depth
    )
  );

  // Coffee Table
  COLLISION_BOXES.push(
    createAABB(
      COFFEE_TABLE.position[0],
      COFFEE_TABLE.position[1],
      COFFEE_TABLE.position[2],
      COFFEE_TABLE.dimensions.width,
      COFFEE_TABLE.dimensions.height,
      COFFEE_TABLE.dimensions.depth
    )
  );

}

/**
 * Check collision and adjust position if needed
 * Returns the corrected position
 */
export function checkCollision(
  position: THREE.Vector3,
  radius: number = PLAYER_RADIUS,
  height: number = PLAYER_HEIGHT
): THREE.Vector3 {
  // Create player bounding box
  const playerAABB = createAABB(
    position.x,
    position.y + height / 2,
    position.z,
    radius * 2,
    height,
    radius * 2
  );

  // Check against all collision boxes
  for (const box of COLLISION_BOXES) {
    if (aabbIntersects(playerAABB, box)) {
      // Collision detected - calculate penetration and push out
      const overlapX = Math.min(
        Math.abs(playerAABB.maxX - box.minX),
        Math.abs(box.maxX - playerAABB.minX)
      );
      const overlapZ = Math.min(
        Math.abs(playerAABB.maxZ - box.minZ),
        Math.abs(box.maxZ - playerAABB.minZ)
      );

      // Push out in direction of least penetration
      if (overlapX < overlapZ) {
        // Push out on X axis
        if (position.x < box.minX + (box.maxX - box.minX) / 2) {
          position.x = box.minX - radius;
        } else {
          position.x = box.maxX + radius;
        }
      } else {
        // Push out on Z axis
        if (position.z < box.minZ + (box.maxZ - box.minZ) / 2) {
          position.z = box.minZ - radius;
        } else {
          position.z = box.maxZ + radius;
        }
      }

      // Re-create player AABB with corrected position
      playerAABB.minX = position.x - radius;
      playerAABB.maxX = position.x + radius;
      playerAABB.minZ = position.z - radius;
      playerAABB.maxZ = position.z + radius;
    }
  }

  return position;
}

/**
 * Get all collision boxes (for debug visualization)
 */
export function getCollisionBoxes(): AABB[] {
  return COLLISION_BOXES;
}
