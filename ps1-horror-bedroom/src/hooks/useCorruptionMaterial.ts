import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CorruptionMaterialProps {
  normalColor: number | string;
  hellColor: number | string;
  transparent?: boolean;
  opacity?: number;
  intensity?: number;
}

/**
 * PS1-style corruption material with lighting support
 */
export function useCorruptionMaterial({
  normalColor,
  hellColor,
  transparent = false,
  opacity = 1.0,
  intensity = 1.0
}: CorruptionMaterialProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const material = useMemo(() => {
    const base = new THREE.MeshStandardMaterial({
      color: normalColor,
      transparent,
      opacity,
      roughness: 0.8,
      metalness: 0.1
    });

    base.onBeforeCompile = (shader) => {
      shader.uniforms.hellColor = { value: new THREE.Color(hellColor) };
      shader.uniforms.hellFactor = { value: 0.0 };
      shader.uniforms.time = { value: 0.0 };
      shader.uniforms.intensity = { value: intensity };

      // Inject corruption shader code
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `
          #include <common>
          uniform vec3 hellColor;
          uniform float hellFactor;
          uniform float time;
          uniform float intensity;
          
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
          vec3 banded = floor(directDiffuse * 4.0) / 4.0;
          float flicker = hash(vUv * time * 2.0) * 0.1;
          vec3 corrupted = mix(banded, hellColor, hellFactor + flicker * intensity);
          gl_FragColor = vec4(corrupted, opacity);
          #include <dithering_fragment>
        `
      );

      // Store reference to shader for runtime updates
      (base as any).userData.shader = shader;
    };

    materialRef.current = base;
    return base;
  }, [normalColor, hellColor, transparent, opacity, intensity]);

  // Animate time each frame
  useFrame((state) => {
    const shader = (materialRef.current as any)?.userData?.shader;
    if (shader) shader.uniforms.time.value = state.clock.elapsedTime;
  });

  // Clean up GPU memory
  useEffect(() => {
    const mat = materialRef.current;
    return () => mat?.dispose();
  }, []);

  return material;
}

/**
 * Update hell factor (corruption level)
 */
export function updateMaterialHellFactor(
  material: THREE.Material,
  hellFactor: number
) {
  const shader = (material as any)?.userData?.shader;
  if (shader?.uniforms?.hellFactor) {
    shader.uniforms.hellFactor.value = THREE.MathUtils.clamp(hellFactor, 0, 1);
  }
}

/**
 * Update opacity
 */
export function updateMaterialOpacity(
  material: THREE.Material,
  opacity: number
) {
  const shader = (material as any)?.userData?.shader;
  if (shader?.uniforms?.opacity) {
    shader.uniforms.opacity.value = THREE.MathUtils.clamp(opacity, 0, 1);
  }
  (material as any).opacity = opacity;
}
