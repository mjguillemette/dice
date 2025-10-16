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

type CameraState = "cinematic" | "player_control" | "directed" | "transitioning";

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
  onStartAnimationFinish,
  gamePhase
}: CameraSystemProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [cameraState, setCameraState] = useState<CameraState>("cinematic");

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

  useEffect(() => {
    if (isStarting) {
      setCameraState("transitioning");
    } else if (cinematicMode) {
      setCameraState("cinematic");
    } else if (gamePhase === 'item_selection' || gamePhase === 'throwing' || gamePhase === 'settled' || gamePhase === 'evaluating') {
      setCameraState("directed");
    } else {
      setCameraState("player_control");
    }
  }, [isStarting, cinematicMode, gamePhase]);

  useFrame((state, delta) => {
    if (!cameraRef.current) return;

    const playerLook = new THREE.Vector2(state.mouse.x, state.mouse.y);

    switch (cameraState) {
      case 'transitioning': {
        const targetPos = new THREE.Vector3(0.28, 1.6, 1.2);
        const targetLookAt = new THREE.Vector3(0.28, 0.62, 2.2);
        cameraRef.current.position.lerp(targetPos, delta * 2);
        currentCameraLookAt.current.lerp(targetLookAt, delta * 2);
        cameraRef.current.lookAt(currentCameraLookAt.current);

        if (cameraRef.current.position.distanceTo(targetPos) < 0.01) {
          cameraRef.current.position.copy(targetPos);
          currentCameraLookAt.current.copy(targetLookAt);
          cameraRef.current.lookAt(currentCameraLookAt.current);
          onStartAnimationFinish();
          setCameraState('player_control');
        }
        break;
      }

      case 'cinematic': {
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

        cameraRef.current.position.lerp(
          targetCameraPos.current,
          easeProgress * 0.1
        );
        currentCameraLookAt.current.lerp(
          targetCameraLookAt.current,
          easeProgress * 0.1
        );
        cameraRef.current.lookAt(currentCameraLookAt.current);
        break;
      }

      case 'directed': {
        let targetPos = new THREE.Vector3();
        let targetLookAt = new THREE.Vector3();

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
        }

        cameraRef.current.position.lerp(targetPos, delta * 2);
        currentCameraLookAt.current.lerp(targetLookAt, delta * 2);

        // Allow player to look around
        const lookAt = new THREE.Vector3().copy(currentCameraLookAt.current);
        lookAt.x += playerLook.x * 0.5;
        lookAt.y += playerLook.y * 0.5;
        cameraRef.current.lookAt(lookAt);
        break;
      }

      case 'player_control': {
        // Free camera mode - WASD movement
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
        break;
      }
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
