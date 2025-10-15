import * as THREE from "three";
import { RapierRigidBody } from "@react-three/rapier";

export interface DiceProps {
  position: [number, number, number];
  initialVelocity?: [number, number, number];
  initialAngularVelocity?: [number, number, number];
  onSettled?: (value: number, position: THREE.Vector3) => void;
  shaderEnabled: boolean;
  outOfBounds?: boolean;
  onCard?: boolean;
  diceId?: number;

  // Transform effects
  sizeMultiplier?: number;
  massMultiplier?: number;
  colorTint?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

export interface DiceHandle {
  getValue: () => number;
  isSettled: () => boolean;
}

export interface DiceConfig {
  maxValue: number;
}
