/**
 * Device Orientation Controls for Mobile
 * Allows camera control using device gyroscope/accelerometer
 */

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { requestGyroscopePermission } from '../utils/mobileDetection';

export interface DeviceOrientationConfig {
  enabled: boolean;
  sensitivity: number; // 0.1 to 2.0
  smoothing: number; // 0 to 1, higher = more smoothing
  invertX: boolean;
  invertY: boolean;
}

const DEFAULT_CONFIG: DeviceOrientationConfig = {
  enabled: true,
  sensitivity: 1.0,
  smoothing: 0.5,
  invertX: false,
  invertY: false
};

// Global config that persists across component lifecycles
let globalConfig: DeviceOrientationConfig = { ...DEFAULT_CONFIG };

export const getDeviceOrientationConfig = (): DeviceOrientationConfig => {
  return { ...globalConfig };
};

export const updateDeviceOrientationConfig = (partial: Partial<DeviceOrientationConfig>): void => {
  globalConfig = { ...globalConfig, ...partial };
};

export const resetDeviceOrientationConfig = (): void => {
  globalConfig = { ...DEFAULT_CONFIG };
};

interface UseDeviceOrientationProps {
  yawRef: MutableRefObject<number>;
  pitchRef: MutableRefObject<number>;
  enabled?: boolean;
  onPermissionChange?: (granted: boolean) => void;
}

export const useDeviceOrientation = ({
  yawRef,
  pitchRef,
  enabled = true,
  onPermissionChange
}: UseDeviceOrientationProps) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Store initial orientation to calculate deltas
  const initialAlpha = useRef<number | null>(null);
  const initialBeta = useRef<number | null>(null);
  const initialGamma = useRef<number | null>(null);

  // Smoothing
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);

  // Request permission on mount (iOS 13+)
  useEffect(() => {
    if (!enabled) return;

    const checkSupport = async () => {
      // Check if DeviceOrientationEvent is supported
      if (!window.DeviceOrientationEvent) {
        console.warn('DeviceOrientation not supported on this device');
        setIsSupported(false);
        return;
      }

      setIsSupported(true);

      // Request permission if needed (iOS 13+)
      const granted = await requestGyroscopePermission();
      setHasPermission(granted);
      onPermissionChange?.(granted);

      if (granted) {
        console.log('✅ Gyroscope permission granted');
      } else {
        console.warn('❌ Gyroscope permission denied');
      }
    };

    checkSupport();
  }, [enabled, onPermissionChange]);

  // Handle orientation events
  useEffect(() => {
    if (!enabled || !hasPermission || !isSupported) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = event;

      // alpha: rotation around z-axis (0-360)
      // beta: rotation around x-axis (-180 to 180)
      // gamma: rotation around y-axis (-90 to 90)

      if (alpha === null || beta === null || gamma === null) return;

      // On first event, store initial orientation as reference point
      if (initialAlpha.current === null) {
        initialAlpha.current = alpha;
        initialBeta.current = beta;
        initialGamma.current = gamma;
        targetYaw.current = yawRef.current;
        targetPitch.current = pitchRef.current;
        console.log('📱 Initial device orientation set:', { alpha, beta, gamma });
        return;
      }

      // Calculate deltas from initial orientation
      let deltaAlpha = alpha - initialAlpha.current;
      let deltaBeta = beta - initialBeta.current!;
      let deltaGamma = gamma - initialGamma.current!;

      // Normalize alpha delta to -180 to 180
      if (deltaAlpha > 180) deltaAlpha -= 360;
      if (deltaAlpha < -180) deltaAlpha += 360;

      // Apply sensitivity
      const sensitivity = globalConfig.sensitivity;
      const yawDelta = (globalConfig.invertX ? -deltaGamma : deltaGamma) * sensitivity * 0.02;
      const pitchDelta = (globalConfig.invertY ? deltaBeta : -deltaBeta) * sensitivity * 0.01;

      // Update target values
      targetYaw.current = THREE.MathUtils.clamp(
        yawRef.current + yawDelta,
        -Math.PI,
        Math.PI
      );

      targetPitch.current = THREE.MathUtils.clamp(
        pitchRef.current + pitchDelta,
        -Math.PI / 2,
        Math.PI / 2
      );

      // Apply smoothing
      const smoothFactor = 1 - globalConfig.smoothing;
      yawRef.current = THREE.MathUtils.lerp(yawRef.current, targetYaw.current, smoothFactor);
      pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, targetPitch.current, smoothFactor);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [enabled, hasPermission, isSupported, yawRef, pitchRef]);

  // Recenter function - resets initial orientation to current device orientation
  const recenter = () => {
    initialAlpha.current = null;
    initialBeta.current = null;
    initialGamma.current = null;
    console.log('📱 Device orientation recentered');
  };

  return {
    hasPermission,
    isSupported,
    recenter
  };
};
