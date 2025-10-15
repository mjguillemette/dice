import {
  forwardRef,
  useRef,
  useState,
  useImperativeHandle,
  useEffect
} from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DiceProps, DiceConfig, DiceHandle } from "./Dice.types";

interface DiceBaseProps extends DiceProps, DiceConfig {
  geometry: React.ReactNode;
  collider: React.ReactNode;
  materials: THREE.Material | THREE.Material[];
}

const DiceBase = forwardRef<DiceHandle, DiceBaseProps>(
  (
    {
      position,
      initialVelocity = [0, 0, 0],
      initialAngularVelocity = [0, 0, 0],
      onSettled,
      shaderEnabled,
      outOfBounds,
      onCard,
      emissive,
      emissiveIntensity = 0,
      colorTint,
      sizeMultiplier = 1,
      massMultiplier = 1,
      diceId,
      maxValue,
      geometry,
      collider,
      materials,
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
    const hasSettledRef = useRef(false);
    const [animatedScale, setAnimatedScale] = useState(1.0);
    const targetScaleRef = useRef(sizeMultiplier);
    const currentScaleRef = useRef(1.0);

    useImperativeHandle(ref, () => ({
      getValue: () => diceValue,
      isSettled: () => settled
    }));

    // Physics initialization
    useEffect(() => {
      if (!rigidBodyRef.current || hasSettledRef.current) return;

      if (diceId !== undefined)
        (rigidBodyRef.current as any).userData = { diceId };

      rigidBodyRef.current.setLinvel(
        { x: initialVelocity[0], y: initialVelocity[1], z: initialVelocity[2] },
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

      if (creationTimeRef.current === 0)
        creationTimeRef.current = performance.now() / 1000;
    }, [initialVelocity, initialAngularVelocity]);

    // Smooth scale animation
    useFrame((_, delta) => {
      if (Math.abs(targetScaleRef.current - currentScaleRef.current) > 0.001) {
        currentScaleRef.current +=
          (targetScaleRef.current - currentScaleRef.current) * 8.0 * delta;
        setAnimatedScale(currentScaleRef.current);
      }
    });

    // Settling logic
    useFrame(() => {
      if (!rigidBodyRef.current || settled) return;

      const linvel = rigidBodyRef.current.linvel();
      const angvel = rigidBodyRef.current.angvel();
      const linearSpeed = Math.hypot(linvel.x, linvel.y, linvel.z);
      const angularSpeed = Math.hypot(angvel.x, angvel.y, angvel.z);

      if (linearSpeed < 0.05 && angularSpeed < 0.05) {
        settledTimeRef.current += 0.016;
        if (settledTimeRef.current > 0.3 && !hasSettledRef.current) {
          hasSettledRef.current = true;
          setSettled(true);

          // const rot = rigidBodyRef.current.rotation();
          // const quaternion = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
          const value = Math.floor(Math.random() * maxValue) + 1; // Stub for face detection
          setDiceValue(value);

          const pos = rigidBodyRef.current.translation();
          const vectorPos = new THREE.Vector3(pos.x, pos.y, pos.z);
          onSettled?.(value, vectorPos);
        }
      } else {
        settledTimeRef.current = 0;
      }
    });

    // Shader/emissive effect
    useFrame(() => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const materialsArray = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      const resetEmissive = () => {
        materialsArray.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        });
      };

      if (outOfBounds && settled) {
        materialsArray.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.setHex(0xff0000);
            mat.emissiveIntensity = 0.6;
          }
        });
        return;
      }

      if (onCard && shaderEnabled && settled) {
        pulseTimeRef.current += 0.05;
        const pulse = Math.sin(pulseTimeRef.current) * 0.5 + 0.5;
        materialsArray.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.setHex(0x0066ff);
            mat.emissiveIntensity = 0.3 + pulse * 0.5;
          }
        });
        return;
      }

      if (shaderEnabled && settled) {
        pulseTimeRef.current += 0.05;
        const pulse = Math.sin(pulseTimeRef.current) * 0.5 + 0.5;
        materialsArray.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive.setHex(emissive ?? 0x00ff00);
            mat.emissiveIntensity = emissiveIntensity || 0.3 + pulse * 0.7;
            if (colorTint) mat.color.setHex(colorTint);
          }
        });
        return;
      }

      resetEmissive();
    });

    return (
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        type="dynamic"
        restitution={0.4}
        friction={0.5}
        linearDamping={2.4}
        angularDamping={2.0}
        mass={0.066 * massMultiplier}
        colliders={false}
        ccd
      >
        {collider}
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          material={materials}
          scale={[animatedScale, animatedScale, animatedScale]}
        >
          {geometry}
        </mesh>
      </RigidBody>
    );
  }
);

DiceBase.displayName = "DiceBase";
export default DiceBase;
