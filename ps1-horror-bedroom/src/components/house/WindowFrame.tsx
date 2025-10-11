import { useCorruptionMaterial } from '../../hooks/useCorruptionMaterial';

interface WindowFrameProps {
  position: [number, number, number];
  width: number;
  height: number;
  rotation?: [number, number, number];
  hellFactor: number;
}

/**
 * Window Frame Component
 *
 * Creates a window frame with four sides
 */
export function WindowFrame({
  position,
  width,
  height,
  rotation = [0, 0, 0],
  hellFactor,
}: WindowFrameProps) {
  const frameMaterial = useCorruptionMaterial({
    normalColor: 0x654321, // Dark wood
    hellColor: 0x1a0000,
  });

  if (frameMaterial.uniforms) {
    frameMaterial.uniforms.hellFactor.value = hellFactor;
  }

  const frameThickness = 0.08;
  const frameDepth = 0.15;

  return (
    <group position={position} rotation={rotation}>
      {/* Left frame */}
      <mesh position={[-width / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Right frame */}
      <mesh position={[width / 2, 0, 0]}>
        <boxGeometry args={[frameThickness, height, frameDepth]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Top frame */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Bottom frame */}
      <mesh position={[0, -height / 2, 0]}>
        <boxGeometry args={[width + frameThickness * 2, frameThickness, frameDepth]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Cross divider (vertical middle) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[frameThickness / 2, height, frameDepth]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      {/* Cross divider (horizontal middle) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, frameThickness / 2, frameDepth]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
    </group>
  );
}

export default WindowFrame;
