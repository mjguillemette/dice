import {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle
} from "react";
import * as THREE from "three";
import Dice, { type DiceHandle } from "./Dice";

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
    chargeAmount?: number
  ) => void;
  clearDice: () => void;
  getCurrentScore: () => number;
  pickUpOutsideDice: () => number;
  hasSettledDice: () => boolean;
  canThrow: () => boolean;
  resetDice: () => void; // Reset all dice and clear state
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

    const RECEPTACLE_BOUNDS = {
      minX: 1.5 - 0.6,
      maxX: 1.5 + 0.6,
      minZ: 2.5 - 0.4,
      maxZ: 2.5 + 0.4
    };

    // Card bounds - positioned in top right corner of receptacle
    // Card dimensions: width 0.065, length 0.095
    // Position: receptacle position [1.5, 0.02, 2.5], offset to top-right
    const CARD_BOUNDS = {
      minX: 1.5 + 0.6 - 0.065 - 0.05, // Right edge minus card width minus small margin
      maxX: 1.5 + 0.6 - 0.05, // Right edge minus small margin
      minZ: 2.5 - 0.4 + 0.05, // Top edge plus small margin
      maxZ: 2.5 - 0.4 + 0.05 + 0.095 // Top edge plus margin plus card length
    };

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
      clickPosition: THREE.Vector3
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
      const basePower = 2.5;
      const distanceMultiplier = Math.min(distance * 0.5, 2.0);
      const throwPower = basePower + distanceMultiplier + Math.random() * 0.5;

      const initialVelocity: [number, number, number] = [
        (directionX / distance) * throwPower,
        -0.5 - Math.random() * 0.3, // Slightly less downward for better arc
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
        status: "thrown" as DiceStatus
      } as DiceInstance;
    };

    // Throw dice: either create all dice on first throw, or re-throw only dice that are 'inHand'
    const throwDice = useCallback(
      (
        clickPosition: THREE.Vector3,
        throwOrigin?: THREE.Vector3,
        chargeAmount: number = 0.5
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
    // If none outside and all dice are in the receptacle, pick up ALL for restart and reset score.
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
      const inside = settled.filter((d) => d.inReceptacle);

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

      // If nothing outside, but all dice are in receptacle -> pick up all for restart
      if (
        diceInstances.length > 0 &&
        diceInstances.every((d) => d.status === "settledInReceptacle")
      ) {
        // Clear all scored dice and card tracking for fresh round
        scoredDiceIds.current.clear();
        diceOnCardRef.current.clear();

        // Notify card change
        if (onCardItemsChange) {
          onCardItemsChange([]);
        }

        setDiceInstances((prev) =>
          prev.map((d) => ({
            ...d,
            status: "inHand",
            settled: false,
            inReceptacle: false,
            position: undefined,
            initialVelocity: undefined,
            initialAngularVelocity: undefined,
            value: undefined,
            generation: 0
          }))
        );
        // reset total score for new round
        totalScoreRef.current = 0;
        if (onScoreUpdate) onScoreUpdate(0);
        return inside.length;
      }

      return 0;
    }, [diceInstances, onScoreUpdate]);

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

    useImperativeHandle(ref, () => ({
      throwDice,
      clearDice,
      getCurrentScore,
      pickUpOutsideDice,
      hasSettledDice,
      canThrow,
      resetDice
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
        const onCard = cardEnabled &&
          position.x >= CARD_BOUNDS.minX &&
          position.x <= CARD_BOUNDS.maxX &&
          position.z >= CARD_BOUNDS.minZ &&
          position.z <= CARD_BOUNDS.maxZ;

        // Update card tracking
        if (onCard) {
          diceOnCardRef.current.add(id);
          if (onCardItemsChange) {
            onCardItemsChange(Array.from(diceOnCardRef.current));
          }
          console.log('Die', id, 'landed on card! Dice on card:', Array.from(diceOnCardRef.current));
        }

        setDiceInstances((prev) => {
          const updated = prev.map((d) => {
            if (d.id !== id) return d;
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
              status: newStatus
            } as DiceInstance;
          });

          return updated;
        });

        // Score the die OUTSIDE of setState to avoid closure issues
        if (inReceptacle && typeof value === "number") {
          scoredDiceIds.current.add(id); // Mark as scored
          totalScoreRef.current += value;
          console.log('Die', id, 'scored:', value, '- New total:', totalScoreRef.current);
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

          return (
            <Dice
              key={dice.id}
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
            />
          );
        })}
      </>
    );
  }
);

DiceManager.displayName = "DiceManager";

export default DiceManager;
