import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface DiceReceptacleProps {
  position: [number, number, number];
  hellFactor: number;
}

/**
 * Dice Receptacle Component
 *
 * A large, shallow wooden box/tray for rolling dice into.
 * Classic dice tray design with raised edges to keep dice contained.
 */
export function DiceReceptacle({ position, hellFactor }: DiceReceptacleProps) {
  // Outer wood frame material
  const frameMaterial = useCorruptionMaterial({
    normalColor: 0x654321, // Dark brown wood
    hellColor: 0x1a0000,
  });

  // Inner felt/fabric surface material
  const feltMaterial = useCorruptionMaterial({
    normalColor: 0x2d5016, // Dark green felt
    hellColor: 0x0d0000,
  });

  // Update hell factor
  if (frameMaterial.uniforms) frameMaterial.uniforms.hellFactor.value = hellFactor;
  if (feltMaterial.uniforms) feltMaterial.uniforms.hellFactor.value = hellFactor;

  // Tray dimensions
  const trayWidth = 1.2;
  const trayDepth = 0.8;
  const trayBaseThickness = 0.03;
  const wallHeight = 0.08;
  const wallThickness = 0.04;

  return (
    <group position={position}>
      {/* Base (bottom of tray) */}
      <mesh position={[0, trayBaseThickness / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[trayWidth, trayBaseThickness, trayDepth]} />
      </mesh>

      {/* Felt surface on top of base */}
      <mesh position={[0, trayBaseThickness + 0.005, 0]} material={feltMaterial}>
        <boxGeometry args={[trayWidth - wallThickness * 2, 0.01, trayDepth - wallThickness * 2]} />
      </mesh>

      {/* Front wall (towards player, closer Z) */}
      <mesh
        position={[0, trayBaseThickness + wallHeight / 2, trayDepth / 2 - wallThickness / 2]}
        material={frameMaterial}
      >
        <boxGeometry args={[trayWidth, wallHeight, wallThickness]} />
      </mesh>

      {/* Back wall */}
      <mesh
        position={[0, trayBaseThickness + wallHeight / 2, -(trayDepth / 2 - wallThickness / 2)]}
        material={frameMaterial}
      >
        <boxGeometry args={[trayWidth, wallHeight, wallThickness]} />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-(trayWidth / 2 - wallThickness / 2), trayBaseThickness + wallHeight / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[wallThickness, wallHeight, trayDepth - wallThickness * 2]} />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[trayWidth / 2 - wallThickness / 2, trayBaseThickness + wallHeight / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[wallThickness, wallHeight, trayDepth - wallThickness * 2]} />
      </mesh>
    </group>
  );
}

export default DiceReceptacle;
