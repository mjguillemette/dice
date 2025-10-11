import { useEffect, useCallback, useRef } from 'react';

export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
}

export interface InputCallbacks {
  onToggleCamera?: () => void;
  onNextCamera?: () => void;
  onIncreaseCorruption?: () => void;
  onDecreaseCorruption?: () => void;
  onToggleAutoCorruption?: () => void;
  onToggleUI?: () => void;
}

/**
 * Custom hook to manage keyboard input for the game
 * @param callbacks - Object containing callback functions for various inputs
 * @returns Current input state for movement
 */
export function useInput(callbacks: InputCallbacks = {}): InputState {
  const inputState = useRef<InputState>({
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
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
        case 'KeyC':
          callbacks.onToggleCamera?.();
          break;
        case 'KeyN':
          callbacks.onNextCamera?.();
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
        case 'KeyH':
          callbacks.onToggleUI?.();
          break;
      }
    },
    [callbacks]
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
