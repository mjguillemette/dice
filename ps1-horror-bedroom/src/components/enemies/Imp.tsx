import { useRef, useEffect, useMemo } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RigidBodyProps } from "@react-three/rapier";
import * as THREE from "three";

// --- Model Constants ---
// **IMPORTANT:** You need to measure these accurately from your GLTF model in a 3D editor (e.g., Blender).
// These are the dimensions of the imp model when its internal scale is 1.
// If your imp is more like a pyramid, adjust these to enclose the main body.
const IMP_BASE_DIMENSIONS = new THREE.Vector3(0.5, 1, 0.5); // Example: W, H, D of the imp's core body

// **IMPORTANT:** This is the correction needed to center the GLTF model's visuals
// around the RigidyBody's local origin (0,0,0). Adjust to stop circular rotation.
const IMP_PIVOT_OFFSET = new THREE.Vector3(0, 0,0); // Fine-tune this based on your model

interface ImpProps extends RigidBodyProps {
  animationOffset?: number;
  /**
   * If true, displays a wireframe visualization of the physics collider.
   * @default false
   */
  debugMode?: boolean;
}

/**
 * Renders an animated imp model with a dynamically scaled physics collider.
 */
export function Imp({
  animationOffset,
  scale = 1,
  debugMode = false,
  ...props
}: ImpProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useLoader(GLTFLoader, "imp.gltf") as GLTF;
  const copiedScene = useMemo(() => scene.clone(), [scene]);
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  const scaleVec = useMemo((): [number, number, number] => {
    // Applying the new custom scale approximation.
    if (typeof scale === "number") return [scale * 1.1, scale * .8, scale * 1.1];
    if (scale instanceof THREE.Vector3) return scale.toArray();
    return [...scale] as [number, number, number];
  }, [scale]);

  const colliderArgs = useMemo((): [number, number, number] => {
    return [
      (IMP_BASE_DIMENSIONS.x * scaleVec[0]) / 2, // Half-width
      (IMP_BASE_DIMENSIONS.y * scaleVec[1]) / 2, // Half-height
      (IMP_BASE_DIMENSIONS.z * scaleVec[2]) / 2 // Half-depth
    ];
  }, [scaleVec]);

  const colliderPosition = useMemo((): [number, number, number] => {
    // Collider's local position, centered vertically on the imp's base.
    // The X and Z components are based on the pivot offset * visual scale,
    // as the collider should also be centered relative to the visual model's effective center.
    return [
      IMP_PIVOT_OFFSET.x * scaleVec[0],
      (IMP_BASE_DIMENSIONS.y * scaleVec[1]) / 2, // Centered vertically, relative to the RigidBody's local origin (0,0,0)
      IMP_PIVOT_OFFSET.z * scaleVec[2]
    ];
  }, [scaleVec]);

  useEffect(() => {
    if (animations.length > 0 && groupRef.current) {
      const clip = animations[0];
      mixer.current = new THREE.AnimationMixer(groupRef.current);
      const action = mixer.current.clipAction(clip);

      action.setLoop(THREE.LoopRepeat, Infinity);
      action.time = animationOffset ?? Math.random() * clip.duration;
      action.play();
    }

    return () => {
      mixer.current?.stopAllAction();
    };
  }, [animations, animationOffset]);

  useFrame((_state, delta: number) => {
    mixer.current?.update(delta);
  });

  return (
    // The RigidBody position/rotation is controlled by props, its scale is always 1 in physics.
    <RigidBody {...props} colliders={false} type="fixed">
      <primitive
        ref={groupRef}
        object={copiedScene}
        // The desired visual scale and pivot correction are applied to the primitive.
        scale={scale}
        position={IMP_PIVOT_OFFSET}
      />
      <CuboidCollider args={colliderArgs} position={colliderPosition} />

      {debugMode && (
        <mesh position={colliderPosition}>
          {" "}
          {/* Use colliderPosition for debug mesh */}
          <boxGeometry
            args={
              colliderArgs.map((arg) => arg * 2) as [number, number, number]
            }
          />
          <meshBasicMaterial color="red" wireframe />
        </mesh>
      )}
    </RigidBody>
  );
}
