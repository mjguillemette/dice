/**
 * Touch Input System
 * Handles touch events for mobile devices
 */

import { useEffect, useCallback } from 'react';

export interface TouchInputHandlers {
  onTouchThrow?: (x: number, y: number) => void;
  onTouchMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
  onTouchEnd?: () => void;
}

interface TouchState {
  isActive: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
}

export const useTouchInput = (handlers: TouchInputHandlers) => {
  const touchStateRef = useRef<TouchState>({
    isActive: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startTime: 0
  });

  const handleTouchStart = useCallback((event: TouchEvent) => {
    // Prevent default to avoid mouse events firing
    event.preventDefault();

    // Only handle single touch for dice throwing
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    touchStateRef.current = {
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      startTime: Date.now()
    };
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();

    if (!touchStateRef.current.isActive || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStateRef.current.lastX;
    const deltaY = touch.clientY - touchStateRef.current.lastY;

    if (handlers.onTouchMove) {
      handlers.onTouchMove(touch.clientX, touch.clientY, deltaX, deltaY);
    }

    touchStateRef.current.lastX = touch.clientX;
    touchStateRef.current.lastY = touch.clientY;
  }, [handlers]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    event.preventDefault();

    if (!touchStateRef.current.isActive) return;

    const touchDuration = Date.now() - touchStateRef.current.startTime;
    const deltaX = touchStateRef.current.lastX - touchStateRef.current.startX;
    const deltaY = touchStateRef.current.lastY - touchStateRef.current.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If it's a quick tap (< 200ms) with minimal movement (< 10px), treat as throw
    if (touchDuration < 200 && distance < 10) {
      if (handlers.onTouchThrow) {
        handlers.onTouchThrow(touchStateRef.current.startX, touchStateRef.current.startY);
      }
    }

    if (handlers.onTouchEnd) {
      handlers.onTouchEnd();
    }

    touchStateRef.current.isActive = false;
  }, [handlers]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
};

// Add missing import
import { useRef } from 'react';
