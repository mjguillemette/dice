import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PerspectiveCamera } from "@react-three/drei";
import {
  CINEMATIC_ANGLES,
  CAMERA_TRANSITION_DURATION,
  CAMERA_HOLD_DURATION,
  MOVEMENT_SPEED,
} from "../../constants/gameConfig";
import type { InputState } from "../../systems/inputSystem";
import { initializeCollisionBoxes, checkCollision } from "../../systems/collisionSystem";

interface CameraSystemProps {
  cinematicMode: boolean;
  inputState: InputState;
  onCameraNameChange?: (name: string) => void;
}

export function CameraSystem({
  cinematicMode,
  inputState,
  onCameraNameChange
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

  const nextCamera = useCallback(() => {
    if (cinematicMode) {
      setCinematicAngle(currentCameraIndex + 1);
    }
  }, [cinematicMode, currentCameraIndex, setCinematicAngle]);

  useFrame((state, delta) => {
    if (!cameraRef.current) return;

    if (cinematicMode) {
      // Cinematic mode - smooth transitions between angles
      cameraTransitionTime.current += delta;

      // Auto-advance to next angle
      if (
        cameraTransitionTime.current >
        CAMERA_HOLD_DURATION + CAMERA_TRANSITION_DURATION
      ) {
        setCinematicAngle(currentCameraIndex + 1);
      }

      // Smooth transition with easing
      const transitionProgress = Math.min(
        cameraTransitionTime.current / CAMERA_TRANSITION_DURATION,
        1
      );

      // Ease in-out function
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
    } else {
      // Free camera mode - WASD movement
      const moveSpeed = MOVEMENT_SPEED;

      // Get camera's forward and right vectors based on yaw rotation
      const yaw = cameraRef.current.rotation.y;

      // Forward/backward movement (W/S)
      if (inputState.moveForward || inputState.moveBackward) {
        const direction = Number(inputState.moveForward) - Number(inputState.moveBackward);
        cameraRef.current.position.x -= direction * moveSpeed * Math.sin(yaw);
        cameraRef.current.position.z -= direction * moveSpeed * Math.cos(yaw);
      }

      // Strafe left/right movement (A/D) - perpendicular to forward
      if (inputState.moveLeft || inputState.moveRight) {
        const direction = Number(inputState.moveRight) - Number(inputState.moveLeft);
        // Right vector is forward rotated 90 degrees clockwise
        cameraRef.current.position.x += direction * moveSpeed * Math.cos(yaw);
        cameraRef.current.position.z -= direction * moveSpeed * Math.sin(yaw);
      }

      // Apply collision detection (no boundary clamping - collision handles walls)
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
