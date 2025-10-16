import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CorruptionMaterialProps {
  normalColor: number | string;
  hellColor: number | string;
  transparent?: boolean;
  opacity?: number;
  intensity?: number; // controls how strongly corruption distorts lighting
}

/**
 * PS1-style corruption material that reacts to lighting
 * Built on top of MeshStandardMaterial for realistic shading
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

      // Add varying + hash for PS1 shimmer
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

      // Inject our corruption blend at the end of lighting
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <dithering_fragment>`,
        `
          // Apply PS1-like banding (reduces lighting precision)
          vec3 banded = floor(directDiffuse * 4.0) / 4.0;

          // Add corruption flicker
          float flicker = hash(vUv * time * 2.0) * 0.1;

          // Blend normal lit color with hellColor based on hellFactor
          vec3 corrupted = mix(banded, hellColor, hellFactor + flicker * intensity);

          gl_FragColor = vec4(corrupted, opacity);

          #include <dithering_fragment>
        `
      );

      materialRef.current = base as any;
      (base as any).userData.shader = shader;
    };

    return base;
  }, [normalColor, hellColor, transparent, opacity, intensity]);

  // Animate time
  useFrame((state) => {
    const shader = materialRef.current?.userData.shader;
    if (shader) shader.uniforms.time.value = state.clock.elapsedTime;
  });

  // Cleanup
  useEffect(() => {
    const mat = materialRef.current;
    return () => mat?.dispose();
  }, []);

  return material;
}

/**
 * Update the corruption factor (0–1)
 */
export function updateMaterialHellFactor(
  material: THREE.Material,
  hellFactor: number
) {
  const shader = (material as any).userData?.shader;
  if (shader)
    shader.uniforms.hellFactor.value = THREE.MathUtils.clamp(hellFactor, 0, 1);
}

/**
 * Update opacity at runtime (0–1)
 */
export function updateMaterialOpacity(
  material: THREE.Material,
  opacity: number
) {
  const shader = (material as any).userData?.shader;
  if (shader)
    shader.uniforms.opacity.value = THREE.MathUtils.clamp(opacity, 0, 1);
  (material as any).opacity = opacity;
}
