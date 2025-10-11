import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Dice, { type DiceHandle } from './Dice';

interface DiceInstance {
  id: number;
  type: 'd6' | 'coin' | 'd3' | 'd4' | 'thumbtack';
  position: [number, number, number];
  initialVelocity: [number, number, number];
  initialAngularVelocity: [number, number, number];
  value?: number;
  settled: boolean;
  inReceptacle: boolean; // Whether dice landed in receptacle
}

interface DiceManagerProps {
  diceCount: number;
  coinCount: number;
  d3Count: number;
  d4Count: number;
  thumbTackCount: number;
  onScoreUpdate?: (score: number) => void;
  shaderEnabled: boolean;
}

export interface DiceManagerHandle {
  throwDice: (clickPosition: THREE.Vector3, throwOrigin?: THREE.Vector3, chargeAmount?: number) => void;
  clearDice: () => void;
  getCurrentScore: () => number;
  pickUpOutsideDice: () => number; // Returns count of picked up dice
  hasSettledDice: () => boolean; // Check if any dice have settled
  canThrow: () => boolean; // Check if we can throw (not debounced)
}

const DiceManager = forwardRef<DiceManagerHandle, DiceManagerProps>(
  ({ diceCount, coinCount, d3Count, d4Count, thumbTackCount, onScoreUpdate, shaderEnabled }, ref) => {
    const [diceInstances, setDiceInstances] = useState<DiceInstance[]>([]);
    const diceRefs = useRef<Map<number, DiceHandle>>(new Map());
    const nextIdRef = useRef(0);
    const { camera, raycaster } = useThree();

    // Receptacle bounds (position [1.5, 0.02, 2.5], size 1.2 x 0.8)
    const RECEPTACLE_CENTER = { x: 1.5, z: 2.5 };
    const RECEPTACLE_BOUNDS = {
      minX: RECEPTACLE_CENTER.x - 0.6, // 1.5 - 0.6 = 0.9
      maxX: RECEPTACLE_CENTER.x + 0.6, // 1.5 + 0.6 = 2.1
      minZ: RECEPTACLE_CENTER.z - 0.4, // 2.5 - 0.4 = 2.1
      maxZ: RECEPTACLE_CENTER.z + 0.4  // 2.5 + 0.4 = 2.9
    };

    // Track dice counts to re-throw (from picked up dice)
    const [diceToReThrow, setDiceToReThrow] = useState({
      d6: 0,
      coin: 0,
      d3: 0,
      d4: 0,
      thumbtack: 0
    });

    // Track if we're currently throwing (for debounce)
    const [isThrowing, setIsThrowing] = useState(false);
    const throwDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const throwDice = useCallback(
      (clickPosition: THREE.Vector3, throwOrigin?: THREE.Vector3, chargeAmount: number = 0.5) => {
        // Debounce check - don't throw if recently threw
        if (isThrowing) {
          console.log('Cannot throw - debounce active');
          return;
        }

        // Set throwing state
        setIsThrowing(true);

        // Use camera position if provided, otherwise use above target
        const origin = throwOrigin || new THREE.Vector3(clickPosition.x, 1.2, clickPosition.z);

        // Constrain click position to room bounds (room is 10x10, centered at 0,0)
        const roomBounds = { minX: -4, maxX: 4, minZ: -4, maxZ: 4 };
        const clampedX = Math.max(roomBounds.minX, Math.min(roomBounds.maxX, clickPosition.x));
        const clampedZ = Math.max(roomBounds.minZ, Math.min(roomBounds.maxZ, clickPosition.z));

        // Helper function to create a dice instance
        const createDiceInstance = (type: DiceInstance['type']) => {
          const spreadRadius = 0.02 + Math.random() * 0.05;
          const angle = Math.random() * Math.PI * 2;
          const offsetX = Math.cos(angle) * spreadRadius;
          const offsetZ = Math.sin(angle) * spreadRadius;

          const position: [number, number, number] = [
            origin.x + offsetX,
            origin.y,
            origin.z + offsetZ,
          ];

          const targetX = clampedX + (Math.random() - 0.5) * 0.1;
          const targetZ = clampedZ + (Math.random() - 0.5) * 0.1;

          const directionX = targetX - position[0];
          const directionZ = targetZ - position[2];
          const distance = Math.sqrt(directionX * directionX + directionZ * directionZ);

          const throwPower = 2.0 + Math.random() * 1.0;
          const initialVelocity: [number, number, number] = [
            (directionX / distance) * throwPower,
            -1.0 - Math.random() * 0.5,
            (directionZ / distance) * throwPower,
          ];

          const initialAngularVelocity: [number, number, number] = [
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
          ];

          return {
            id: nextIdRef.current++,
            type,
            position,
            initialVelocity,
            initialAngularVelocity,
            settled: false,
            inReceptacle: false,
          };
        };

        // Use functional setState to access current values without dependencies
        setDiceToReThrow(currentReThrow => {
          setDiceInstances(currentInstances => {
            // Keep existing dice that are in receptacle (they stay put)
            // We DON'T mark them as unsettled because we need them for scoring
            // Instead, we'll track them separately to exclude from pickup
            const keptDice = currentInstances.filter(d => d.settled && d.inReceptacle);
            const newDice: DiceInstance[] = [];

            // Check if we have picked-up dice to re-throw
            const totalReThrow = currentReThrow.d6 + currentReThrow.coin + currentReThrow.d3 + currentReThrow.d4 + currentReThrow.thumbtack;

            if (totalReThrow > 0) {
              console.log('DiceManager: re-throwing', totalReThrow, 'picked-up dice from', origin, 'to:', clampedX, clampedZ);
              // Re-throw ONLY the picked-up dice
              for (let i = 0; i < currentReThrow.d6; i++) {
                newDice.push(createDiceInstance('d6'));
              }
              for (let i = 0; i < currentReThrow.coin; i++) {
                newDice.push(createDiceInstance('coin'));
              }
              for (let i = 0; i < currentReThrow.d3; i++) {
                newDice.push(createDiceInstance('d3'));
              }
              for (let i = 0; i < currentReThrow.d4; i++) {
                newDice.push(createDiceInstance('d4'));
              }
              for (let i = 0; i < currentReThrow.thumbtack; i++) {
                newDice.push(createDiceInstance('thumbtack'));
              }
            } else {
              // Throw fresh dice from settings
              const totalNewDice = diceCount + coinCount + d3Count + d4Count + thumbTackCount;
              console.log('DiceManager: throwing', totalNewDice, 'new dice from', origin, 'to:', clampedX, clampedZ);
              for (let i = 0; i < diceCount; i++) {
                newDice.push(createDiceInstance('d6'));
              }
              for (let i = 0; i < coinCount; i++) {
                newDice.push(createDiceInstance('coin'));
              }
              for (let i = 0; i < d3Count; i++) {
                newDice.push(createDiceInstance('d3'));
              }
              for (let i = 0; i < d4Count; i++) {
                newDice.push(createDiceInstance('d4'));
              }
              for (let i = 0; i < thumbTackCount; i++) {
                newDice.push(createDiceInstance('thumbtack'));
              }
            }

            console.log('DiceManager: created', newDice.length, 'new dice, keeping', keptDice.length, 'in receptacle');
            return [...keptDice, ...newDice];
          });

          // Reset re-throw queue
          return { d6: 0, coin: 0, d3: 0, d4: 0, thumbtack: 0 };
        });
      },
      [diceCount, coinCount, d3Count, d4Count, thumbTackCount]
    );

    const clearDice = useCallback(() => {
      setDiceInstances([]);
      if (onScoreUpdate) {
        onScoreUpdate(0);
      }
    }, [onScoreUpdate]);

    const getCurrentScore = useCallback(() => {
      let total = 0;
      diceInstances.forEach((dice) => {
        if (dice.value !== undefined && dice.inReceptacle) {
          total += dice.value;
        }
      });
      return total;
    }, [diceInstances]);

    const pickUpOutsideDice = useCallback(() => {
      const settledDice = diceInstances.filter(d => d.settled);
      const outsideDice = settledDice.filter(d => !d.inReceptacle);
      const insideDice = settledDice.filter(d => d.inReceptacle);

      // If there are outside dice, pick up ONLY those
      if (outsideDice.length > 0) {
        const counts = { d6: 0, coin: 0, d3: 0, d4: 0, thumbtack: 0 };
        outsideDice.forEach(d => {
          counts[d.type]++;
        });

        console.log('Picking up', outsideDice.length, 'dice outside receptacle:', counts);

        // Add to re-throw queue (don't reset - add to existing)
        setDiceToReThrow(prev => ({
          d6: prev.d6 + counts.d6,
          coin: prev.coin + counts.coin,
          d3: prev.d3 + counts.d3,
          d4: prev.d4 + counts.d4,
          thumbtack: prev.thumbtack + counts.thumbtack,
        }));

        // Remove outside dice from scene (keep only dice in receptacle)
        setDiceInstances(prev => prev.filter(d => !d.settled || d.inReceptacle));

        return outsideDice.length;
      }

      // If ALL dice are in receptacle (no outside dice), pick up ALL for restart
      if (insideDice.length > 0) {
        const counts = { d6: 0, coin: 0, d3: 0, d4: 0, thumbtack: 0 };
        insideDice.forEach(d => {
          counts[d.type]++;
        });

        console.log('All dice in receptacle! Picking up ALL', insideDice.length, 'dice for restart:', counts);

        // REPLACE re-throw queue with all dice (fresh start)
        setDiceToReThrow({
          d6: counts.d6,
          coin: counts.coin,
          d3: counts.d3,
          d4: counts.d4,
          thumbtack: counts.thumbtack,
        });

        // Clear all dice from scene
        setDiceInstances([]);

        return insideDice.length;
      }

      return 0;
    }, [diceInstances]);

    const hasSettledDice = useCallback(() => {
      // Check if ALL dice have settled (not just some)
      // This prevents picking up kept dice before new dice settle
      const allDiceSettled = diceInstances.length > 0 && diceInstances.every(d => d.settled);
      return allDiceSettled;
    }, [diceInstances]);

    const canThrow = useCallback(() => {
      return !isThrowing;
    }, [isThrowing]);

    useImperativeHandle(ref, () => ({
      throwDice,
      clearDice,
      getCurrentScore,
      pickUpOutsideDice,
      hasSettledDice,
      canThrow,
    }));

    const handleDiceSettled = useCallback(
      (id: number, value: number, position: THREE.Vector3) => {
        // Check if dice is in receptacle bounds
        const inReceptacle =
          position.x >= RECEPTACLE_BOUNDS.minX &&
          position.x <= RECEPTACLE_BOUNDS.maxX &&
          position.z >= RECEPTACLE_BOUNDS.minZ &&
          position.z <= RECEPTACLE_BOUNDS.maxZ;

        console.log('Dice', id, 'settled with value:', value, 'at', position, 'inReceptacle:', inReceptacle);

        setDiceInstances((prev) => {
          const updated = prev.map((dice) =>
            dice.id === id ? { ...dice, value, settled: true, inReceptacle } : dice
          );

          // Calculate total score (only dice in receptacle)
          const allSettled = updated.every((d) => d.settled);
          console.log('All settled?', allSettled, 'Updated dice:', updated);
          if (allSettled && onScoreUpdate) {
            const totalScore = updated.reduce((sum, d) => {
              // Only count dice that are in the receptacle
              return sum + (d.inReceptacle && d.value ? d.value : 0);
            }, 0);
            const inReceptacleCount = updated.filter(d => d.inReceptacle).length;
            const outsideCount = updated.filter(d => !d.inReceptacle).length;
            console.log('Total score:', totalScore, '(', inReceptacleCount, 'in receptacle,', outsideCount, 'outside)');
            onScoreUpdate(totalScore);

            // Clear throwing state after 3 seconds
            if (throwDebounceRef.current) {
              clearTimeout(throwDebounceRef.current);
            }
            throwDebounceRef.current = setTimeout(() => {
              console.log('Debounce cleared - can throw again');
              setIsThrowing(false);
            }, 3000);
          }

          return updated;
        });
      },
      [onScoreUpdate, RECEPTACLE_BOUNDS, diceToReThrow]
    );

    // Helper function to get maxValue based on type
    const getMaxValue = (type: DiceInstance['type']): number => {
      switch (type) {
        case 'thumbtack': return 1;
        case 'coin': return 2;
        case 'd3': return 3;
        case 'd4': return 4;
        case 'd6': return 6;
        default: return 6;
      }
    };

    return (
      <>
        {diceInstances.map((dice) => (
          <Dice
            key={dice.id}
            ref={(handle) => {
              if (handle) {
                diceRefs.current.set(dice.id, handle);
              } else {
                diceRefs.current.delete(dice.id);
              }
            }}
            position={dice.position}
            initialVelocity={dice.initialVelocity}
            initialAngularVelocity={dice.initialAngularVelocity}
            onSettled={(value, position) => handleDiceSettled(dice.id, value, position)}
            shaderEnabled={shaderEnabled}
            maxValue={getMaxValue(dice.type)}
            outOfBounds={dice.settled && !dice.inReceptacle}
          />
        ))}
      </>
    );
  }
);

DiceManager.displayName = 'DiceManager';

export default DiceManager;
