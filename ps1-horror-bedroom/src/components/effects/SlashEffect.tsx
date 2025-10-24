import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type SlashType = "single" | "double" | "cleave";

interface SlashEffectProps {
  position: [number, number, number];
  type: SlashType;
  onComplete?: () => void;
}

/**
 * SlashEffect - Animated slash visual effect for combat abilities
 * Creates a quick white slash with red tint that fades out
 */
export function SlashEffect({ position, type, onComplete }: SlashEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const hasCompletedRef = useRef(false);

  const duration = 0.4; // 400ms animation

  useEffect(() => {
    // Reset on mount
    progressRef.current = 0;
    hasCompletedRef.current = false;
  }, []);

  useFrame((_state, delta) => {
    if (!groupRef.current || hasCompletedRef.current) return;

    progressRef.current += delta / duration;

    if (progressRef.current >= 1) {
      progressRef.current = 1;
      hasCompletedRef.current = true;
      onComplete?.();
    }

    const progress = progressRef.current;

    // Fade out effect
    const opacity = 1 - progress;

    // Scale animation (slashes grow slightly then shrink)
    const scale = progress < 0.5
      ? 1 + progress * 0.3
      : 1.15 - (progress - 0.5) * 0.3;

    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
        child.material.opacity = opacity;
        child.scale.setScalar(scale);
      }
    });
  });

  // Create slash geometry based on type
  const createSlash = (offsetX: number, rotation: number, delay: number = 0) => {
    const adjustedOpacity = delay > 0 ? 0 : 1;

    return (
      <mesh
        position={[offsetX, 0, 0]}
        rotation={[0, 0, rotation]}
        key={`${offsetX}-${rotation}`}
      >
        <planeGeometry args={[0.011, 0.05]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={adjustedOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    );
  };

  const renderSlashes = () => {
    switch (type) {
      case "single":
        // Single diagonal slash
        return createSlash(0, Math.PI / 4);

      case "double":
        // Two diagonal slashes forming an X
        return (
          <>
            {createSlash(-0.017, Math.PI / 4)}
            {createSlash(0.017, -Math.PI / 4)}
          </>
        );

      case "cleave":
        // Wide horizontal slash
        return createSlash(0, 0);

      default:
        return null;
    }
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Red glow background */}
      <mesh>
        <sphereGeometry args={[0.05, 3, 3]} />
        <meshBasicMaterial
          color="#ff2c4b"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* White slashes */}
      {renderSlashes()}
    </group>
  );
}
