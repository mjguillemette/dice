import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface RoomProps {
  hellFactor: number;
}

export function Room({ hellFactor }: RoomProps) {
  // Floor
  const floorMaterial = useCorruptionMaterial({
    normalColor: 0x8b7355,
    hellColor: 0x2a0a0a,
  });

  // Rug
  const rugMaterial = useCorruptionMaterial({
    normalColor: 0xcc6666,
    hellColor: 0x660000,
  });

  // Walls
  const wallMaterial = useCorruptionMaterial({
    normalColor: 0xe0e0e0,
    hellColor: 0x1a0000,
  });

  // Ceiling
  const ceilingMaterial = useCorruptionMaterial({
    normalColor: 0xffffff,
    hellColor: 0x330000,
  });

  // Update hell factor for all materials
  if (floorMaterial.uniforms) floorMaterial.uniforms.hellFactor.value = hellFactor;
  if (rugMaterial.uniforms) rugMaterial.uniforms.hellFactor.value = hellFactor;
  if (wallMaterial.uniforms) wallMaterial.uniforms.hellFactor.value = hellFactor;
  if (ceilingMaterial.uniforms) ceilingMaterial.uniforms.hellFactor.value = hellFactor;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial}>
        <planeGeometry args={[10, 10]} />
      </mesh>

      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={rugMaterial}>
        <planeGeometry args={[4, 3]} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2.5, -5]} material={wallMaterial}>
        <boxGeometry args={[10, 5, 0.2]} />
      </mesh>

      {/* Left wall with window cutout (1.5m wide x 1.5m tall window centered at 2.25m height) */}
      {/* Bottom section (floor to window bottom at 1.5m) */}
      <mesh position={[-5, 0.75, 0]} material={wallMaterial}>
        <boxGeometry args={[0.2, 1.5, 10]} />
      </mesh>
      {/* Top section (window top at 3m to ceiling at 5m) */}
      <mesh position={[-5, 4, 0]} material={wallMaterial}>
        <boxGeometry args={[0.2, 2, 10]} />
      </mesh>
      {/* Left of window (from back wall to window) */}
      <mesh position={[-5, 2.25, -3.75]} material={wallMaterial}>
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>
      {/* Right of window (from window to front wall) */}
      <mesh position={[-5, 2.25, 3.75]} material={wallMaterial}>
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>

      {/* Right wall with window cutout (1.5m wide x 1.5m tall window centered at 2.25m height) */}
      {/* Bottom section (floor to window bottom at 1.5m) */}
      <mesh position={[5, 0.75, 0]} material={wallMaterial}>
        <boxGeometry args={[0.2, 1.5, 10]} />
      </mesh>
      {/* Top section (window top at 3m to ceiling at 5m) */}
      <mesh position={[5, 4, 0]} material={wallMaterial}>
        <boxGeometry args={[0.2, 2, 10]} />
      </mesh>
      {/* Left of window (from back wall to window) */}
      <mesh position={[5, 2.25, -3.75]} material={wallMaterial}>
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>
      {/* Right of window (from window to front wall) */}
      <mesh position={[5, 2.25, 3.75]} material={wallMaterial}>
        <boxGeometry args={[0.2, 1.5, 4.5]} />
      </mesh>

      {/* Front wall with door opening (1.2m wide x 2.64m tall door in center) */}
      {/* Left section */}
      <mesh position={[-2.7, 2.5, 5]} material={wallMaterial}>
        <boxGeometry args={[4.4, 5, 0.2]} />
      </mesh>
      {/* Right section */}
      <mesh position={[2.7, 2.5, 5]} material={wallMaterial}>
        <boxGeometry args={[4.4, 5, 0.2]} />
      </mesh>
      {/* Above door section (from 2.64m to 5m ceiling) */}
      <mesh position={[0, 3.82, 5]} material={wallMaterial}>
        <boxGeometry args={[1.2, 2.36, 0.2]} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]} material={ceilingMaterial}>
        <planeGeometry args={[10, 10]} />
      </mesh>
    </group>
  );
}

export default Room;
