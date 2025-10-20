import { useEffect, useCallback, useRef } from 'react';
import type { GameState } from './gameStateSystem';

export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
}

export interface InputCallbacks {
  onStartGame?: () => void;
  onExitToMenu?: () => void;
  onIncreaseCorruption?: () => void;
  onDecreaseCorruption?: () => void;
  onToggleAutoCorruption?: () => void;
  onToggleUI?: () => void;
}

/**
 * Custom hook to manage keyboard input for the game
 * @param callbacks - Object containing callback functions for various inputs
 * @param gameState - Optional game state to control input modes
 * @returns Current input state for movement
 */
export function useInput(
  callbacks: InputCallbacks = {},
  gameState?: GameState
): InputState {
  const inputState = useRef<InputState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Game start (only if gameState is provided)
      if (gameState && gameState.phase === 'menu' && e.code === 'Enter') {
        callbacks.onStartGame?.();
        // Request pointer lock on game start
        requestPointerLock();
        return; // Prevent other inputs in menu
      }

      // Toggle dev panel with Escape (during gameplay or menu)
      if (e.code === 'Escape') {
        callbacks.onToggleUI?.();
        return;
      }

      // H key also toggles UI for dev access
      if (e.code === 'KeyH') {
        callbacks.onToggleUI?.();
      }

      // Gameplay controls (only active if not in menu)
      if (!gameState || (gameState.phase !== 'menu')) {
        switch (e.code) {
          case 'KeyW':
            inputState.current.moveForward = true;
            break;
          case 'KeyS':
            inputState.current.moveBackward = true;
            break;
          case 'KeyA':
            inputState.current.moveLeft = true;
            break;
          case 'KeyD':
            inputState.current.moveRight = true;
            break;
          case 'KeyQ':
            callbacks.onDecreaseCorruption?.();
            break;
          case 'KeyE':
            callbacks.onIncreaseCorruption?.();
            break;
          case 'KeyT':
            callbacks.onToggleAutoCorruption?.();
            break;
        }
      }
    },
    [callbacks, gameState]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
        inputState.current.moveForward = false;
        break;
      case 'KeyS':
        inputState.current.moveBackward = false;
        break;
      case 'KeyA':
        inputState.current.moveLeft = false;
        break;
      case 'KeyD':
        inputState.current.moveRight = false;
        break;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return inputState.current;
}

/**
 * Custom hook to manage mouse movement for camera control
 * @param onMouseMove - Callback function for mouse movement
 * @param enabled - Whether mouse control is enabled
 */
export function useMouseLook(
  onMouseMove: (movementX: number, movementY: number) => void,
  enabled: boolean
) {
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (enabled && document.pointerLockElement) {
        onMouseMove(e.movementX, e.movementY);
      }
    },
    [onMouseMove, enabled]
  );

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);
}

/**
 * Request pointer lock for free camera mode
 */
export function requestPointerLock() {
  document.body.requestPointerLock();
}

/**
 * Exit pointer lock
 */
export function exitPointerLock() {
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}
