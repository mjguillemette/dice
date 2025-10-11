import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface StaircaseProps {
  topPosition: [number, number, number];
  bottomPosition: [number, number, number];
  width: number;
  steps: number;
  stepHeight: number;
  stepDepth: number;
  hellFactor: number;
}

/**
 * Reusable Staircase Component
 *
 * Creates a staircase connecting two floor levels.
 * Stairs are built from bottom to top.
 */
export function Staircase({
  topPosition,
  bottomPosition,
  width,
  steps,
  stepHeight,
  stepDepth,
  hellFactor,
}: StaircaseProps) {
  const stepMaterial = useCorruptionMaterial({
    normalColor: 0x8b7355, // Wood
    hellColor: 0x1a0000,   // Dark corrupted
  });

  const railingMaterial = useCorruptionMaterial({
    normalColor: 0x654321, // Darker wood
    hellColor: 0x330000,   // Blood-tinged
  });

  // Update hell factor
  if (stepMaterial.uniforms) {
    stepMaterial.uniforms.hellFactor.value = hellFactor;
  }
  if (railingMaterial.uniforms) {
    railingMaterial.uniforms.hellFactor.value = hellFactor;
  }

  // Calculate staircase orientation
  const dx = topPosition[0] - bottomPosition[0];
  const dz = topPosition[2] - bottomPosition[2];
  const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  // Create individual steps
  const stepElements = [];
  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    const x = bottomPosition[0] + dx * progress;
    const y = bottomPosition[1] + (topPosition[1] - bottomPosition[1]) * progress;
    const z = bottomPosition[2] + dz * progress;

    stepElements.push(
      <group key={i} position={[x, y, z]} rotation={[0, angle, 0]}>
        {/* Step tread */}
        <mesh position={[0, stepHeight / 2, 0]} material={stepMaterial}>
          <boxGeometry args={[width, stepHeight, stepDepth]} />
        </mesh>

        {/* Step riser (vertical part) */}
        <mesh
          position={[0, -stepHeight / 2, -stepDepth / 2]}
          material={stepMaterial}
        >
          <boxGeometry args={[width, stepHeight, 0.02]} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {stepElements}

      {/* Left railing */}
      <mesh
        position={[
          (bottomPosition[0] + topPosition[0]) / 2 - (width / 2) * Math.cos(angle),
          (bottomPosition[1] + topPosition[1]) / 2 + 0.5,
          (bottomPosition[2] + topPosition[2]) / 2 - (width / 2) * Math.sin(angle),
        ]}
        rotation={[0, angle, Math.atan2(topPosition[1] - bottomPosition[1], horizontalDistance)]}
        material={railingMaterial}
      >
        <cylinderGeometry args={[0.05, 0.05, horizontalDistance, 8]} />
      </mesh>

      {/* Right railing */}
      <mesh
        position={[
          (bottomPosition[0] + topPosition[0]) / 2 + (width / 2) * Math.cos(angle),
          (bottomPosition[1] + topPosition[1]) / 2 + 0.5,
          (bottomPosition[2] + topPosition[2]) / 2 + (width / 2) * Math.sin(angle),
        ]}
        rotation={[0, angle, Math.atan2(topPosition[1] - bottomPosition[1], horizontalDistance)]}
        material={railingMaterial}
      >
        <cylinderGeometry args={[0.05, 0.05, horizontalDistance, 8]} />
      </mesh>
    </group>
  );
}

export default Staircase;
