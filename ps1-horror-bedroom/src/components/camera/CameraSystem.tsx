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
}

export function CameraSystem({
  inputState,
  onCameraNameChange,
  isStarting,
  onStartAnimationFinish,
  gamePhase,
  yawRef,
  pitchRef
}: CameraSystemProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const [cameraState, setCameraState] = useState<CameraState>("cinematic");

  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const cameraTransitionTime = useRef(0);
  const previousGamePhase = useRef<GamePhase>(gamePhase);
  const phaseTransitionProgress = useRef(1.0); // 1.0 = transition complete, 0.0 = just started

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
      console.log("🎬 Camera: Starting game transition");
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
      // All active gameplay phases use directed camera
      setCameraState("directed");

      // DON'T initialize rotation here during phase changes
      // Let the player keep their current rotation - they have full mouse control
      // Rotation is only initialized once during the initial "transitioning" state

      previousGamePhase.current = gamePhase;
    } else {
      // Fallback to directed (shouldn't reach here normally)
      setCameraState("directed");
    }
  }, [isStarting, gamePhase, yawRef, pitchRef]);

  useFrame((state, delta) => {
    if (!cameraRef.current) return;

    const playerLook = new THREE.Vector2(state.mouse.x, state.mouse.y);
    // touch playerLook so as to not trigger TS warning
    playerLook.clone();

    switch (cameraState) {
      case "transitioning": {
        const targetPos = new THREE.Vector3(0.28, 1.6, 1.2);
        const targetLookAt = new THREE.Vector3(0.28, 0.62, 2.2);

        // Smooth position lerping
        cameraRef.current.position.lerp(targetPos, delta * 2);

        // Calculate target rotation from lookAt
        const direction = new THREE.Vector3().subVectors(
          targetLookAt,
          cameraRef.current.position
        );
        // In Three.js, default camera looks at -Z, so we need to adjust the yaw calculation
        const targetYaw = Math.atan2(-direction.x, -direction.z);
        const horizontalDist = Math.sqrt(
          direction.x * direction.x + direction.z * direction.z
        );
        const targetPitch = Math.atan2(direction.y, horizontalDist); // Positive Y = look up, Negative Y = look down

        // Smooth rotation lerping
        const rotationLerpFactor = delta * 3;

        // Lerp yaw (handle wrapping)
        let yawDiff = targetYaw - yawRef.current;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        yawRef.current += yawDiff * rotationLerpFactor;

        // Lerp pitch
        pitchRef.current +=
          (targetPitch - pitchRef.current) * rotationLerpFactor;

        // Apply rotation
        cameraRef.current.rotation.order = "YXZ";
        cameraRef.current.rotation.y = yawRef.current;
        cameraRef.current.rotation.x = pitchRef.current;
        cameraRef.current.rotation.z = 0;

        if (cameraRef.current.position.distanceTo(targetPos) < 0.01) {
          cameraRef.current.position.copy(targetPos);

          // Ensure rotation is set correctly before finishing
          yawRef.current = targetYaw;
          pitchRef.current = targetPitch;
          cameraRef.current.rotation.y = targetYaw;
          cameraRef.current.rotation.x = targetPitch;

          console.log("🎬 Transitioning finished, final rotation:", {
            yaw: targetYaw,
            pitch: targetPitch,
            yawDeg: (targetYaw * 180) / Math.PI,
            pitchDeg: (targetPitch * 180) / Math.PI,
            cameraPos: `(${cameraRef.current.position.x.toFixed(
              2
            )}, ${cameraRef.current.position.y.toFixed(
              2
            )}, ${cameraRef.current.position.z.toFixed(2)})`
          });

          onStartAnimationFinish();
          // Transition to directed mode for gameplay
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

        // Smooth position lerping
        cameraRef.current.position.lerp(
          targetCameraPos.current,
          easeProgress * 0.1
        );

        // Lerp the lookAt target
        currentCameraLookAt.current.lerp(
          targetCameraLookAt.current,
          easeProgress * 0.1
        );

        // Calculate target rotation from lookAt direction
        const direction = new THREE.Vector3().subVectors(
          currentCameraLookAt.current,
          cameraRef.current.position
        );
        // In Three.js, default camera looks at -Z, so we need to adjust the yaw calculation
        const targetYaw = Math.atan2(-direction.x, -direction.z);
        const horizontalDist = Math.sqrt(
          direction.x * direction.x + direction.z * direction.z
        );
        const targetPitch = Math.atan2(direction.y, horizontalDist); // Positive Y = look up, Negative Y = look down

        // Smooth rotation lerping
        const rotationLerpFactor = easeProgress * 0.15;

        // Lerp yaw (handle wrapping)
        let yawDiff = targetYaw - yawRef.current;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        yawRef.current += yawDiff * rotationLerpFactor;

        // Lerp pitch
        pitchRef.current +=
          (targetPitch - pitchRef.current) * rotationLerpFactor;

        // Apply rotation
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
            // Look at receptacle/table - ready to throw
            targetPos = new THREE.Vector3(0.28, 1.6, 1.2);
            break;
          case "item_selection":
            targetPos = new THREE.Vector3(-2.25, 1.45, 2.6);
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

        // Smooth camera position lerping
        // Position is driven by game phase
        cameraRef.current.position.lerp(targetPos, delta * 3);

        // Progress the phase transition (used for smooth rotation takeover)
        if (phaseTransitionProgress.current < 1.0) {
          phaseTransitionProgress.current = Math.min(
            1.0,
            phaseTransitionProgress.current + delta * 2
          );
        }

        // CRITICAL: Apply rotation from refs to camera
        // This ensures the camera uses the yaw/pitch values set during transition
        // and updated by mouse input in Scene.tsx
        cameraRef.current.rotation.order = "YXZ";
        cameraRef.current.rotation.y = yawRef.current;
        cameraRef.current.rotation.x = pitchRef.current;
        cameraRef.current.rotation.z = 0;

        break;
      }

      case "player_control": {
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
      fov={40}
      near={0.2}
      far={20}
      position={[0, 1.5, 5]}
    />
  );
}

export { CameraSystem as default };
