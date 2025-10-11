import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface FloorProps {
  position: [number, number, number];
  width: number;
  depth: number;
  hellFactor: number;
  isCeiling?: boolean;
}

/**
 * Reusable Floor/Ceiling Component
 *
 * Creates a horizontal surface with corruption material.
 * Can be used for floors or ceilings.
 */
export function Floor({
  position,
  width,
  depth,
  hellFactor,
  isCeiling = false,
}: FloorProps) {
  const floorMaterial = useCorruptionMaterial({
    normalColor: isCeiling ? 0xf5f5f5 : 0x8b7355, // White ceiling or wood floor
    hellColor: 0x0d0000,   // Dark corrupted
  });

  // Update hell factor
  if (floorMaterial.uniforms) {
    floorMaterial.uniforms.hellFactor.value = hellFactor;
  }

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]} // Rotate to be horizontal
      material={floorMaterial}
    >
      <planeGeometry args={[width, depth]} />
    </mesh>
  );
}

export default Floor;
