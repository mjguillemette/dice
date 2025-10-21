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
import { isMobileDevice } from "../../utils/mobileDetection";
import { getDeviceOrientationConfig } from "../../systems/deviceOrientationControls";

type CameraState =
  | "cinematic"
  | "player_control"
  | "directed"
  | "transitioning";

interface CameraSystemProps {
  inputState: InputState;
  onCameraNameChange?: (name: string) => void;
  isStarting: boolean;
  onStartAnimationFinish: () => void;
  gamePhase: GamePhase;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  orientationRef?: React.RefObject<THREE.Quaternion>;
}

export function CameraSystem({
  inputState,
  onCameraNameChange,
  isStarting,
  onStartAnimationFinish,
  gamePhase,
  yawRef,
  pitchRef,
  orientationRef
}: CameraSystemProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [cameraState, setCameraState] = useState<CameraState>("cinematic");

  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const cameraTransitionTime = useRef(0);
  const previousGamePhase = useRef<GamePhase>(gamePhase);
  const phaseTransitionProgress = useRef(1.0);

  const isMobile = isMobileDevice();

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
    } else if (gamePhase === "menu") {
      setCameraState("cinematic");
    } else if (
      gamePhase === "idle" ||
      gamePhase === "throwing" ||
      gamePhase === "settled" ||
      gamePhase === "evaluating" ||
      gamePhase === "item_selection"
    ) {
      setCameraState("directed");
      previousGamePhase.current = gamePhase;
    } else {
      setCameraState("directed");
    }
  }, [isStarting, gamePhase]);

  useEffect(() => {
    if (gamePhase === "item_selection") {
      const targetPos = new THREE.Vector3(-2.25, 1.45, 1.6);
      const lookAtPos = new THREE.Vector3(-2.4, 0.8, 4.1);

      const direction = new THREE.Vector3().subVectors(lookAtPos, targetPos);
      const targetYaw = Math.atan2(-direction.x, -direction.z);
      const horizontalDist = Math.sqrt(
        direction.x * direction.x + direction.z * direction.z
      );
      const targetPitch = Math.atan2(direction.y, horizontalDist);

      yawRef.current = targetYaw;
      pitchRef.current = targetPitch;
    }
  }, [gamePhase, yawRef, pitchRef]);

  useFrame((_state, delta) => {
    if (!cameraRef.current) return;

    switch (cameraState) {
      case "transitioning": {
        const targetPos = new THREE.Vector3(0.28, 1.6, 1.2);
        const targetLookAt = new THREE.Vector3(0.28, 0.62, 2.2);

        cameraRef.current.position.lerp(targetPos, delta * 4);

        const direction = new THREE.Vector3().subVectors(
          targetLookAt,
          cameraRef.current.position
        );
        const targetYaw = Math.atan2(-direction.x, -direction.z);
        const horizontalDist = Math.sqrt(
          direction.x * direction.x + direction.z * direction.z
        );
        const targetPitch = Math.atan2(direction.y, horizontalDist);
        const rotationLerpFactor = delta * 5;

        let yawDiff = targetYaw - yawRef.current;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        yawRef.current += yawDiff * rotationLerpFactor;

        pitchRef.current +=
          (targetPitch - pitchRef.current) * rotationLerpFactor;

        cameraRef.current.rotation.order = "YXZ";
        cameraRef.current.rotation.y = yawRef.current;
        cameraRef.current.rotation.x = pitchRef.current;
        cameraRef.current.rotation.z = 0;

        if (cameraRef.current.position.distanceTo(targetPos) < 0.01) {
          cameraRef.current.position.copy(targetPos);
          yawRef.current = targetYaw;
          pitchRef.current = targetPitch;
          cameraRef.current.rotation.y = targetYaw;
          cameraRef.current.rotation.x = targetPitch;
          onStartAnimationFinish();
          setCameraState("directed");
        }
        break;
      }
      case "cinematic": {
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

        const direction = new THREE.Vector3().subVectors(
          currentCameraLookAt.current,
          cameraRef.current.position
        );
        const targetYaw = Math.atan2(-direction.x, -direction.z);
        const horizontalDist = Math.sqrt(
          direction.x * direction.x + direction.z * direction.z
        );
        const targetPitch = Math.atan2(direction.y, horizontalDist);
        const rotationLerpFactor = easeProgress * 0.15;

        let yawDiff = targetYaw - yawRef.current;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        yawRef.current += yawDiff * rotationLerpFactor;

        pitchRef.current +=
          (targetPitch - pitchRef.current) * rotationLerpFactor;

        cameraRef.current.rotation.order = "YXZ";
        cameraRef.current.rotation.y = yawRef.current;
        cameraRef.current.rotation.x = pitchRef.current;
        cameraRef.current.rotation.z = 0;
        break;
      }
      case "directed": {
        let targetPos = new THREE.Vector3();

        switch (gamePhase) {
          case "idle":
            targetPos = new THREE.Vector3(0.28, 1.6, 1.2);
            break;
          case "item_selection":
            targetPos = new THREE.Vector3(-2.25, 1.45, 2.2);
            break;
          case "throwing":
            targetPos = new THREE.Vector3(0.28, 1.55, 1.6);
            break;
          case "settled":
            targetPos = new THREE.Vector3(0.28, 1.55, 1.6);
            break;
          case "evaluating":
            targetPos = new THREE.Vector3(0, 2.5, 6);
            break;
        }

        cameraRef.current.position.lerp(targetPos, delta * 3);

        if (phaseTransitionProgress.current < 1.0) {
          phaseTransitionProgress.current = Math.min(
            1.0,
            phaseTransitionProgress.current + delta * 2
          );
        }

        if (isMobile && orientationRef?.current) {
          const config = getDeviceOrientationConfig();
          const slerpFactor = THREE.MathUtils.clamp(
            (1 - config.smoothing) * config.sensitivity,
            0.05,
            0.5
          );
          cameraRef.current.quaternion.slerp(
            orientationRef.current,
            slerpFactor
          );
        } else {
          cameraRef.current.rotation.order = "YXZ";
          cameraRef.current.rotation.y = yawRef.current;
          cameraRef.current.rotation.x = pitchRef.current;
          cameraRef.current.rotation.z = 0;
        }
        break;
      }
      case "player_control": {
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
      fov={40}
      near={0.2}
      far={20}
      position={[0, 1.5, 5]}
    />
  );
}

export { CameraSystem as default };
