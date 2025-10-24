import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";
import { useCursor, Text } from "@react-three/drei";

/* ---------- Button3D (Uses userData.onClick) ---------- */
export const Button3D = ({
  label,
  onClick,
  color = "#2f80ed",
  hoverColor = "#56ccf2",
  width = 0.8,
  height = 0.25,
  name // Optional name for debugging
}: any) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setHovered] = useState(false);
  const { camera, raycaster } = useThree();
  useCursor(isHovered);

  // Attach onClick to userData, called by the Scene's master handler
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData.onClick = (event?: MouseEvent) => {
        // Stop event propagation if needed (though master handler might not pass it)
        onClick?.(event);
      };
      // Optional: Tag as UI if needed by master handler logic
      // meshRef.current.userData.isUI = true;
    }
    // Cleanup function to remove onClick from userData if component unmounts
    return () => {
      if (meshRef.current) {
        delete meshRef.current.userData.onClick;
        // delete meshRef.current.userData.isUI;
      }
    };
  }, [onClick]); // Re-attach if onClick changes

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

  const { scale } = useSpring({
    scale: isHovered ? 1.05 : 1,
    config: { tension: 300, friction: 10 }
  });

  return (
    <a.group scale={scale}>
      <mesh
        ref={meshRef}
        name={name} // Apply optional name
      >
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={isHovered ? hoverColor : color} />
      </mesh>
      <Text
        fontSize={0.1}
        position={[-1, 0, 0.03]}
        anchorX="center"
        anchorY="middle"
        raycast={() => null} // Make sure text doesn't block raycast
      >
        {label}
      </Text>
    </a.group>
  );
};
