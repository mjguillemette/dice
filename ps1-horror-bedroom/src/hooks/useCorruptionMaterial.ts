import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface CorruptionMaterialProps {
  normalColor: number | string;
  hellColor: number | string;
  transparent?: boolean;
  opacity?: number;
}

/**
 * Custom hook to create a PS1-style shader material with corruption effects.
 * Blends between normal and hell colors using a hellFactor uniform.
 */
export function useCorruptionMaterial({
  normalColor,
  hellColor,
  transparent = false,
  opacity = 1.0
}: CorruptionMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const material = useMemo(() => {
    const uniforms = {
      normalColor: { value: new THREE.Color(normalColor) },
      hellColor: { value: new THREE.Color(hellColor) },
      hellFactor: { value: 0.0 },
      time: { value: 0.0 },
      opacity: { value: opacity }
    } satisfies Record<string, { value: any }>;

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 normalColor;
        uniform vec3 hellColor;
        uniform float hellFactor;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;

        // PS1-style: subtle dithering / noise shimmer
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          float noise = hash(vUv * time);
          float factor = clamp(hellFactor + noise * 0.05, 0.0, 1.0);
          vec3 color = mix(normalColor, hellColor, factor);
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide
    });

    materialRef.current = mat;
    return mat;
  }, [normalColor, hellColor, transparent, opacity]);

  // Update uniforms if props change dynamically
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.normalColor.value.set(normalColor);
      materialRef.current.uniforms.hellColor.value.set(hellColor);
      materialRef.current.uniforms.opacity.value = opacity;
    }
  }, [normalColor, hellColor, opacity]);

  // Animate the time uniform each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  // Clean up GPU memory
  useEffect(() => {
    const mat = materialRef.current;
    return () => {
      mat?.dispose();
    };
  }, []);

  return material;
}

/**
 * Update the hell factor (corruption level) for a material
 * @param material - The shader material to update
 * @param hellFactor - Corruption level (0–1)
 */
export function updateMaterialHellFactor(
  material: THREE.ShaderMaterial,
  hellFactor: number
) {
  if (material.uniforms?.hellFactor) {
    material.uniforms.hellFactor.value = THREE.MathUtils.clamp(
      hellFactor,
      0,
      1
    );
  }
}

/**
 * Update the opacity for a material
 * @param material - The shader material to update
 * @param opacity - Opacity value (0–1)
 */
export function updateMaterialOpacity(
  material: THREE.ShaderMaterial,
  opacity: number
) {
  if (material.uniforms?.opacity) {
    material.uniforms.opacity.value = THREE.MathUtils.clamp(opacity, 0, 1);
  }
}
