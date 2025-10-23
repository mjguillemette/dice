import React from "react";
import * as THREE from "three";

const dotGeometry = new THREE.SphereGeometry(0.015, 16, 16);
const activeMaterial = new THREE.MeshBasicMaterial({ color: "#FFFFFF" });
const inactiveMaterial = new THREE.MeshBasicMaterial({ color: "#555555" });

interface DotIndicator3DProps {
  max: number;
  current: number;
  spacing?: number;
  [key: string]: any; // for position
}

export const DotIndicator3D = ({
  max,
  current,
  spacing = 0.04,
  ...props
}: DotIndicator3DProps) => {
  const totalWidth = max * spacing - spacing;

  return (
    <group position-x={-totalWidth / 2} {...props}>
      {[...Array(max)].map((_, i) => (
        <mesh
          key={i}
          raycast={() => null}
          geometry={dotGeometry}
          material={i < current ? activeMaterial : inactiveMaterial}
          position-x={i * spacing}
        />
      ))}
    </group>
  );
};