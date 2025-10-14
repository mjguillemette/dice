import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import boardTexture from '../../assets/textures/board.png';

interface BoardGameProps {
  position: [number, number, number];
  hellFactor: number;
  daysMarked: number;
}

/**
 * Board Game Component - Calendar with X'able dates
 *
 * A calendar board with a 7x5 grid (35 days) where dates can be X'd out
 */
export function BoardGame({ position, hellFactor, daysMarked }: BoardGameProps) {
  // Create a set of marked dates from 1 to daysMarked
  const crossedOutDates = new Set(Array.from({ length: daysMarked }, (_, i) => i + 1));

  // Days 32-35 are blacked out (October only has 31 days)
  const blackedOutDates = new Set([32, 33, 34, 35]);

  // Load board texture
  const texture = useLoader(THREE.TextureLoader, boardTexture);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  // Board surface material with texture
  const boardSurfaceMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.3,
    metalness: 0.1,
  });

  // Board edge material (darker wood)
  const boardEdgeMaterial = useCorruptionMaterial({
    normalColor: 0x8B6F47, // Medium brown wood
    hellColor: 0x2a0a0a,
  });

  // Update hell factor
  if (boardEdgeMaterial.uniforms) boardEdgeMaterial.uniforms.hellFactor.value = hellFactor;

  // Board dimensions - 4:3 aspect ratio (200:150 px texture)
  const boardWidth = 0.6;  // 4 units
  const boardDepth = 0.45; // 3 units
  const boardBaseThickness = 0.025;
  const boardEdgeHeight = 0.022;
  const boardEdgeWidth = 0.023;

  return (
    <group position={position} rotation={[Math.PI / 2, 0, Math.PI / 1]}>
      {/* ===== GAME BOARD ===== */}

      {/* Board base */}
      <mesh position={[0, boardBaseThickness / 2, 0]} material={boardEdgeMaterial}>
        <boxGeometry args={[boardWidth, boardBaseThickness, boardDepth]} />
      </mesh>

      {/* Board playing surface (slightly raised) */}
      <mesh
        position={[0, boardBaseThickness + 0.003, 0]}
        material={boardSurfaceMaterial}
      >
        <boxGeometry args={[boardWidth - boardEdgeWidth * 2, 0.006, boardDepth - boardEdgeWidth * 2]} />
      </mesh>

      {/* Board raised edges (frame) */}
      {/* Top edge */}
      <mesh
        position={[0, boardBaseThickness + boardEdgeHeight / 2, -(boardDepth / 2 - boardEdgeWidth / 2)]}
        material={boardEdgeMaterial}
      >
        <boxGeometry args={[boardWidth, boardEdgeHeight, boardEdgeWidth]} />
      </mesh>
      {/* Bottom edge */}
      <mesh
        position={[0, boardBaseThickness + boardEdgeHeight / 2, (boardDepth / 2 - boardEdgeWidth / 2)]}
        material={boardEdgeMaterial}
      >
        <boxGeometry args={[boardWidth, boardEdgeHeight, boardEdgeWidth]} />
      </mesh>
      {/* Left edge */}
      <mesh
        position={[-(boardWidth / 2 - boardEdgeWidth / 2), boardBaseThickness + boardEdgeHeight / 2, 0]}
        material={boardEdgeMaterial}
      >
        <boxGeometry args={[boardEdgeWidth, boardEdgeHeight, boardDepth - boardEdgeWidth * 2]} />
      </mesh>
      {/* Right edge */}
      <mesh
        position={[(boardWidth / 2 - boardEdgeWidth / 2), boardBaseThickness + boardEdgeHeight / 2, 0]}
        material={boardEdgeMaterial}
      >
        <boxGeometry args={[boardEdgeWidth, boardEdgeHeight, boardDepth - boardEdgeWidth * 2]} />
      </mesh>

      {/* ===== CALENDAR GRID (7 columns x 5 rows = 35 days) ===== */}
      {Array.from({ length: 35 }).map((_, index) => {
        const dateNumber = index + 1;
        const col = index % 7; // 0-6 (7 columns for days of week)
        const row = Math.floor(index / 7); // 0-4 (5 rows)

        // Calculate position on the board
        const playAreaWidth = boardWidth - boardEdgeWidth * 2;
        const playAreaDepth = boardDepth - boardEdgeWidth * 2;
        const cellWidth = playAreaWidth / 7;
        const cellHeight = playAreaDepth / 5;

        // Center of each cell
        const x = -playAreaWidth / 2 + cellWidth * (col + 0.5);
        const z = -playAreaDepth / 2 + cellHeight * (row + 0.5);
        const y = boardBaseThickness + 0.015; // Slightly above the board

        const isXedOut = crossedOutDates.has(dateNumber);
        const isBlackedOut = blackedOutDates.has(dateNumber);

        // Don't render blacked out dates - just show a black box
        if (isBlackedOut) {
          return (
            <mesh
              key={`date-${dateNumber}`}
              position={[x, y, z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[cellWidth, cellHeight]} />
              <meshStandardMaterial color="#000000" opacity={.1}/>
            </mesh>
          );
        }

        return (
          <group key={`date-${dateNumber}`} position={[x, y, z]}>
            {/* Date number - chunky pixel font style */}
            <Text
              position={[0, 0, 0]}
              rotation={[-Math.PI / 2, 0, 0]} // Lay flat on board
              fontSize={0.034} // Bigger, chunkier size
              color={isXedOut ? "#666666" : "#000000"}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
              outlineWidth={0.001}
              outlineColor="#9c9c9c"
              fontWeight={700}
            >
              {dateNumber}
            </Text>

            {/* X mark if crossed out */}
            {isXedOut && (
              <>
                {/* Diagonal line 1 - thicker for pixel style */}
                <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
                  <boxGeometry args={[0.045, 0.006, 0.003]} />
                  <meshStandardMaterial color="#CC0000" />
                </mesh>
                {/* Diagonal line 2 */}
                <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
                  <boxGeometry args={[0.045, 0.006, 0.003]} />
                  <meshStandardMaterial color="#CC0000" />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

export default BoardGame;
