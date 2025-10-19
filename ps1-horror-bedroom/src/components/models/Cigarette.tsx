import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

interface CigaretteProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  count?: number; // Number of cigarettes in pack (1-20)
  onHover?: (isHovered: boolean) => void;
}

/**
 * Cigarette 3D Model
 * A simple procedural cigarette made from cylinders
 */
export function Cigarette({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  count = 1,
  onHover
}: CigaretteProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { camera, raycaster } = useThree();

  // Check for hover on each frame
  useFrame(() => {
    if (!groupRef.current || !onHover) return;

    // Raycast from center of screen (where crosshair is)
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Get all meshes in the group
    const meshes: THREE.Object3D[] = [];
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(meshes, false);
    onHover(intersects.length > 0);
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Cigarette pack box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.055, 0.085, 0.022]} />
        <meshStandardMaterial color="#E8E8E8" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Pack label/stripe (red) */}
      <mesh position={[0, 0.02, 0.0115]}>
        <boxGeometry args={[0.056, 0.02, 0.001]} />
        <meshStandardMaterial color="#CC0000" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Count text on pack */}
      <Text
        position={[0, 0, 0.013]}
        fontSize={0.015}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        font="Jersey25-Regular.ttf"
      >
        {count}/20
      </Text>

      {/* Single cigarette sticking out of top */}
      <group position={[0, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        {/* Cigarette body (white paper) */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.04, 8]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.8} metalness={0.1} />
        </mesh>

        {/* Filter (orange/tan) */}
        <mesh position={[0, -0.015, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.01, 8]} />
          <meshStandardMaterial color="#D2691E" roughness={0.7} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export default Cigarette;
