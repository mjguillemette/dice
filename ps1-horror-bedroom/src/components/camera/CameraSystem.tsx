import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PerspectiveCamera } from "@react-three/drei";
import {
  CINEMATIC_ANGLES,
  CAMERA_TRANSITION_DURATION,
  CAMERA_HOLD_DURATION,
  MOVEMENT_SPEED
} from "../../constants/gameConfig";
import type { InputState } from "../../systems/inputSystem";
import {
  initializeCollisionBoxes,
  checkCollision
} from "../../systems/collisionSystem";

import type { GamePhase } from "../../systems/gameStateSystem";

interface CameraSystemProps {
  cinematicMode: boolean;
  inputState: InputState;
  onCameraNameChange?: (name: string) => void;
  isStarting: boolean;
  onStartAnimationFinish: () => void;
  gamePhase: GamePhase;
}

export function CameraSystem({
  cinematicMode,
  inputState,
  onCameraNameChange,
  isStarting,
  onStartAnimationFinish
}: CameraSystemProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const cameraTransitionTime = useRef(0);

  // Initialize collision boxes once
  useEffect(() => {
    initializeCollisionBoxes();
  }, []);

  const targetCameraPos = useRef(
    new THREE.Vector3().copy(CINEMATIC_ANGLES[0].pos)
  );
  const targetCameraLookAt = useRef(
    new THREE.Vector3().copy(CINEMATIC_ANGLES[0].lookAt)
  );
  const currentCameraLookAt = useRef(new THREE.Vector3(0, 0, -5));

  const setCinematicAngle = useCallback(
    (index: number) => {
      const newIndex = index % CINEMATIC_ANGLES.length;
      setCurrentCameraIndex(newIndex);

      const angle = CINEMATIC_ANGLES[newIndex];
      targetCameraPos.current.copy(angle.pos);
      targetCameraLookAt.current.copy(angle.lookAt);
      cameraTransitionTime.current = 0;

      onCameraNameChange?.(angle.name);
    },
    [onCameraNameChange]
  );

  useFrame((_state, delta) => {
    if (!cameraRef.current) return;

    let targetPos = targetCameraPos.current;
    let targetLookAt = targetCameraLookAt.current;

    switch (gamePhase) {
      case 'item_selection':
        targetPos = new THREE.Vector3(-1.5, 1.2, 3.5);
        targetLookAt = new THREE.Vector3(-2.2, 1.0, 4.2);
        break;
      case 'throwing':
      case 'settled':
        targetPos = new THREE.Vector3(0.28, 1.8, 1.5);
        targetLookAt = new THREE.Vector3(0.28, 0.62, 2.2);
        break;
      case 'evaluating':
        targetPos = new THREE.Vector3(0, 2.5, 6);
        targetLookAt = new THREE.Vector3(0, 1, 0);
        break;
      case 'idle':
        targetPos = new THREE.Vector3(0.28, 1.6, 1.2);
        targetLookAt = new THREE.Vector3(0.28, 0.62, 2.2);
        break;
      default:
        // For 'menu' or other phases, use the cinematic camera logic
        if (cinematicMode) {
          targetPos = CINEMATIC_ANGLES[currentCameraIndex].pos;
          targetLookAt = CINEMATIC_ANGLES[currentCameraIndex].lookAt;
        }
        break;
    }

    if (isStarting) {
      const startTargetPos = new THREE.Vector3(0.28, 1.6, 1.2);
      const startTargetLookAt = new THREE.Vector3(0.28, 0.62, 2.2);
      cameraRef.current.position.lerp(startTargetPos, delta * 2);
      currentCameraLookAt.current.lerp(startTargetLookAt, delta * 2);
      cameraRef.current.lookAt(currentCameraLookAt.current);

      if (cameraRef.current.position.distanceTo(startTargetPos) < 0.01) {
        cameraRef.current.position.copy(startTargetPos);
        currentCameraLookAt.current.copy(startTargetLookAt);
        cameraRef.current.lookAt(currentCameraLookAt.current);
        onStartAnimationFinish();
      }
    } else if (cinematicMode && gamePhase === 'menu') {
      cameraTransitionTime.current += delta;
      if (
        cameraTransitionTime.current >
        CAMERA_HOLD_DURATION + CAMERA_TRANSITION_DURATION
      ) {
        setCinematicAngle(currentCameraIndex + 1);
      }
      const transitionProgress = Math.min(
        cameraTransitionTime.current / CAMERA_TRANSITION_DURATION,
        1
      );
      const easeProgress =
        transitionProgress < 0.5
          ? 2 * transitionProgress * transitionProgress
          : 1 - Math.pow(-2 * transitionProgress + 2, 2) / 2;

      cameraRef.current.position.lerp(targetPos, easeProgress * 0.1);
      currentCameraLookAt.current.lerp(targetLookAt, easeProgress * 0.1);
      cameraRef.current.lookAt(currentCameraLookAt.current);
    } else if (!cinematicMode) {
      // Free camera mode
      // First, smoothly move to the game phase's designated position
      cameraRef.current.position.lerp(targetPos, delta * 2);
      currentCameraLookAt.current.lerp(targetLookAt, delta * 2);
      cameraRef.current.lookAt(currentCameraLookAt.current);

      // Then, apply player input on top
      const moveSpeed = MOVEMENT_SPEED;
      const yaw = cameraRef.current.rotation.y;

      if (inputState.moveForward || inputState.moveBackward) {
        const direction =
          Number(inputState.moveForward) - Number(inputState.moveBackward);
        cameraRef.current.position.x -= direction * moveSpeed * Math.sin(yaw);
        cameraRef.current.position.z -= direction * moveSpeed * Math.cos(yaw);
      }

      if (inputState.moveLeft || inputState.moveRight) {
        const direction =
          Number(inputState.moveRight) - Number(inputState.moveLeft);
        cameraRef.current.position.x += direction * moveSpeed * Math.cos(yaw);
        cameraRef.current.position.z -= direction * moveSpeed * Math.sin(yaw);
      }

      const currentPos = cameraRef.current.position.clone();
      const correctedPosition = checkCollision(currentPos);
      cameraRef.current.position.copy(correctedPosition);
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={45}
      near={0.05}
      far={40}
      position={[0, 1.6, 5]}
    />
  );
}

export { CameraSystem as default };
