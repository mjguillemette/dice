/**
 * Device Orientation Controls for Mobile
 * Allows camera control using device gyroscope/accelerometer
 */

import { useEffect, useRef, useState, useCallback } from "react";
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
  sensitivity: 0.5,
  smoothing: 0.85,
  invertX: false,
  invertY: false
};

let globalConfig: DeviceOrientationConfig = { ...DEFAULT_CONFIG };

export const getDeviceOrientationConfig = (): DeviceOrientationConfig => ({
  ...globalConfig
});
export const updateDeviceOrientationConfig = (
  partial: Partial<DeviceOrientationConfig>
): void => {
  globalConfig = { ...globalConfig, ...partial };
};
export const resetDeviceOrientationConfig = (): void => {
  globalConfig = { ...DEFAULT_CONFIG };
};

interface UseDeviceOrientationParams {
  yawRef?: React.RefObject<number>;
  pitchRef?: React.RefObject<number>;
  enabled?: boolean;
  onPermissionChange?: (granted: boolean) => void;
}

export const useDeviceOrientation = (
  params?: UseDeviceOrientationParams | boolean
) => {
  const config: UseDeviceOrientationParams =
    typeof params === "boolean" ? { enabled: params } : params || {};
  const { yawRef, pitchRef, enabled = true, onPermissionChange } = config;

  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const orientationRef = useRef(new THREE.Quaternion());

  // --- REFACTORED SECTION ---
  // Store orientation state in refs to tie it to the component lifecycle
  const orientationOffsetRef = useRef(new THREE.Quaternion());
  const initialOrientationSetRef = useRef(false);
  const rawDeviceQuaternionRef = useRef(new THREE.Quaternion());
  // --- END REFACTORED SECTION ---

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

    let lastQuaternion = new THREE.Quaternion();
    let firstFrame = true;
    const euler = new THREE.Euler();

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = event;
      if (alpha === null || beta === null || gamma === null) return;

      euler.set(
        THREE.MathUtils.degToRad(beta),
        THREE.MathUtils.degToRad(alpha),
        -THREE.MathUtils.degToRad(gamma),
        "YXZ"
      );

      // Update the raw device quaternion ref
      rawDeviceQuaternionRef.current.setFromEuler(euler);

      if (!initialOrientationSetRef.current) {
        orientationOffsetRef.current
          .copy(rawDeviceQuaternionRef.current)
          .invert();
        initialOrientationSetRef.current = true;
      }

      const tempQuat = new THREE.Quaternion()
        .copy(orientationOffsetRef.current)
        .multiply(rawDeviceQuaternionRef.current);

      if (firstFrame) {
        orientationRef.current.copy(tempQuat);
        lastQuaternion.copy(tempQuat);
        firstFrame = false;
      } else {
        const config = getDeviceOrientationConfig();
        const smoothFactor = 1 - config.smoothing;
        orientationRef.current
          .copy(lastQuaternion)
          .slerp(tempQuat, smoothFactor);
        lastQuaternion.copy(orientationRef.current);
      }

      if (yawRef && pitchRef) {
        const eulerFromQuat = new THREE.Euler().setFromQuaternion(
          orientationRef.current,
          "YXZ"
        );
        yawRef.current = eulerFromQuat.y;
        pitchRef.current = eulerFromQuat.x;
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [enabled, hasPermission, yawRef, pitchRef]);

  const recenter = useCallback(() => {
    console.log("📱 Recalibrating orientation...");
    // This line resets the physical zero point
    orientationOffsetRef.current.copy(rawDeviceQuaternionRef.current).invert();
    // This new line resets the virtual offset, snapping the view back to center
    orientationRef.current.identity();
  }, []); // The ref dependencies are implicit

  return { orientationRef, hasPermission, isSupported, recenter };
};
