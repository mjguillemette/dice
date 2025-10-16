import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import { FOG_CONFIG, TIME_OF_DAY_CONFIG } from "../constants/gameConfig";
import {
  RECEPTACLE_POSITION,
  getTowerCardPosition,
  getSunCardPosition,
  getHourglassPosition
} from "../constants/receptacleConfig";
import { type TimeOfDay } from "../systems/gameStateSystem";
import { getTimeProgressRatio } from "../systems/gameStateSystem";
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
import CeilingLight from "./models/CeilingLight";
import Decorations from "./models/Decorations";
import Ashtray from "./models/Ashtray";
import BoardGame from "./models/BoardGame";
import DiceReceptacle from "./models/DiceReceptacle";
import Card from "./models/Card";
import Hourglass from "./models/Hourglass";
import House from "./house/House";
import DiceManager, { type DiceManagerHandle } from "./models/DiceManager";
import ItemChoice from "./models/ItemChoice";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { type ItemDefinition } from "../systems/itemSystem";

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
  towerCardEnabled: boolean;
  sunCardEnabled: boolean;
  onTowerCardItemsChange: (diceOnCard: number[]) => void;
  onSunCardItemsChange: (diceOnCard: number[]) => void;
  showCardDebugBounds: boolean;
  spotlightHeight: number;
  spotlightIntensity: number;
  spotlightAngle: number;
  onSuccessfulRoll: () => void;
  onFailedRoll: () => void;
  onAttempt: () => void;
  onDiceSettled: () => void;
  daysMarked: number;
  currentAttempts: number; // Needed to know if round is complete after failed roll
  timeOfDay: TimeOfDay;
  successfulRolls: number; // Needed for time transition progress
  itemChoices: ItemDefinition[]; // Items to choose from
  storeChoices: ItemDefinition[];
  onItemSelected: (item: ItemDefinition) => void; // Called when item is selected
  onDieSettledForCurrency: (type: string, amount: number) => void;
  isStoreOpen: boolean;
  playerBalance: number;
  onPurchase: (item: ItemDefinition) => void;
  onCloseStore: () => void;
  spendCurrency: (type: string, amount: number) => boolean;
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
  towerCardEnabled,
  sunCardEnabled,
  onTowerCardItemsChange,
  onSunCardItemsChange,
  showCardDebugBounds,
  spotlightHeight,
  spotlightIntensity,
  spotlightAngle,
  onSuccessfulRoll,
  onFailedRoll,
  onAttempt,
  daysMarked,
  currentAttempts,
  timeOfDay,
  successfulRolls,
  itemChoices,
  onItemSelected,
  onDieSettledForCurrency,
  storeChoices,
  spendCurrency
}: SceneProps) {
  const { scene, camera, gl } = useThree();
  const [cinematicMode, setCinematicMode] = useState(false);
  const cameraRef = useRef(camera);
  const diceManagerRef = useRef<DiceManagerHandle>(null);
  const [hasItemsOnTowerCard, setHasItemsOnTowerCard] = useState(false);
  const [hasItemsOnSunCard, setHasItemsOnSunCard] = useState(false);

  console.log("Store choices:", storeChoices);
  // Store yaw (left/right) and pitch (up/down) separately for FPS camera
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // // Throw charge mechanics
  // const [throwCharging, setThrowCharging] = useState(false);
  // const [throwCharge, setThrowCharge] = useState(0);
  // const chargeStartTime = useRef<number>(0);
  // const MAX_CHARGE_TIME = 1500; // 1.5 seconds max charge

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

  // Callbacks for card items change that update both parent and local state
  const handleTowerCardItemsChange = useCallback(
    (diceIds: number[]) => {
      setHasItemsOnTowerCard(diceIds.length > 0);
      onTowerCardItemsChange(diceIds);
    },
    [onTowerCardItemsChange]
  );

  const handleSunCardItemsChange = useCallback(
    (diceIds: number[]) => {
      setHasItemsOnSunCard(diceIds.length > 0);
      onSunCardItemsChange(diceIds);
    },
    [onSunCardItemsChange]
  );

  const handleCardItemsChange = useCallback(
    (sunCardDiceIDs: number[], towerCardDiceIDs: number[]) => {
      handleSunCardItemsChange(sunCardDiceIDs);
      handleTowerCardItemsChange(towerCardDiceIDs);
    },
    [handleSunCardItemsChange, handleTowerCardItemsChange]
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

  // Update fog and background based on time of day AND corruption
  useEffect(() => {
    // Calculate time progress (0-1) toward next time period
    const timeProgress = getTimeProgressRatio(successfulRolls);

    // Get current and next time period colors
    const getNextTimePeriod = (current: TimeOfDay): TimeOfDay => {
      if (current === "morning") return "midday";
      if (current === "midday") return "night";
      return "morning";
    };

    const nextTime = getNextTimePeriod(timeOfDay);
    const currentTimeConfig = TIME_OF_DAY_CONFIG[timeOfDay];
    const nextTimeConfig = TIME_OF_DAY_CONFIG[nextTime];

    console.log("🌅 Time-of-Day Update:", {
      timeOfDay,
      successfulRolls,
      timeProgress,
      nextTime,
      currentFogColor: `#${currentTimeConfig.fogColor.toString(16)}`,
      nextFogColor: `#${nextTimeConfig.fogColor.toString(16)}`
    });

    // Blend between current and next time-of-day
    const normalFogColor = new THREE.Color(currentTimeConfig.fogColor).lerp(
      new THREE.Color(nextTimeConfig.fogColor),
      timeProgress
    );

    // Then blend with corruption/hell color
    const fogColor = normalFogColor
      .clone()
      .lerp(new THREE.Color(FOG_CONFIG.hellColor), hellFactor);

    console.log("🎨 Final fog color:", `#${fogColor.getHexString()}`);

    if (scene.fog) {
      (scene.fog as THREE.Fog).color = fogColor;
    } else {
      scene.fog = new THREE.Fog(fogColor, FOG_CONFIG.near, FOG_CONFIG.far);
    }

    scene.background = fogColor;
  }, [scene, hellFactor, timeOfDay, successfulRolls]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Update dice pool when throwable counts change (preserves transformations on existing dice)
  useEffect(() => {
    if (diceManagerRef.current) {
      console.log("Dice counts changed - updating dice pool");
      diceManagerRef.current.updateDicePool({
        d6: diceCount,
        coins: coinCount,
        d3: d3Count,
        d4: d4Count,
        thumbtacks: thumbTackCount
      });
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

      // Perform raycast to check what surface we're clicking on
      const raycaster = new THREE.Raycaster();
      let mouse: THREE.Vector2;

      if (document.pointerLockElement) {
        // First-person mode - raycast from center of screen
        mouse = new THREE.Vector2(0, 0);
      } else {
        // Cinematic mode - raycast from mouse position
        const rect = gl.domElement.getBoundingClientRect();
        mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Check if we hit an item choice (they're inside Physics, which is in scene.children)
      // Item choices are named "ItemChoice" or have specific materials/geometries
      const hitItemChoice = intersects.some((intersect) => {
        const obj = intersect.object;
        // Check if this object or any parent is part of an item choice
        let current: THREE.Object3D | null = obj;
        while (current) {
          // Item choices are meshes with specific names or are children of groups positioned at item locations
          if (
            current.name === "ItemChoice" ||
            (current.parent && current.parent.name === "ItemChoice")
          ) {
            return true;
          }
          current = current.parent;
        }
        return false;
      });

      if (hitItemChoice) {
        console.log("🚫 Clicked on item choice - not throwing dice");
        return;
      }

      // Check if we hit a valid throwable surface (floor, furniture, receptacle)
      const validSurfaceNames = [
        "Ground",
        "Floor",
        "Furniture",
        "Receptacle",
        "Table",
        "Bed",
        "Bureau",
        "TVStand"
      ];
      const hitValidSurface = intersects.some((intersect) => {
        const obj = intersect.object;
        let current: THREE.Object3D | null = obj;
        while (current) {
          if (validSurfaceNames.some((name) => current!.name.includes(name))) {
            return true;
          }
          current = current.parent;
        }
        // Also allow if we hit the floor plane (y near 0)
        return intersect.point.y < 0.1;
      });

      if (!hitValidSurface && intersects.length > 0) {
        console.log("🚫 Not clicking on valid throwing surface");
        return;
      }

      // Priority 1: If there are settled dice, pick them up first AND evaluate round
      if (diceManagerRef.current.hasSettledDice()) {
        const pickedUp = diceManagerRef.current.pickUpOutsideDice();
        console.log("Picked up", pickedUp, "dice outside receptacle");

        // Now evaluate the round based on what happened
        if (pickedUp === 0) {
          // All dice were in receptacle - successful round!
          console.log("✅ All dice in receptacle - successful round!");
          onSuccessfulRoll();
          // Start a new round - this will pick up all dice and reset score
          diceManagerRef.current.startNewRound();
        } else {
          // Some dice were outside receptacle - failed attempt
          console.log(
            "❌",
            pickedUp,
            "dice were outside receptacle - failed attempt"
          );
          onFailedRoll();

          // Check if this was the last attempt (round is now complete)
          // After calling onFailedRoll(), currentAttempts will have been incremented
          // So we check if currentAttempts >= 2 (MAX_ATTEMPTS_PER_ROUND)
          if (currentAttempts >= 2) {
            console.log(
              "🔄 Round complete after failed attempts - starting new round"
            );
            diceManagerRef.current.startNewRound();
          }
        }

        return; // ALWAYS return after picking up - prevents both actions in one click
      }

      // Priority 2: Check if we can throw (not debounced)
      if (!diceManagerRef.current.canThrow()) {
        console.log("Cannot throw - debounce active");
        return;
      }

      // Priority 3: Throw dice (either from re-throw queue or fresh)
      // Count this as an attempt BEFORE throwing
      console.log("🎲 Starting new attempt...");
      onAttempt();

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
        }
      }
    },
    [
      camera,
      gl,
      onAttempt,
      onSuccessfulRoll,
      onFailedRoll,
      currentAttempts,
      itemChoices.length
    ]
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
  // const thumb = useLoader(GLTFLoader, "thumb.gltf");
  const table = useLoader(GLTFLoader, "table.gltf");
  // const key = useLoader(GLTFLoader, "key.gltf");
  const television = useLoader(GLTFLoader, "television.gltf");
  const cabinet = useLoader(GLTFLoader, "cabinet.gltf");

  return (
    <>
      <CameraSystem
        cinematicMode={cinematicMode}
        inputState={inputState}
        onCameraNameChange={onCameraNameChange}
      />

      <LightingRig
        hellFactor={hellFactor}
        timeOfDay={timeOfDay}
        timeProgress={getTimeProgressRatio(successfulRolls)}
      />

      {/* Test model - thumb tack on receptacle */}
      {/* <primitive
        object={thumb.scene}
        position={getThumbPosition()}
        scale={0.145}
        rotation={[Math.PI / 2.1, Math.PI, 0.7]}
      /> */}
      <primitive
        object={table.scene}
        position={[0, -0.01, 2.21]}
        scale={3}
        rotation={[0, Math.PI / 2, 0]}
      />
      <primitive
        object={television.scene}
        position={[-4, 0.01, 4.21]}
        scale={1}
        rotation={[0, Math.PI / 0.31, 0]}
      />
      <primitive
        object={cabinet.scene}
        position={[-2.2, 0.0, 4.2]}
        scale={1.4}
        rotation={[0, Math.PI / - 2, 0]}
      />

      <Suspense fallback={null}>
        {/* Physics world for dice */}
        <Physics gravity={[0, -10, 0]}>
          <DiceManager
            ref={diceManagerRef}
            diceCount={diceCount}
            coinCount={coinCount}
            d3Count={d3Count}
            d4Count={d4Count}
            thumbTackCount={thumbTackCount}
            onScoreUpdate={onDiceScoreChange}
            shaderEnabled={diceShaderEnabled}
            cardEnabled={towerCardEnabled || sunCardEnabled}
            onCardItemsChange={handleCardItemsChange}
            onCoinSettled={onDieSettledForCurrency}
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

          {/* Dice Receptacle - now includes its own collision boxes */}
          <DiceReceptacle
            position={RECEPTACLE_POSITION}
            hellFactor={hellFactor}
            spotlightHeight={spotlightHeight}
            spotlightIntensity={spotlightIntensity}
            spotlightAngle={spotlightAngle}
          />

          {/* Hourglass - physics-enabled object on receptacle */}
          <Hourglass
            position={getHourglassPosition()}
            hellFactor={hellFactor}
            onBumped={() => console.log("⏳ Hourglass was bumped by dice!")}
          />

          {/* Tower Card - must be inside Physics for sensor collision detection */}
          {towerCardEnabled && (
            <Card
              position={getTowerCardPosition()}
              cardType="tower"
              hellFactor={hellFactor}
              hasItemOnTop={hasItemsOnTowerCard}
              showDebugBounds={showCardDebugBounds}
              onDiceEnter={(diceId) => {
                if (diceManagerRef.current) {
                  console.log(
                    "🔮 Tower Card collision detected - applying transformation to die",
                    diceId
                  );
                  diceManagerRef.current.applyCardTransformation?.(
                    diceId,
                    "tower"
                  );
                }
              }}
            />
          )}

          {/* Sun Card - must be inside Physics for sensor collision detection */}
          {sunCardEnabled && (
            <Card
              position={getSunCardPosition()}
              cardType="sun"
              hellFactor={hellFactor}
              hasItemOnTop={hasItemsOnSunCard}
              showDebugBounds={showCardDebugBounds}
              onDiceEnter={(diceId) => {
                if (diceManagerRef.current) {
                  console.log(
                    "☀️ Sun Card collision detected - applying transformation to die",
                    diceId
                  );
                  diceManagerRef.current.applyCardTransformation?.(
                    diceId,
                    "sun"
                  );
                }
              }}
            />
          )}

          {/* Store Choices */}
          {storeChoices.map((item, index) => (
            <ItemChoice
              key={`store-${index}`}
              item={item}
              position={[-0.3 + index * 0.3, 0.85, 2.68]}
              // onPurchase is called on success to add the item
              onPurchase={() => onItemSelected(item)}
              // spendCurrency handles the transaction
              spendCurrency={() => spendCurrency("cents", item.price || 0)}
            />
          ))}

          {/* Free Item Choices */}
          {itemChoices.map((item, index) => (
            <ItemChoice
              key={`reward-${index}`}
              item={item}
              position={[-2.3 + index * 0.3, 1.1, 4.25]}
              onPurchase={() => onItemSelected(item)}
              spendCurrency={() => true}
            />
          ))}
        </Physics>
      </Suspense>
 {/* position={[-2.2, 0.0, 4.2]} */}
      {/* House structure (floors, walls, stairs) */}
      <House hellFactor={hellFactor} />

      {/* Bedroom (upper level) */}
      <Room hellFactor={hellFactor} />
      <Bed hellFactor={hellFactor} />
      <Bureau hellFactor={hellFactor} />
      <TVStand hellFactor={hellFactor} />
      {/* <Window hellFactor={hellFactor} /> */}
      <CeilingLight hellFactor={hellFactor} />
      <Decorations hellFactor={hellFactor} />
      <Ashtray hellFactor={hellFactor} />
      <BoardGame
        position={[2.01, 1.55, 4.88]}
        hellFactor={hellFactor}
        daysMarked={daysMarked}
      />
    </>
  );
}

export default Scene;
