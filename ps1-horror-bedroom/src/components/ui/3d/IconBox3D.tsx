import React from "react";
import { Text3D } from "./Text3D"; // Assumes Text3D is in the same folder

interface IconBox3DProps {
  letter: string;
  color: string;
  size?: number;
  [key: string]: any; // for position
}

export const IconBox3D = ({
  letter,
  color,
  size = 0.1,
  ...props
}: IconBox3DProps) => {
  return (
    <group {...props}>
      <mesh raycast={() => null}>
        <boxGeometry args={[size, size, size / 5]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text3D
        fontSize={size * 0.7}
        color="#FFFFFF"
        anchorX="center"
        position={[0, 0, size / 10 + 0.001]}
        font="Jersey25-Regular.ttf"
      >
        {letter.charAt(0).toUpperCase()}
      </Text3D>
    </group>
  );
};
