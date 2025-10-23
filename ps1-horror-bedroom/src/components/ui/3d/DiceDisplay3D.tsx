import React from "react";
import { a, useSpring } from "@react-spring/three";
import { UIPanel3D } from "./UIPanel3D";
import { Text3D } from "./Text3D";

// Animatable versions are not needed
// const APanel = a(UIPanel3D);
// const AText = a(Text3D);

interface DiceDisplay3DProps {
  value: number;
  isHighlighted: boolean;
  highlightColor?: string;
  [key: string]: any; // for position
}

export const DiceDisplay3D = ({
  value,
  isHighlighted,
  highlightColor = "#FFFFFF",
  ...props
}: DiceDisplay3DProps) => {
  const size = 0.2;

  const { scale, panelColor, textColor } = useSpring({
    scale: isHighlighted ? 1.1 : 1,
    panelColor: isHighlighted ? highlightColor : "#333333",
    textColor: isHighlighted ? "#000000" : "#FFFFFF",
    config: { tension: 300, friction: 15 }
  });

  return (
    // Use an animatable group for the scale
    <a.group scale={scale} {...props}>
      {/* Pass the animated panelColor as a prop.
        UIPanel3D will handle applying it to its material.
      */}
      <UIPanel3D
        width={size}
        height={size}
        depth={size}
        color={panelColor}
        opacity={1}
      >
        {/* This is no longer needed, as UIPanel3D creates its own material.
          <a.meshBasicMaterial color={panelColor as any} /> 
        */}

        {/* Text3D is already animatable from our previous fix.
          Pass the animated textColor as a prop.
        */}
        <Text3D
          fontSize={0.12}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          position={[0, 0, size / 2 + 0.001]}
        >
          {value}
        </Text3D>
      </UIPanel3D>
    </a.group>
  );
};
