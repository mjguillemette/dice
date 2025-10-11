import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { WALL_THICKNESS } from '../../constants/modelPositions';

export type WallSide = 'north' | 'south' | 'east' | 'west';

export interface DoorOpening {
  wall: WallSide;
  offset?: number; // Offset from center of wall (0 = center)
  width?: number;   // Door width (default 1.0m)
}

interface GenericRoomProps {
  position: [number, number, number]; // Center position [x, y, z]
  width: number;   // X dimension
  depth: number;   // Z dimension
  height?: number; // Wall height (default 5)
  doors?: DoorOpening[];
  hellFactor: number;
  floorColor?: number;
  wallColor?: number;
  ceilingColor?: number;
}

/**
 * GenericRoom Component
 *
 * Creates a room with floor, ceiling, and walls with optional door openings.
 * Doors are carved out of walls by splitting them into segments.
 *
 * Wall orientations:
 * - North: -Z direction (back wall)
 * - South: +Z direction (front wall)
 * - East: +X direction (right wall)
 * - West: -X direction (left wall)
 */
export function GenericRoom({
  position,
  width,
  depth,
  height = 5,
  doors = [],
  hellFactor,
  floorColor = 0x8b7355,
  wallColor = 0xe8e4d9,
  ceilingColor = 0xf5f5f5,
}: GenericRoomProps) {
  const [centerX, centerY, centerZ] = position;

  // Materials
  const floorMaterial = useCorruptionMaterial({
    normalColor: floorColor,
    hellColor: 0x0d0000,
  });

  const wallMaterial = useCorruptionMaterial({
    normalColor: wallColor,
    hellColor: 0x1a0000,
  });

  const ceilingMaterial = useCorruptionMaterial({
    normalColor: ceilingColor,
    hellColor: 0x0d0000,
  });

  // Update hell factor
  if (floorMaterial.uniforms) floorMaterial.uniforms.hellFactor.value = hellFactor;
  if (wallMaterial.uniforms) wallMaterial.uniforms.hellFactor.value = hellFactor;
  if (ceilingMaterial.uniforms) ceilingMaterial.uniforms.hellFactor.value = hellFactor;

  const wallY = centerY + height / 2;

  // Helper function to create wall segments around a door
  const createWallWithDoor = (
    wall: WallSide,
    wallLength: number,
    wallDepth: number
  ) => {
    // Find doors on this wall
    const doorsOnWall = doors.filter(d => d.wall === wall);

    if (doorsOnWall.length === 0) {
      // No door - render full wall
      const pos = getWallPosition(wall, centerX, centerZ, width, depth, wallY);
      const dims = getWallDimensions(wall, width, depth, height);

      return (
        <mesh position={pos} material={wallMaterial}>
          <boxGeometry args={dims} />
        </mesh>
      );
    }

    // Has door(s) - split wall into segments
    const segments: JSX.Element[] = [];

    doorsOnWall.forEach((door, idx) => {
      const doorWidth = door.width || 1.0;
      const doorOffset = door.offset || 0;

      // Calculate door center position along wall
      const doorCenter = doorOffset;
      const doorStart = doorCenter - doorWidth / 2;
      const doorEnd = doorCenter + doorWidth / 2;

      // Left segment (from wall start to door start)
      const leftWidth = wallLength / 2 + doorStart;
      if (leftWidth > 0.1) {
        const leftCenter = -wallLength / 2 + leftWidth / 2;
        const leftPos = getWallSegmentPosition(wall, centerX, centerZ, width, depth, wallY, leftCenter);
        const leftDims = getWallSegmentDimensions(wall, leftWidth, wallDepth, height);

        segments.push(
          <mesh key={`${wall}-left-${idx}`} position={leftPos} material={wallMaterial}>
            <boxGeometry args={leftDims} />
          </mesh>
        );
      }

      // Right segment (from door end to wall end)
      const rightWidth = wallLength / 2 - doorEnd;
      if (rightWidth > 0.1) {
        const rightCenter = wallLength / 2 - rightWidth / 2;
        const rightPos = getWallSegmentPosition(wall, centerX, centerZ, width, depth, wallY, rightCenter);
        const rightDims = getWallSegmentDimensions(wall, rightWidth, wallDepth, height);

        segments.push(
          <mesh key={`${wall}-right-${idx}`} position={rightPos} material={wallMaterial}>
            <boxGeometry args={rightDims} />
          </mesh>
        );
      }
    });

    return <>{segments}</>;
  };

  return (
    <group>
      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, centerY, centerZ]}
        material={floorMaterial}
      >
        <planeGeometry args={[width, depth]} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[centerX, centerY + height, centerZ]}
        material={ceilingMaterial}
      >
        <planeGeometry args={[width, depth]} />
      </mesh>

      {/* North wall (back, -Z) */}
      {createWallWithDoor('north', width, WALL_THICKNESS)}

      {/* South wall (front, +Z) */}
      {createWallWithDoor('south', width, WALL_THICKNESS)}

      {/* East wall (right, +X) */}
      {createWallWithDoor('east', depth, WALL_THICKNESS)}

      {/* West wall (left, -X) */}
      {createWallWithDoor('west', depth, WALL_THICKNESS)}
    </group>
  );
}

// Helper functions to get wall positions and dimensions
function getWallPosition(
  wall: WallSide,
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
  wallY: number
): [number, number, number] {
  switch (wall) {
    case 'north': return [centerX, wallY, centerZ - depth / 2];
    case 'south': return [centerX, wallY, centerZ + depth / 2];
    case 'east': return [centerX + width / 2, wallY, centerZ];
    case 'west': return [centerX - width / 2, wallY, centerZ];
  }
}

function getWallDimensions(
  wall: WallSide,
  width: number,
  depth: number,
  height: number
): [number, number, number] {
  switch (wall) {
    case 'north':
    case 'south':
      return [width, height, WALL_THICKNESS];
    case 'east':
    case 'west':
      return [WALL_THICKNESS, height, depth];
  }
}

function getWallSegmentPosition(
  wall: WallSide,
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
  wallY: number,
  segmentOffset: number
): [number, number, number] {
  switch (wall) {
    case 'north':
      return [centerX + segmentOffset, wallY, centerZ - depth / 2];
    case 'south':
      return [centerX + segmentOffset, wallY, centerZ + depth / 2];
    case 'east':
      return [centerX + width / 2, wallY, centerZ + segmentOffset];
    case 'west':
      return [centerX - width / 2, wallY, centerZ + segmentOffset];
  }
}

function getWallSegmentDimensions(
  wall: WallSide,
  segmentWidth: number,
  wallDepth: number,
  height: number
): [number, number, number] {
  switch (wall) {
    case 'north':
    case 'south':
      return [segmentWidth, height, wallDepth];
    case 'east':
    case 'west':
      return [wallDepth, height, segmentWidth];
  }
}

export default GenericRoom;
