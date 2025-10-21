import {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect
} from "react";
import * as THREE from "three";
import Dice, { type DiceHandle, type TriggerEffectType } from "./Dice";
import {
  getReceptacleBounds,
  getTowerCardBounds,
  getSunCardBounds
} from "../../constants/receptacleConfig";
import {
  type DiceTransformation,
  applyTransformation,
  calculateTransformationEffects
} from "../../systems/diceTransformationSystem";
import { getPhysicsConfig } from "../../config/physics.config";

type DiceStatus =
  | "inHand"
  | "thrown"
  | "settledInReceptacle"
  | "settledOutOfBounds";

interface DiceInstance {
  id: number;
  type:
    | "d6"
    | "coin"
    | "nickel"
    | "d3"
    | "d4"
    | "d8"
    | "d10"
    | "d12"
    | "d20"
    | "thumbtack"
    | "golden_pyramid"
    | "caltrop"
    | "casino_reject"
    | "weighted_die"
    | "loaded_coin"
    | "cursed_die"
    | "split_die"
    | "mirror_die"
    | "rigged_die";
  position?: [number, number, number]; // present while thrown/settled
  initialVelocity?: [number, number, number];
  initialAngularVelocity?: [number, number, number];
  value?: number;
  settled: boolean;
  inReceptacle: boolean;
  generation: number;
  status: DiceStatus;
  transformations: DiceTransformation[]; // Permanent transformations applied to this die
  currencyEarned?: number; // Total currency earned from this die (for coins/nickels)
  triggerEffect?: TriggerEffectType; // Visual trigger effect (combo, edge, special)
}

interface DiceManagerProps {
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
  // Special dice
  goldenPyramidCount: number;
  caltropCount: number;
  casinoRejectCount: number;
  weightedDieCount: number;
  loadedCoinCount: number;
  cursedDieCount: number;
  splitDieCount: number;
  mirrorDieCount: number;
  riggedDieCount: number;
  onScoreUpdate?: (score: number) => void;
  shaderEnabled: boolean;
  cardEnabled: boolean; // Whether the card is placed on the receptacle
  onCardItemsChange: (
    sunCardDiceIDs: number[],
    towerCardDiceIDs: number[]
  ) => void; // Callback with dice IDs on each card
  onCoinSettled?: (type: string, amount: number) => void;
  hoveredDiceId?: number | null; // ID of the currently hovered dice
  highlightedDiceIds: number[]; // Dice IDs to highlight from scorecard hover
  currentScores?: any[]; // Current scoring state for trigger detection
  previousScores?: any[]; // Previous scores for combo detection
}

export interface SettledDieData {
  id: number;
  type:
    | "d6"
    | "coin"
    | "nickel"
    | "d3"
    | "d4"
    | "d8"
    | "d10"
    | "d12"
    | "d20"
    | "thumbtack"
    | "golden_pyramid"
    | "caltrop"
    | "casino_reject"
    | "weighted_die"
    | "loaded_coin"
    | "cursed_die"
    | "split_die"
    | "mirror_die"
    | "rigged_die";
  value: number;
  inReceptacle: boolean;
  scoreMultiplier?: number; // From transformations
  modifiers?: string[]; // List of modifier names for display
}

export interface DiceManagerHandle {
  throwDice: (
    clickPosition: THREE.Vector3,
    throwOrigin?: THREE.Vector3,
    chargeAmount?: number,
    cameraDirection?: THREE.Vector3
  ) => void;
  clearDice: () => void;
  getCurrentScore: () => number;
  pickUpOutsideDice: () => number;
  hasSettledDice: () => boolean;
  canThrow: () => boolean;
  resetDice: () => void; // Reset all dice and clear state
  updateDicePool: (newCounts: {
    d6: number;
    coins: number;
    nickels: number;
    d3: number;
    d4: number;
    d8: number;
    d10: number;
    d12: number;
    d20: number;
    thumbtacks: number;
    golden_pyramid: number;
    caltrop: number;
    casino_reject: number;
    weighted_die: number;
    loaded_coin: number;
    cursed_die: number;
    split_die: number;
    mirror_die: number;
    rigged_die: number;
  }) => void; // Update dice pool without losing transformations
  startNewRound: () => void; // Start a new round - pick up all dice and reset score
  applyCardTransformation: (diceId: number, cardType: "sun" | "tower") => void; // Apply transformation when die collides with card
  getSettledDice: () => SettledDieData[]; // Get all settled dice with their values and IDs
}

const DiceManager = forwardRef<DiceManagerHandle, DiceManagerProps>(
  (
    {
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
      onScoreUpdate,
      shaderEnabled,
      cardEnabled,
      onCardItemsChange,
      onCoinSettled,
      hoveredDiceId = null,
      currentScores,
      previousScores
    },
    ref
  ) => {
    const [diceInstances, setDiceInstances] = useState<DiceInstance[]>([]);
    const diceRefs = useRef<Map<number, DiceHandle>>(new Map());
    const nextIdRef = useRef(0);
    const generationRef = useRef(0);
    const totalScoreRef = useRef(0);
    const scoredDiceIds = useRef<Set<number>>(new Set()); // Track which dice have been scored
    // CHANGED: Use separate refs for each card to match the new callback signature
    const sunCardDiceIdsRef = useRef<Set<number>>(new Set());
    const towerCardDiceIdsRef = useRef<Set<number>>(new Set());
    const [isThrowing, setIsThrowing] = useState(false);
    const throwDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get receptacle and card bounds from centralized config
    const RECEPTACLE_BOUNDS = getReceptacleBounds();
    const TOWER_CARD_BOUNDS = getTowerCardBounds();
    const SUN_CARD_BOUNDS = getSunCardBounds();

    const getMaxValue = (type: DiceInstance["type"]): number => {
      switch (type) {
        case "thumbtack":
          return 1;
        case "coin":
        case "loaded_coin":
          return 2;
        case "nickel":
          return 2; // Nickel rolls 5 or 10 (represented as 1 or 2, multiplied by 5)
        case "d3":
        case "golden_pyramid":
          return 3;
        case "d4":
        case "caltrop":
          return 4;
        case "d6":
        case "casino_reject":
        case "weighted_die":
        case "cursed_die":
        case "split_die":
        case "mirror_die":
        case "rigged_die":
          return 6;
        case "d8":
          return 8;
        case "d10":
          return 10;
        case "d12":
          return 12;
        case "d20":
          return 20;
        default:
          return 6;
      }
    };

    const getTransformationNames = (
      transformations: DiceTransformation[]
    ): string[] => {
      return transformations.map((t) => {
        switch (t.type) {
          case "sun_boost":
            return "Sun";
          case "tarot_boost":
            return "Tower";
          case "hourglass_curse":
            return "Hourglass";
          case "hell_corruption":
            return "Corrupted";
          case "blessed":
            return "Blessed";
          case "cursed":
            return "Cursed";
          default:
            return t.type;
        }
      });
    };

    const createDieObject = (
      type: DiceInstance["type"],
      generation: number,
      origin: THREE.Vector3,
      clickPosition: THREE.Vector3,
      cameraDirection?: THREE.Vector3
    ) => {
      const spreadRadius = 0.15 + Math.random() * 0.1;
      const angle = Math.random() * Math.PI * 2;
      const offsetX = Math.cos(angle) * spreadRadius;
      const offsetZ = Math.sin(angle) * spreadRadius;

      const position: [number, number, number] = [
        origin.x + offsetX,
        origin.y + Math.random() * 0.1,
        origin.z + offsetZ
      ];

      const targetX = clickPosition.x + (Math.random() - 0.5) * 0.3;
      const targetZ = clickPosition.z + (Math.random() - 0.5) * 0.3;
      const directionX = targetX - position[0];
      const directionZ = targetZ - position[2];
      const distance =
        Math.sqrt(directionX * directionX + directionZ * directionZ) || 1;

      // Get physics config (allows dev panel to adjust in real-time)
      const physics = getPhysicsConfig();

      const basePower = physics.basePower;
      const distanceMultiplier = Math.min(
        distance * physics.distanceMultiplier,
        physics.maxDistanceBoost
      );
      const throwPower =
        basePower + distanceMultiplier + Math.random() * physics.powerVariation;

      // Calculate lob arc
      let velocityY =
        physics.baseUpwardVelocity - Math.random() * physics.upwardVariation;
      const arcBoost = Math.min(
        distance * physics.arcBoostMultiplier,
        physics.maxArcBoost
      );
      velocityY -= arcBoost;

      if (cameraDirection) {
        const camInfluence = cameraDirection.y * throwPower * 0.5;
        velocityY = Math.min(velocityY, camInfluence - arcBoost);
      }

      const initialVelocity: [number, number, number] = [
        (directionX / distance) * throwPower,
        velocityY,
        (directionZ / distance) * throwPower
      ];

      // Tumbling based on physics config
      const angVel = physics.angularVelocity;
      const initialAngularVelocity: [number, number, number] = [
        (Math.random() - 0.5) * angVel,
        (Math.random() - 0.5) * angVel,
        (Math.random() - 0.5) * angVel
      ];

      return {
        id: nextIdRef.current++,
        type,
        position,
        initialVelocity,
        initialAngularVelocity,
        settled: false,
        inReceptacle: false,
        generation,
        status: "thrown" as DiceStatus,
        transformations: []
      } as DiceInstance;
    };

    const throwDice = useCallback(
      (
        clickPosition: THREE.Vector3,
        throwOrigin?: THREE.Vector3,
        _chargeAmount?: number,
        cameraDirection?: THREE.Vector3
      ) => {
        if (isThrowing) return;

        generationRef.current += 1;
        const thisGeneration = generationRef.current;
        setIsThrowing(true);
        if (throwDebounceRef.current) clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = setTimeout(() => setIsThrowing(false), 300);

        const origin =
          throwOrigin ||
          new THREE.Vector3(clickPosition.x, 1.2, clickPosition.z);

        setDiceInstances((prev) => {
          if (prev.length === 0) {
            const created: DiceInstance[] = [];
            for (let i = 0; i < diceCount; i++)
              created.push(
                createDieObject(
                  "d6",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < coinCount; i++)
              created.push(
                createDieObject(
                  "coin",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < nickelCount; i++)
              created.push(
                createDieObject(
                  "nickel",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < d3Count; i++)
              created.push(
                createDieObject(
                  "d3",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < d4Count; i++)
              created.push(
                createDieObject(
                  "d4",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < d8Count; i++)
              created.push(
                createDieObject(
                  "d8",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < d10Count; i++)
              created.push(
                createDieObject(
                  "d10",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < d12Count; i++)
              created.push(
                createDieObject(
                  "d12",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < d20Count; i++)
              created.push(
                createDieObject(
                  "d20",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < thumbTackCount; i++)
              created.push(
                createDieObject(
                  "thumbtack",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            // Special dice
            for (let i = 0; i < goldenPyramidCount; i++)
              created.push(
                createDieObject(
                  "golden_pyramid",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < caltropCount; i++)
              created.push(
                createDieObject(
                  "caltrop",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < casinoRejectCount; i++)
              created.push(
                createDieObject(
                  "casino_reject",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < weightedDieCount; i++)
              created.push(
                createDieObject(
                  "weighted_die",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < loadedCoinCount; i++)
              created.push(
                createDieObject(
                  "loaded_coin",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < cursedDieCount; i++)
              created.push(
                createDieObject(
                  "cursed_die",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < splitDieCount; i++)
              created.push(
                createDieObject(
                  "split_die",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < mirrorDieCount; i++)
              created.push(
                createDieObject(
                  "mirror_die",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            for (let i = 0; i < riggedDieCount; i++)
              created.push(
                createDieObject(
                  "rigged_die",
                  thisGeneration,
                  origin,
                  clickPosition,
                  cameraDirection
                )
              );
            return created;
          }

          const next = prev.map((d) => {
            if (d.status === "inHand") {
              const spreadRadius = 0.02 + Math.random() * 0.05;
              const angle = Math.random() * Math.PI * 2;
              const offsetX = Math.cos(angle) * spreadRadius;
              const offsetZ = Math.sin(angle) * spreadRadius;
              const position: [number, number, number] = [
                origin.x + offsetX,
                origin.y,
                origin.z + offsetZ
              ];

              const targetX = clickPosition.x + (Math.random() - 0.5) * 0.3;
              const targetZ = clickPosition.z + (Math.random() - 0.5) * 0.3;
              const directionX = targetX - position[0];
              const directionZ = targetZ - position[2];
              const distance =
                Math.sqrt(directionX * directionX + directionZ * directionZ) ||
                1;

              // Get physics config (same as createDieObject)
              const physics = getPhysicsConfig();

              const basePower = physics.basePower;
              const distanceMultiplier = Math.min(
                distance * physics.distanceMultiplier,
                physics.maxDistanceBoost
              );
              const throwPower =
                basePower +
                distanceMultiplier +
                Math.random() * physics.powerVariation;

              const arcBoost = Math.min(
                distance * physics.arcBoostMultiplier,
                physics.maxArcBoost
              );

              const initialVelocity: [number, number, number] = [
                (directionX / distance) * throwPower,
                physics.baseUpwardVelocity -
                  Math.random() * physics.upwardVariation -
                  arcBoost,
                (directionZ / distance) * throwPower
              ];

              // Tumbling based on physics config
              const angVel = physics.angularVelocity;
              const initialAngularVelocity: [number, number, number] = [
                (Math.random() - 0.5) * angVel,
                (Math.random() - 0.5) * angVel,
                (Math.random() - 0.5) * angVel
              ];

              return {
                ...d,
                position,
                initialVelocity,
                initialAngularVelocity,
                settled: false,
                inReceptacle: false,
                generation: thisGeneration,
                status: "thrown" as DiceStatus,
                value: undefined
              };
            }
            return d;
          });

          return next;
        });
      },
      [
        isThrowing,
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
      ]
    );

    const clearDice = useCallback(() => {
      setDiceInstances([]);
      totalScoreRef.current = 0;
      if (onScoreUpdate) onScoreUpdate(0);
    }, [onScoreUpdate]);

    const getCurrentScore = useCallback(() => {
      return totalScoreRef.current;
    }, []);

    // FIX: This is the function you pointed out was broken.
    const pickUpOutsideDice = useCallback(() => {
      if (throwDebounceRef.current) {
        clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = null;
      }
      setIsThrowing(false);

      const outside = diceInstances.filter((d) => d.settled && !d.inReceptacle);

      if (outside.length > 0) {
        const outsideIds = new Set(outside.map((d) => d.id));
        let wasChanged = false; // Flag to check if a die was actually removed from a card

        // Remove picked up dice from scored and card tracking
        outsideIds.forEach((id) => {
          scoredDiceIds.current.delete(id);
          // Check and remove from both card refs
          if (sunCardDiceIdsRef.current.delete(id)) wasChanged = true;
          if (towerCardDiceIdsRef.current.delete(id)) wasChanged = true;
        });

        // Notify card change if any dice were removed from a card
        if (wasChanged && onCardItemsChange) {
          onCardItemsChange(
            Array.from(sunCardDiceIdsRef.current),
            Array.from(towerCardDiceIdsRef.current)
          );
        }

        setDiceInstances((prev) =>
          prev.map((d) =>
            outsideIds.has(d.id)
              ? {
                  ...d,
                  status: "inHand",
                  settled: false,
                  inReceptacle: false,
                  position: undefined,
                  initialVelocity: undefined,
                  initialAngularVelocity: undefined,
                  value: undefined
                }
              : d
          )
        );
        return outside.length;
      }

      return 0;
    }, [diceInstances, onCardItemsChange]);

    const hasSettledDice = useCallback(() => {
      return diceInstances.length > 0 && diceInstances.every((d) => d.settled);
    }, [diceInstances]);

    const canThrow = useCallback(() => !isThrowing, [isThrowing]);

    const resetDice = useCallback(() => {
      setDiceInstances([]);
      totalScoreRef.current = 0;
      nextIdRef.current = 0;
      generationRef.current = 0;
      scoredDiceIds.current.clear();
      // CHANGED: Clear both card refs
      sunCardDiceIdsRef.current.clear();
      towerCardDiceIdsRef.current.clear();
      setIsThrowing(false);
      if (throwDebounceRef.current) {
        clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = null;
      }
      if (onScoreUpdate) onScoreUpdate(0);
      // CHANGED: Call with two empty arrays to reset parent state
      if (onCardItemsChange) onCardItemsChange([], []);
    }, [onScoreUpdate, onCardItemsChange]);

    const startNewRound = useCallback(() => {
      if (throwDebounceRef.current) {
        clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = null;
      }
      setIsThrowing(false);

      scoredDiceIds.current.clear();
      // CHANGED: Clear both card refs
      sunCardDiceIdsRef.current.clear();
      towerCardDiceIdsRef.current.clear();

      // CHANGED: Call with two empty arrays to reset parent state
      if (onCardItemsChange) {
        onCardItemsChange([], []);
      }

      setDiceInstances((prev) =>
        prev.map((d) => ({
          ...d,
          status: "inHand" as DiceStatus,
          settled: false,
          inReceptacle: false,
          position: undefined,
          initialVelocity: undefined,
          initialAngularVelocity: undefined,
          value: undefined,
          generation: 0
        }))
      );

      totalScoreRef.current = 0;
      if (onScoreUpdate) onScoreUpdate(0);
    }, [onScoreUpdate, onCardItemsChange]);

    const updateDicePool = useCallback(
      (newCounts: {
        d6: number;
        coins: number;
        nickels: number;
        d3: number;
        d4: number;
        d8: number;
        d10: number;
        d12: number;
        d20: number;
        thumbtacks: number;
        golden_pyramid: number;
        caltrop: number;
        casino_reject: number;
        weighted_die: number;
        loaded_coin: number;
        cursed_die: number;
        split_die: number;
        mirror_die: number;
        rigged_die: number;
      }) => {
        setDiceInstances((prev) => {
          const totalByType = {
            d6: prev.filter((d) => d.type === "d6").length,
            coin: prev.filter((d) => d.type === "coin").length,
            nickel: prev.filter((d) => d.type === "nickel").length,
            d3: prev.filter((d) => d.type === "d3").length,
            d4: prev.filter((d) => d.type === "d4").length,
            d8: prev.filter((d) => d.type === "d8").length,
            d10: prev.filter((d) => d.type === "d10").length,
            d12: prev.filter((d) => d.type === "d12").length,
            d20: prev.filter((d) => d.type === "d20").length,
            thumbtack: prev.filter((d) => d.type === "thumbtack").length,
            golden_pyramid: prev.filter((d) => d.type === "golden_pyramid")
              .length,
            caltrop: prev.filter((d) => d.type === "caltrop").length,
            casino_reject: prev.filter((d) => d.type === "casino_reject")
              .length,
            weighted_die: prev.filter((d) => d.type === "weighted_die").length,
            loaded_coin: prev.filter((d) => d.type === "loaded_coin").length,
            cursed_die: prev.filter((d) => d.type === "cursed_die").length,
            split_die: prev.filter((d) => d.type === "split_die").length,
            mirror_die: prev.filter((d) => d.type === "mirror_die").length,
            rigged_die: prev.filter((d) => d.type === "rigged_die").length
          };

          let updated = [...prev];

          const types: Array<{
            type: DiceInstance["type"];
            current: number;
            target: number;
          }> = [
            { type: "d6", current: totalByType.d6, target: newCounts.d6 },
            {
              type: "coin",
              current: totalByType.coin,
              target: newCounts.coins
            },
            {
              type: "nickel",
              current: totalByType.nickel,
              target: newCounts.nickels
            },
            { type: "d3", current: totalByType.d3, target: newCounts.d3 },
            { type: "d4", current: totalByType.d4, target: newCounts.d4 },
            { type: "d8", current: totalByType.d8, target: newCounts.d8 },
            { type: "d10", current: totalByType.d10, target: newCounts.d10 },
            { type: "d12", current: totalByType.d12, target: newCounts.d12 },
            { type: "d20", current: totalByType.d20, target: newCounts.d20 },
            {
              type: "thumbtack",
              current: totalByType.thumbtack,
              target: newCounts.thumbtacks
            },
            {
              type: "golden_pyramid",
              current: totalByType.golden_pyramid,
              target: newCounts.golden_pyramid
            },
            {
              type: "caltrop",
              current: totalByType.caltrop,
              target: newCounts.caltrop
            },
            {
              type: "casino_reject",
              current: totalByType.casino_reject,
              target: newCounts.casino_reject
            },
            {
              type: "weighted_die",
              current: totalByType.weighted_die,
              target: newCounts.weighted_die
            },
            {
              type: "loaded_coin",
              current: totalByType.loaded_coin,
              target: newCounts.loaded_coin
            },
            {
              type: "cursed_die",
              current: totalByType.cursed_die,
              target: newCounts.cursed_die
            },
            {
              type: "split_die",
              current: totalByType.split_die,
              target: newCounts.split_die
            },
            {
              type: "mirror_die",
              current: totalByType.mirror_die,
              target: newCounts.mirror_die
            },
            {
              type: "rigged_die",
              current: totalByType.rigged_die,
              target: newCounts.rigged_die
            }
          ];

          for (const { type, current, target } of types) {
            const diff = target - current;

            if (diff > 0) {
              for (let i = 0; i < diff; i++) {
                updated.push({
                  id: nextIdRef.current++,
                  type,
                  settled: false,
                  inReceptacle: false,
                  generation: 0,
                  status: "inHand",
                  transformations: []
                });
              }
              console.log(`➕ Added ${diff} ${type} dice`);
            } else if (diff < 0) {
              const toRemove = Math.abs(diff);
              const inHandOfType = updated.filter(
                (d) => d.type === type && d.status === "inHand"
              );

              if (inHandOfType.length >= toRemove) {
                const idsToRemove = new Set(
                  inHandOfType.slice(0, toRemove).map((d) => d.id)
                );
                updated = updated.filter((d) => !idsToRemove.has(d.id));
                console.log(`➖ Removed ${toRemove} ${type} dice from hand`);
              } else {
                console.warn(
                  `⚠️ Cannot remove ${toRemove} ${type} dice - only ${inHandOfType.length} in hand`
                );
              }
            }
          }

          return updated;
        });
      },
      []
    );

    const applyCardTransformation = useCallback(
      (diceId: number, cardType: "sun" | "tower") => {
        // FIX: Check if this transformation has already been applied from a collision
        // to prevent duplicate calls from re-renders.
        const alreadyOnCard =
          (cardType === "sun" && sunCardDiceIdsRef.current.has(diceId)) ||
          (cardType === "tower" && towerCardDiceIdsRef.current.has(diceId));

        if (alreadyOnCard) {
          // console.log(`Ignoring duplicate transformation call for die ${diceId} on ${cardType} card.`);
          return; // Exit early
        }

        setDiceInstances((prev) =>
          prev.map((d) => {
            if (d.id !== diceId) return d;

            const transformationType =
              cardType === "sun" ? "sun_boost" : "tarot_boost";

            console.log(
              `🔮 Applying ${transformationType} transformation to die`,
              diceId,
              "via collision"
            );

            const newTransformations = applyTransformation(
              d.transformations,
              transformationType
            );
            return { ...d, transformations: newTransformations };
          })
        );

        // Add to card tracking and notify parent
        if (cardType === "sun") {
          sunCardDiceIdsRef.current.add(diceId);
        } else if (cardType === "tower") {
          towerCardDiceIdsRef.current.add(diceId);
        }

        if (onCardItemsChange) {
          onCardItemsChange(
            Array.from(sunCardDiceIdsRef.current),
            Array.from(towerCardDiceIdsRef.current)
          );
        }
      },
      [onCardItemsChange]
    );

    // This hook synchronizes the dice pool with props that come from the inventory
    useEffect(() => {
      updateDicePool({
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
      riggedDieCount,
      updateDicePool
    ]);

    const getSettledDice = useCallback((): SettledDieData[] => {
      return diceInstances
        .filter((d) => d.settled && d.value !== undefined)
        .map((d) => {
          // Calculate transformation effects for this die
          const effects = calculateTransformationEffects(d.transformations);
          const modifierNames = d.transformations.map((t) => t.type);

          return {
            id: d.id,
            type: d.type,
            value: d.value!,
            inReceptacle: d.inReceptacle,
            scoreMultiplier: effects.scoreMultiplier,
            modifiers: modifierNames
          };
        });
    }, [diceInstances]);

    useImperativeHandle(ref, () => ({
      throwDice,
      clearDice,
      getCurrentScore,
      pickUpOutsideDice,
      hasSettledDice,
      canThrow,
      resetDice,
      updateDicePool,
      startNewRound,
      applyCardTransformation,
      getSettledDice
    }));

    const handleDiceSettled = useCallback(
      (
        id: number,
        type: DiceInstance["type"],
        value: number,
        position: THREE.Vector3
      ) => {
        if (scoredDiceIds.current.has(id)) {
          console.log("Die", id, "already scored - skipping duplicate");
          return;
        }

        const inReceptacle =
          position.x >= RECEPTACLE_BOUNDS.minX &&
          position.x <= RECEPTACLE_BOUNDS.maxX &&
          position.z >= RECEPTACLE_BOUNDS.minZ &&
          position.z <= RECEPTACLE_BOUNDS.maxZ;

        // Check if dice landed on either card
        const onTowerCard =
          cardEnabled &&
          position.x >= TOWER_CARD_BOUNDS.minX &&
          position.x <= TOWER_CARD_BOUNDS.maxX &&
          position.z >= TOWER_CARD_BOUNDS.minZ &&
          position.z <= TOWER_CARD_BOUNDS.maxZ;

        const onSunCard =
          cardEnabled &&
          position.x >= SUN_CARD_BOUNDS.minX &&
          position.x <= SUN_CARD_BOUNDS.maxX &&
          position.z >= SUN_CARD_BOUNDS.minZ &&
          position.z <= SUN_CARD_BOUNDS.maxZ;

        // CHANGED: Update card tracking logic for two cards
        const wasOnSun = sunCardDiceIdsRef.current.has(id);
        const wasOnTower = towerCardDiceIdsRef.current.has(id);
        let cardStateChanged = false;

        if (onSunCard) {
          if (!wasOnSun) {
            sunCardDiceIdsRef.current.add(id);
            cardStateChanged = true;
          }
        } else if (wasOnSun) {
          sunCardDiceIdsRef.current.delete(id);
          cardStateChanged = true;
        }

        if (onTowerCard) {
          if (!wasOnTower) {
            towerCardDiceIdsRef.current.add(id);
            cardStateChanged = true;
          }
        } else if (wasOnTower) {
          towerCardDiceIdsRef.current.delete(id);
          cardStateChanged = true;
        }

        // Notify parent if the card state for this die has changed
        if (cardStateChanged && onCardItemsChange) {
          onCardItemsChange(
            Array.from(sunCardDiceIdsRef.current),
            Array.from(towerCardDiceIdsRef.current)
          );
        }

        let dieTransformations: DiceTransformation[] = [];
        let totalCurrency = 0; // Track total currency for this die

        setDiceInstances((prev) => {
          const updated = prev.map((d) => {
            if (d.id !== id) return d;

            // Transformations are applied via collision detection (applyCardTransformation)
            // NOT here during settle to avoid double-dipping
            dieTransformations = d.transformations;

            const newStatus: DiceStatus = inReceptacle
              ? "settledInReceptacle"
              : "settledOutOfBounds";
            return {
              ...d,
              value,
              position: [position.x, position.y, position.z] as [
                number,
                number,
                number
              ],
              settled: true,
              inReceptacle,
              status: newStatus,
              currencyEarned: 0 // Initialize, will be updated below
              // transformations are NOT modified here - they're set by collision detection
            } as DiceInstance;
          });

          return updated;
        });

        if (inReceptacle && typeof value === "number") {
          const effects = calculateTransformationEffects(dieTransformations);

          // Check if this is an edge landing (special value 10 for coins)
          const isEdgeLanding =
            value === 10 && (type === "coin" || type === "nickel");

          // For scoring purposes, normalize edge landing to average value (1.5)
          let finalValueForScore = isEdgeLanding ? 1.5 : value;

          if ((type === "coin" || type === "nickel") && onCoinSettled) {
            // Use the die's actual face value for currency calculation
            // Nickels roll 1-2, but represent 5¢ or 10¢
            // Special case: value 10 means coin landed on edge (10x bonus!)
            let baseValue = value;
            let edgeMultiplier = 1;

            if (isEdgeLanding) {
              // Edge landing! Use average value (1.5 for coins) with 10x multiplier
              baseValue = 1.5;
              edgeMultiplier = 10;
              console.log("🪙✨ EDGE LANDING BONUS: 10x multiplier applied!");
            }

            const currencyMultiplier = type === "nickel" ? 5 : 1;
            const currencyForThisRoll = Math.round(
              baseValue *
                currencyMultiplier *
                effects.scoreMultiplier *
                edgeMultiplier
            );
            if (currencyForThisRoll > 0) {
              totalCurrency += currencyForThisRoll; // Accumulate currency
              onCoinSettled(type, currencyForThisRoll);
            }
          } // Now, handle conceptual re-rolls for additional currency and final score

          while (Math.random() < (effects.rerollChance ?? 0)) {
            console.log(
              `☀️ Die ${id} is re-rolling conceptually for additional value!`
            );

            const maxValue = getMaxValue(type);
            const newValue = Math.floor(Math.random() * maxValue) + 1;
            finalValueForScore = newValue; // The score is based on the LAST value // Grant ADDITIONAL currency for this conceptual roll

            if ((type === "coin" || type === "nickel") && onCoinSettled) {
              const currencyMultiplier = type === "nickel" ? 5 : 1;
              const additionalCurrency = Math.round(
                newValue * currencyMultiplier * effects.scoreMultiplier
              );
              if (additionalCurrency > 0) {
                console.log(
                  `💰 Granting additional ${additionalCurrency} cents from re-roll.`
                );
                totalCurrency += additionalCurrency; // Accumulate re-roll currency
                onCoinSettled(type, additionalCurrency);
              }
            }
          } // Use the final value (after any re-rolls) to calculate the score

          const finalScore = Math.round(
            finalValueForScore * effects.scoreMultiplier
          );

          scoredDiceIds.current.add(id);
          totalScoreRef.current += finalScore;

          // Update dice instance with total currency earned
          if (totalCurrency > 0) {
            setDiceInstances((prev) =>
              prev.map((d) =>
                d.id === id ? { ...d, currencyEarned: totalCurrency } : d
              )
            );
          }
          console.log(
            `🎲 Die ${id} scored:`,
            `base=${value}`,
            `finalValue=${finalValueForScore}`,
            `multiplier=${effects.scoreMultiplier.toFixed(2)}`,
            `final=${finalScore}`,
            `- Total: ${totalScoreRef.current}`
          );
          if (onScoreUpdate) onScoreUpdate(totalScoreRef.current);
        }
      },
      [
        onScoreUpdate,
        cardEnabled,
        onCardItemsChange,
        onCoinSettled,
        RECEPTACLE_BOUNDS,
        SUN_CARD_BOUNDS,
        TOWER_CARD_BOUNDS,
        getMaxValue
      ]
    );

    // Calculate trigger effects for settled dice
    useEffect(() => {
      if (!currentScores || !previousScores) return;

      const settledDice = diceInstances.filter(
        (d) => d.settled && d.inReceptacle
      );
      if (settledDice.length === 0) return;

      // Collect dice IDs that should have trigger effects
      const comboTriggers = new Set<number>();
      const highScoreTriggers = new Set<number>();
      const edgeTriggers = new Set<number>();

      // 1. Check for combo triggers (dice contributing to consecutive achievements)
      const achievedCategories = new Set(
        currentScores
          .filter((s) => s.achieved && s.category !== "highest_total")
          .map((s) => s.category)
      );

      const previousAchievedCategories = new Set(
        previousScores
          .filter((s) => s.achieved && s.category !== "highest_total")
          .map((s) => s.category)
      );

      const comboCategories = Array.from(achievedCategories).filter((cat) =>
        previousAchievedCategories.has(cat)
      );

      if (comboCategories.length > 0) {
        settledDice.forEach((d) => comboTriggers.add(d.id));
      }

      // 2. Check for high score triggers (1.5x better than previous best)
      currentScores.forEach((currentScore) => {
        if (currentScore.category === "highest_total" || !currentScore.achieved)
          return;
        const previousScore = previousScores.find(
          (p) => p.category === currentScore.category
        );
        if (!previousScore || previousScore.score === 0) return;
        if (currentScore.score / previousScore.score >= 1.5) {
          currentScore.diceIds?.forEach((id: number) =>
            highScoreTriggers.add(id)
          );
        }
      });

      // 3. Check for edge landing
      settledDice.forEach((d) => {
        const isCoin =
          d.type === "coin" || d.type === "loaded_coin" || d.type === "nickel";
        if (isCoin && d.value === 3) {
          edgeTriggers.add(d.id);
        }
      });

      let effectsHaveChanged = false;
      // Apply trigger effects to dice instances, checking for changes
      const updatedDiceInstances = diceInstances.map((d) => {
        if (!d.settled) return d;

        let newTriggerEffect: TriggerEffectType = null;

        // Priority: edge > high score > combo
        if (edgeTriggers.has(d.id)) {
          newTriggerEffect = "edge";
        } else if (highScoreTriggers.has(d.id)) {
          newTriggerEffect = "special";
        } else if (comboTriggers.has(d.id)) {
          newTriggerEffect = "combo";
        }

        // If the effect is different, flag it and return a new object
        if (d.triggerEffect !== newTriggerEffect) {
          effectsHaveChanged = true;
          return { ...d, triggerEffect: newTriggerEffect };
        }

        // Otherwise, return the original object to prevent re-renders
        return d;
      });

      // Only call setDiceInstances if something actually changed
      if (effectsHaveChanged) {
        setDiceInstances(updatedDiceInstances);
      }
    }, [currentScores, previousScores, diceInstances]);

    return (
      <>
        {diceInstances.map((dice) => {
          if (dice.status === "inHand") return null;

          const isThrown = dice.status === "thrown";
          const initialVelocity = isThrown
            ? dice.initialVelocity ?? [0, 0, 0]
            : [0, 0, 0];
          const initialAngularVelocity = isThrown
            ? dice.initialAngularVelocity ?? [0, 0, 0]
            : [0, 0, 0];

          // CHANGED: Check both refs to see if the die is on any card
          const isOnCard =
            sunCardDiceIdsRef.current.has(dice.id) ||
            towerCardDiceIdsRef.current.has(dice.id);

          const transformationEffects = calculateTransformationEffects(
            dice.transformations
          );

          // Calculate the score with transformation multiplier if dice has settled with a value
          const scoreWithMultiplier =
            dice.value !== undefined && dice.settled
              ? Math.round(dice.value * transformationEffects.scoreMultiplier)
              : undefined;

          return (
            <Dice
              key={dice.id}
              diceId={dice.id}
              ref={(handle) => {
                if (handle) diceRefs.current.set(dice.id, handle);
                else diceRefs.current.delete(dice.id);
              }}
              position={dice.position ?? [0, -1000, 0]}
              initialVelocity={initialVelocity as [number, number, number]}
              initialAngularVelocity={
                initialAngularVelocity as [number, number, number]
              }
              onSettled={(value: number, position: THREE.Vector3) =>
                handleDiceSettled(dice.id, dice.type, value, position)
              }
              shaderEnabled={shaderEnabled}
              maxValue={getMaxValue(dice.type)}
              diceType={dice.type}
              outOfBounds={dice.settled && !dice.inReceptacle}
              onCard={isOnCard}
              isHovered={hoveredDiceId === dice.id}
              sizeMultiplier={transformationEffects.sizeMultiplier}
              massMultiplier={transformationEffects.massMultiplier}
              emissive={transformationEffects.emissive}
              emissiveIntensity={transformationEffects.emissiveIntensity}
              transformations={getTransformationNames(dice.transformations)}
              scoreMultiplier={transformationEffects.scoreMultiplier}
              calculatedScore={scoreWithMultiplier}
              currencyEarned={dice.currencyEarned}
              triggerEffect={dice.triggerEffect}
            />
          );
        })}
      </>
    );
  }
);

DiceManager.displayName = "DiceManager";

export default DiceManager;
