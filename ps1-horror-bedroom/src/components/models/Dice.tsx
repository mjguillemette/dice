import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// Import dice textures
import normalTexture1 from '../../assets/textures/normal-1.png';
import normalTexture2 from '../../assets/textures/normal-2.png';
import normalTexture3 from '../../assets/textures/normal-3.png';
import normalTexture4 from '../../assets/textures/normal-4.png';
import normalTexture5 from '../../assets/textures/normal-5.png';
import normalTexture6 from '../../assets/textures/normal-6.png';

interface DiceProps {
  position: [number, number, number];
  initialVelocity?: [number, number, number];
  initialAngularVelocity?: [number, number, number];
  onSettled?: (value: number, position: THREE.Vector3) => void;
  shaderEnabled: boolean;
  maxValue?: number; // 1 for thumbtack, 2 for coin, 3 for d3, 4 for d4, 6 for d6 (default)
  outOfBounds?: boolean; // Whether dice is out of bounds (red tint)
}

export interface DiceHandle {
  getValue: () => number;
  isSettled: () => boolean;
}

const Dice = forwardRef<DiceHandle, DiceProps>(({
  position,
  initialVelocity = [0, 0, 0],
  initialAngularVelocity = [0, 0, 0],
  onSettled,
  shaderEnabled,
  maxValue = 6,
  outOfBounds = false
}, ref) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [settled, setSettled] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const settledTimeRef = useRef(0);
  const pulseTimeRef = useRef(0);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getValue: () => diceValue,
    isSettled: () => settled,
  }));

  useEffect(() => {
    if (rigidBodyRef.current) {
      console.log('Dice created at position:', position, 'with velocity:', initialVelocity);
      rigidBodyRef.current.setLinvel(
        { x: initialVelocity[0], y: initialVelocity[1], z: initialVelocity[2] },
        true
      );
      rigidBodyRef.current.setAngvel(
        { x: initialAngularVelocity[0], y: initialAngularVelocity[1], z: initialAngularVelocity[2] },
        true
      );
    }
  }, [initialVelocity, initialAngularVelocity, position]);

  // Check if dice has settled
  useFrame(() => {
    if (!rigidBodyRef.current || settled) return;

    const linvel = rigidBodyRef.current.linvel();
    const angvel = rigidBodyRef.current.angvel();

    const linearSpeed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2);
    const angularSpeed = Math.sqrt(angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2);

    // Check if dice is mostly still (lower threshold for better detection)
    if (linearSpeed < 0.05 && angularSpeed < 0.05) {
      settledTimeRef.current += 0.016; // ~60fps

      // Wait 0.3 seconds of being still before considering it settled
      if (settledTimeRef.current > 0.3) {
        setSettled(true);

        // Calculate which face is up
        const rotation = rigidBodyRef.current.rotation();
        const quaternion = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
        const value = getTopFace(quaternion);
        setDiceValue(value);

        // Get current position
        const pos = rigidBodyRef.current.translation();
        const position = new THREE.Vector3(pos.x, pos.y, pos.z);

        console.log('Dice settled with value:', value, 'at position:', position);

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

    // For coins (2-sided), check if top or bottom is up
    if (maxValue === 2) {
      const upVector = new THREE.Vector3(0, 1, 0);
      const topNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
      const dot = topNormal.dot(upVector);
      return dot > 0 ? 1 : 2; // Heads or tails
    }

    // For D3 (3-sided) and D4 (4-sided), use simplified face detection
    if (maxValue === 3 || maxValue === 4) {
      const upVector = new THREE.Vector3(0, 1, 0);
      const faceNormals = [];

      // Generate face normals based on maxValue
      for (let i = 0; i < maxValue; i++) {
        const angle = (i / maxValue) * Math.PI * 2;
        faceNormals.push(new THREE.Vector3(Math.cos(angle), 0.5, Math.sin(angle)));
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
      new THREE.Vector3(1, 0, 0),   // Face 1 (right)
      new THREE.Vector3(-1, 0, 0),  // Face 6 (left)
      new THREE.Vector3(0, 1, 0),   // Face 2 (top)
      new THREE.Vector3(0, -1, 0),  // Face 5 (bottom)
      new THREE.Vector3(0, 0, 1),   // Face 3 (front)
      new THREE.Vector3(0, 0, -1),  // Face 4 (back)
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

  const diceSize = 0.05; // 20% of original size - very small dice

  // Only load textures for D6
  const textures = maxValue === 6 ? useLoader(THREE.TextureLoader, [
    normalTexture1,
    normalTexture2,
    normalTexture3,
    normalTexture4,
    normalTexture5,
    normalTexture6,
  ]) : [];

  // Create materials based on dice type
  const materials = useMemo(() => {
    // D6 - Use textures
    if (maxValue === 6 && textures.length > 0) {
      textures.forEach(texture => {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
      });

      return [
        new THREE.MeshStandardMaterial({ map: textures[0], roughness: 0.3, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: textures[5], roughness: 0.3, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: textures[1], roughness: 0.3, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: textures[4], roughness: 0.3, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: textures[2], roughness: 0.3, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ map: textures[3], roughness: 0.3, metalness: 0.1 }),
      ];
    }

    // Thumb tack - Small cone shape, dark gray
    if (maxValue === 1) {
      return new THREE.MeshStandardMaterial({
        color: '#444444',
        roughness: 0.6,
        metalness: 0.4,
      });
    }

    // Coin - Flat cylinder, gold color
    if (maxValue === 2) {
      return new THREE.MeshStandardMaterial({
        color: '#FFD700',
        roughness: 0.2,
        metalness: 0.8,
      });
    }

    // D3 - Triangular prism, light blue
    if (maxValue === 3) {
      return new THREE.MeshStandardMaterial({
        color: '#4488FF',
        roughness: 0.3,
        metalness: 0.1,
      });
    }

    // D4 - Tetrahedron, purple
    if (maxValue === 4) {
      return new THREE.MeshStandardMaterial({
        color: '#AA44FF',
        roughness: 0.3,
        metalness: 0.1,
      });
    }

    // Fallback - white
    return new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.3,
      metalness: 0.1,
    });
  }, [maxValue, textures]);

  // Animate pulse effect when settled (only if shader is enabled) and red tint for out of bounds
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material;
      const meshMaterials = Array.isArray(material) ? material : [material];

      if (outOfBounds && settled) {
        // Red tint for out of bounds dice
        meshMaterials.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.setHex(0xff0000);
            mat.emissiveIntensity = 0.6;
          }
        });
      } else if (settled && shaderEnabled) {
        pulseTimeRef.current += 0.05;
        const pulse = Math.sin(pulseTimeRef.current) * 0.5 + 0.5;

        // Pulsing glow effect on all materials
        meshMaterials.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.setHex(0x00ff00);
            mat.emissiveIntensity = 0.3 + pulse * 0.7;
          }
        });
      } else {
        // Reset emissive when shader is disabled or dice not settled
        meshMaterials.forEach(mat => {
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
        return <cylinderGeometry args={[diceSize * 0.8, diceSize * 0.8, diceSize * 0.3, 16]} />;
      case 3: // D3 - triangular prism (cylinder with 3 sides)
        return <cylinderGeometry args={[diceSize * 0.7, diceSize * 0.7, diceSize, 3]} />;
      case 4: // D4 - tetrahedron
        return <tetrahedronGeometry args={[diceSize * 0.9]} />;
      case 6: // D6 - cube (default)
      default:
        return <boxGeometry args={[diceSize, diceSize, diceSize]} />;
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      restitution={0.5}
      friction={0.4}
      linearDamping={0.8}
      angularDamping={0.8}
      mass={0.03}
      colliders="cuboid"
      enabledRotations={[true, true, true]}
      ccd={true}
    >
      <mesh ref={meshRef} castShadow receiveShadow material={materials}>
        {renderGeometry()}
      </mesh>
    </RigidBody>
  );
});

Dice.displayName = 'Dice';

export default Dice;
