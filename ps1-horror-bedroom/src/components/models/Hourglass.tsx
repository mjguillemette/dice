import { useRef, useState, useEffect } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RigidBody as RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface HourglassProps {
  position: [number, number, number];
  hellFactor: number;
  onBumped?: () => void; // Callback when hourglass is bumped by dice
}

/**
 * Hourglass Component
 *
 * A physics-enabled hourglass that sits on the receptacle.
 * Can be knocked over by dice and detects collisions.
 */
export function Hourglass({ position, hellFactor, onBumped }: HourglassProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [isBumped, setIsBumped] = useState(false);
  const lastBumpTime = useRef(0);

  // Hourglass dimensions
  const hourglassHeight = 0.08;
  const hourglassWidth = 0.04;
  const hourglassDepth = 0.04;

  // Track velocity to detect bumps
  useEffect(() => {
    if (!rigidBodyRef.current) return;

    const checkVelocity = () => {
      if (!rigidBodyRef.current) return;

      const linvel = rigidBodyRef.current.linvel();
      const angvel = rigidBodyRef.current.angvel();

      // Calculate total velocity magnitude
      const linearSpeed = Math.sqrt(
        linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2
      );
      const angularSpeed = Math.sqrt(
        angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2
      );

      // If moving significantly, it's been bumped
      const bumpThreshold = 0.1;
      const now = Date.now();

      if (
        (linearSpeed > bumpThreshold || angularSpeed > bumpThreshold) &&
        now - lastBumpTime.current > 500
      ) {
        console.log("⏳ Hourglass bumped!", { linearSpeed, angularSpeed });
        setIsBumped(true);
        lastBumpTime.current = now;

        if (onBumped) {
          onBumped();
        }

        // Reset bumped state after a delay
        setTimeout(() => setIsBumped(false), 1000);
      }
    };

    const interval = setInterval(checkVelocity, 100);
    return () => clearInterval(interval);
  }, [onBumped]);

  // Create materials
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: isBumped ? 0xff6600 : 0xccddff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    metalness: 0.3,
    emissive: isBumped ? new THREE.Color(0xff6600) : new THREE.Color(0x000000),
    emissiveIntensity: isBumped ? 0.3 : 0.0
  });

  const sandMaterial = new THREE.MeshStandardMaterial({
    color: 0xddaa66,
    roughness: 0.9,
    metalness: 0.0
  });

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: hellFactor > 0.5 ? 0x331100 : 0x664422,
    roughness: 0.7,
    metalness: 0.2
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      mass={0.2}
      friction={0.6}
      restitution={0.1}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      {/* Main collision shape - slightly smaller than visual for better stability */}
      <CuboidCollider
        args={[
          hourglassWidth * 0.4,
          hourglassHeight * 0.45,
          hourglassDepth * 0.4
        ]}
      />

      {/* Visual geometry */}
      <group>
        {/* Top glass bulb */}
        <mesh position={[0, hourglassHeight * 0.3, 0]} material={glassMaterial}>
          <sphereGeometry
            args={[hourglassWidth * 0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
        </mesh>

        {/* Bottom glass bulb */}
        <mesh
          position={[0, -hourglassHeight * 0.3, 0]}
          rotation={[Math.PI, 0, 0]}
          material={glassMaterial}
        >
          <sphereGeometry
            args={[hourglassWidth * 0.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
        </mesh>

        {/* Center neck */}
        <mesh material={glassMaterial}>
          <cylinderGeometry
            args={[
              hourglassWidth * 0.2,
              hourglassWidth * 0.2,
              hourglassHeight * 0.3,
              6
            ]}
          />
        </mesh>

        {/* Sand in bottom (grows over time in real implementation) */}
        <mesh
          position={[0, -hourglassHeight * 0.25, 0]}
          material={sandMaterial}
        >
          <coneGeometry
            args={[hourglassWidth * 0.6, hourglassHeight * 0.3, 6]}
          />
        </mesh>

        {/* Sand in top (shrinks over time in real implementation) */}
        <mesh
          position={[0, hourglassHeight * 0.25, 0]}
          rotation={[Math.PI, 0, 0]}
          material={sandMaterial}
        >
          <coneGeometry
            args={[hourglassWidth * 0.5, hourglassHeight * 0.2, 6]}
          />
        </mesh>

        {/* Top frame ring */}
        <mesh
          position={[0, hourglassHeight * 0.45, 0]}
          material={frameMaterial}
        >
          <torusGeometry
            args={[hourglassWidth * 0.9, hourglassWidth * 0.15, 6, 8]}
          />
        </mesh>

        {/* Bottom frame ring */}
        <mesh
          position={[0, -hourglassHeight * 0.45, 0]}
          material={frameMaterial}
        >
          <torusGeometry
            args={[hourglassWidth * 0.9, hourglassWidth * 0.15, 6, 8]}
          />
        </mesh>

        {/* Support posts (4 corners) */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => {
          const x = Math.cos(angle) * hourglassWidth * 0.85;
          const z = Math.sin(angle) * hourglassDepth * 0.85;
          return (
            <mesh key={i} position={[x, 0, z]} material={frameMaterial}>
              <cylinderGeometry
                args={[
                  hourglassWidth * 0.08,
                  hourglassWidth * 0.08,
                  hourglassHeight * 0.9,
                  4
                ]}
              />
            </mesh>
          );
        })}
      </group>
    </RigidBody>
  );
}

export default Hourglass;
