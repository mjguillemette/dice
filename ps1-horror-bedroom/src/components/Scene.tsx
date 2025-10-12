import { useState, useCallback, useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { FOG_CONFIG } from "../constants/gameConfig";
import {
  useInput,
  useMouseLook,
  requestPointerLock
} from "../systems/inputSystem";
import { useCorruption } from "../systems/corruptionSystem";
import CameraSystem from "./camera/CameraSystem";
import LightingRig from "./lighting/LightingRig";
import Room from "./models/Room";
import Bed from "./models/Bed";
import Bureau from "./models/Bureau";
import TVStand from "./models/TVStand";
import Window from "./models/Window";
import CeilingLight from "./models/CeilingLight";
import Decorations from "./models/Decorations";
import Ashtray from "./models/Ashtray";
import BoardGame from "./models/BoardGame";
import DiceReceptacle from "./models/DiceReceptacle";
import Card from "./models/Card";
import House from "./house/House";
import DiceManager, { type DiceManagerHandle } from "./models/DiceManager";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

interface SceneProps {
  onCameraNameChange: (name: string) => void;
  onCameraModeChange: (cinematicMode: boolean) => void;
  onHellFactorChange: (hellFactor: number) => void;
  onAutoCorruptionChange: (autoCorruption: boolean) => void;
  diceCount: number;
  coinCount: number;
  d3Count: number;
  d4Count: number;
  thumbTackCount: number;
  onDiceScoreChange: (score: number) => void;
  diceShaderEnabled: boolean;
  cardEnabled: boolean;
  onCardItemsChange: (diceOnCard: number[]) => void;
  onSuccessfulRoll: () => void;
  onFailedRoll: () => void;
  onAttempt: () => void;
  onDiceSettled: () => void;
  daysMarked: number;
}

export function Scene({
  onCameraNameChange,
  onCameraModeChange,
  onHellFactorChange,
  onAutoCorruptionChange,
  diceCount,
  coinCount,
  d3Count,
  d4Count,
  thumbTackCount,
  onDiceScoreChange,
  diceShaderEnabled,
  cardEnabled,
  onCardItemsChange,
  onSuccessfulRoll,
  onFailedRoll,
  onAttempt,
  onDiceSettled,
  daysMarked
}: SceneProps) {
  const { scene, camera, gl } = useThree();
  const [cinematicMode, setCinematicMode] = useState(false);
  const cameraRef = useRef(camera);
  const diceManagerRef = useRef<DiceManagerHandle>(null);
  const [hasItemsOnCard, setHasItemsOnCard] = useState(false);

  // Store yaw (left/right) and pitch (up/down) separately for FPS camera
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Throw charge mechanics
  const [throwCharging, setThrowCharging] = useState(false);
  const [throwCharge, setThrowCharge] = useState(0);
  const chargeStartTime = useRef<number>(0);
  const MAX_CHARGE_TIME = 1500; // 1.5 seconds max charge

  const {
    hellFactor,
    autoCorruption,
    increaseCorruption,
    decreaseCorruption,
    toggleAutoCorruption
  } = useCorruption();

  // Update parent component with hellFactor changes
  useEffect(() => {
    onHellFactorChange(hellFactor);
  }, [hellFactor, onHellFactorChange]);

  // Update parent component with autoCorruption changes
  useEffect(() => {
    onAutoCorruptionChange(autoCorruption);
  }, [autoCorruption, onAutoCorruptionChange]);

  // Callback for card items change that updates both parent and local state
  const handleCardItemsChange = useCallback(
    (diceIds: number[]) => {
      setHasItemsOnCard(diceIds.length > 0);
      onCardItemsChange(diceIds);
    },
    [onCardItemsChange]
  );

  const toggleCamera = useCallback(() => {
    const newMode = !cinematicMode;
    setCinematicMode(newMode);
    onCameraModeChange(newMode);

    if (!newMode) {
      // Entering free camera mode - reset to FPS starting position
      if (cameraRef.current) {
        // Set camera to player height in center of room, facing forward
        cameraRef.current.position.set(0, 1.6, 0);

        // Reset rotation to face forward (negative Z)
        yawRef.current = 0;
        pitchRef.current = 0;
        cameraRef.current.rotation.set(0, 0, 0, "YXZ"); // YXZ order prevents gimbal lock
      }

      // Request pointer lock
      requestPointerLock();
    }
  }, [cinematicMode, onCameraModeChange]);

  const handleMouseMove = useCallback(
    (movementX: number, movementY: number) => {
      if (cameraRef.current && !cinematicMode) {
        // Update yaw (left/right) and pitch (up/down)
        yawRef.current -= movementX * 0.002;
        pitchRef.current -= movementY * 0.002;

        // Clamp pitch to prevent looking too far up or down
        const maxPitch = Math.PI / 2 - 0.1; // Slightly less than 90 degrees
        pitchRef.current = Math.max(
          -maxPitch,
          Math.min(maxPitch, pitchRef.current)
        );

        // Apply rotation using YXZ order (prevents weird tilting/rolling)
        cameraRef.current.rotation.order = "YXZ";
        cameraRef.current.rotation.y = yawRef.current;
        cameraRef.current.rotation.x = pitchRef.current;
        cameraRef.current.rotation.z = 0; // No roll
      }
    },
    [cinematicMode]
  );

  const inputState = useInput({
    onToggleCamera: toggleCamera,
    onIncreaseCorruption: increaseCorruption,
    onDecreaseCorruption: decreaseCorruption,
    onToggleAutoCorruption: toggleAutoCorruption
  });

  useMouseLook(handleMouseMove, !cinematicMode);

  // Update fog and background based on corruption
  useEffect(() => {
    const fogColor = new THREE.Color().lerpColors(
      new THREE.Color(FOG_CONFIG.normalColor),
      new THREE.Color(FOG_CONFIG.hellColor),
      hellFactor
    );

    if (scene.fog) {
      (scene.fog as THREE.Fog).color = fogColor;
    } else {
      scene.fog = new THREE.Fog(fogColor, FOG_CONFIG.near, FOG_CONFIG.far);
    }

    scene.background = fogColor;
  }, [scene, hellFactor]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Reset dice when throwable counts change in DevPanel
  useEffect(() => {
    if (diceManagerRef.current) {
      console.log("Dice counts changed - resetting all dice");
      diceManagerRef.current.resetDice();
    }
  }, [diceCount, coinCount, d3Count, d4Count, thumbTackCount]);

  // Handle click to throw dice or pick up outside dice
  const handleClick = useCallback(
    (event: MouseEvent) => {
      console.log(
        "Click detected! Pointer locked:",
        !!document.pointerLockElement
      );

      if (!diceManagerRef.current) return;

      // Priority 1: If there are settled dice, pick them up first
      if (diceManagerRef.current.hasSettledDice()) {
        const pickedUp = diceManagerRef.current.pickUpOutsideDice();
        console.log("Picked up", pickedUp, "dice - next click will throw");

        // Check if this was a successful roll (all dice in receptacle, no outside dice)
        if (pickedUp === 0) {
          // This means all dice were in receptacle - successful roll!
          console.log("Successful roll completed!");
          onSuccessfulRoll();
        } else {
          // Some dice were outside receptacle - failed roll
          console.log("Failed roll - some dice were outside receptacle");
          onFailedRoll();
        }

        return; // ALWAYS return after picking up - prevents both actions in one click
      }

      // Priority 2: Check if we can throw (not debounced)
      if (!diceManagerRef.current.canThrow()) {
        console.log("Cannot throw - debounce active");
        return;
      }

      // Priority 3: Throw dice (either from re-throw queue or fresh)
      // Get the camera's current position and direction
      const cameraPosition = camera.position.clone();
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);

      // For pointer locked (first person) mode, raycast from camera center
      if (document.pointerLockElement) {
        console.log("FPS mode - throwing from camera look direction");
        // Raycast from center of screen (where camera is looking)
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        const didIntersect = raycaster.ray.intersectPlane(
          floorPlane,
          intersectPoint
        );

        console.log("Floor intersect:", didIntersect, intersectPoint);

        if (didIntersect && diceManagerRef.current) {
          console.log(
            "Throwing dice from camera at:",
            cameraPosition,
            "to:",
            intersectPoint
          );
          diceManagerRef.current.throwDice(intersectPoint, cameraPosition);
          onAttempt(); // Count this as an attempt
        }
      } else {
        console.log("Cinematic mode - throwing from mouse position");
        // For cinematic mode, raycast from mouse position
        const rect = gl.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        const didIntersect = raycaster.ray.intersectPlane(
          floorPlane,
          intersectPoint
        );

        if (didIntersect && diceManagerRef.current) {
          console.log(
            "Throwing dice from camera at:",
            cameraPosition,
            "to:",
            intersectPoint
          );
          diceManagerRef.current.throwDice(intersectPoint, cameraPosition);
          onAttempt(); // Count this as an attempt
        }
      }
    },
    [camera, gl, onAttempt, onSuccessfulRoll, onFailedRoll]
  );

  useEffect(() => {
    const canvas = gl.domElement;

    // Use mousedown instead of click for better pointer lock compatibility
    const handleMouseDown = (event: MouseEvent) => {
      console.log("Mousedown event fired, button:", event.button);
      // Only handle left click
      if (event.button === 0) {
        handleClick(event);
      }
    };

    // Add listeners to both canvas and document for pointer lock compatibility
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("click", handleMouseDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("click", handleMouseDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [gl, handleClick]);


  // Just a test GLTF model to verify loading
  const thumb = useLoader(GLTFLoader, "thumb.gltf");

  return (
    <>
      <CameraSystem
        cinematicMode={cinematicMode}
        inputState={inputState}
        onCameraNameChange={onCameraNameChange}
      />

      <LightingRig hellFactor={hellFactor} />

      {/* Test model */}
      <primitive
        object={thumb.scene}
        position={[1.8, .082, 2.21]}
        scale={0.145}
        rotation={[Math.PI / 2.1, Math.PI, 0.7]}
      />
      
      {/* Physics world for dice */}
      <Physics gravity={[0, -9.81, 0]}>
        <DiceManager
          ref={diceManagerRef}
          diceCount={diceCount}
          coinCount={coinCount}
          d3Count={d3Count}
          d4Count={d4Count}
          thumbTackCount={thumbTackCount}
          onScoreUpdate={onDiceScoreChange}
          shaderEnabled={diceShaderEnabled}
          cardEnabled={cardEnabled}
          onCardItemsChange={handleCardItemsChange}
        />

        {/* Ground plane - using explicit CuboidCollider */}
        <RigidBody
          type="fixed"
          position={[0, -0.05, 0]}
          friction={0.8}
          restitution={0.2}
        >
          <CuboidCollider args={[10, 0.05, 10]} />
        </RigidBody>

        {/* Invisible boundary walls using CuboidCollider */}
        {/* Back wall */}
        <RigidBody type="fixed" position={[0, 1.5, -5]} friction={0.5}>
          <CuboidCollider args={[5, 1.5, 0.1]} />
        </RigidBody>
        {/* Front wall */}
        <RigidBody type="fixed" position={[0, 1.5, 5]} friction={0.5}>
          <CuboidCollider args={[5, 1.5, 0.1]} />
        </RigidBody>
        {/* Left wall */}
        <RigidBody type="fixed" position={[-5, 1.5, 0]} friction={0.5}>
          <CuboidCollider args={[0.1, 1.5, 5]} />
        </RigidBody>
        {/* Right wall */}
        <RigidBody type="fixed" position={[5, 1.5, 0]} friction={0.5}>
          <CuboidCollider args={[0.1, 1.5, 5]} />
        </RigidBody>

        {/* Furniture colliders */}
        {/* Bed - Combined bounding box for entire bed */}
        <RigidBody
          type="fixed"
          position={[-2, 0.4, -2]}
          friction={0.6}
          restitution={0.3}
        >
          <CuboidCollider args={[1.6, 0.5, 2.1]} />
        </RigidBody>

        {/* Bureau - Including drawers */}
        <RigidBody
          type="fixed"
          position={[3, 0.8, -4.1]}
          friction={0.5}
          restitution={0.2}
        >
          <CuboidCollider args={[0.9, 0.6, 0.55]} />
        </RigidBody>

        {/* TV Stand - Combined bounding box */}
        <RigidBody
          type="fixed"
          position={[0, 0.9, -4.4]}
          friction={0.5}
          restitution={0.2}
        >
          <CuboidCollider args={[1.25, 1.0, 0.4]} />
        </RigidBody>

        {/* Coffee Table - In second room */}
        <RigidBody
          type="fixed"
          position={[0, 0.5, 10]}
          friction={0.5}
          restitution={0.2}
        >
          <CuboidCollider args={[0.9, 0.25, 0.6]} />
        </RigidBody>

        {/* Dice Receptacle - THICK solid base to prevent tiny dice tunneling */}
        <RigidBody
          type="fixed"
          position={[1.5, 0.0, 2.5]}
          friction={0.8}
          restitution={0.15}
          ccd={true}
        >
          {/* Very thick base - prevents fast dice tunneling through */}
          <CuboidCollider args={[0.6, 0.08, 0.4]} position={[0, 0.08, 0]} />
          {/* Tall front wall */}
          <CuboidCollider args={[0.6, 0.1, 0.04]} position={[0, 0.16, 0.36]} />
          {/* Tall back wall */}
          <CuboidCollider args={[0.6, 0.1, 0.04]} position={[0, 0.16, -0.36]} />
          {/* Tall left wall */}
          <CuboidCollider
            args={[0.04, 0.1, 0.32]}
            position={[-0.56, 0.16, 0]}
          />
          {/* Tall right wall */}
          <CuboidCollider args={[0.04, 0.1, 0.32]} position={[0.56, 0.16, 0]} />
        </RigidBody>
      </Physics>

      {/* House structure (floors, walls, stairs) */}
      <House hellFactor={hellFactor} />

      {/* Bedroom (upper level) */}
      <Room hellFactor={hellFactor} />
      <Bed hellFactor={hellFactor} />
      <Bureau hellFactor={hellFactor} />
      <TVStand hellFactor={hellFactor} />
      <Window hellFactor={hellFactor} />
      <CeilingLight hellFactor={hellFactor} />
      <Decorations hellFactor={hellFactor} />
      <Ashtray hellFactor={hellFactor} />
      <BoardGame
        position={[2.5, 0.05, 2.38]}
        hellFactor={hellFactor}
        daysMarked={daysMarked}
      />
      <DiceReceptacle position={[1.5, 0.02, 2.5]} hellFactor={hellFactor} />
      {cardEnabled && (
        <Card
          position={[1.73, 0.063, 3.04]}
          hellFactor={hellFactor}
          hasItemOnTop={hasItemsOnCard}
        />
      )}
    </>
  );
}

export default Scene;
