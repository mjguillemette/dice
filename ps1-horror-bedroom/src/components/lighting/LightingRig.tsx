import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LIGHT_CONFIG, HELL_LIGHTS } from '../../constants/gameConfig';

interface LightingRigProps {
  hellFactor: number;
}

export function LightingRig({ hellFactor }: LightingRigProps) {
  // Main lights
  const ceilingLightRef = useRef<THREE.PointLight>(null);
  const windowLightRef = useRef<THREE.DirectionalLight>(null);
  const deskLampLightRef = useRef<THREE.PointLight>(null);
  const tvLightRef = useRef<THREE.PointLight>(null);
  const corner1LightRef = useRef<THREE.PointLight>(null);
  const corner2LightRef = useRef<THREE.PointLight>(null);

  // Hell lights
  const hellLight1Ref = useRef<THREE.PointLight>(null);
  const hellLight2Ref = useRef<THREE.PointLight>(null);
  const hellLight3Ref = useRef<THREE.PointLight>(null);
  const hellLight4Ref = useRef<THREE.PointLight>(null);
  const hellLight5Ref = useRef<THREE.PointLight>(null);

  // Update lights based on corruption level
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Ceiling light: bright yellow -> intense red
    if (ceilingLightRef.current) {
      ceilingLightRef.current.color.lerpColors(
        new THREE.Color(LIGHT_CONFIG.ceiling.color),
        new THREE.Color(LIGHT_CONFIG.ceiling.hellColor),
        hellFactor
      );
      ceilingLightRef.current.intensity = LIGHT_CONFIG.ceiling.intensity - hellFactor * 0.5;
    }

    // Window light: bright blue -> dark blood red
    if (windowLightRef.current) {
      windowLightRef.current.color.lerpColors(
        new THREE.Color(LIGHT_CONFIG.window.color),
        new THREE.Color(LIGHT_CONFIG.window.hellColor),
        hellFactor
      );
      windowLightRef.current.intensity = LIGHT_CONFIG.window.intensity * (1.0 - hellFactor * 0.8);
    }

    // Desk lamp: warm cream -> hellfire orange
    if (deskLampLightRef.current) {
      deskLampLightRef.current.color.lerpColors(
        new THREE.Color(LIGHT_CONFIG.deskLamp.color),
        new THREE.Color(LIGHT_CONFIG.deskLamp.hellColor),
        hellFactor
      );
      deskLampLightRef.current.intensity = LIGHT_CONFIG.deskLamp.intensity + hellFactor * 0.4;
    }

    // TV screen: bright blue -> blood red
    if (tvLightRef.current) {
      tvLightRef.current.color.lerpColors(
        new THREE.Color(LIGHT_CONFIG.tv.color),
        new THREE.Color(LIGHT_CONFIG.tv.hellColor),
        hellFactor
      );
      tvLightRef.current.intensity = LIGHT_CONFIG.tv.intensity + hellFactor * 0.6;
    }

    // Corner lights dim and turn red
    const cornerColor = new THREE.Color().lerpColors(
      new THREE.Color(LIGHT_CONFIG.corner1.color),
      new THREE.Color(LIGHT_CONFIG.corner1.hellColor),
      hellFactor
    );

    if (corner1LightRef.current) {
      corner1LightRef.current.color.copy(cornerColor);
      corner1LightRef.current.intensity = LIGHT_CONFIG.corner1.intensity * (1.0 - hellFactor * 0.5);
    }

    if (corner2LightRef.current) {
      corner2LightRef.current.color.copy(cornerColor);
      corner2LightRef.current.intensity = LIGHT_CONFIG.corner2.intensity * (1.0 - hellFactor * 0.5);
    }

    // Hell lights fade in progressively with pulsing effect
    const pulse = Math.sin(time * 2.3) * Math.cos(time * 1.7) * 0.5 + 0.5;
    const hellIntensity = hellFactor * 0.8;

    [hellLight1Ref, hellLight2Ref, hellLight3Ref, hellLight4Ref, hellLight5Ref].forEach(
      (lightRef, index) => {
        if (lightRef.current) {
          lightRef.current.intensity = hellIntensity * (0.8 + pulse * 0.4);
        }
      }
    );
  });

  return (
    <>
      {/* Ambient light */}
      <ambientLight
        color={LIGHT_CONFIG.ambient.color}
        intensity={LIGHT_CONFIG.ambient.intensity}
      />

      {/* Main ceiling light (bedroom) */}
      <pointLight
        ref={ceilingLightRef}
        position={LIGHT_CONFIG.ceiling.position.toArray()}
        color={LIGHT_CONFIG.ceiling.color}
        intensity={LIGHT_CONFIG.ceiling.intensity}
        distance={LIGHT_CONFIG.ceiling.distance}
      />

      {/* Second room ceiling light */}
      <pointLight
        position={[0, 4.7, 10]}
        color={LIGHT_CONFIG.ceiling.color}
        intensity={LIGHT_CONFIG.ceiling.intensity}
        distance={LIGHT_CONFIG.ceiling.distance}
      />

      {/* Window light (sunlight) */}
      <directionalLight
        ref={windowLightRef}
        position={LIGHT_CONFIG.window.position.toArray()}
        color={LIGHT_CONFIG.window.color}
        intensity={LIGHT_CONFIG.window.intensity}
      />

      {/* Desk lamp light */}
      <pointLight
        ref={deskLampLightRef}
        position={LIGHT_CONFIG.deskLamp.position.toArray()}
        color={LIGHT_CONFIG.deskLamp.color}
        intensity={LIGHT_CONFIG.deskLamp.intensity}
        distance={LIGHT_CONFIG.deskLamp.distance}
      />

      {/* TV screen glow */}
      <pointLight
        ref={tvLightRef}
        position={LIGHT_CONFIG.tv.position.toArray()}
        color={LIGHT_CONFIG.tv.color}
        intensity={LIGHT_CONFIG.tv.intensity}
        distance={LIGHT_CONFIG.tv.distance}
      />

      {/* Corner accent lights */}
      <pointLight
        ref={corner1LightRef}
        position={LIGHT_CONFIG.corner1.position.toArray()}
        color={LIGHT_CONFIG.corner1.color}
        intensity={LIGHT_CONFIG.corner1.intensity}
        distance={LIGHT_CONFIG.corner1.distance}
      />

      <pointLight
        ref={corner2LightRef}
        position={LIGHT_CONFIG.corner2.position.toArray()}
        color={LIGHT_CONFIG.corner2.color}
        intensity={LIGHT_CONFIG.corner2.intensity}
        distance={LIGHT_CONFIG.corner2.distance}
      />

      {/* Hell ambient lights */}
      <pointLight
        ref={hellLight1Ref}
        position={HELL_LIGHTS[0].position.toArray()}
        color={HELL_LIGHTS[0].color}
        intensity={0}
        distance={HELL_LIGHTS[0].distance}
      />

      <pointLight
        ref={hellLight2Ref}
        position={HELL_LIGHTS[1].position.toArray()}
        color={HELL_LIGHTS[1].color}
        intensity={0}
        distance={HELL_LIGHTS[1].distance}
      />

      <pointLight
        ref={hellLight3Ref}
        position={HELL_LIGHTS[2].position.toArray()}
        color={HELL_LIGHTS[2].color}
        intensity={0}
        distance={HELL_LIGHTS[2].distance}
      />

      <pointLight
        ref={hellLight4Ref}
        position={HELL_LIGHTS[3].position.toArray()}
        color={HELL_LIGHTS[3].color}
        intensity={0}
        distance={HELL_LIGHTS[3].distance}
      />

      <pointLight
        ref={hellLight5Ref}
        position={HELL_LIGHTS[4].position.toArray()}
        color={HELL_LIGHTS[4].color}
        intensity={0}
        distance={HELL_LIGHTS[4].distance}
      />
    </>
  );
}

export default LightingRig;
