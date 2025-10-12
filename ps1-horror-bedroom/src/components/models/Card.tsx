import { useRef, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import towerTexture from "../../assets/textures/tower.png";

interface CardProps {
  position: [number, number, number];
  hellFactor: number;
  hasItemOnTop: boolean; // Whether dice have landed on this card
}

/**
 * Card Component - A flat card that sits on the receptacle
 * Detects when dice land on top of it
 */
export function Card({ position, hellFactor, hasItemOnTop }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Card dimensions - Tarot, longer than a playing card
  const cardWidth = 0.165;
  const cardLength = 0.295;
  const cardThickness = 0.002;

  // Position modified by dimensions
  // position[1] += cardThickness / 2; // Lift slightly above surface
  position[0] += cardWidth / 2; // Center on receptacle
  position[2] -= cardLength / 2;

  // Load the tower texture
  const texture = useLoader(THREE.TextureLoader, towerTexture);

  // Create material with texture
  const cardMaterial = useMemo(() => {
    // Apply pixelated filter for PS1 aesthetic
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1,
      emissive: hasItemOnTop ? new THREE.Color(0x00ff00) : new THREE.Color(0x000000),
      emissiveIntensity: hasItemOnTop ? 0.5 : 0.0,
    });
  }, [texture, hasItemOnTop]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0.02, 4.20]} // Lay flat
      material={cardMaterial}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[cardWidth, cardLength]} />
    </mesh>
  );
}

export default Card;
