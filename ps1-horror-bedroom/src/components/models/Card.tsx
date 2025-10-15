import { useRef, useMemo, useState } from "react";
import { useLoader } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import towerTexture from "../../assets/textures/tower.png";
import sunTexture from "../../assets/textures/sun.png";

interface CardProps {
  position: [number, number, number];
  hellFactor: number;
  hasItemOnTop: boolean; // Whether dice have landed on this card
  showDebugBounds?: boolean; // Whether to show the detection bounds
  onDiceEnter?: (diceId: number) => void; // Called when a die enters the card area
  cardType?: "tower" | "sun"; // Type of card texture to use
}

/**
 * Card Component - A flat card that sits on the receptacle
 * Detects when dice land on top of it
 */
export function Card({
  position,
  hellFactor,
  hasItemOnTop,
  showDebugBounds = false,
  onDiceEnter,
  cardType = "tower"
}: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [recentCollisions, setRecentCollisions] = useState<Set<number>>(
    new Set()
  );

  // Card dimensions - Tarot, longer than a playing card
  const cardWidth = 0.165;
  const cardLength = 0.295;
  const cardThickness = 0.002 * hellFactor;

  // Calculate final position (don't mutate the prop)
  const finalPosition: [number, number, number] = [
    position[0] + cardWidth / 2, // Center on receptacle
    position[1] + cardThickness / 2, // Keep Y position 
    position[2] - cardLength / 2 // Adjust Z position
  ];

  // Load the appropriate texture based on card type
  const texture = useLoader(
    THREE.TextureLoader,
    cardType === "sun" ? sunTexture : towerTexture
  );

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
      emissive: hasItemOnTop
        ? new THREE.Color(0x00ff00)
        : new THREE.Color(0x000000),
      emissiveIntensity: hasItemOnTop ? 0.5 : 0.0
    });
  }, [texture, hasItemOnTop]);

  // Card rotation (same for visual and debug bounds)
  const cardRotation: [number, number, number] = [-Math.PI / 2, 0.0, 2.87];

  // Create debug bounds visualization material
  const debugMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: hasItemOnTop ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      wireframe: false
    });
  }, [hasItemOnTop]);

  const debugWireframeMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: hasItemOnTop ? 0x00ff00 : 0xffff00,
      linewidth: 2
    });
  }, [hasItemOnTop]);

  // Handle collision detection with dice
  const handleIntersectionEnter = (
    payload: import("@react-three/rapier").CollisionPayload
  ) => {
    const otherBody = payload.other.rigidBody;
    if (!otherBody) return;

    // Get the userData which should contain the dice ID
    const userData = (otherBody as any).userData;
    if (userData && typeof userData.diceId === "number") {
      const diceId = userData.diceId;

      // Throttle to prevent duplicate triggers
      if (!recentCollisions.has(diceId)) {
        console.log("🔮 Die", diceId, "touched the card!");
        setRecentCollisions((prev) => new Set(prev).add(diceId));

        if (onDiceEnter) {
          onDiceEnter(diceId);
        }

        // Clear after 2 seconds
        setTimeout(() => {
          setRecentCollisions((prev) => {
            const next = new Set(prev);
            next.delete(diceId);
            return next;
          });
        }, 2000);
      }
    }
  };

  return (
    <group>
      {/* Visual card mesh */}
      <mesh
        ref={meshRef}
        position={finalPosition}
        rotation={cardRotation} // Lay flat
        material={cardMaterial}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[cardWidth, cardLength]} />
      </mesh>

      {/* Physics sensor for detecting dice collisions */}
      <RigidBody
        type="fixed"
        position={finalPosition}
        rotation={[cardRotation[0], cardRotation[1], cardRotation[2]]}
        sensor
      >
        <CuboidCollider
          args={[cardWidth / 2, 0.001, cardLength / 2]} // Very thin sensor
          onIntersectionEnter={handleIntersectionEnter}
        />
      </RigidBody>

      {/* Debug bounds visualization */}
      {showDebugBounds && (
        <group position={finalPosition}>
          {/* Semi-transparent detection area */}
          <mesh
            position={[0, 0.01, 0]} // Slightly above card
            rotation={cardRotation} // Same rotation as card
            material={debugMaterial}
          >
            <planeGeometry args={[cardWidth, cardLength]} />
          </mesh>

          {/* Wireframe outline */}
          <lineSegments position={[0, 0.01, 0]} rotation={cardRotation}>
            <edgesGeometry
              args={[new THREE.PlaneGeometry(cardWidth, cardLength)]}
            />
            <primitive object={debugWireframeMaterial} attach="material" />
          </lineSegments>
        </group>
      )}
    </group>
  );
}

export default Card;
