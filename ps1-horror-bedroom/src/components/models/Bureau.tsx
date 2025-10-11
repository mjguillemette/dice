import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';
import { BUREAU } from '../../constants/modelPositions';

interface BureauProps {
  hellFactor: number;
}

export function Bureau({ hellFactor }: BureauProps) {
  const bureauMaterial = useCorruptionMaterial({
    normalColor: 0x8b4513,
    hellColor: 0x2d0000,
  });

  const drawerMaterial = useCorruptionMaterial({
    normalColor: 0x654321,
    hellColor: 0x1a0000,
  });

  const handleMaterial = useCorruptionMaterial({
    normalColor: 0xc0c0c0,
    hellColor: 0x660000,
  });

  // Update hell factor
  if (bureauMaterial.uniforms) bureauMaterial.uniforms.hellFactor.value = hellFactor;
  if (drawerMaterial.uniforms) drawerMaterial.uniforms.hellFactor.value = hellFactor;
  if (handleMaterial.uniforms) handleMaterial.uniforms.hellFactor.value = hellFactor;

  // Bureau position - change in modelPositions.ts to move the entire bureau
  const BUREAU_POSITION = BUREAU.position;
  const BUREAU_WIDTH = BUREAU.dimensions.width;
  const BUREAU_HEIGHT = BUREAU.dimensions.height;
  const BUREAU_DEPTH = BUREAU.dimensions.depth;

  // Drawer dimensions and offsets (relative to bureau center)
  const DRAWER_WIDTH = BUREAU.drawer.width;
  const DRAWER_HEIGHT = BUREAU.drawer.height;
  const DRAWER_DEPTH = BUREAU.drawer.depth;
  const DRAWER_OFFSET_Y = -0.2; // Start position for first drawer
  const DRAWER_SPACING = 0.5;
  const DRAWER_OFFSET_Z = BUREAU_DEPTH / 2 + DRAWER_DEPTH / 2 + 0.05;

  // Handle offset (relative to drawer)
  const HANDLE_OFFSET_Z = DRAWER_DEPTH / 2 + 0.03;

  return (
    <group position={BUREAU_POSITION}>
      {/* Bureau body */}
      <mesh position={[0, 0, 0]} material={bureauMaterial}>
        <boxGeometry args={[BUREAU_WIDTH, BUREAU_HEIGHT, BUREAU_DEPTH]} />
      </mesh>

      {/* Drawers */}
      {[0, 1].map((i) => (
        <group key={i}>
          {/* Drawer */}
          <mesh
            position={[0, DRAWER_OFFSET_Y + i * DRAWER_SPACING, DRAWER_OFFSET_Z]}
            material={drawerMaterial}
          >
            <boxGeometry args={[DRAWER_WIDTH, DRAWER_HEIGHT, DRAWER_DEPTH]} />
          </mesh>

          {/* Handle */}
          <mesh
            position={[0, DRAWER_OFFSET_Y + i * DRAWER_SPACING, DRAWER_OFFSET_Z + HANDLE_OFFSET_Z]}
            material={handleMaterial}
          >
            <sphereGeometry args={[0.05, 6, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default Bureau;
