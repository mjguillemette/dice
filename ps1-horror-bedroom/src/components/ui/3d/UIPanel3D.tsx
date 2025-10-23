import React, { forwardRef } from "react"; // Import forwardRef
import * as THREE from "three";
import { a } from "@react-spring/three";

// Animatable material
const AMaterial = a.meshStandardMaterial;

const panelGeometry = (width: number, height: number, depth: number) =>
  new THREE.BoxGeometry(width, height, depth);

interface UIPanel3DProps {
  width: number;
  height: number;
  depth?: number;
  children?: React.ReactNode;
  color?: string | THREE.Color | any; // Accept animated color
  opacity?: number | any; // Accept animated opacity
  meshRef?: React.Ref<THREE.Mesh>; // New prop for mesh ref
  [key: string]: any;
}

// Use forwardRef to pass the ref down to the group
export const UIPanel3D = forwardRef<THREE.Group, UIPanel3DProps>(
  (
    {
      width,
      height,
      depth = 0.05, // Sensible default depth
      children,
      color = "#16161d", // Default color
      opacity = 1, // Default opacity
      meshRef, // Destructure meshRef
      ...props
    },
    ref // 'ref' here is the ref for the main group
  ) => (
    <group ref={ref} {...props}>
      {/* The main panel mesh */}
      <mesh
        ref={meshRef} // Apply the specific meshRef to the mesh
        raycast={() => null} // Ignore raycasts for the background panel itself
        geometry={panelGeometry(width, height, depth)}
        // Material properties are now handled below
      >
        {/* Use animatable material and pass animated props */}
        <AMaterial
          color={color} // Pass animated color
          opacity={opacity} // Pass animated opacity
          roughness={0.5}
          metalness={0.1}
          transparent={true} // Set transparent to true to allow opacity changes
          // Optimize rendering: disable depth write when partially transparent
          depthWrite={opacity === 1}
        />
      </mesh>
      {/* Position children just in front of the panel */}
      <group position={[0, 0, depth / 2 + 0.001]}>{children}</group>
    </group>
  )
);

// Add display name for better debugging
UIPanel3D.displayName = "UIPanel3D";
