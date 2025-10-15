import { useCorruptionMaterial } from "../../hooks/useCorruptionMaterial";
import WindowFrame from "./WindowFrame";
import WindowGlow from "./WindowGlow";

interface HouseProps {
  hellFactor: number;
}

/**
 * House Component
 *
 * Simple second room connected to the bedroom.
 */
export function House({ hellFactor }: HouseProps) {
  // Materials
  const floorMaterial = useCorruptionMaterial({
    normalColor: 0x8b7355,
    hellColor: 0x0d0000
  });

  const wallMaterial = useCorruptionMaterial({
    normalColor: 0xe8e4d9,
    hellColor: 0x1a0000
  });

  const ceilingMaterial = useCorruptionMaterial({
    normalColor: 0xf5f5f5,
    hellColor: 0x0d0000
  });

  const doorFrameMaterial = useCorruptionMaterial({
    normalColor: 0x654321, // Dark wood
    hellColor: 0x1a0000
  });

  // Update hell factor
  if (floorMaterial.uniforms)
    floorMaterial.uniforms.hellFactor.value = hellFactor;
  if (wallMaterial.uniforms)
    wallMaterial.uniforms.hellFactor.value = hellFactor;
  if (ceilingMaterial.uniforms)
    ceilingMaterial.uniforms.hellFactor.value = hellFactor;
  if (doorFrameMaterial.uniforms)
    doorFrameMaterial.uniforms.hellFactor.value = hellFactor;

  // Second room dimensions (same size as bedroom: 10x10)
  const roomWidth = 10;
  const roomDepth = 10;
  const roomCenterZ = 5 + roomDepth / 2; // Bedroom ends at Z=5, room center at Z=10
  const roomCenterX = 0;

  return (
    <group>
      {/* ===== SECOND ROOM ===== */}

      {/* Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[roomCenterX, 0, roomCenterZ]}
        material={floorMaterial}
      >
        <planeGeometry args={[roomWidth, roomDepth]} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[roomCenterX, 5, roomCenterZ]}
        material={ceilingMaterial}
      >
        <planeGeometry args={[roomWidth, roomDepth]} />
      </mesh>

      {/* Left wall with window cutout (1.5m x 1.5m) */}
      {/* Bottom section */}
      <mesh
        position={[-roomWidth / 2, 0.75, roomCenterZ]}
        material={wallMaterial}
      >
        <boxGeometry args={[0.2, 1.5, roomDepth]} />
      </mesh>
      {/* Top section */}
      <mesh position={[-roomWidth / 2, 4, roomCenterZ]} material={wallMaterial}>
        <boxGeometry args={[0.2, 2, roomDepth]} />
      </mesh>
      {/* Left of window */}
      <mesh
        position={[-roomWidth / 2, 2.25, roomCenterZ - 3.75]}
        material={wallMaterial}
      >
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>
      {/* Right of window */}
      <mesh
        position={[-roomWidth / 2, 2.25, roomCenterZ + 3.75]}
        material={wallMaterial}
      >
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>

      {/* Right wall with window cutout (1.5m x 1.5m) */}
      {/* Bottom section */}
      <mesh
        position={[roomWidth / 2, 0.75, roomCenterZ]}
        material={wallMaterial}
      >
        <boxGeometry args={[0.2, 1.5, roomDepth]} />
      </mesh>
      {/* Top section */}
      <mesh position={[roomWidth / 2, 4, roomCenterZ]} material={wallMaterial}>
        <boxGeometry args={[0.2, 2, roomDepth]} />
      </mesh>
      {/* Left of window */}
      <mesh
        position={[roomWidth / 2, 2.25, roomCenterZ - 3.75]}
        material={wallMaterial}
      >
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>
      {/* Right of window */}
      <mesh
        position={[roomWidth / 2, 2.25, roomCenterZ + 3.75]}
        material={wallMaterial}
      >
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>

      {/* Back wall with window cutout (1.5m x 1.5m) */}
      {/* Bottom section */}
      <mesh position={[0, 0.75, 5 + roomDepth]} material={wallMaterial}>
        <boxGeometry args={[roomWidth, 1.5, 0.2]} />
      </mesh>
      {/* Top section */}
      <mesh position={[0, 4, 5 + roomDepth]} material={wallMaterial}>
        <boxGeometry args={[roomWidth, 2, 0.2]} />
      </mesh>
      {/* Left of window */}
      <mesh position={[-3.75, 2.25, 5 + roomDepth]} material={wallMaterial}>
        <boxGeometry args={[4.5, 1.5, 0.2]} />
      </mesh>
      {/* Right of window */}
      <mesh position={[3.75, 2.25, 5 + roomDepth]} material={wallMaterial}>
        <boxGeometry args={[4.5, 1.5, 0.2]} />
      </mesh>

      {/* Front wall is shared with bedroom - no wall needed */}

      {/* ===== DOOR FRAME (between bedroom and second room) ===== */}
      {/* Door is 1.2m wide, 2.64m tall, centered in the shared wall at Z=5 */}

      {/* Left door frame vertical */}
      <mesh position={[-0.65, 1.32, 5]} material={doorFrameMaterial}>
        <boxGeometry args={[0.15, 2.64, 0.25]} />
      </mesh>

      {/* Right door frame vertical */}
      <mesh position={[0.65, 1.32, 5]} material={doorFrameMaterial}>
        <boxGeometry args={[0.15, 2.64, 0.25]} />
      </mesh>

      {/* Top door frame horizontal */}
      <mesh position={[0, 2.64, 5]} material={doorFrameMaterial}>
        <boxGeometry args={[1.45, 0.15, 0.25]} />
      </mesh>

      {/* Bottom door frame (threshold) */}
      <mesh position={[0, 0, 5]} material={doorFrameMaterial}>
        <boxGeometry args={[1.3, 0.1, 0.25]} />
      </mesh>

      {/* ===== WINDOW FRAMES ===== */}

      {/* Bedroom left wall window */}
      <WindowFrame
        position={[-5, 2.25, 1]}
        width={1}
        height={1.5}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[-5, 2.25, 1]}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowFrame
        position={[-5, 2.25, 0]}
        width={1}
        height={1.5}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[-5, 2.25, 0]}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowFrame
        position={[-5, 2.25, -1]}
        width={1}
        height={1.5}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[-5, 2.25, -1]}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />

      {/* Bedroom right wall window */}
      <WindowFrame
        position={[5, 2.25, 1]}
        width={1}
        height={1.5}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[5, 2.25, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowFrame
        position={[5, 2.25, 0]}
        width={1}
        height={1.5}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[5, 2.25, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowFrame
        position={[5, 2.25, -1]}
        width={1}
        height={1.5}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[5, 2.25, -1]}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />

      {/* Second room left wall window */}
      <WindowFrame
        position={[-roomWidth / 2, 2.25, roomCenterZ]}
        width={1.5}
        height={1.5}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[-roomWidth / 2, 2.25, roomCenterZ]}
        rotation={[0, Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />

      {/* Second room right wall window */}
      <WindowFrame
        position={[roomWidth / 2, 2.25, roomCenterZ]}
        width={1.5}
        height={1.5}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[roomWidth / 2, 2.25, roomCenterZ]}
        rotation={[0, -Math.PI / 2, 0]}
        hellFactor={hellFactor}
      />

      {/* Second room back wall window */}
      <WindowFrame
        position={[0, 2.25, 5 + roomDepth]}
        width={1.5}
        height={1.5}
        rotation={[0, Math.PI, 0]}
        hellFactor={hellFactor}
      />
      <WindowGlow
        position={[0, 2.25, 5 + roomDepth]}
        rotation={[0, Math.PI, 0]}
        hellFactor={hellFactor}
      />


      {/* ===== FURNITURE ===== */}
      {/* Coffee Table */}
      {/* <CoffeeTable hellFactor={hellFactor} /> */}
    </group>
  );
}

export default House;
