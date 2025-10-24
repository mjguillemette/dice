import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
// Removed 'a' and 'useSpring' as color is not animated directly here
import * as THREE from "three";
import { useCursor, Text } from "@react-three/drei";

// Materials
const matNormal = new THREE.MeshStandardMaterial({
  color: "#444444",
  roughness: 0.7
});
const matHover = new THREE.MeshStandardMaterial({
  color: "#666666",
  roughness: 0.7
});
const matActive = new THREE.MeshStandardMaterial({
  color: "#0074D9",
  roughness: 0.7
});
const matActiveHover = new THREE.MeshStandardMaterial({
  color: "#3498DB",
  roughness: 0.7
});

interface TabButton3DProps {
  label: string;
  onClick: () => void;
  isActive: boolean;
  width?: number;
  height?: number;
  depth?: number;
  [key: string]: any; // for position, rotation, etc.
}

export const TabButton3D = ({
  label,
  onClick,
  isActive,
  width = 0.5,
  height = 0.15,
  depth = 0.04,
  ...props
}: TabButton3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setHovered] = useState(false);
  const { camera, raycaster } = useThree();
  useCursor(isHovered);

  const geometry = React.useMemo(
    () => new THREE.BoxGeometry(width, height, depth),
    [width, height, depth]
  );

  // Attach onClick to userData
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.onClick = () => {
        onClick(); // Call the passed onClick
      };
    }
    return () => {
      if (meshRef.current) {
        delete meshRef.current.userData.onClick;
      }
    };
  }, [onClick]);

  // Handle Hover (FPS Style)
  useFrame(() => {
    if (!meshRef.current) return;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObject(meshRef.current, true);
    const nowHovered =
      intersects.length > 0 && intersects[0].object === meshRef.current;
    if (nowHovered !== isHovered) {
      setHovered(nowHovered);
    }
  });

  // Determine material based on state
  const currentMaterial = isActive
    ? isHovered
      ? matActiveHover
      : matActive
    : isHovered
    ? matHover
    : matNormal;

  return (
    <group {...props}>
      <mesh ref={meshRef} geometry={geometry} material={currentMaterial} />
      <Text
        fontSize={height * 0.5}
        color={isActive ? "#FFFFFF" : "#AAAAAA"}
        position={[0, 0, depth / 2 + 0.01]}
        anchorX="center"
        anchorY="middle"
        raycast={() => null}
      >
        {label}
      </Text>
    </group>
  );
};
