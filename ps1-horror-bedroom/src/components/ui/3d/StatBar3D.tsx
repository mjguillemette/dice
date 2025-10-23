import React from "react";
import * as THREE from "three";
import { useSpring, a } from "@react-spring/three";

const bgMaterial = new THREE.MeshBasicMaterial({ color: "#333333" });

interface StatBar3DProps {
  value: number;
  max: number;
  width: number;
  height: number;
  color: string;
  [key: string]: any; // for position
}

export const StatBar3D = ({
  value,
  max,
  width,
  height,
  color,
  ...props
}: StatBar3DProps) => {
  // Clamp percentage between 0 and 1
  const percentage = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  // Animate the bar fill
  const { scaleX } = useSpring({
    scaleX: percentage,
    config: { tension: 300, friction: 30 }
  });

  const barGeometry = React.useMemo(
    () => new THREE.BoxGeometry(width, height, 0.01),
    [width, height]
  );

  // Memoize the fill material so we can update its color
  const fillMaterial = React.useMemo(
    () => new THREE.MeshBasicMaterial({ color }),
    [color]
  );
  // Update color if it changes
  fillMaterial.color.set(color);

  return (
    <group {...props}>
      {/* Background */}
      <mesh
        raycast={() => null}
        geometry={barGeometry}
        material={bgMaterial}
        position={[0, 0, -0.001]} // Place slightly behind fill
      />
      {/* Fill */}
      {/* Apply animation scale */}
      <a.group scale-x={scaleX} position-x={-width / 2}>
        <mesh
          raycast={() => null}
          geometry={barGeometry}
          material={fillMaterial}
          // Position relative to the scaled group's origin
          position-x={width / 2}
        />
      </a.group>
    </group>
  );
};
