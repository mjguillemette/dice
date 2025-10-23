import React from "react";
import { UIPanel3D } from "./UIPanel3D";
import { Text3D } from "./Text3D";

interface MiniDice3DProps {
  value: number;
  [key: string]: any; // for position
}

export const MiniDice3D = ({ value, ...props }: MiniDice3DProps) => {
  const size = 0.06;
  return (
    <UIPanel3D width={size} height={size} depth={size} {...props}>
      <meshBasicMaterial color="#333333" />
      <Text3D
        fontSize={0.04}
        color="#FFFFFF"
        anchorX="center"
        position={[0, 0, size / 2 + 0.001]}
        font="Jersey25-Regular.ttf"
      >
        {value}
      </Text3D>
    </UIPanel3D>
  );
};
