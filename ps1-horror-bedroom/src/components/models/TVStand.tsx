import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface TVStandProps {
  hellFactor: number;
}

export function TVStand({ hellFactor }: TVStandProps) {
  const standMaterial = useCorruptionMaterial({
    normalColor: 0x2c2c2c,
    hellColor: 0x0a0000,
  });

  const tvMaterial = useCorruptionMaterial({
    normalColor: 0x1a1a1a,
    hellColor: 0x000000,
  });

  const screenMaterial = useCorruptionMaterial({
    normalColor: 0x4080ff,
    hellColor: 0xff0000,
  });

  // Update hell factor
  if (standMaterial.uniforms) standMaterial.uniforms.hellFactor.value = hellFactor;
  if (tvMaterial.uniforms) tvMaterial.uniforms.hellFactor.value = hellFactor;
  if (screenMaterial.uniforms) screenMaterial.uniforms.hellFactor.value = hellFactor;

  // Set screen material properties
  screenMaterial.side = 2; // THREE.DoubleSide
  screenMaterial.polygonOffset = true;
  screenMaterial.polygonOffsetFactor = -1;
  screenMaterial.polygonOffsetUnits = -1;

  return (
    <group>
      {/* Stand */}
      <mesh position={[0, 0.4, -4.5]} material={standMaterial}>
        <boxGeometry args={[2.5, 0.8, 0.8]} />
      </mesh>

      {/* TV body */}
      <mesh position={[0, 1.4, -4.35]} material={tvMaterial}>
        <boxGeometry args={[2, 1.2, 0.15]} />
      </mesh>

      {/* Screen */}
      <mesh position={[0, 1.4, -4.2]} material={screenMaterial}>
        <planeGeometry args={[1.8, 1]} />
      </mesh>
    </group>
  );
}

export default TVStand;
