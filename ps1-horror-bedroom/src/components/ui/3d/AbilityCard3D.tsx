import React, { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";

import { UIPanel3D } from "./UIPanel3D"; // Standard UIPanel3D
import { Text3D } from "./Text3D";
import { IconBox3D } from "./IconBox3D";
import { Badge3D } from "./Badge3D";
import { MiniDice3D } from "./MiniDice3D";

type AbilityState = "inactive" | "active" | "hovered" | "disabled";

export interface AbilityCard3DProps {
  title: string;
  description: string;
  iconLetter: string;
  iconColor: string;
  state: AbilityState;
  effectLabel?: string;
  effectValue?: number;
  contributingDice?: number[];
  onClick?: (event?: MouseEvent) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  [key: string]: any; // for position
}

const stateColors = {
  inactive: "#222222",
  active: "#004422",
  hovered: "#006633",
  disabled: "#111111"
};

export const AbilityCard3D = ({
  title,
  description,
  iconLetter,
  iconColor,
  state: externalState, // Rename prop to avoid conflict with internal state
  effectLabel,
  effectValue,
  contributingDice = [],
  onClick,
  onHoverStart,
  onHoverEnd,
  ...props
}: AbilityCard3DProps) => {
  const groupRef = useRef<THREE.Group>(null!);
  const panelMeshRef = useRef<THREE.Mesh>(null!); // Ref specifically for the panel mesh
  const [isHovered, setHovered] = useState(false);
  const { camera, raycaster } = useThree();

  const width = 1.2;
  const height = 0.5;

  // --- NEW: Handle Click (Exact same pattern as Button3D) ---
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Check internal hover state AND ensure the card isn't disabled
      if (
        isHovered &&
        externalState !== "disabled" &&
        externalState !== "inactive"
      ) {
        event.stopPropagation(); // Consume the click!
        onClick?.(event);
      }
    };

    // Add listener in capture phase
    window.addEventListener("mousedown", handleClick, true);
    return () => {
      window.removeEventListener("mousedown", handleClick, true);
    };
  }, [isHovered, onClick, externalState]); // Depend on internal hover and external state

  // --- UPDATED: Handle FPS-style hover detection ---
  useFrame(() => {
    if (!panelMeshRef.current || !groupRef.current) return; // Need panel mesh ref

    // Ignore hover check if card is disabled/inactive externally
    if (externalState === "disabled" || externalState === "inactive") {
      if (isHovered) {
        // Ensure internal state is also reset
        setHovered(false);
        onHoverEnd?.();
      }
      return;
    }

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    // Intersect specifically the panel mesh
    const intersects = raycaster.intersectObject(panelMeshRef.current, true);

    // Check if the hit object IS the panel mesh
    const nowHovered =
      intersects.length > 0 && intersects[0].object === panelMeshRef.current;

    if (nowHovered && !isHovered) {
      setHovered(true);
      onHoverStart?.();
    } else if (!nowHovered && isHovered) {
      setHovered(false);
      onHoverEnd?.();
    }
  });

  // Determine the final state for animation (based on internal hover and external prop)
  const finalState = isHovered ? "hovered" : externalState;

  // Animate scale, color, and opacity
  const { scale, panelColor, panelOpacity } = useSpring({
    scale: finalState === "hovered" ? 1.05 : 1,
    panelColor: stateColors[finalState] || "#222222",
    panelOpacity:
      externalState === "disabled" || externalState === "inactive" ? 0.5 : 1, // Opacity based on external state
    config: { tension: 300, friction: 15 }
  });

  const showEffect = externalState === "active" || finalState === "hovered"; // Show effect based on external state + hover

  return (
    // Use a.group for scale animation
    <a.group ref={groupRef} scale={scale} {...props}>
      {/* Pass animated color and opacity to UIPanel3D props */}
      {/* ADD REF to UIPanel's internal mesh */}
      <UIPanel3D
        meshRef={panelMeshRef} // Pass ref down
        width={width}
        height={height}
        depth={0.05}
        color={panelColor}
        opacity={panelOpacity}
      >
        {/* Badge (Top Right) */}
        {finalState === "active" && (
          <Badge3D
            label="Ready"
            color="#008800"
            position={[width / 2 - 0.1, height / 2 - 0.05, 0.03]}
          />
        )}
        {finalState === "hovered" && (
          <Badge3D
            label="Ready"
            color="#00AA00"
            position={[width / 2 - 0.1, height / 2 - 0.05, 0.03]}
          />
        )}
        {finalState === "disabled" && (
          <Badge3D
            label="Blocked"
            color="#550000"
            position={[width / 2 - 0.1, height / 2 - 0.05, 0.03]}
          />
        )}

        {/* Main Content */}
        <group position={[-width / 2 + 0.05, 0, 0.03]}>
          {/* Icon */}
          <IconBox3D
            letter={iconLetter}
            color={iconColor}
            size={0.12}
            position={[0.06, 0.15, 0]}
          />
          {/* Info Column */}
          <group position={[0.2, 0.15, 0]}>
            <Text3D
              fontSize={0.08}
              font="Jersey25-Regular.ttf"
              anchorX="left"
              color="#FFFFFF"
            >
              {title}
            </Text3D>
            <Text3D
              fontSize={0.05}
              anchorX="left"
              color="#AAAAAA"
              position={[0, -0.07, 0]}
              font="Jersey25-Regular.ttf"
            >
              {description}
            </Text3D>
          </group>

          {/* Effect / Dice (Bottom) */}
          {showEffect && (
            <group position={[0.2, -0.05, 0]}>
              {/* Effect */}
              <UIPanel3D
                width={0.3}
                height={0.08}
                depth={0.01}
                color="#000000"
                opacity={0.3}
              >
                <Text3D
                  fontSize={0.04}
                  color="#AAAAAA"
                  position={[-0.13, 0, 0.006]}
                  font="Jersey25-Regular.ttf"
                >
                  {effectLabel}
                </Text3D>
                <Text3D
                  fontSize={0.05}
                  color="#FFFFFF"
                  anchorX="right"
                  position={[0.13, 0, 0.006]}
                  font="Jersey25-Regular.ttf"
                >
                  {effectValue}
                </Text3D>
              </UIPanel3D>

              {/* Contributing Dice */}
              <group position={[0.35, 0, 0]}>
                {contributingDice.map((dieValue, i) => (
                  <MiniDice3D
                    key={i}
                    value={dieValue}
                    position={[i * 0.08, 0, 0]}
                  />
                ))}
              </group>
            </group>
          )}
        </group>
      </UIPanel3D>
    </a.group>
  );
};
