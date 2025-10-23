import React from "react";
import { Text } from "@react-three/drei";

interface Text3DProps {
  children: React.ReactNode;
  fontSize?: number;
  color?: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
  [key: string]: any; // for position
}

export const Text3D = ({
  children,
  fontSize = 0.1,
  color = "#FFFFFF",
  anchorX = "left",
  anchorY = "middle",
  ...props
}: Text3DProps) => (
  <Text
    raycast={() => null} // Ignore raycasts
    fontSize={fontSize}
    color={color}
    anchorX={anchorX}
    anchorY={anchorY}
    {...props}
  >
    {children}
  </Text>
);