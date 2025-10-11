import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WindowGlowProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  hellFactor: number;
}

/**
 * Window Glow Component
 *
 * Creates an eerie red glow outside windows that intensifies with corruption
 * and moves/shifts position over time for unsettling effect
 */
export function WindowGlow({
  position,
  rotation = [0, 0, 0],
  hellFactor,
}: WindowGlowProps) {
  const light1Ref = useRef<THREE.PointLight>(null);
  const light2Ref = useRef<THREE.PointLight>(null);

  // Only show glow when hell factor is significant
  const glowIntensity = Math.max(0, hellFactor - 0.1) * 50; // Starts at 10% corruption, much stronger
  const baseGlowDistance = 0.5; // Base distance outside the window

  // Animate the glow position
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Moving pattern using sine/cosine waves
    const moveX = Math.sin(time * 0.7 + position[0] * 0.3) * 0.3; // Slow horizontal drift
    const moveY = Math.cos(time * 0.5 + position[1] * 0.2) * 0.2; // Slow vertical drift
    const moveZ = Math.sin(time * 0.3 + position[2] * 0.4) * 0.15; // Slight depth movement

    // Pulsing distance effect
    const pulseDistance = Math.sin(time * 1.3) * 0.2;

    if (light1Ref.current) {
      light1Ref.current.position.set(
        moveX,
        moveY,
        -(baseGlowDistance + pulseDistance)
      );

      // Pulsing intensity
      const pulse1 = Math.sin(time * 2.3) * 0.15 + 0.85; // 0.7 to 1.0 range
      light1Ref.current.intensity = glowIntensity * pulse1;
    }

    if (light2Ref.current) {
      // Secondary light moves in opposite pattern
      light2Ref.current.position.set(
        -moveX * 0.7,
        -moveY * 0.5,
        -(baseGlowDistance * 2 + pulseDistance * 1.5)
      );

      // Different pulse timing
      const pulse2 = Math.cos(time * 1.7) * 0.2 + 0.8; // 0.6 to 1.0 range
      light2Ref.current.intensity = glowIntensity * 0.6 * pulse2;
    }
  });

  if (glowIntensity <= 0) {
    return null; // Don't render if no corruption
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Primary moving point light */}
      <pointLight
        ref={light1Ref}
        position={[0, 0, -baseGlowDistance]}
        color="#ff0000"
        intensity={glowIntensity}
        distance={8}
        decay={1.5}
      />

      {/* Secondary moving ambient glow */}
      <pointLight
        ref={light2Ref}
        position={[0, 0, -baseGlowDistance * 2]}
        color="#cc0000"
        intensity={glowIntensity * 0.6}
        distance={12}
        decay={1.5}
      />
    </group>
  );
}

export default WindowGlow;
