import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback
} from "react";
import {
  RigidBody,
  RapierRigidBody,
  CuboidCollider,
  CylinderCollider,
  ConeCollider
} from "@react-three/rapier";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useCollisionSound, SOUNDS, getCollisionVelocity } from "../../systems/audioSystem";
import type { CollisionEnterHandler } from "@react-three/rapier";

// Import dice textures
import normalTexture1 from "../../assets/textures/normal-1.png";
import normalTexture2 from "../../assets/textures/normal-2.png";
import normalTexture3 from "../../assets/textures/normal-3.png";
import normalTexture4 from "../../assets/textures/normal-4.png";
import normalTexture5 from "../../assets/textures/normal-5.png";
import normalTexture6 from "../../assets/textures/normal-6.png";

// Import coin textures
import coinHeadsTexture from "../../assets/textures/coinheads.png";
import coinTailsTexture from "../../assets/textures/cointails.png";

interface DiceProps {
  position: [number, number, number];
  initialVelocity?: [number, number, number];
  initialAngularVelocity?: [number, number, number];
  onSettled?: (value: number, position: THREE.Vector3) => void;
  shaderEnabled: boolean;
  maxValue?: number; // 1 for thumbtack, 2 for coin, 3 for d3, 4 for d4, 6 for d6 (default)
  outOfBounds?: boolean; // Whether dice is out of bounds (red tint)
  onCard?: boolean; // Whether dice is on a card (blue tint)
  diceId?: number; // Unique ID for collision detection
  diceType?: string; // Type of dice: "d6", "d4", "d3", "coin", "thumbtack"
  isHovered?: boolean; // Whether the dice is currently being hovered

  // Transformation effects
  sizeMultiplier?: number;
  massMultiplier?: number;
  colorTint?: number;
  emissive?: number;
  emissiveIntensity?: number;
  transformations?: string[]; // List of transformation modifiers applied
  scoreMultiplier?: number; // Score multiplier from transformations
  calculatedScore?: number; // Pre-calculated score with transformations applied
  currencyEarned?: number; // Total currency earned from this die
}

export interface DiceHandle {
  getValue: () => number;
  isSettled: () => boolean;
}

const Dice = forwardRef<DiceHandle, DiceProps>(
  (
    {
      position,
      initialVelocity = [0, 0, 0],
      initialAngularVelocity = [0, 0, 0],
      onSettled,
      shaderEnabled,
      maxValue = 6,
      outOfBounds = false,
      onCard = false,
      sizeMultiplier = 1.0,
      massMultiplier = 1.0,
      colorTint,
      emissive,
      emissiveIntensity = 0,
      diceId,
      diceType = "d6",
      isHovered = false,
      transformations = [],
      scoreMultiplier = 1.0,
      calculatedScore,
      currencyEarned
    },
    ref
  ) => {
    const rigidBodyRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const [settled, setSettled] = useState(false);
    const [diceValue, setDiceValue] = useState(1);
    const settledTimeRef = useRef(0);
    const pulseTimeRef = useRef(0);
    const creationTimeRef = useRef(0);
    const hasSettledRef = useRef(false); // Track if we've already called onSettled
    const TIMEOUT_DURATION = 2.0; // 2 seconds timeout

    // Animation state for smooth transformation scaling
    const [animatedScale, setAnimatedScale] = useState(1.0);
    const targetScaleRef = useRef(sizeMultiplier);
    const currentScaleRef = useRef(1.0);

    // === AUDIO: Collision sounds ===
    // Balanced thresholds with smart queuing for performance
    const playTableSound = useCollisionSound({
      ...SOUNDS.dice.table,
      minVelocity: 0.7,
      maxVelocity: 8,
      cooldown: 100,
    });

    const playDiceSound = useCollisionSound({
      ...SOUNDS.dice.dice,
      minVelocity: 0.5,
      maxVelocity: 6,
      cooldown: 90,
    });

    const playWoodSound = useCollisionSound({
      ...SOUNDS.dice.wood,
      minVelocity: 0.6,
      maxVelocity: 7,
      cooldown: 100,
    });

    // Collision handler - throttled for performance
    const lastCollisionCheck = useRef<number>(0);
    const handleCollision: CollisionEnterHandler = useCallback((event) => {
      // Throttle collision checks to max 60 per second per dice
      const now = performance.now();
      if (now - lastCollisionCheck.current < 16) { // ~60fps throttle
        return;
      }
      lastCollisionCheck.current = now;

      const rigidBody = rigidBodyRef.current;
      if (!rigidBody) return;

      // Get velocity magnitude
      const linvel = rigidBody.linvel();
      const velocity = getCollisionVelocity(linvel);

      // Early exit for very low velocity (performance optimization)
      if (velocity < 0.5) return;

      // Get collision position
      const position = new THREE.Vector3(
        rigidBody.translation().x,
        rigidBody.translation().y,
        rigidBody.translation().z
      );

      // Get userData from the other rigid body (@react-three/rapier stores it here)
      const otherRigidBody = event.other.rigidBody;
      const otherUserData = (otherRigidBody as any)?.userData;

      // Check what we collided with
      if (otherUserData?.isDice) {
        // Collided with another dice
        playDiceSound(position, velocity);
      } else if (otherUserData?.type === 'furniture') {
        // Collided with furniture (wood)
        playWoodSound(position, velocity);
      } else {
        // Default: table/floor/wall collision
        playTableSound(position, velocity);
      }
    }, [playDiceSound, playTableSound, playWoodSound]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getValue: () => diceValue,
      isSettled: () => settled
    }));

    useEffect(() => {
      if (rigidBodyRef.current && !hasSettledRef.current) {
        console.log(
          "Dice created at position:",
          position,
          "with velocity:",
          initialVelocity
        );

        rigidBodyRef.current.setLinvel(
          {
            x: initialVelocity[0],
            y: initialVelocity[1],
            z: initialVelocity[2]
          },
          true
        );
        rigidBodyRef.current.setAngvel(
          {
            x: initialAngularVelocity[0],
            y: initialAngularVelocity[1],
            z: initialAngularVelocity[2]
          },
          true
        );
        // Track creation time for timeout (only on first creation)
        if (creationTimeRef.current === 0) {
          creationTimeRef.current = performance.now() / 1000; // Convert to seconds
        }
      }
    }, [initialVelocity, initialAngularVelocity, position, diceId]);

    // Animate scale changes smoothly
    useFrame((_state, delta) => {
      // Smooth scale animation
      if (Math.abs(targetScaleRef.current - currentScaleRef.current) > 0.001) {
        const lerpSpeed = 8.0; // How fast the animation happens
        currentScaleRef.current +=
          (targetScaleRef.current - currentScaleRef.current) *
          lerpSpeed *
          delta;
        setAnimatedScale(currentScaleRef.current);
      }
    });

    // Update target scale when sizeMultiplier changes
    useEffect(() => {
      if (targetScaleRef.current !== sizeMultiplier) {
        targetScaleRef.current = sizeMultiplier;
        console.log(
          `🎬 Animating dice scale from ${currentScaleRef.current.toFixed(
            2
          )} to ${sizeMultiplier.toFixed(2)}`
        );
      }
    }, [sizeMultiplier]);

    // Update mesh userData for raycasting detection
    useEffect(() => {
      if (meshRef.current && settled) {
        // Use the pre-calculated score from DiceManager if available, otherwise calculate base score
        const scoreValue =
          calculatedScore !== undefined
            ? calculatedScore
            : Math.round(diceValue * scoreMultiplier);

        meshRef.current.userData = {
          isDice: true,
          diceId: diceId,
          diceType: diceType,
          faceValue: diceValue,
          score: scoreValue,
          modifiers: transformations,
          currencyEarned: currencyEarned
        };
      }
    }, [
      settled,
      diceId,
      diceType,
      diceValue,
      transformations,
      scoreMultiplier,
      calculatedScore,
      currencyEarned
    ]);

    // Check if dice has settled
    useFrame(() => {
      if (!rigidBodyRef.current || settled) return;

      const currentTime = performance.now() / 1000; // Convert to seconds
      const elapsedTime = currentTime - creationTimeRef.current;

      // Check for 2-second timeout - force settle as out of bounds
      if (elapsedTime > TIMEOUT_DURATION && !hasSettledRef.current) {
        console.log(
          "Dice timeout - forcing settle as out of bounds after 2 seconds"
        );
        setSettled(true);
        hasSettledRef.current = true;

        // Put dice to sleep to save physics calculations
        rigidBodyRef.current.sleep();

        // Calculate which face is up
        const rotation = rigidBodyRef.current.rotation();
        const quaternion = new THREE.Quaternion(
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w
        );
        const value = getTopFace(quaternion);
        setDiceValue(value);

        // Get current position
        const pos = rigidBodyRef.current.translation();
        const position = new THREE.Vector3(pos.x, pos.y, pos.z);

        console.log(
          "Dice force-settled (timeout) with value:",
          value,
          "at position:",
          position
        );

        if (onSettled) {
          onSettled(value, position);
        }
        return;
      }

      const linvel = rigidBodyRef.current.linvel();
      const angvel = rigidBodyRef.current.angvel();

      const linearSpeed = Math.sqrt(
        linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2
      );
      const angularSpeed = Math.sqrt(
        angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2
      );

      // Check if dice is mostly still (lower threshold for better detection)
      if (linearSpeed < 0.05 && angularSpeed < 0.05) {
        settledTimeRef.current += 0.016; // ~60fps

        // Wait 0.3 seconds of being still before considering it settled
        if (settledTimeRef.current > 0.3 && !hasSettledRef.current) {
          setSettled(true);
          hasSettledRef.current = true;

          // Put dice to sleep to save physics calculations
          rigidBodyRef.current.sleep();

          // Calculate which face is up
          const rotation = rigidBodyRef.current.rotation();
          const quaternion = new THREE.Quaternion(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
          );
          const value = getTopFace(quaternion);
          setDiceValue(value);

          // Get current position
          const pos = rigidBodyRef.current.translation();
          const position = new THREE.Vector3(pos.x, pos.y, pos.z);

          console.log(
            "Dice settled with value:",
            value,
            "at position:",
            position
          );

          if (onSettled) {
            onSettled(value, position);
          }
        }
      } else {
        settledTimeRef.current = 0;
      }
    });

    // Determine which face is pointing up
    const getTopFace = (quaternion: THREE.Quaternion): number => {
      // Thumb tacks always return 1 (tip up)
      if (maxValue === 1) {
        return 1;
      }

      // For coins (2-sided), check if top or bottom is up, or if on edge
      if (maxValue === 2) {
        const upVector = new THREE.Vector3(0, 1, 0);
        const topNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(
          quaternion
        );
        const dot = topNormal.dot(upVector);

        // Check if coin is on its edge (side)
        // When on edge, the dot product will be close to 0 (perpendicular to up vector)
        const edgeThreshold = 0.3; // Tolerance for edge detection
        const absD = Math.abs(dot);

        if (absD < edgeThreshold) {
          // Coin is on its edge! Special 10x bonus value
          console.log("🪙 COIN LANDED ON EDGE! 10x multiplier activated!");
          return 10; // Special value indicating edge landing
        }

        return dot > 0 ? 1 : 2; // Heads or tails
      }

      // For D3 (3-sided) and D4 (4-sided), use simplified face detection
      if (maxValue === 3 || maxValue === 4) {
        const upVector = new THREE.Vector3(0, 1, 0);
        const faceNormals = [];

        // Generate face normals based on maxValue
        for (let i = 0; i < maxValue; i++) {
          const angle = (i / maxValue) * Math.PI * 2;
          faceNormals.push(
            new THREE.Vector3(Math.cos(angle), 0.5, Math.sin(angle))
          );
        }

        let maxDot = -Infinity;
        let topFaceIndex = 0;

        faceNormals.forEach((normal, index) => {
          const rotatedNormal = normal.clone().applyQuaternion(quaternion);
          const dot = rotatedNormal.dot(upVector);
          if (dot > maxDot) {
            maxDot = dot;
            topFaceIndex = index;
          }
        });

        return topFaceIndex + 1; // Return 1-indexed value
      }

      // Standard D6 logic
      const faceNormals = [
        new THREE.Vector3(1, 0, 0), // Face 1 (right)
        new THREE.Vector3(-1, 0, 0), // Face 6 (left)
        new THREE.Vector3(0, 1, 0), // Face 2 (top)
        new THREE.Vector3(0, -1, 0), // Face 5 (bottom)
        new THREE.Vector3(0, 0, 1), // Face 3 (front)
        new THREE.Vector3(0, 0, -1) // Face 4 (back)
      ];

      const faceValues = [1, 6, 2, 5, 3, 4];
      const upVector = new THREE.Vector3(0, 1, 0);

      let maxDot = -Infinity;
      let topFaceIndex = 0;

      faceNormals.forEach((normal, index) => {
        const rotatedNormal = normal.clone().applyQuaternion(quaternion);
        const dot = rotatedNormal.dot(upVector);

        if (dot > maxDot) {
          maxDot = dot;
          topFaceIndex = index;
        }
      });

      return faceValues[topFaceIndex];
    };

    const baseDiceSize = 0.03; // 20% of original size - very small dice
    const diceSize = baseDiceSize * sizeMultiplier; // Apply size multiplier from transformations

    // Load textures for D6
    const d6Textures =
      maxValue === 6
        ? useLoader(THREE.TextureLoader, [
            normalTexture1,
            normalTexture2,
            normalTexture3,
            normalTexture4,
            normalTexture5,
            normalTexture6
          ])
        : [];

    // Load textures for coin
    const coinTextures =
      maxValue === 2
        ? useLoader(THREE.TextureLoader, [coinHeadsTexture, coinTailsTexture])
        : [];

    // Create materials based on dice type
    const materials = useMemo(() => {
      // D6 - Use textures
      if (maxValue === 6 && d6Textures.length > 0) {
        d6Textures.forEach((texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
        });

        return [
          new THREE.MeshStandardMaterial({
            map: d6Textures[0],
            roughness: 0.3,
            metalness: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: d6Textures[5],
            roughness: 0.3,
            metalness: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: d6Textures[1],
            roughness: 0.3,
            metalness: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: d6Textures[4],
            roughness: 0.3,
            metalness: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: d6Textures[2],
            roughness: 0.3,
            metalness: 0.1
          }),
          new THREE.MeshStandardMaterial({
            map: d6Textures[3],
            roughness: 0.3,
            metalness: 0.1
          })
        ];
      }

      // Thumb tack - Small cone shape, dark gray
      if (maxValue === 1) {
        return new THREE.MeshStandardMaterial({
          color: "#444444",
          roughness: 0.6,
          metalness: 0.4
        });
      }

      // Coin - Flat cylinder with heads/tails textures
      if (maxValue === 2 && coinTextures.length > 0) {
        coinTextures.forEach((texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
        });

        // CylinderGeometry material order: [side, top cap, bottom cap]
        return [
          new THREE.MeshStandardMaterial({
            map: coinTextures[0],
            roughness: 0.2,
            metalness: 0.8
          }), // Side - heads texture edge
          new THREE.MeshStandardMaterial({
            map: coinTextures[0],
            roughness: 0.2,
            metalness: 0.8
          }), // Top - heads
          new THREE.MeshStandardMaterial({
            map: coinTextures[1],
            roughness: 0.2,
            metalness: 0.8
          }) // Bottom - tails
        ];
      }

      // Coin fallback (if textures not loaded)
      if (maxValue === 2) {
        return new THREE.MeshStandardMaterial({
          color: "#FFD700",
          roughness: 0.2,
          metalness: 0.8
        });
      }

      // D3 - Triangular prism, light blue
      if (maxValue === 3) {
        return new THREE.MeshStandardMaterial({
          color: "#4488FF",
          roughness: 0.3,
          metalness: 0.1
        });
      }

      // D4 - Tetrahedron, purple
      if (maxValue === 4) {
        return new THREE.MeshStandardMaterial({
          color: "#AA44FF",
          roughness: 0.3,
          metalness: 0.1
        });
      }

      // Fallback - white
      return new THREE.MeshStandardMaterial({
        color: "#FFFFFF",
        roughness: 0.3,
        metalness: 0.1
      });
    }, [maxValue, d6Textures, coinTextures]);

    // Animate pulse effect when settled (only if shader is enabled) and colored tints for special states
    useFrame((_state) => {
      if (meshRef.current) {
        const material = meshRef.current.material;
        const meshMaterials = Array.isArray(material) ? material : [material];

        if (outOfBounds && settled) {
          // Red tint for out of bounds dice
          meshMaterials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive.setHex(0xff0000);
              mat.emissiveIntensity = 0.6;
            }
          });
        } else if (emissive !== undefined && emissiveIntensity > 0) {
          // Apply transformation emissive color (like tarot boost)
          meshMaterials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive.setHex(emissive);
              mat.emissiveIntensity = emissiveIntensity;
              // Apply color tint if specified
              if (colorTint !== undefined) {
                mat.color.setHex(colorTint);
              }
            }
          });
        } else if (onCard && settled && shaderEnabled) {
          // Blue pulsing tint for dice on card
          pulseTimeRef.current += 0.05;
          const pulse = Math.sin(pulseTimeRef.current) * 0.5 + 0.5;

          meshMaterials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive.setHex(0x0066ff); // Blue
              mat.emissiveIntensity = 0.3 + pulse * 0.5;
            }
          });
        } else if (settled && shaderEnabled) {
          pulseTimeRef.current += 0.05;
          const pulse = Math.sin(pulseTimeRef.current) * 0.5 + 0.5;

          // Pulsing green glow effect on all materials
          meshMaterials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive.setHex(0x00ff00);
              mat.emissiveIntensity = 0.3 + pulse * 0.7;
            }
          });
        } else {
          // Reset emissive when shader is disabled or dice not settled
          meshMaterials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0;
            }
          });
        }
      }
    });

    // Render different geometry based on dice type
    const renderGeometry = () => {
      switch (maxValue) {
        case 1: // Thumb tack - cone
          return <coneGeometry args={[diceSize * 0.5, diceSize * 1.2, 8]} />;
        case 2: // Coin - flat cylinder
          return (
            <cylinderGeometry
              args={[diceSize * 0.8, diceSize * 0.8, diceSize * 0.3, 16]}
            />
          );
        case 3: // D3 - triangular prism (cylinder with 3 sides)
          return (
            <cylinderGeometry
              args={[diceSize * 0.7, diceSize * 0.7, diceSize, 3]}
            />
          );
        case 4: // D4 - tetrahedron
          return <tetrahedronGeometry args={[diceSize * 0.9]} />;
        case 6: // D6 - cube (default)
        default:
          return <boxGeometry args={[diceSize, diceSize, diceSize]} />;
      }
    };

    // Render appropriate collider based on dice type
    const renderCollider = () => {
      switch (maxValue) {
        case 1: // Thumb tack - cone collider
          return (
            <ConeCollider
              args={[
                ((diceSize * 1.2) / 2) * animatedScale, // half height
                diceSize * 0.5 * animatedScale // radius
              ]}
            />
          );
        case 2: // Coin - flat cylinder collider
          return (
            <CylinderCollider
              args={[
                ((diceSize * 0.3) / 2) * animatedScale, // half height (very flat)
                diceSize * 0.8 * animatedScale // radius
              ]}
            />
          );
        case 3: // D3 - cylinder collider
        case 4: // D4 - use cuboid for now (tetrahedron collider not available)
        case 6: // D6 - cube collider
        default:
          return (
            <CuboidCollider
              args={[
                (diceSize / 2) * animatedScale,
                (diceSize / 2) * animatedScale,
                (diceSize / 2) * animatedScale
              ]}
            />
          );
      }
    };

    const OUTLINE_THICKNESS = 1.25;
    const isOutlineVisible = isHovered && settled;

    return (
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        type="dynamic"
        restitution={0.4}
        friction={0.5}
        linearDamping={2.4}
        angularDamping={2.0}
        mass={0.066 * massMultiplier} // Apply mass multiplier from transformations
        colliders={false} // Disable auto colliders - we'll manually add scaled collider
        enabledRotations={[true, true, true]}
        ccd={true} // Keep CCD for accurate collisions
        canSleep={true} // Allow physics engine to sleep settled dice
        onCollisionEnter={handleCollision}
        userData={{ diceId, isDice: true }}
      >
        {/* Manual collider that scales with animatedScale and matches geometry type */}
        {renderCollider()}

        {/* Outline mesh - only visible when hovered */}
        {isOutlineVisible && (
          <>
            <mesh
              renderOrder={9999}
              scale={[
                animatedScale * OUTLINE_THICKNESS,
                animatedScale * OUTLINE_THICKNESS,
                animatedScale * OUTLINE_THICKNESS
              ]}
            >
              {renderGeometry()}
              <meshBasicMaterial
                color={0xffa724}
                side={THREE.BackSide}
                opacity={.4}
                depthTest={false} // 👈 ignores depth buffer
              />
            </mesh>
            <mesh
              renderOrder={10000}
              scale={[
                animatedScale * OUTLINE_THICKNESS - 0.075,
                animatedScale * OUTLINE_THICKNESS - 0.15,
                animatedScale * OUTLINE_THICKNESS - 0.175
              ]}
            >
              {renderGeometry()}
              <meshBasicMaterial
                color={0x35322d}
                side={THREE.BackSide}
                depthTest={false} // 👈 ensures always on top
              />
            </mesh>
          </>
        )}

        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          material={materials}
          renderOrder={isOutlineVisible ? 10001 : undefined} // Render above outline if visible
          scale={[animatedScale, animatedScale, animatedScale]} // Apply smooth animated scaling
        >
          {renderGeometry()}
        </mesh>
      </RigidBody>
    );
  }
);

Dice.displayName = "Dice";

export default Dice;
