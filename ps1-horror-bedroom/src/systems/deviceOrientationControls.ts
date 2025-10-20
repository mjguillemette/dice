/**
 * Device Orientation Controls for Mobile
 * Allows camera control using device gyroscope/accelerometer
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { requestGyroscopePermission } from "../utils/mobileDetection";

export interface DeviceOrientationConfig {
  enabled: boolean;
  sensitivity: number; // 0.1 to 2.0
  smoothing: number; // 0 to 1, higher = more smoothing
  invertX: boolean;
  invertY: boolean;
}

const DEFAULT_CONFIG: DeviceOrientationConfig = {
  enabled: true,
  sensitivity: 0.3, // Reduced from 1.0 for slower, more controlled movement
  smoothing: 0.7, // Increased from 0.5 for smoother movement
  invertX: false,
  invertY: false
};

// Global config that persists across component lifecycles
let globalConfig: DeviceOrientationConfig = { ...DEFAULT_CONFIG };

export const getDeviceOrientationConfig = (): DeviceOrientationConfig => {
  return { ...globalConfig };
};

export const updateDeviceOrientationConfig = (
  partial: Partial<DeviceOrientationConfig>
): void => {
  globalConfig = { ...globalConfig, ...partial };
};

export const resetDeviceOrientationConfig = (): void => {
  globalConfig = { ...DEFAULT_CONFIG };
};

// A Quaternion to store the device's orientation
const deviceQuaternion = new THREE.Quaternion();
const euler = new THREE.Euler();

// An offset to "zero" the orientation
let orientationOffset = new THREE.Quaternion();
let initialOrientationSet = false;

interface UseDeviceOrientationParams {
  yawRef?: React.RefObject<number>;
  pitchRef?: React.RefObject<number>;
  enabled?: boolean;
  onPermissionChange?: (granted: boolean) => void;
}

export const useDeviceOrientation = (params?: UseDeviceOrientationParams | boolean) => {
  // Support both old boolean API and new object API
  const config: UseDeviceOrientationParams = typeof params === 'boolean'
    ? { enabled: params }
    : params || {};

  const { yawRef, pitchRef, enabled = true, onPermissionChange } = config;

  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // We'll return a stable ref to the quaternion to avoid re-renders
  const orientationRef = useRef(new THREE.Quaternion());

  useEffect(() => {
    if (!enabled) return;

    const checkSupportAndPermission = async () => {
      if (!window.DeviceOrientationEvent) {
        setIsSupported(false);
        return;
      }
      setIsSupported(true);

      const granted = await requestGyroscopePermission();
      setHasPermission(granted);
      onPermissionChange?.(granted);
    };

    checkSupportAndPermission();
  }, [enabled, onPermissionChange]);

  useEffect(() => {
    if (!enabled || !hasPermission) return;

    const handleOrientation = (event: {
      alpha: any;
      beta: any;
      gamma: any;
    }) => {
      const { alpha, beta, gamma } = event;
      if (alpha === null || beta === null || gamma === null) return;

      // The 'YXZ' order is crucial for device orientation.
      euler.set(
        THREE.MathUtils.degToRad(beta),
        THREE.MathUtils.degToRad(alpha),
        -THREE.MathUtils.degToRad(gamma),
        "YXZ"
      );

      // Update the quaternion with the new Euler angles
      deviceQuaternion.setFromEuler(euler);

      // On the first run, establish the initial "forward" direction
      if (!initialOrientationSet) {
        orientationOffset.copy(deviceQuaternion).invert();
        initialOrientationSet = true;
      }

      // Apply the offset to the current orientation
      orientationRef.current.copy(orientationOffset).multiply(deviceQuaternion);

      // If yaw/pitch refs are provided, extract Euler angles and update them
      if (yawRef && pitchRef) {
        const eulerFromQuat = new THREE.Euler().setFromQuaternion(orientationRef.current, 'YXZ');
        yawRef.current = eulerFromQuat.y;
        pitchRef.current = eulerFromQuat.x;
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [enabled, hasPermission, yawRef, pitchRef]);

  const recenter = () => {
    console.log("📱 Recalibrating orientation...");
    // Capture the current orientation and set it as the new "zero" offset
    orientationOffset.copy(deviceQuaternion).invert();
  };

  return { orientationRef, hasPermission, isSupported, recenter };
};
