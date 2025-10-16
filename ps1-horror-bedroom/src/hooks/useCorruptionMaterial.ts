import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CorruptionMaterialUniforms {
  hellColor: { value: THREE.Color };
  hellFactor: { value: number };
  time: { value: number };
  intensity: { value: number };
  opacity: { value: number };
}

export type CorruptionMaterial = THREE.MeshStandardMaterial & {
  uniforms: CorruptionMaterialUniforms;
  userData: { shader?: THREE.WebGLProgramParametersWithUniforms };
};

export interface CorruptionMaterialProps {
  normalColor: number | string;
  hellColor: number | string;
  transparent?: boolean;
  opacity?: number;
  intensity?: number;
}

/**
 * PS1-style corruption material with lighting support and TypeScript-safe uniforms
 */
export function useCorruptionMaterial({
  normalColor,
  hellColor,
  transparent = false,
  opacity = 1.0,
  intensity = 1.0
}: CorruptionMaterialProps): CorruptionMaterial {
  const materialRef = useRef<CorruptionMaterial | null>(null);

  const material = useMemo(() => {
    const base = new THREE.MeshStandardMaterial({
      color: normalColor,
      transparent,
      opacity,
      roughness: 0.8,
      metalness: 0.1
    }) as CorruptionMaterial;

    // create placeholder uniforms so TS knows they exist
    base.uniforms = {
      hellColor: { value: new THREE.Color(hellColor) },
      hellFactor: { value: 0.0 },
      time: { value: 0.0 },
      intensity: { value: intensity },
      opacity: { value: opacity }
    };

    base.onBeforeCompile = (shader) => {
      shader.uniforms.hellColor = base.uniforms.hellColor;
      shader.uniforms.hellFactor = base.uniforms.hellFactor;
      shader.uniforms.time = base.uniforms.time;
      shader.uniforms.intensity = base.uniforms.intensity;
      shader.uniforms.opacity = base.uniforms.opacity;

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `
          #include <common>
          uniform vec3 hellColor;
          uniform float hellFactor;
          uniform float time;
          uniform float intensity;
          uniform float opacity;
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

      base.userData.shader = shader;
    };

    materialRef.current = base;
    return base;
  }, [normalColor, hellColor, transparent, opacity, intensity]);

  // animate time
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  // clean up
  useEffect(() => {
    const mat = materialRef.current;
    return () => mat?.dispose();
  }, []);

  return material;
}

/**
 * Update corruption level (0–1)
 */
export function updateMaterialHellFactor(
  material: CorruptionMaterial,
  hellFactor: number
) {
  material.uniforms.hellFactor.value = THREE.MathUtils.clamp(hellFactor, 0, 1);
}

/**
 * Update opacity (0–1)
 */
export function updateMaterialOpacity(
  material: CorruptionMaterial,
  opacity: number
) {
  material.uniforms.opacity.value = THREE.MathUtils.clamp(opacity, 0, 1);
  material.opacity = opacity;
}
