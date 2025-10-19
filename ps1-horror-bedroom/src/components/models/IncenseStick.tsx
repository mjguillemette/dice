import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface IncenseStickProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isActive?: boolean; // Whether incense is currently burning/active
  onHover?: (isHovered: boolean) => void;
}

const OUTLINE_THICKNESS = 1.15;

/**
 * Incense Stick 3D Model
 * A simple procedural incense stick with optional smoke particle effect
 */
export function IncenseStick({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  isActive = false,
  onHover
}: IncenseStickProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const smokeRef = useRef<THREE.Mesh>(null);
  const [smokeOpacity, setSmokeOpacity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { camera, raycaster } = useThree();

  // Animate smoke when active and check for hover
  useFrame((state) => {
    // Smoke animation
    if (smokeRef.current && isActive) {
      const time = state.clock.getElapsedTime();
      smokeRef.current.position.y = 0.02 + Math.sin(time * 2) * 0.005;
      smokeRef.current.scale.setScalar(0.8 + Math.sin(time * 1.5) * 0.2);
      setSmokeOpacity(0.3 + Math.sin(time * 3) * 0.1);
    } else if (smokeRef.current) {
      setSmokeOpacity(0);
    }

    // Hover detection
    if (groupRef.current && onHover) {
      // Raycast from center of screen (where crosshair is)
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      // Get all meshes in the group (except smoke)
      const meshes: THREE.Object3D[] = [];
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child !== smokeRef.current) {
          meshes.push(child);
        }
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      const nowHovered = intersects.length > 0;
      setIsHovered(nowHovered);
      onHover(nowHovered);
    }
  });

  // Outline color - purple/maroon to match incense coating
  const outlineColor = "#8B5A9F";

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Outline for wooden stick */}
      <mesh
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        visible={isHovered}
        scale={[OUTLINE_THICKNESS, OUTLINE_THICKNESS, OUTLINE_THICKNESS]}
      >
        <cylinderGeometry args={[0.001, 0.001, 0.1, 6]} />
        <meshBasicMaterial color={outlineColor} side={THREE.BackSide} />
      </mesh>

      {/* Wooden stick (brown) */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.001, 0.001, 0.1, 6]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Outline for incense coating */}
      <mesh
        position={[0.03, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        visible={isHovered}
        scale={[OUTLINE_THICKNESS, OUTLINE_THICKNESS, OUTLINE_THICKNESS]}
      >
        <cylinderGeometry args={[0.0015, 0.0015, 0.04, 6]} />
        <meshBasicMaterial color={outlineColor} side={THREE.BackSide} />
      </mesh>

      {/* Incense coating (dark purple/maroon) */}
      <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0015, 0.0015, 0.04, 6]} />
        <meshStandardMaterial color="#4A1C40" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Outline for burning tip */}
      <mesh
        position={[0.05, 0, 0]}
        visible={isHovered}
        scale={[OUTLINE_THICKNESS, OUTLINE_THICKNESS, OUTLINE_THICKNESS]}
      >
        <sphereGeometry args={[0.002, 8, 8]} />
        <meshBasicMaterial color={outlineColor} side={THREE.BackSide} />
      </mesh>

      {/* Burning tip (orange glow when active) */}
      <mesh position={[0.05, 0, 0]}>
        <sphereGeometry args={[0.002, 8, 8]} />
        <meshStandardMaterial
          color={isActive ? "#FF6600" : "#2C2C2C"}
          emissive={isActive ? "#FF3300" : "#000000"}
          emissiveIntensity={isActive ? 0.8 : 0}
          roughness={0.5}
        />
      </mesh>

      {/* Smoke particle (when active) */}
      {isActive && (
        <mesh ref={smokeRef} position={[0.05, 0.02, 0]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial
            color="#888888"
            transparent
            opacity={smokeOpacity}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export default IncenseStick;
