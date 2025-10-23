import { useRef, useEffect, useMemo } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import type { RigidBodyProps } from "@react-three/rapier";
import * as THREE from "three";

const IMP_BASE_DIMENSIONS = new THREE.Vector3(0.5, 1, 0.5);
const IMP_PIVOT_OFFSET = new THREE.Vector3(0, 0, 0);

interface ImpProps extends RigidBodyProps {
  animationOffset?: number;
  playEntranceAnimation?: boolean;
  entranceAnimationProgress?: number;
  debugMode?: boolean;
  sensor?: boolean;
}

export function Imp({
  animationOffset,
  scale = 1,
  debugMode = false,
  playEntranceAnimation = false,
  entranceAnimationProgress = 1,
  sensor = false,
  ...props
}: ImpProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useLoader(GLTFLoader, "imp.gltf") as GLTF;
  const copiedScene = useMemo(() => scene.clone(), [scene]);
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  const finalScale = useMemo((): [number, number, number] => {
    if (typeof scale === "number")
      return [scale * 1.1, scale * 0.8, scale * 1.1];
    if (scale instanceof THREE.Vector3) return scale.toArray();
    return [...scale] as [number, number, number];
  }, [scale]);

  const scaleVec = useMemo((): [number, number, number] => {
    return [
      finalScale[0] * entranceAnimationProgress,
      finalScale[1] * entranceAnimationProgress,
      finalScale[2] * entranceAnimationProgress
    ];
  }, [finalScale, entranceAnimationProgress]);

  const colliderArgs = useMemo((): [number, number, number] => {
    return [
      (IMP_BASE_DIMENSIONS.x * finalScale[0]) / 2,
      (IMP_BASE_DIMENSIONS.y * finalScale[1]) / 2,
      (IMP_BASE_DIMENSIONS.z * finalScale[2]) / 2
    ];
  }, [finalScale]);

  const colliderPosition = useMemo((): [number, number, number] => {
    return [
      IMP_PIVOT_OFFSET.x * finalScale[0],
      (IMP_BASE_DIMENSIONS.y * finalScale[1]) / 2,
      IMP_PIVOT_OFFSET.z * finalScale[2]
    ];
  }, [finalScale]);

  useEffect(() => {
    if (animations.length > 0 && groupRef.current) {
      const clip = animations[0];
      mixer.current = new THREE.AnimationMixer(groupRef.current);
      const action = mixer.current.clipAction(clip);

      if (playEntranceAnimation) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.time = animationOffset ?? Math.random() * clip.duration;
      }
      action.play();
    }

    return () => {
      mixer.current?.stopAllAction();
    };
  }, [animations, animationOffset, playEntranceAnimation]);

  useFrame((_state, delta: number) => {
    mixer.current?.update(delta);
  });

  return (
    <RigidBody {...props} colliders={false} type="kinematicPosition">
      <primitive
        ref={groupRef}
        object={copiedScene}
        scale={scaleVec}
        position={IMP_PIVOT_OFFSET}
      />
      <CuboidCollider
        args={colliderArgs}
        position={colliderPosition}
        sensor={sensor}
      />

      {debugMode && (
        <mesh position={colliderPosition}>
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
