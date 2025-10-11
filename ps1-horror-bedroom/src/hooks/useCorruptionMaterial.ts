import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';

export interface CorruptionMaterialProps {
  normalColor: number | string;
  hellColor: number | string;
  transparent?: boolean;
  opacity?: number;
}

/**
 * Custom hook to create a PS1-style shader material with corruption effects
 * @param normalColor - The base color in normal state
 * @param hellColor - The color in corrupted state
 * @param transparent - Whether the material should be transparent
 * @param opacity - Initial opacity value
 * @returns A THREE.ShaderMaterial with corruption uniforms
 */
export function useCorruptionMaterial({
  normalColor,
  hellColor,
  transparent = false,
  opacity = 1.0,
}: CorruptionMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>();

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        normalColor: { value: new THREE.Color(normalColor) },
        hellColor: { value: new THREE.Color(hellColor) },
        hellFactor: { value: 0.0 },
        time: { value: 0.0 },
        opacity: { value: opacity },
      },
      vertexShader,
      fragmentShader,
      transparent,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    });

    materialRef.current = mat;
    return mat;
  }, [normalColor, hellColor, transparent, opacity]);

  // Update time uniform every frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return material;
}

/**
 * Update the hell factor (corruption level) for a material
 * @param material - The shader material to update
 * @param hellFactor - Corruption level (0-1)
 */
export function updateMaterialHellFactor(
  material: THREE.ShaderMaterial,
  hellFactor: number
) {
  if (material.uniforms && material.uniforms.hellFactor) {
    material.uniforms.hellFactor.value = hellFactor;
  }
}

/**
 * Update the opacity for a material
 * @param material - The shader material to update
 * @param opacity - Opacity value (0-1)
 */
export function updateMaterialOpacity(
  material: THREE.ShaderMaterial,
  opacity: number
) {
  if (material.uniforms && material.uniforms.opacity) {
    material.uniforms.opacity.value = opacity;
  }
}
