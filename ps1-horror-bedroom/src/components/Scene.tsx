import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
import { useInput, useMouseLook } from "../systems/inputSystem";
import { useCorruption } from "../systems/corruptionSystem";
import { useGameState } from "../contexts/GameStateContext";
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
import { type GameState } from "../systems/gameStateSystem";
// import DiceInfo from "./ui/DiceInfo";

interface SceneProps {
  onCameraNameChange: (name: string) => void;
  // onCameraModeChange: (cinematicMode: boolean) => void;
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
  onDiceSettled: (diceValues?: number[]) => void;
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
  gameState: GameState;
  onStartGame: () => void;
  onDiceHover: (
    diceData: {
      id: number;
      type: string;
      faceValue: number;
      score: number;
      modifiers: string[];
      position: { x: number; y: number };
    } | null
  ) => void;
}
export function Scene({
  onCameraNameChange,
  // onCameraModeChange,
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
  onDiceSettled,
  daysMarked,
  currentAttempts,
  timeOfDay,
  successfulRolls,
  itemChoices,
  onItemSelected,
  onDieSettledForCurrency,
  storeChoices,
  spendCurrency,
  gameState,
  onStartGame,
  onDiceHover
}: SceneProps) {
  const { scene, camera, gl } = useThree();
  const { returnToMenu } = useGameState();
  const [isStarting, setIsStarting] = useState(false);
  const hasStartedGameRef = useRef(false);

  useEffect(() => {
    // Only trigger the starting animation when transitioning from menu to idle (first time)
    if (gameState.phase === "idle" && !hasStartedGameRef.current) {
      console.log(
        "🎮 First time entering idle - starting transition animation"
      );
      hasStartedGameRef.current = true;
      setIsStarting(true);
    }
  }, [gameState.phase]);

  const handleStartAnimationFinish = () => {
    console.log("🎬 handleStartAnimationFinish - Current yaw/pitch:", {
      yaw: yawRef.current,
      pitch: pitchRef.current,
      yawDeg: (yawRef.current * 180) / Math.PI,
      pitchDeg: (pitchRef.current * 180) / Math.PI
    });
    setIsStarting(false);
  };

  const cameraRef = useRef(camera);
  const diceManagerRef = useRef<DiceManagerHandle>(null);
  const [hasItemsOnTowerCard, setHasItemsOnTowerCard] = useState(false);
  const [hasItemsOnSunCard, setHasItemsOnSunCard] = useState(false);

  // Store yaw (left/right) and pitch (up/down) for camera look
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Track locally to pass to DiceManager for highlighting
  const [hoveredDiceId, setHoveredDiceId] = useState<number | null>(null);

  console.log("Store choices:", storeChoices);

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
  }, [hellFactor]); // Removed onHellFactorChange from deps to prevent infinite loop

  // Update parent component with autoCorruption changes
  useEffect(() => {
    onAutoCorruptionChange(autoCorruption);
  }, [autoCorruption]); // Removed onAutoCorruptionChange from deps to prevent infinite loop

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

  const handleMouseMove = useCallback(
    (movementX: number, movementY: number) => {
      // Only allow mouse look when not in menu AND not during the initial transition
      if (cameraRef.current && gameState.phase !== "menu" && !isStarting) {
        // Update yaw (left/right) and pitch (up/down) with good sensitivity
        const mouseSensitivity = 0.003;
        yawRef.current -= movementX * mouseSensitivity;
        pitchRef.current -= movementY * mouseSensitivity;

        // Clamp pitch to prevent looking too far up or down
        const maxPitch = Math.PI / 2.5;
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
    [gameState.phase, isStarting]
  );

  const inputState = useInput(
    {
      onStartGame,
      onExitToMenu: returnToMenu,
      onIncreaseCorruption: increaseCorruption,
      onDecreaseCorruption: decreaseCorruption,
      onToggleAutoCorruption: toggleAutoCorruption
    },
    gameState
  );

  // Disable mouse look during menu OR during the initial starting transition
  useMouseLook(handleMouseMove, gameState.phase !== "menu" && !isStarting);

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
        !!document.pointerLockElement,
        "Game phase:",
        gameState.phase
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

      // Priority 1: If dice have settled, calculate scores AND evaluate round in ONE click
      if (diceManagerRef.current.hasSettledDice() && gameState.phase === "throwing") {
        // TODO: Replace with actual dice values from physics simulation
        // For now, generate random dice values to test scoring
        const mockDiceValues: number[] = [];
        for (let i = 0; i < diceCount; i++) {
          mockDiceValues.push(Math.floor(Math.random() * 6) + 1); // D6: 1-6
        }
        for (let i = 0; i < d4Count; i++) {
          mockDiceValues.push(Math.floor(Math.random() * 4) + 1); // D4: 1-4
        }
        for (let i = 0; i < d3Count; i++) {
          mockDiceValues.push(Math.floor(Math.random() * 3) + 1); // D3: 1-3
        }

        console.log("🎲 Mock dice values on settle:", mockDiceValues);

        // Manually check for pairs in console
        const valueCounts = new Map<number, number>();
        mockDiceValues.forEach((val) => {
          valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
        });
        console.log("🎲 Value counts:", Array.from(valueCounts.entries()));

        // Calculate scores (this transitions to "settled" phase internally)
        onDiceSettled(mockDiceValues);

        // Immediately evaluate the round
        const pickedUp = diceManagerRef.current.pickUpOutsideDice();
        console.log("Picked up", pickedUp, "dice outside receptacle");

        if (pickedUp === 0) {
          // All dice were in receptacle - successful round!
          console.log("✅ All dice in receptacle - successful round!");
          onSuccessfulRoll();
          diceManagerRef.current.startNewRound();
        } else {
          // Some dice were outside receptacle - failed attempt
          console.log(
            "❌",
            pickedUp,
            "dice were outside receptacle - failed attempt"
          );
          onFailedRoll();

          if (currentAttempts >= 2) {
            console.log(
              "🔄 Round complete after failed attempts - starting new round"
            );
            diceManagerRef.current.startNewRound();
          }
        }

        return; // Evaluation complete
      }

      // Priority 3: Check if we can throw (not debounced)
      if (!diceManagerRef.current.canThrow()) {
        console.log("Cannot throw - debounce active");
        return;
      }

      // Priority 4: Throw dice (either from re-throw queue or fresh)
      // Count this as an attempt BEFORE throwing
      console.log("🎲 Starting new attempt...");
      onAttempt();

      // Get the camera's current position and direction
      const cameraPosition = camera.position.clone();

      // ALWAYS throw in camera direction (center of screen), not mouse position
      console.log("Throwing from camera look direction");
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
    },
    [
      camera,
      gl,
      scene,
      gameState.phase,
      onAttempt,
      onSuccessfulRoll,
      onFailedRoll,
      onDiceSettled,
      currentAttempts,
      itemChoices.length,
      diceCount,
      coinCount,
      d3Count,
      d4Count,
      thumbTackCount
    ]
  );

  // Handle dice hovering using raycasting from center of screen (like store items)
  useFrame(() => {
    // Only check for dice hover when settled
    if (diceManagerRef.current?.hasSettledDice()) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Look for dice objects in the intersections
      let foundDice = false;
      for (const intersect of intersects) {
        const obj = intersect.object;

        // Check if this object or any parent has a "dice" userData
        let current: THREE.Object3D | null = obj;
        while (current) {
          if (current.userData?.isDice) {
            // Found a dice! Extract info
            // For screen position, project the 3D position to screen space
            const vector = new THREE.Vector3();
            current.getWorldPosition(vector);
            vector.project(camera);

            const canvas = gl.domElement;
            const widthHalf = canvas.width / 2;
            const heightHalf = canvas.height / 2;

            const screenX = vector.x * widthHalf + widthHalf;
            const screenY = -(vector.y * heightHalf) + heightHalf;

            const diceData = {
              id: current.userData.diceId || 0,
              type: current.userData.diceType || "d6",
              faceValue: current.userData.faceValue || 0,
              score: current.userData.score || 0,
              modifiers: current.userData.modifiers || [],
              position: { x: screenX, y: screenY }
            };

            // Update both local ID for highlighting and parent for UI
            setHoveredDiceId(diceData.id);
            onDiceHover(diceData);
            foundDice = true;
            break;
          }
          current = current.parent;
        }

        if (foundDice) break;
      }

      if (!foundDice) {
        setHoveredDiceId(null);
        onDiceHover(null);
      }
    } else {
      setHoveredDiceId(null);
      onDiceHover(null);
    }
  });

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
  const tray = useLoader(GLTFLoader, "tray.gltf");

  return (
    <>
      <CameraSystem
        inputState={inputState}
        onCameraNameChange={onCameraNameChange}
        isStarting={isStarting}
        onStartAnimationFinish={handleStartAnimationFinish}
        gamePhase={gameState.phase}
        yawRef={yawRef}
        pitchRef={pitchRef}
      />

      <LightingRig
        hellFactor={hellFactor}
        timeOfDay={timeOfDay}
        timeProgress={getTimeProgressRatio(successfulRolls)}
      />

      {/* DEBUG: Ceiling marker directly above player start position */}
      <mesh position={[0.28, 2.8, 1.2]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>

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
        rotation={[0, Math.PI / -2, 0]}
      />
      <primitive object={tray.scene} position={RECEPTACLE_POSITION} scale={1} />
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
            hoveredDiceId={hoveredDiceId}
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
              position={[-2.65 + index * 0.45, 1.08, 4.15]}
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
