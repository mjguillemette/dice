import {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import * as THREE from "three";
import Dice, { type DiceHandle } from "./Dice";
import { getReceptacleBounds, getCardBounds } from "../../constants/receptacleConfig";
import {
  type DiceTransformation,
  applyTransformation,
  calculateTransformationEffects
} from "../../systems/diceTransformationSystem";

type DiceStatus =
  | "inHand"
  | "thrown"
  | "settledInReceptacle"
  | "settledOutOfBounds";

interface DiceInstance {
  id: number;
  type: "d6" | "coin" | "d3" | "d4" | "thumbtack";
  position?: [number, number, number]; // present while thrown/settled
  initialVelocity?: [number, number, number];
  initialAngularVelocity?: [number, number, number];
  value?: number;
  settled: boolean;
  inReceptacle: boolean;
  generation: number;
  status: DiceStatus;
  transformations: DiceTransformation[]; // Permanent transformations applied to this die
}

interface DiceManagerProps {
  diceCount: number;
  coinCount: number;
  d3Count: number;
  d4Count: number;
  thumbTackCount: number;
  onScoreUpdate?: (score: number) => void;
  shaderEnabled: boolean;
  cardEnabled: boolean; // Whether the card is placed on the receptacle
  onCardItemsChange?: (diceOnCard: number[]) => void; // Callback with dice IDs on card
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
  startNewRound: () => void; // Start a new round - pick up all dice and reset score
  applyCardTransformation: (diceId: number) => void; // Apply transformation when die collides with card
}

const DiceManager = forwardRef<DiceManagerHandle, DiceManagerProps>(
  (
    {
      diceCount,
      coinCount,
      d3Count,
      d4Count,
      thumbTackCount,
      onScoreUpdate,
      shaderEnabled,
      cardEnabled,
      onCardItemsChange
    },
    ref
  ) => {
    const [diceInstances, setDiceInstances] = useState<DiceInstance[]>([]);
    const diceRefs = useRef<Map<number, DiceHandle>>(new Map());
    const nextIdRef = useRef(0);
    const generationRef = useRef(0);
    const totalScoreRef = useRef(0);
    const scoredDiceIds = useRef<Set<number>>(new Set()); // Track which dice have been scored
    const diceOnCardRef = useRef<Set<number>>(new Set()); // Track which dice are on the card
    const [isThrowing, setIsThrowing] = useState(false);
    const throwDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get receptacle and card bounds from centralized config
    const RECEPTACLE_BOUNDS = getReceptacleBounds();
    const CARD_BOUNDS = getCardBounds();

    // Debug: Log bounds once
    console.log('🎯 DiceManager bounds:', {
      receptacle: RECEPTACLE_BOUNDS,
      card: CARD_BOUNDS,
    });

    const roomBounds = { minX: -4, maxX: 4, minZ: -4, maxZ: 4 };

    const getMaxValue = (type: DiceInstance["type"]): number => {
      switch (type) {
        case "thumbtack":
          return 1;
        case "coin":
          return 2;
        case "d3":
          return 3;
        case "d4":
          return 4;
        case "d6":
        default:
          return 6;
      }
    };

    const createDieObject = (
      type: DiceInstance["type"],
      generation: number,
      origin: THREE.Vector3,
      clickPosition: THREE.Vector3,
      cameraDirection?: THREE.Vector3
    ) => {
      const spreadRadius = 0.02 + Math.random() * 0.05;
      const angle = Math.random() * Math.PI * 2;
      const offsetX = Math.cos(angle) * spreadRadius;
      const offsetZ = Math.sin(angle) * spreadRadius;

      const position: [number, number, number] = [
        origin.x + offsetX,
        origin.y,
        origin.z + offsetZ
      ];

      // Use the actual click position as the target, with slight randomness for spread
      const targetX = clickPosition.x + (Math.random() - 0.5) * 0.3;
      const targetZ = clickPosition.z + (Math.random() - 0.5) * 0.3;
      const directionX = targetX - position[0];
      const directionZ = targetZ - position[2];
      const distance =
        Math.sqrt(directionX * directionX + directionZ * directionZ) || 1;

      // Scale throw power based on distance for more natural feel
      const basePower = 0.01;
      const distanceMultiplier = Math.min(distance * 0.3, 2.0);
      const throwPower = basePower + distanceMultiplier + Math.random() * 0.5;

      // Calculate Y velocity based on camera direction if provided
      let velocityY = -6 - Math.random() * 0.2; // Default downward arc
      if (cameraDirection) {
        // Use camera's Y component to influence throw angle
        // Positive Y = looking down, negative Y = looking up
        velocityY = cameraDirection.y * throwPower - Math.random() * 0.2;
      }

      const initialVelocity: [number, number, number] = [
        (directionX / distance) * throwPower,
        velocityY,
        (directionZ / distance) * throwPower
      ];

      const initialAngularVelocity: [number, number, number] = [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
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
        transformations: [] // Start with no transformations
      } as DiceInstance;
    };

    // Throw dice: either create all dice on first throw, or re-throw only dice that are 'inHand'
    const throwDice = useCallback(
      (
        clickPosition: THREE.Vector3,
        throwOrigin?: THREE.Vector3,
        chargeAmount: number = 0.5,
        cameraDirection?: THREE.Vector3
      ) => {
        // Basic debounce to avoid double throws; pickUp clears it so a pickUp->throw can happen instantly.
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
          // If no dice exist yet, create full set of dice and throw them all
          if (prev.length === 0) {
            const created: DiceInstance[] = [];
            for (let i = 0; i < diceCount; i++)
              created.push(createDieObject("d6", thisGeneration, origin, clickPosition));
            for (let i = 0; i < coinCount; i++)
              created.push(createDieObject("coin", thisGeneration, origin, clickPosition));
            for (let i = 0; i < d3Count; i++)
              created.push(createDieObject("d3", thisGeneration, origin, clickPosition));
            for (let i = 0; i < d4Count; i++)
              created.push(createDieObject("d4", thisGeneration, origin, clickPosition));
            for (let i = 0; i < thumbTackCount; i++)
              created.push(
                createDieObject("thumbtack", thisGeneration, origin, clickPosition)
              );
            return created;
          }

          // Otherwise only transform dice that are 'inHand' -> 'thrown'
          const next = prev.map((d) => {
            if (d.status === "inHand") {
              // prepare a thrown object using same id/type but new velocity/position
              const spreadRadius = 0.02 + Math.random() * 0.05;
              const angle = Math.random() * Math.PI * 2;
              const offsetX = Math.cos(angle) * spreadRadius;
              const offsetZ = Math.sin(angle) * spreadRadius;
              const position: [number, number, number] = [
                origin.x + offsetX,
                origin.y,
                origin.z + offsetZ
              ];

              // Use the actual click position as the target
              const targetX = clickPosition.x + (Math.random() - 0.5) * 0.3;
              const targetZ = clickPosition.z + (Math.random() - 0.5) * 0.3;
              const directionX = targetX - position[0];
              const directionZ = targetZ - position[2];
              const distance =
                Math.sqrt(directionX * directionX + directionZ * directionZ) ||
                1;

              // Scale throw power based on distance
              const basePower = 2.5;
              const distanceMultiplier = Math.min(distance * 0.5, 2.0);
              const throwPower = basePower + distanceMultiplier + Math.random() * 0.5;

              const initialVelocity: [number, number, number] = [
                (directionX / distance) * throwPower,
                -0.5 - Math.random() * 0.3,
                (directionZ / distance) * throwPower
              ];

              const initialAngularVelocity: [number, number, number] = [
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
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
            // keep others (thrown/settled) unchanged
            return d;
          });

          return next;
        });
      },
      [isThrowing, diceCount, coinCount, d3Count, d4Count, thumbTackCount]
    );

    // Clear all dice and reset score
    const clearDice = useCallback(() => {
      setDiceInstances([]);
      totalScoreRef.current = 0;
      if (onScoreUpdate) onScoreUpdate(0);
    }, [onScoreUpdate]);

    // Return total score (accumulated as dice land in the receptacle)
    const getCurrentScore = useCallback(() => {
      return totalScoreRef.current;
    }, []);

    // Pick up any settled out-of-bounds dice (mark them inHand).
    // Dice in the receptacle remain there until explicitly cleared for a new round.
    const pickUpOutsideDice = useCallback(() => {
      // allow immediate rethrow after pickup
      if (throwDebounceRef.current) {
        clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = null;
      }
      setIsThrowing(false);

      // Use current diceInstances snapshot
      const settled = diceInstances.filter((d) => d.settled);
      const outside = settled.filter((d) => !d.inReceptacle);

      if (outside.length > 0) {
        // mark those as inHand so they can be thrown next
        const outsideIds = new Set(outside.map((d) => d.id));

        // Remove picked up dice from scored and card tracking
        outsideIds.forEach(id => {
          scoredDiceIds.current.delete(id);
          diceOnCardRef.current.delete(id);
        });

        // Notify card change if any dice were removed from card
        if (onCardItemsChange && diceOnCardRef.current.size >= 0) {
          onCardItemsChange(Array.from(diceOnCardRef.current));
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

      // If nothing outside, return 0 (all dice are in receptacle - successful!)
      // Dice remain in receptacle - they'll be cleared when starting a new round
      return 0;
    }, [diceInstances, onCardItemsChange]);

    // Returns true if every die is settled (either in-bounds or out-of-bounds)
    const hasSettledDice = useCallback(() => {
      return diceInstances.length > 0 && diceInstances.every((d) => d.settled);
    }, [diceInstances]);

    const canThrow = useCallback(() => !isThrowing, [isThrowing]);

    // Reset all dice state (clear instances, reset score, reset IDs, clear debounce)
    const resetDice = useCallback(() => {
      setDiceInstances([]);
      totalScoreRef.current = 0;
      nextIdRef.current = 0; // Reset ID counter for new dice
      generationRef.current = 0; // Reset generation counter
      scoredDiceIds.current.clear(); // Clear scored dice tracking
      diceOnCardRef.current.clear(); // Clear card tracking
      setIsThrowing(false);
      if (throwDebounceRef.current) {
        clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = null;
      }
      if (onScoreUpdate) onScoreUpdate(0);
      if (onCardItemsChange) onCardItemsChange([]);
    }, [onScoreUpdate, onCardItemsChange]);

    // Start a new round - pick up all dice and reset score (called after successful/failed round completion)
    const startNewRound = useCallback(() => {
      // allow immediate rethrow after pickup
      if (throwDebounceRef.current) {
        clearTimeout(throwDebounceRef.current);
        throwDebounceRef.current = null;
      }
      setIsThrowing(false);

      // Clear all scored dice and card tracking for fresh round
      scoredDiceIds.current.clear();
      diceOnCardRef.current.clear();

      // Notify card change
      if (onCardItemsChange) {
        onCardItemsChange([]);
      }

      // Pick up all dice (mark as inHand)
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

      // Reset total score for new round
      totalScoreRef.current = 0;
      if (onScoreUpdate) onScoreUpdate(0);
    }, [onScoreUpdate, onCardItemsChange]);

    // Apply card transformation when die collides with card sensor
    const applyCardTransformation = useCallback((diceId: number) => {
      setDiceInstances((prev) => {
        return prev.map((d) => {
          if (d.id !== diceId) return d;

          console.log('🔮 Applying tarot_boost transformation to die', diceId, 'via collision');
          const newTransformations = applyTransformation(d.transformations, 'tarot_boost');

          return {
            ...d,
            transformations: newTransformations
          };
        });
      });

      // Also add to card tracking
      if (!diceOnCardRef.current.has(diceId)) {
        diceOnCardRef.current.add(diceId);
        console.log('✅ Die', diceId, 'added to card via collision! Dice on card:', Array.from(diceOnCardRef.current));
        if (onCardItemsChange) {
          onCardItemsChange(Array.from(diceOnCardRef.current));
        }
      }
    }, [onCardItemsChange]);

    useImperativeHandle(ref, () => ({
      throwDice,
      clearDice,
      getCurrentScore,
      pickUpOutsideDice,
      hasSettledDice,
      canThrow,
      resetDice,
      startNewRound,
      applyCardTransformation
    }));

    // Called by each Dice component when it finishes settling.
    const handleDiceSettled = useCallback(
      (id: number, value: number, position: THREE.Vector3) => {
        // Check if we've already scored this die using ref (outside of setState closure)
        if (scoredDiceIds.current.has(id)) {
          console.log('Die', id, 'already scored - skipping duplicate');
          return;
        }

        const inReceptacle =
          position.x >= RECEPTACLE_BOUNDS.minX &&
          position.x <= RECEPTACLE_BOUNDS.maxX &&
          position.z >= RECEPTACLE_BOUNDS.minZ &&
          position.z <= RECEPTACLE_BOUNDS.maxZ;

        // Check if dice landed on the card (if card is enabled)
        console.log(`🎲 Die ${id} settled at position:`, {
          x: position.x,
          z: position.z,
          cardEnabled,
          cardBounds: CARD_BOUNDS,
        });

        const onCard = cardEnabled &&
          position.x >= CARD_BOUNDS.minX &&
          position.x <= CARD_BOUNDS.maxX &&
          position.z >= CARD_BOUNDS.minZ &&
          position.z <= CARD_BOUNDS.maxZ;

        // Update card tracking - ALWAYS call callback to update state
        const wasOnCard = diceOnCardRef.current.has(id);
        if (onCard) {
          diceOnCardRef.current.add(id);
          console.log('✅ Die', id, 'landed on card! Dice on card:', Array.from(diceOnCardRef.current));
        } else if (wasOnCard) {
          diceOnCardRef.current.delete(id);
          console.log('❌ Die', id, 'removed from card');
        }

        // Always notify when card state changes
        if (onCardItemsChange && (onCard || wasOnCard)) {
          onCardItemsChange(Array.from(diceOnCardRef.current));
        }

        // Calculate the score for this die BEFORE updating state
        let dieScore = value;
        let dieTransformations: DiceTransformation[] = [];

        setDiceInstances((prev) => {
          const updated = prev.map((d) => {
            if (d.id !== id) return d;

            // Apply tarot card transformation if landed on card
            let newTransformations = d.transformations;
            if (onCard) {
              console.log('🔮 Applying tarot_boost transformation to die', id);
              newTransformations = applyTransformation(d.transformations, 'tarot_boost');
            }

            // Store transformations for score calculation
            dieTransformations = newTransformations;

            // Update the die with settle info
            const newStatus: DiceStatus = inReceptacle
              ? "settledInReceptacle"
              : "settledOutOfBounds";
            return {
              ...d,
              value,
              position: [position.x, position.y, position.z] as [number, number, number],
              settled: true,
              inReceptacle,
              status: newStatus,
              transformations: newTransformations
            } as DiceInstance;
          });

          return updated;
        });

        // Score the die OUTSIDE of setState to avoid closure issues
        if (inReceptacle && typeof value === "number") {
          // Apply score multiplier from transformations
          const effects = calculateTransformationEffects(dieTransformations);
          dieScore = Math.round(value * effects.scoreMultiplier);

          scoredDiceIds.current.add(id); // Mark as scored
          totalScoreRef.current += dieScore;
          console.log(
            `🎲 Die ${id} scored:`,
            `base=${value}`,
            `multiplier=${effects.scoreMultiplier.toFixed(2)}`,
            `final=${dieScore}`,
            `- Total: ${totalScoreRef.current}`
          );
          if (onScoreUpdate) onScoreUpdate(totalScoreRef.current);
        }
      },
      [onScoreUpdate, cardEnabled, onCardItemsChange]
    );

    return (
      <>
        {diceInstances.map((dice) => {
          // Only render dice that are thrown or already settled (not those in the player's hand)
          if (dice.status === "inHand") return null;

          // For thrown dice, pass their velocities; for settled dice pass zeros
          const isThrown = dice.status === "thrown";
          const initialVelocity: [number, number, number] = isThrown
            ? (Array.isArray(dice.initialVelocity) && dice.initialVelocity.length === 3
                ? dice.initialVelocity as [number, number, number]
                : [0, 0, 0])
            : [0, 0, 0];
          const initialAngularVelocity: [number, number, number] = isThrown
            ? Array.isArray(dice.initialAngularVelocity) && dice.initialAngularVelocity.length === 3
              ? dice.initialAngularVelocity as [number, number, number]
              : [
                  dice.initialAngularVelocity?.[0] ?? 0,
                  dice.initialAngularVelocity?.[1] ?? 0,
                  dice.initialAngularVelocity?.[2] ?? 0
                ]
            : [0, 0, 0];

          const isOnCard = diceOnCardRef.current.has(dice.id);

          // Calculate transformation effects for this die
          const transformationEffects = calculateTransformationEffects(dice.transformations);

          return (
            <Dice
              key={dice.id}
              diceId={dice.id}
              ref={(handle) => {
                if (handle) diceRefs.current.set(dice.id, handle);
                else diceRefs.current.delete(dice.id);
              }}
              position={dice.position ?? [0, -1000, 0]} // if no position (edge cases), push offscreen until thrown
              initialVelocity={initialVelocity}
              initialAngularVelocity={initialAngularVelocity}
              onSettled={(value: number, position: THREE.Vector3) =>
                handleDiceSettled(dice.id, value, position)
              }
              shaderEnabled={shaderEnabled}
              maxValue={getMaxValue(dice.type)}
              outOfBounds={dice.settled && !dice.inReceptacle}
              onCard={isOnCard}
              sizeMultiplier={transformationEffects.sizeMultiplier}
              massMultiplier={transformationEffects.massMultiplier}
              emissive={transformationEffects.emissive}
              emissiveIntensity={transformationEffects.emissiveIntensity}
            />
          );
        })}
      </>
    );
  }
);

DiceManager.displayName = "DiceManager";

export default DiceManager;
