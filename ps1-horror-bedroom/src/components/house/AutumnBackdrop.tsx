import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface AutumnBackdropProps {
  hellFactor: number;
}

/**
 * Autumn Backdrop Component
 *
 * Creates a flat autumn tree scenery that wraps around the house exterior
 */
export function AutumnBackdrop({ hellFactor }: AutumnBackdropProps) {
  // Sky material (blue fading to hellish red)
  const skyMaterial = useCorruptionMaterial({
    normalColor: 0x87CEEB, // Sky blue
    hellColor: 0x330000,   // Dark red
  });

  // Ground material (autumn grass)
  const groundMaterial = useCorruptionMaterial({
    normalColor: 0x8B7355, // Brown autumn grass
    hellColor: 0x1a0000,
  });

  // Tree trunk material
  const trunkMaterial = useCorruptionMaterial({
    normalColor: 0x4A3728, // Dark brown
    hellColor: 0x0d0000,
  });

  // Autumn foliage colors
  const foliageOrange = useCorruptionMaterial({
    normalColor: 0xFF8C00, // Orange
    hellColor: 0x660000,
  });

  const foliageRed = useCorruptionMaterial({
    normalColor: 0xDC143C, // Crimson
    hellColor: 0x4a0000,
  });

  const foliageYellow = useCorruptionMaterial({
    normalColor: 0xFFD700, // Gold
    hellColor: 0x660000,
  });

  // Update hell factor
  if (skyMaterial.uniforms) skyMaterial.uniforms.hellFactor.value = hellFactor;
  if (groundMaterial.uniforms) groundMaterial.uniforms.hellFactor.value = hellFactor;
  if (trunkMaterial.uniforms) trunkMaterial.uniforms.hellFactor.value = hellFactor;
  if (foliageOrange.uniforms) foliageOrange.uniforms.hellFactor.value = hellFactor;
  if (foliageRed.uniforms) foliageRed.uniforms.hellFactor.value = hellFactor;
  if (foliageYellow.uniforms) foliageYellow.uniforms.hellFactor.value = hellFactor;

  const backdropDistance = 20; // Distance from house

  return (
    <group>
      {/* Sky backdrop - wraps around house */}
      {/* North sky */}
      <mesh position={[0, 5, -backdropDistance]} material={skyMaterial}>
        <planeGeometry args={[60, 20]} />
      </mesh>

      {/* East sky */}
      <mesh position={[backdropDistance, 5, 0]} rotation={[0, -Math.PI / 2, 0]} material={skyMaterial}>
        <planeGeometry args={[60, 20]} />
      </mesh>

      {/* West sky */}
      <mesh position={[-backdropDistance, 5, 0]} rotation={[0, Math.PI / 2, 0]} material={skyMaterial}>
        <planeGeometry args={[60, 20]} />
      </mesh>

      {/* South sky */}
      <mesh position={[0, 5, backdropDistance]} rotation={[0, Math.PI, 0]} material={skyMaterial}>
        <planeGeometry args={[60, 20]} />
      </mesh>

      {/* Ground plane */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={groundMaterial}>
        <planeGeometry args={[100, 100]} />
      </mesh>

      {/* Trees - simple flat cutout style */}
      {/* Left side trees */}
      {[-15, -12, -9].map((x, i) => (
        <group key={`left-${i}`}>
          {/* Trunk */}
          <mesh position={[x, 1, -15]} material={trunkMaterial}>
            <planeGeometry args={[0.5, 3]} />
          </mesh>
          {/* Foliage (random autumn colors) */}
          <mesh
            position={[x, 3, -15]}
            material={i % 3 === 0 ? foliageOrange : i % 3 === 1 ? foliageRed : foliageYellow}
          >
            <planeGeometry args={[3, 4]} />
          </mesh>
        </group>
      ))}

      {/* Right side trees */}
      {[9, 12, 15].map((x, i) => (
        <group key={`right-${i}`}>
          {/* Trunk */}
          <mesh position={[x, 1, -15]} material={trunkMaterial}>
            <planeGeometry args={[0.5, 3]} />
          </mesh>
          {/* Foliage */}
          <mesh
            position={[x, 3, -15]}
            material={i % 3 === 0 ? foliageYellow : i % 3 === 1 ? foliageOrange : foliageRed}
          >
            <planeGeometry args={[3, 4]} />
          </mesh>
        </group>
      ))}

      {/* Back trees (behind second room) */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <group key={`back-${i}`}>
          {/* Trunk */}
          <mesh position={[x, 1, 18]} rotation={[0, Math.PI, 0]} material={trunkMaterial}>
            <planeGeometry args={[0.5, 3]} />
          </mesh>
          {/* Foliage */}
          <mesh
            position={[x, 3, 18]}
            rotation={[0, Math.PI, 0]}
            material={i % 3 === 0 ? foliageRed : i % 3 === 1 ? foliageYellow : foliageOrange}
          >
            <planeGeometry args={[3, 4]} />
          </mesh>
        </group>
      ))}

      {/* Side trees (left wall) */}
      {[-15, -12, -9].map((z, i) => (
        <group key={`side-left-${i}`}>
          {/* Trunk */}
          <mesh position={[-18, 1, z]} rotation={[0, Math.PI / 2, 0]} material={trunkMaterial}>
            <planeGeometry args={[0.5, 3]} />
          </mesh>
          {/* Foliage */}
          <mesh
            position={[-18, 3, z]}
            rotation={[0, Math.PI / 2, 0]}
            material={i % 3 === 0 ? foliageOrange : i % 3 === 1 ? foliageYellow : foliageRed}
          >
            <planeGeometry args={[3, 4]} />
          </mesh>
        </group>
      ))}

      {/* Side trees (right wall) */}
      {[-15, -12, -9].map((z, i) => (
        <group key={`side-right-${i}`}>
          {/* Trunk */}
          <mesh position={[18, 1, z]} rotation={[0, -Math.PI / 2, 0]} material={trunkMaterial}>
            <planeGeometry args={[0.5, 3]} />
          </mesh>
          {/* Foliage */}
          <mesh
            position={[18, 3, z]}
            rotation={[0, -Math.PI / 2, 0]}
            material={i % 3 === 0 ? foliageYellow : i % 3 === 1 ? foliageRed : foliageOrange}
          >
            <planeGeometry args={[3, 4]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default AutumnBackdrop;
