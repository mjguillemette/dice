import React, { useRef, useState, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { a, useSpring } from "@react-spring/three";
import * as THREE from "three";
import { useCursor } from "@react-three/drei";

// Materials
const trackMaterial = new THREE.MeshStandardMaterial({
  color: "#333333",
  roughness: 0.8
});
const trackHoverMaterial = new THREE.MeshStandardMaterial({
  color: "#555555",
  roughness: 0.8
}); // Added hover for track
const knobMaterial = new THREE.MeshStandardMaterial({
  color: "#cccccc",
  roughness: 0.5
});
const indicatorMaterial = new THREE.MeshBasicMaterial({
  color: "#99ccff",
  toneMapped: false
}); // Simple bright indicator

interface Slider3DProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  width?: number; // Width of the track
  knobSize?: number;
  [key: string]: any; // for position, rotation, etc.
}

export const Slider3D = ({
  min = 0,
  max = 1,
  step = 0.01,
  value,
  onChange,
  width = 1,
  knobSize = 0.08,
  ...props
}: Slider3DProps) => {
  const groupRef = useRef<THREE.Group>(null!);
  const trackRef = useRef<THREE.Mesh>(null!); // Ref for the track mesh
  const knobRef = useRef<THREE.Mesh>(null!);
  const [isHovered, setHovered] = useState(false); // Now tracks hover over the *track*
  const [indicatorX, setIndicatorX] = useState<number | null>(null); // Position of the hover indicator
  const { camera, raycaster } = useThree();
  useCursor(isHovered);

  // Geometry
  const trackHeight = knobSize * .86;
  const trackDepth = knobSize * 0.4;
  const trackGeometry = React.useMemo(
    () => new THREE.BoxGeometry(width, trackHeight, trackDepth),
    [width, trackHeight, trackDepth]
  );
  const knobGeometry = React.useMemo(
    () => new THREE.BoxGeometry(knobSize, knobSize, knobSize * 1.2),
    [knobSize]
  );
  const indicatorGeometry = React.useMemo(
    () =>
      new THREE.BoxGeometry(
        step * width,
        trackHeight * 1.5,
        trackDepth * 1.5
      ),
    [step, width, trackHeight, trackDepth]
  ); // Indicator size based on step

  // --- Calculations (unchanged) ---
  const valueToX = useCallback(
    (val: number) => {
      const clampedVal = Math.max(min, Math.min(max, val));
      if (max === min) return -width / 2;
      const percentage = (clampedVal - min) / (max - min);
      return -width / 2 + percentage * width;
    },
    [min, max, width]
  );

  const xToValue = useCallback(
    (xPos: number) => {
      if (width === 0) return min;
      const percentage = Math.max(0, Math.min(1, (xPos + width / 2) / width));
      const rawValue = min + percentage * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, width]
  );

  // Animate knob to the current 'value' prop
  const { knobX } = useSpring({
    knobX: valueToX(value),
    config: { tension: 400, friction: 30 }
  });

  // --- Click Handler (Point and Set Value) ---
  const handleClick = useCallback(
    (event?: MouseEvent) => {
      if (event) event.stopPropagation(); // Stop propagation

      // If hovering and indicator position is known, set the value
      if (isHovered && indicatorX !== null) {
        const newValue = xToValue(indicatorX);
        if (newValue !== value) {
          // Only call if value changes
          onChange(newValue);
        }
      }
    },
    [isHovered, indicatorX, xToValue, onChange, value]
  ); // Added value dependency

  // Attach click handler to the track's userData
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.userData.onClick = handleClick;
    }
    // Cleanup
    return () => {
      if (trackRef.current) {
        delete trackRef.current.userData.onClick;
      }
    };
  }, [handleClick]); // Re-attach if handleClick changes

  // --- Hover Logic (Raycast against Track) ---
  useFrame(() => {
    if (!trackRef.current || !groupRef.current) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObject(trackRef.current, true);

    if (intersects.length > 0 && intersects[0].object === trackRef.current) {
      const intersectionPoint = intersects[0].point;
      // Convert world intersection point to local coords relative to the group
      const localPoint = groupRef.current.worldToLocal(
        intersectionPoint.clone()
      );

      // Calculate the potential value and snap it
      const potentialValue = xToValue(localPoint.x);
      // Calculate the indicator's target X based on the snapped value
      const targetIndicatorX = valueToX(potentialValue);

      setIndicatorX(targetIndicatorX); // Store the snapped indicator position
      if (!isHovered) setHovered(true);
    } else {
      if (isHovered) {
        setHovered(false);
        setIndicatorX(null); // Hide indicator when not hovering
      }
    }
  });

  return (
    <group ref={groupRef} {...props}>
      {/* Track - Now interactive */}
      <mesh
        ref={trackRef}
        geometry={trackGeometry}
        material={isHovered ? trackHoverMaterial : trackMaterial}
        // No userData.onClick needed here, attached via useEffect
      />
      {/* Knob - Animated based on 'value' prop */}
      <a.mesh
        ref={knobRef}
        geometry={knobGeometry}
        material={knobMaterial} // Knob doesn't need hover/drag material now
        position-x={knobX}
        position-z={trackDepth / 2 + 0.001}
        raycast={() => null} // Knob is not directly interactive
      />
      {/* Indicator - Visible on hover */}
      {isHovered && indicatorX !== null && (
        <mesh
          geometry={indicatorGeometry}
          material={indicatorMaterial}
          position-x={indicatorX} // Position based on hover intersection
          position-z={trackDepth / 2 + 0.002} // Slightly in front of knob
          raycast={() => null} // Indicator is not interactive
        />
      )}
    </group>
  );
};
