/**
 * Visual debug overlay for dice tray collision bounds
 * Shows a wireframe box representing the collision area
 */

import { useEffect, useState } from "react";
import { getReceptacleBounds, RECEPTACLE_DIMENSIONS, RECEPTACLE_POSITION, COLLISION_BOUNDS_OFFSET } from "../../constants/receptacleConfig";
import { getShowDiceTrayBounds } from "../../config/devState";

export function DiceTrayBoundsDebug() {
  const [bounds, setBounds] = useState(getReceptacleBounds());
  const [visible, setVisible] = useState(getShowDiceTrayBounds());
  const [wallOffset, setWallOffset] = useState(COLLISION_BOUNDS_OFFSET.wallHeight);
  const [depthOffset, setDepthOffset] = useState(COLLISION_BOUNDS_OFFSET.depth);

  // Update bounds and visibility when they change
  useEffect(() => {
    const interval = setInterval(() => {
      setBounds(getReceptacleBounds());
      setVisible(getShowDiceTrayBounds());
      setWallOffset(COLLISION_BOUNDS_OFFSET.wallHeight);
      setDepthOffset(COLLISION_BOUNDS_OFFSET.depth);
    }, 100); // Poll every 100ms to catch dev panel changes

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  // Calculate position and size for the wireframe
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;

  const baseY = RECEPTACLE_POSITION[1] + RECEPTACLE_DIMENSIONS.baseThickness + depthOffset;
  const wallHeight = RECEPTACLE_DIMENSIONS.wallHeight + wallOffset;

  return (
    <group>
      {/* Filled plane showing the floor bounds area */}
      <mesh position={[centerX, baseY, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color="#ff6b4a"
          transparent
          opacity={0.15}
          side={2} // DoubleSide
        />
      </mesh>

      {/* Wireframe outline for clear visibility */}
      <mesh position={[centerX, baseY, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color="#ff6b4a"
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Wall visualizations */}
      {[
        // Front wall (minZ)
        { pos: [centerX, baseY + wallHeight / 2, bounds.minZ], size: [width, wallHeight, 0.01] },
        // Back wall (maxZ)
        { pos: [centerX, baseY + wallHeight / 2, bounds.maxZ], size: [width, wallHeight, 0.01] },
        // Left wall (minX)
        { pos: [bounds.minX, baseY + wallHeight / 2, centerZ], size: [0.01, wallHeight, depth] },
        // Right wall (maxX)
        { pos: [bounds.maxX, baseY + wallHeight / 2, centerZ], size: [0.01, wallHeight, depth] }
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos as [number, number, number]}>
          <boxGeometry args={wall.size as [number, number, number]} />
          <meshBasicMaterial
            color="#ffaa66"
            wireframe
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Corner markers for precision */}
      {[
        [bounds.minX, bounds.minZ],
        [bounds.maxX, bounds.minZ],
        [bounds.minX, bounds.maxZ],
        [bounds.maxX, bounds.maxZ]
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, baseY + 0.01, z]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ff6b4a" />
        </mesh>
      ))}
    </group>
  );
}
