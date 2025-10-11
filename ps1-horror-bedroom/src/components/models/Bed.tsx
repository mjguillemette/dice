import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface BedProps {
  hellFactor: number;
}

export function Bed({ hellFactor }: BedProps) {
  const mattressMaterial = useCorruptionMaterial({
    normalColor: 0x4169e1,
    hellColor: 0x330033,
  });

  const pillowMaterial = useCorruptionMaterial({
    normalColor: 0xffffff,
    hellColor: 0x440000,
  });

  const frameMaterial = useCorruptionMaterial({
    normalColor: 0x654321,
    hellColor: 0x1a0000,
  });

  // Update hell factor
  if (mattressMaterial.uniforms) mattressMaterial.uniforms.hellFactor.value = hellFactor;
  if (pillowMaterial.uniforms) pillowMaterial.uniforms.hellFactor.value = hellFactor;
  if (frameMaterial.uniforms) frameMaterial.uniforms.hellFactor.value = hellFactor;

  return (
    <group>
      {/* Mattress */}
      <mesh position={[-2, 0.5, -2]} material={mattressMaterial}>
        <boxGeometry args={[3, 0.4, 4]} />
      </mesh>

      {/* Pillow */}
      <mesh position={[-2, 0.8, -3.5]} material={pillowMaterial}>
        <boxGeometry args={[1, 0.2, 0.6]} />
      </mesh>

      {/* Frame */}
      <mesh position={[-2, 0.15, -2]} material={frameMaterial}>
        <boxGeometry args={[3.2, 0.3, 4.2]} />
      </mesh>
    </group>
  );
}

export default Bed;
