import React, { useEffect, useRef, useState } from "react";
import { useCursor, Text } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

/* ---------- Card3D (Corrected) ---------- */
const Card3D = ({
  width = 1.4,
  height = 0.8,
  depth = 0.05,
  color = "#222",
  children
}: any) => (
  <group name="ui_3d">
    <mesh
      // This tells the event system to ignore this mesh for pointer events,
      // allowing clicks to pass through to the buttons.
      raycast={() => null}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
    </mesh>
    {/* Position children just in front of the card's face */}
    <group position={[0, 0, depth / 2 + 0.001]}>{children}</group>
  </group>
);

/* ---------- Button3D (Refactored for FPS) ---------- */
const Button3D = ({
  label,
  onClick,
  color = "#2f80ed",
  hoverColor = "#56ccf2",
  width = 0.8,
  height = 0.25,
  name // NEW: We need a unique name to identify this button
}: any) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setHovered] = useState(false);
  const { camera, raycaster } = useThree();

  useCursor(isHovered);

  // This component now handles its own click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isHovered) {
        event.stopPropagation(); // Consume the click!
        onClick?.();
      }
    };

    // Add its own listener, just like ItemChoice
    window.addEventListener("mousedown", handleClick, true);
    return () => {
      window.removeEventListener("mousedown", handleClick, true);
    };
  }, [isHovered, onClick]);

  // This component now handles its own hover raycast
  useFrame(() => {
    if (!meshRef.current) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObject(meshRef.current, true);

    // Check if the first hit object is this button
    const nowHovered =
      intersects.length > 0 && intersects[0].object === meshRef.current;
    setHovered(nowHovered);
  });

  const { scale } = useSpring({
    scale: isHovered ? 1.05 : 1,
    config: { tension: 300, friction: 10 }
  });

  return (
    <a.group scale={scale}>
      <mesh
        ref={meshRef}
        name={name} // Apply the unique name
      >
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={isHovered ? hoverColor : color} />
      </mesh>
      <Text
        fontSize={0.1}
        position={[0, 0, 0.03]}
        anchorX="center"
        anchorY="middle"
        raycast={() => null} // Make sure text doesn't block raycast
      >
        {label}
      </Text>
    </a.group>
  );
};

/* ---------- Select3D (Improved) ---------- */
const Select3D = ({ options, value, onChange }: any) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(options.indexOf(value) || 0);

  const toggle = () => setOpen((s) => !s);

  const selectOption = (i: number) => {
    setIndex(i);
    onChange?.(options[i]);
    setOpen(false);
  };

  return (
    <group name="ui_3d">
      {/* Main button */}
      <Button3D
        label={options[index]}
        onClick={toggle}
        color="#555"
        hoverColor="#888"
      />

      {/* Option list */}
      {open && (
        // Position the dropdown slightly BEHIND the main button to prevent overlap
        <group name="ui_3d" position={[0, -0.32, -0.01]}>
          {options.map((opt: string, i: number) => (
            <Button3D
              key={i}
              label={opt}
              onClick={() => selectOption(i)}
              color={i === index ? "#777" : "#444"}
              hoverColor="#666"
              width={0.8}
              height={0.22}
              name={`button_option_${index}`}
            />
          ))}
        </group>
      )}
    </group>
  );
};

/* ---------- FormOnCube (Corrected Scene Graph) ---------- */
const FormOnCube = () => {
  const [choice, setChoice] = useState("Red");

  return (
    <group name="ui_3d">
      <mesh rotation={[-0.7, Math.PI / 5, .1]}>
      
        {/* Position the card relative to the cube's front face */}
        <group position={[-1.9, -.4, 1.601]} scale={.5} rotation={[-0.75, Math.PI / 5, 1.3]}>
          <Card3D>
            <group position={[0, 0.15, 0]}>
              <Select3D
                options={["Red", "Green", "Blue"]}
                value={choice}
                onChange={setChoice}
                name="select_color"
              />
            </group>
            <group position={[0, -0.2, 0]}>
              <Button3D
                label="Submit"
                onClick={() => console.log("Selected:", choice)}
                name="button_submit"
              />
            </group>
          </Card3D>
        </group>
      </mesh>
    </group>
  );
};

export default FormOnCube;
