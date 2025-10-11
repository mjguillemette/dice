import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface WallProps {
  position: [number, number, number];
  width: number;
  height: number;
  thickness?: number;
  rotation?: [number, number, number];
  hellFactor: number;
}

/**
 * Reusable Wall Component
 *
 * Creates a simple wall with corruption material.
 * Can be rotated to create walls in any direction.
 */
export function Wall({
  position,
  width,
  height,
  thickness = 0.15,
  rotation = [0, 0, 0],
  hellFactor,
}: WallProps) {
  const wallMaterial = useCorruptionMaterial({
    normalColor: 0xe8e4d9, // Off-white plaster
    hellColor: 0x1a0000,   // Dark corrupted
  });

  // Update hell factor
  if (wallMaterial.uniforms) {
    wallMaterial.uniforms.hellFactor.value = hellFactor;
  }

  return (
    <mesh position={position} rotation={rotation} material={wallMaterial}>
      <boxGeometry args={[width, height, thickness]} />
    </mesh>
  );
}

export default Wall;
