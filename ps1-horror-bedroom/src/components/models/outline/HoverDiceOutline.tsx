import * as THREE from "three";
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";

function HoverDiceOutline({
  hovered,
  settled
}: {
  hovered: boolean;
  settled: boolean;
}) {
  const materialRef = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uHover: { value: 0 },
          uSettled: { value: 0 },
          colorWarm: { value: new THREE.Color("#ff2c4b") },
          colorCool: { value: new THREE.Color("#0a9dff") }
        },
        vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPosition;

      uniform float uTime;
      uniform float uHover;
      uniform float uSettled;
      uniform vec3 colorWarm;
      uniform vec3 colorCool;

      // Simple hash-based noise (cheap)
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
      }

      void main() {
        // Fresnel term for edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

        // Blend warm and cool based on normal Y
        vec3 baseColor = mix(colorWarm, colorCool, smoothstep(-0.3, 0.6, vNormal.y));

        // Noise overlay
        float grain = noise(vPosition.xy * 15.0 + uTime * 0.5);
        float flicker = mix(0.9, 1.1, grain);

        // Hover pulse
        float pulse = 0.5 + 0.5 * sin(uTime * 5.0);
        float hoverIntensity = mix(0.3, 1.2, uHover * pulse);

        vec3 finalColor = baseColor * hoverIntensity * flicker * (0.4 + fresnel * 1.2);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
        transparent: false,
        side: THREE.DoubleSide
      }),
    []
  );

  useFrame(({ clock }) => {
    materialRef.uniforms.uTime.value = clock.elapsedTime;
    materialRef.uniforms.uHover.value = hovered ? 1.0 : 0.0;
    materialRef.uniforms.uSettled.value = settled ? 1.0 : 0.0;
  });

  return <primitive object={materialRef} attach="material" />;
}
export default HoverDiceOutline;
