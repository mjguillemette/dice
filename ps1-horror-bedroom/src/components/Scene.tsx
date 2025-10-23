import {
  useState,
  useCallback,
  useRef,
  useEffect,
  Suspense,
  Fragment
} from "react";
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
import { useTouchInput } from "../systems/touchInputSystem";
import { useDeviceOrientation } from "../systems/deviceOrientationControls";
import { useCorruption } from "../systems/corruptionSystem";
import { isMobileDevice } from "../utils/mobileDetection";
import { useGameState } from "../contexts/GameStateContext";
import { useAudioSystem } from "../systems/audioSystem";
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
import { DiceTrayBoundsDebug } from "./models/DiceTrayBoundsDebug";
import Card from "./models/Card";
import Hourglass from "./models/Hourglass";
import House from "./house/House";
import DiceManager, { type DiceManagerHandle } from "./models/DiceManager";
import ItemChoice from "./models/ItemChoice";
import Cigarette from "./models/Cigarette";
import IncenseStick from "./models/IncenseStick";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  type ItemDefinition,
  type PlayerInventory,
  getItemPrice,
  isConsumableActive
} from "../systems/itemSystem";
import { type GameState } from "../systems/gameStateSystem";
import { Imp } from "./enemies/Imp";
import { combatSystem } from "../systems/combatSystem";
import type { Enemy } from "../types/combat.types";
import { Portal } from "./models/Portal";
import { useCombat } from "../hooks/useCombat";
import FormOnCube from "./ui/3d/FormOnCube";
import { CharacterHUD3D } from "./ui/3d/CharacterHUD3D";

// import DiceInfo from "./ui/DiceInfo";
const isInteractive = (object: THREE.Object3D | null): boolean => {
  let current = object;
  while (current) {
    if (current.name === "ui_3d") {
      return true;
    }
    current = current.parent;
  }
  return false;
};

interface SceneProps {
  onCameraNameChange: (name: string) => void;
  // onCameraModeChange: (cinematicMode: boolean) => void;
  onHellFactorChange: (hellFactor: number) => void;
  onAutoCorruptionChange: (autoCorruption: boolean) => void;
  onCursorLockChange?: (isLocked: boolean) => void;
  diceCount: number;
  coinCount: number;
  nickelCount: number;
  d3Count: number;
  d4Count: number;
  d8Count: number;
  d10Count: number;
  d12Count: number;
  d20Count: number;
  thumbTackCount: number;
  goldenPyramidCount: number;
  caltropCount: number;
  casinoRejectCount: number;
  weightedDieCount: number;
  loadedCoinCount: number;
  cursedDieCount: number;
  splitDieCount: number;
  mirrorDieCount: number;
  riggedDieCount: number;
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
  onDiceSettled: (
    diceValues?: number[],
    diceIds?: number[],
    scoreMultipliers?: number[]
  ) => void;
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
  inventory: PlayerInventory;
  onStartGame: () => void;
  onDiceHover: (
    diceData: {
      id: number;
      type: string;
      faceValue: number;
      score: number;
      modifiers: string[];
      position: { x: number; y: number };
      currencyEarned?: number;
    } | null
  ) => void;
  onTableItemHover?: (itemId: "cigarette" | "incense" | null) => void;
  highlightedDiceIds: number[]; // NEW: Dice IDs to highlight from scorecard hover
  onGyroPermissionChange?: (hasPermission: boolean) => void; // Mobile: Gyro permission status
  onRecenterGyroReady?: (recenterFn: () => void) => void; // Mobile: Provide recenter function
  currentScores?: any[]; // Current scoring data for trigger effects
  previousScores?: any[]; // Previous scoring data for trigger effects
}
export function Scene({
  onCameraNameChange,
  // onCameraModeChange,
  onHellFactorChange,
  onAutoCorruptionChange,
  onCursorLockChange,
  diceCount,
  coinCount,
  nickelCount,
  d3Count,
  d4Count,
  d8Count,
  d10Count,
  d12Count,
  d20Count,
  thumbTackCount,
  goldenPyramidCount,
  caltropCount,
  casinoRejectCount,
  weightedDieCount,
  loadedCoinCount,
  cursedDieCount,
  splitDieCount,
  mirrorDieCount,
  riggedDieCount,
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
  inventory,
  onStartGame,
  onDiceHover,
  onTableItemHover,
  highlightedDiceIds,
  onGyroPermissionChange,
  currentScores,
  previousScores,
  onRecenterGyroReady,
  playerBalance
}: SceneProps) {
  const { scene, camera, gl } = useThree();
  const { returnToMenu } = useGameState();
  const [isStarting, setIsStarting] = useState(false);
  const hasStartedGameRef = useRef(false);

  const [isMobile] = useState(() => isMobileDevice());

  useAudioSystem(camera);

  useEffect(() => {
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

  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const [hoveredDiceId, setHoveredDiceId] = useState<number | null>(null);
  const [isCursorLocked, setIsCursorLocked] = useState(false);

  const { enemies, startCombat, endCombat, isCombatActive } = useCombat();
  const combatTimerRef = useRef<number | null>(null);
  const activeCombatTimeOfDay = useRef<TimeOfDay | null>(null); // Track when combat *started*

  // Start/End combat based on time of day and game phase
  useEffect(() => {
    if (combatTimerRef.current) {
      clearTimeout(combatTimerRef.current);
      combatTimerRef.current = null;
    }

    // --- Conditions ---
    const isGameplayPhase = [
      "idle",
      "throwing",
      "settled",
      "evaluating"
    ].includes(gameState.phase);
    // REMOVED: const isCombatTime = timeOfDay !== "night"; // Combat occurs during morning and midday

    // --- Logic to START Combat ---
    // Start combat if in a gameplay phase, not already active, and haven't started for this time yet.
    if (
      isGameplayPhase &&
      !isCombatActive &&
      activeCombatTimeOfDay.current !== timeOfDay
    ) {
      console.log(
        `[Scene Combat Logic] Conditions met to START combat for ${timeOfDay}. Setting timer.`
      );
      combatTimerRef.current = window.setTimeout(() => {
        console.log(
          `[Scene Combat Logic] Timer fired! Starting combat for ${timeOfDay}!`
        );
        startCombat();
        activeCombatTimeOfDay.current = timeOfDay;
        combatTimerRef.current = null;
      }, 500);
    }

    // --- Logic to END Combat ---
    // End combat ONLY if we go to menu OR if the time of day changes *while* combat is active.
    const shouldEndCombat =
      gameState.phase === "menu" ||
      (isCombatActive && activeCombatTimeOfDay.current !== timeOfDay);

    if (shouldEndCombat) {
      if (isCombatActive) {
        console.log(
          `[Scene Combat Logic] Conditions met to END combat (Phase: ${gameState.phase}, Time: ${timeOfDay}, Active Combat Time: ${activeCombatTimeOfDay.current}).`
        );
        endCombat();
      }
      // Reset tracking ref when ending due to time change or menu
      if (
        gameState.phase === "menu" ||
        activeCombatTimeOfDay.current !== timeOfDay
      ) {
        activeCombatTimeOfDay.current = null;
      }
    }

    // Cleanup
    return () => {
      if (combatTimerRef.current) {
        console.log(
          "[Scene Combat Logic] Cleanup: Clearing combat start timer."
        );
        clearTimeout(combatTimerRef.current);
        combatTimerRef.current = null;
      }
    };
    // Keep dependencies the same, the logic inside handles the conditions now.
  }, [timeOfDay, gameState.phase, startCombat, endCombat, isCombatActive]);

  useEffect(() => {
    console.log("🚬 Cigarette visible:", inventory.passiveEffects.cigarette);
    console.log(
      "🔥 Incense in inventory:",
      inventory.consumables.find((c) => c.itemId === "incense")
    );
    console.log("📍 Receptacle position:", RECEPTACLE_POSITION);
  }, [inventory.passiveEffects.cigarette, inventory.consumables]);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = !!document.pointerLockElement;
      setIsCursorLocked(locked);
      onCursorLockChange?.(locked);
      console.log("🔒 Cursor lock changed:", locked);
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("mozpointerlockchange", handlePointerLockChange);
    document.addEventListener(
      "webkitpointerlockchange",
      handlePointerLockChange
    );

    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener(
        "mozpointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener(
        "webkitpointerlockchange",
        handlePointerLockChange
      );
    };
  }, [onCursorLockChange]);

  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      if (
        e.code === "Enter" &&
        !isCursorLocked &&
        gameState.phase !== "menu" &&
        !gameState.isGameOver
      ) {
        e.preventDefault();
        document.body.requestPointerLock();
      }
    };

    document.addEventListener("keydown", handleEnterKey);
    return () => document.removeEventListener("keydown", handleEnterKey);
  }, [isCursorLocked, gameState.phase, gameState.isGameOver]);

  useEffect(() => {
    if (
      gameState.phase === "idle" &&
      gameState.daysMarked === 2 &&
      diceManagerRef.current
    ) {
      console.log("🎲 Game reset detected - clearing all dice");
      diceManagerRef.current.resetDice();
    }
  }, [gameState.phase, gameState.daysMarked]);

  console.log("Store choices:", storeChoices);
  useEffect(() => {
    if (enemies && enemies.length > 0) {
      console.log(
        "Enemies state updated in Scene:",
        JSON.stringify(
          enemies.map((e) => ({
            id: e.id,
            type: e.type,
            hp: e.hp,
            portal: e.portalProgress,
            entrance: e.entranceAnimationProgress
          }))
        )
      );
    } else {
      // console.log("Enemies state updated in Scene: []");
    }
  }, [enemies]);

  const {
    hellFactor,
    autoCorruption,
    increaseCorruption,
    decreaseCorruption,
    toggleAutoCorruption
  } = useCorruption(gameState.corruption);

  useEffect(() => {
    onHellFactorChange(hellFactor);
  }, [hellFactor]);

  useEffect(() => {
    onAutoCorruptionChange(autoCorruption);
  }, [autoCorruption]);

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
      if (cameraRef.current && gameState.phase !== "menu" && !isStarting) {
        const mouseSensitivity = 0.003;
        yawRef.current -= movementX * mouseSensitivity;
        pitchRef.current -= movementY * mouseSensitivity;

        const maxPitch = Math.PI / 2.5;
        pitchRef.current = Math.max(
          -maxPitch,
          Math.min(maxPitch, pitchRef.current)
        );

        cameraRef.current.rotation.order = "YXZ";
        cameraRef.current.rotation.y = yawRef.current;
        cameraRef.current.rotation.x = pitchRef.current;
        cameraRef.current.rotation.z = 0;
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

  useMouseLook(handleMouseMove, gameState.phase !== "menu" && !isStarting);
  const isGyroEnabled = isMobile && gameState.phase !== "menu" && !isStarting;
  const { orientationRef, hasPermission, isSupported, recenter } =
    useDeviceOrientation(isGyroEnabled);

  useEffect(() => {
    if (recenter) {
      onRecenterGyroReady?.(recenter);
    }
  }, [recenter, onRecenterGyroReady]);

  useEffect(() => {
    if (isSupported) {
      console.log(
        "📱 Gyroscope permission:",
        hasPermission ? "granted" : "denied"
      );
      onGyroPermissionChange?.(hasPermission);
    }
  }, [hasPermission, isSupported, onGyroPermissionChange]);

  const targetFogColorRef = useRef<THREE.Color>(
    new THREE.Color(TIME_OF_DAY_CONFIG[timeOfDay].fogColor)
  );
  const currentFogColorRef = useRef<THREE.Color>(
    new THREE.Color(TIME_OF_DAY_CONFIG[timeOfDay].fogColor)
  );

  useEffect(() => {
    const timeProgress = getTimeProgressRatio(successfulRolls);

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

    const normalFogColor = new THREE.Color(currentTimeConfig.fogColor).lerp(
      new THREE.Color(nextTimeConfig.fogColor),
      timeProgress
    );

    const targetColor = normalFogColor
      .clone()
      .lerp(new THREE.Color(FOG_CONFIG.hellColor), hellFactor);

    console.log("🎨 Target fog color:", `#${targetColor.getHexString()}`);

    targetFogColorRef.current = targetColor;
  }, [hellFactor, timeOfDay, successfulRolls]);

  useFrame((_state, delta) => {
    const lerpAmount = Math.min(delta * FOG_CONFIG.transitionSpeed, 1.0);

    currentFogColorRef.current.lerp(targetFogColorRef.current, lerpAmount);

    if (scene.fog) {
      (scene.fog as THREE.Fog).color.copy(currentFogColorRef.current);
    } else {
      scene.fog = new THREE.Fog(
        currentFogColorRef.current,
        FOG_CONFIG.near,
        FOG_CONFIG.far
      );
    }

    scene.background = currentFogColorRef.current;
  });

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    if (diceManagerRef.current) {
      console.log("Dice counts changed - updating dice pool");
      diceManagerRef.current.updateDicePool({
        d6: diceCount,
        coins: coinCount,
        nickels: nickelCount,
        d3: d3Count,
        d4: d4Count,
        d8: d8Count,
        d10: d10Count,
        d12: d12Count,
        d20: d20Count,
        thumbtacks: thumbTackCount,
        golden_pyramid: goldenPyramidCount,
        caltrop: caltropCount,
        casino_reject: casinoRejectCount,
        weighted_die: weightedDieCount,
        loaded_coin: loadedCoinCount,
        cursed_die: cursedDieCount,
        split_die: splitDieCount,
        mirror_die: mirrorDieCount,
        rigged_die: riggedDieCount
      });
    }
  }, [
    diceCount,
    coinCount,
    nickelCount,
    d3Count,
    d4Count,
    d8Count,
    d10Count,
    d12Count,
    d20Count,
    thumbTackCount,
    goldenPyramidCount,
    caltropCount,
    casinoRejectCount,
    weightedDieCount,
    loadedCoinCount,
    cursedDieCount,
    splitDieCount,
    mirrorDieCount,
    riggedDieCount
  ]);

  // This is the actual game logic for throwing dice or evaluating a round
  const handleGameAction = useCallback(() => {
    // Guard Clause: Abort if in a non-interactive game phase
    if (gameState.phase === "menu" || gameState.phase === "item_selection") {
      console.log("Game action blocked by phase:", gameState.phase);
      return;
    }

    // Game Logic: Evaluate settled dice
    if (
      diceManagerRef.current?.hasSettledDice() &&
      gameState.phase === "settled"
    ) {
      console.log("Handling game action: Evaluate");
      const pickedUp = diceManagerRef.current.pickUpOutsideDice();
      if (pickedUp === 0) onSuccessfulRoll();
      else onFailedRoll();

      if (currentAttempts >= 2 || pickedUp === 0) {
        diceManagerRef.current.startNewRound();
      }
      return;
    }

    // Game Logic: Check throw cooldown
    if (!diceManagerRef.current?.canThrow()) {
      console.log("Handling game action: Cooldown active");
      return;
    }

    // Default Action: Throw the dice
    console.log("Handling game action: Throw Dice");
    onAttempt();
    const throwRaycaster = new THREE.Raycaster();
    throwRaycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // From center of screen
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();

    if (throwRaycaster.ray.intersectPlane(floorPlane, intersectPoint)) {
      diceManagerRef.current?.throwDice(
        intersectPoint,
        camera.position.clone(),
        undefined,
        throwRaycaster.ray.direction.clone()
      );
    }
  }, [
    gameState.phase,
    currentAttempts,
    onSuccessfulRoll,
    onFailedRoll,
    onAttempt,
    camera,
    diceManagerRef
  ]);

  // This is the MASTER input handler for MOUSE
  const handleMasterMouseClick = useCallback(
    (event: MouseEvent) => {
      // Only fire if the pointer is locked
      if (!document.pointerLockElement) return;

      // Raycast from the center of the screen
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;

        // Check if the object we hit has its own 'onClick' handler
        if (
          hitObject.userData.onClick &&
          typeof hitObject.userData.onClick === "function"
        ) {
          // We hit a UI element! Call its specific handler.
          hitObject.userData.onClick(event);
          return;
        }
      }

      // If we hit nothing, or the object had no handler, perform the default game action.
      handleGameAction();
    },
    [camera, scene, handleGameAction]
  );

  // Attach the single master listener
  useEffect(() => {
    // Use 'mousedown' for the most responsive feel
    document.addEventListener("mousedown", handleMasterMouseClick);
    return () => {
      document.removeEventListener("mousedown", handleMasterMouseClick);
    };
  }, [handleMasterMouseClick]);

  // MASTER input handler for TOUCH
  const handleMasterTouch = useCallback(
    (x: number, y: number) => {
      // Touch raycasts from the tap position, not the center
      const raycaster = new THREE.Raycaster();
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        if (
          hitObject.userData.onClick &&
          typeof hitObject.userData.onClick === "function"
        ) {
          hitObject.userData.onClick();
          return;
        }
      }

      handleGameAction();
    },
    [gl, camera, scene, handleGameAction]
  );

  useTouchInput({
    onTouchThrow: isMobile ? handleMasterTouch : undefined
  });

  // --- END OF PASTE ---

  useFrame(() => {
    if (
      diceManagerRef.current?.hasSettledDice() &&
      gameState.phase === "throwing"
    ) {
      const settledDice = diceManagerRef.current.getSettledDice();

      const diceInReceptacle = settledDice.filter((d) => d.inReceptacle);
      const diceValues = diceInReceptacle.map((d) => d.value);
      const diceIds = diceInReceptacle.map((d) => d.id);
      const scoreMultipliers = diceInReceptacle.map(
        (d) => d.scoreMultiplier || 1
      );

      console.log(
        "🎲 Auto-detected settled dice - Values:",
        diceValues,
        "IDs:",
        diceIds,
        "Multipliers:",
        scoreMultipliers
      );

      onDiceSettled(diceValues, diceIds, scoreMultipliers);
    }

    if (diceManagerRef.current?.hasSettledDice()) {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let foundDice = false;
      for (const intersect of intersects) {
        const obj = intersect.object;

        let current: THREE.Object3D | null = obj;
        while (current) {
          if (current.userData?.isDice) {
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
              position: { x: screenX, y: screenY },
              currencyEarned: current.userData.currencyEarned
            };

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

  const table = useLoader(GLTFLoader, "table.gltf");
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
        orientationRef={orientationRef}
      />

      <LightingRig
        hellFactor={hellFactor}
        timeOfDay={timeOfDay}
        timeProgress={getTimeProgressRatio(successfulRolls)}
      />

      <FormOnCube />
      <CharacterHUD3D
        scores={gameState.scoring.currentScores}
        timeOfDay={gameState.scoring.currentTimeOfDay}
        currentAttempts={gameState.currentAttempts}
        maxAttempts={2}
        balance={playerBalance}
        currentHP={100}
      />

      <mesh position={[0.28, 2.8, 1.2]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>

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
        <Physics
          gravity={[0, -9.66, 0]}
          timeStep={1 / 60}
          paused={gameState.phase === "menu"}
        >
          <DiceManager
            ref={diceManagerRef}
            diceCount={diceCount}
            coinCount={coinCount}
            nickelCount={nickelCount}
            d3Count={d3Count}
            d4Count={d4Count}
            d8Count={d8Count}
            d10Count={d10Count}
            d12Count={d12Count}
            d20Count={d20Count}
            thumbTackCount={thumbTackCount}
            goldenPyramidCount={goldenPyramidCount}
            caltropCount={caltropCount}
            casinoRejectCount={casinoRejectCount}
            weightedDieCount={weightedDieCount}
            loadedCoinCount={loadedCoinCount}
            cursedDieCount={cursedDieCount}
            splitDieCount={splitDieCount}
            mirrorDieCount={mirrorDieCount}
            riggedDieCount={riggedDieCount}
            onScoreUpdate={onDiceScoreChange}
            shaderEnabled={diceShaderEnabled}
            cardEnabled={towerCardEnabled || sunCardEnabled}
            onCardItemsChange={handleCardItemsChange}
            onCoinSettled={onDieSettledForCurrency}
            hoveredDiceId={hoveredDiceId}
            highlightedDiceIds={highlightedDiceIds}
            currentScores={currentScores}
            previousScores={previousScores}
          />

          <RigidBody
            type="fixed"
            position={[0, -0.05, 0]}
            friction={0.8}
            restitution={0.2}
          >
            <CuboidCollider args={[10, 0.05, 10]} />
          </RigidBody>

          <RigidBody type="fixed" position={[0, 1.5, -5]} friction={0.5}>
            <CuboidCollider args={[5, 1.5, 0.1]} />
          </RigidBody>
          <RigidBody type="fixed" position={[0, 1.5, 5]} friction={0.5}>
            <CuboidCollider args={[5, 1.5, 0.1]} />
          </RigidBody>
          <RigidBody type="fixed" position={[-5, 1.5, 0]} friction={0.5}>
            <CuboidCollider args={[0.1, 1.5, 5]} />
          </RigidBody>
          <RigidBody type="fixed" position={[5, 1.5, 0]} friction={0.5}>
            <CuboidCollider args={[0.1, 1.5, 5]} />
          </RigidBody>

          <RigidBody
            type="fixed"
            position={[-2, 0.4, -2]}
            friction={0.6}
            restitution={0.3}
          >
            <CuboidCollider args={[1.6, 0.5, 2.1]} />
          </RigidBody>

          <RigidBody
            type="fixed"
            position={[3, 0.8, -4.1]}
            friction={0.5}
            restitution={0.2}
          >
            <CuboidCollider args={[0.9, 0.6, 0.55]} />
          </RigidBody>

          <RigidBody
            type="fixed"
            position={[0, 0.9, -4.4]}
            friction={0.5}
            restitution={0.2}
          >
            <CuboidCollider args={[1.25, 1.0, 0.4]} />
          </RigidBody>

          <RigidBody
            type="fixed"
            position={[0, 0.5, 10]}
            friction={0.5}
            restitution={0.2}
          >
            <CuboidCollider args={[0.9, 0.25, 0.6]} />
          </RigidBody>

          <DiceReceptacle
            position={RECEPTACLE_POSITION}
            hellFactor={hellFactor}
            spotlightHeight={spotlightHeight}
            spotlightIntensity={spotlightIntensity}
            spotlightAngle={spotlightAngle}
          />
          {enemies.map((enemy, index) => (
            <Fragment key={enemy.id}>
              {enemy.portalProgress > 0 && (
                <Portal
                  progress={enemy.portalProgress}
                  position={[
                    enemy.position[0],
                    enemy.position[1],
                    enemy.position[2] + 0.01
                  ]}
                />
              )}
              <Imp
                position={enemy.position}
                scale={0.1}
                animationOffset={index}
                entranceAnimationProgress={enemy.entranceAnimationProgress}
                playEntranceAnimation={true}
                rotation={[0, Math.PI / (index * 0.2 - 1.1), 0]}
                sensor={enemy.entranceAnimationProgress < 1}
              />
            </Fragment>
          ))}

          {import.meta.env.DEV && <DiceTrayBoundsDebug />}

          <Hourglass
            position={getHourglassPosition()}
            hellFactor={hellFactor}
            onBumped={() => console.log("⏳ Hourglass was bumped by dice!")}
          />

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

          {/* {storeChoices.map((item, index) => (
            <ItemChoice
              key={`store-${index}`}
              item={item}
              position={[-0.3 + index * 0.3, 0.85, 2.68]}
              onPurchase={() => onItemSelected(item)}
              spendCurrency={() => spendCurrency("cents", getItemPrice(item))}
            />
          ))} */}

          {itemChoices.map((item, index) => (
            <ItemChoice
              key={`reward-${index}`}
              item={item}
              position={[-2.525 + index * 0.33, 0.72, 4.1]}
              onPurchase={() => onItemSelected(item)}
              spendCurrency={() => true}
            />
          ))}
        </Physics>
      </Suspense>
      <House hellFactor={hellFactor} />

      <Room hellFactor={hellFactor} />
      <Bed hellFactor={hellFactor} />
      <Bureau hellFactor={hellFactor} />
      <TVStand hellFactor={hellFactor} />
      <CeilingLight hellFactor={hellFactor} />
      <Decorations hellFactor={hellFactor} />
      <Ashtray
        hellFactor={hellFactor}
        cigaretteCount={inventory.passiveEffects.cigarette}
      />

      {inventory.passiveEffects.cigarette > 0 && (
        <Cigarette
          position={[
            RECEPTACLE_POSITION[0] - 0.666,
            RECEPTACLE_POSITION[1] + 0.12,
            RECEPTACLE_POSITION[2] - 0.22
          ]}
          rotation={[Math.PI / 2, Math.PI, Math.PI / 4]}
          scale={1.8}
          count={inventory.passiveEffects.cigarette}
          onHover={(isHovered) =>
            onTableItemHover?.(isHovered ? "cigarette" : null)
          }
        />
      )}

      {inventory.consumables.find((c) => c.itemId === "incense") && (
        <IncenseStick
          position={[
            RECEPTACLE_POSITION[0] + 0.456,
            RECEPTACLE_POSITION[1] + 0.2,
            RECEPTACLE_POSITION[2] - 0.249
          ]}
          rotation={[-Math.PI / -2.3, 0.6, Math.PI / 4]}
          scale={2.66}
          isActive={isConsumableActive(inventory, "incense")}
          onHover={(isHovered) =>
            onTableItemHover?.(isHovered ? "incense" : null)
          }
        />
      )}

      <BoardGame
        position={[2.01, 1.55, 4.88]}
        hellFactor={hellFactor}
        daysMarked={daysMarked}
      />
    </>
  );
}

export default Scene;
