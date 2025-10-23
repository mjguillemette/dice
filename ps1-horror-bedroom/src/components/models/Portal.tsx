import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const portalVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const portalFragmentShader = `
// Description: GLSL 2D simplex noise function by Ian McEwan, Ashima Arts.
// License: Distributed under the MIT License.
// https://github.com/stegu/webgl-noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

varying vec2 vUv;
uniform float uTime;
uniform float uProgress;

void main() {
    vec2 uv = vUv - 0.5;
    float radius = length(uv);
    float angle = atan(uv.y, uv.x);
    float portalRadius = 0.5 * uProgress;

    if (radius > portalRadius) {
        discard;
    }

    float swirlAmount = (1.0 - smoothstep(0.0, portalRadius, radius)) * 3.0;
    float distortedAngle = angle + swirlAmount - uTime * 1.5;
    vec2 distortedUv = vec2(cos(distortedAngle), sin(distortedAngle)) * radius;

    float noise = 0.0;
    noise += snoise(distortedUv * 5.0 + uTime * 0.2) * 0.5;
    noise += snoise(distortedUv * 10.0 - uTime * 0.3) * 0.25;
    noise += snoise(distortedUv * 20.0 + uTime * 0.1) * 0.125;
    noise = (noise + 1.0) / 2.0;

    vec3 colorDeepSpace = vec3(0.0, 0.0, 0.1);
    vec3 colorNebula = vec3(0.5, 0.2, 0.8);
    vec3 colorStars = vec3(1.0, 0.9, 1.0);

    vec3 finalColor = mix(colorDeepSpace, colorNebula, smoothstep(0.2, 0.6, noise));
    finalColor = mix(finalColor, colorStars, smoothstep(0.8, 0.9, noise));

    float rimIntensity = uProgress * (1.0 - uProgress) * 4.0;
    float rim = smoothstep(portalRadius - 0.02, portalRadius, radius);
    finalColor += rim * rimIntensity * colorStars;

    // Reduced the center fade from 0.3 to 0.1 to make the portal appear fuller.
    float centerFade = smoothstep(0.0, portalRadius * 0.1, radius);
    finalColor *= centerFade;

    finalColor *= smoothstep(0.0, 0.1, uProgress);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export function Portal({
  progress,
  position,
  scale = 1
}: {
  progress: number;
  position: [number, number, number];
  scale?: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();

      // FIX: Re-introduce a frame-rate independent lerp for visual smoothing.
      // This will smooth the already-animated 'progress' prop,
      // creating a polished look without the original lag bug.
      const lerpFactor = 1.0 - Math.exp(-delta * 15); // Adjust '15' for tightness
      materialRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uProgress.value,
        progress,
        lerpFactor
      );
    }
  });

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <circleGeometry args={[0.5, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={portalVertexShader}
        fragmentShader={portalFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 }
        }}
        transparent={true}
      />
    </mesh>
  );
}
