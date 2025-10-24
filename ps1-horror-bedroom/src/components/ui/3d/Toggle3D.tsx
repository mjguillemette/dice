import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";
import { useCursor } from "@react-three/drei";

interface Toggle3DProps {
  value: boolean; // true = on, false = off
  onChange: (value: boolean) => void;
  size?: number;
  [key: string]: any; // for position, rotation, etc.
}

export const Toggle3D = ({
  value,
  onChange,
  size = 0.1,
  ...props
}: Toggle3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setHovered] = useState(false);
  const { camera, raycaster } = useThree();
  useCursor(isHovered);

  const geometry = React.useMemo(
    () => new THREE.BoxGeometry(size * 2, size, size * 1.2),
    [size]
  );

  // Attach onClick to userData
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.onClick = () => {
        onChange(!value); // Toggle the value
      };
    }
    return () => {
      if (meshRef.current) {
        delete meshRef.current.userData.onClick;
      }
    };
  }, [onChange, value]); // Include value in dependencies

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

  // Animation for color change
  const { color } = useSpring({
    color: isHovered ? "#FFFFFF" : value ? "#2ECC40" : "#FF4136",
    config: { tension: 400, friction: 30 }
  });

  return (
    <group {...props}>
      <a.mesh ref={meshRef} geometry={geometry}>
        <a.meshStandardMaterial color={color as any} roughness={0.6} />
      </a.mesh>
    </group>
  );
};
