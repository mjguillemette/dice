import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  LIGHT_CONFIG,
  HELL_LIGHTS,
  TIME_OF_DAY_CONFIG
} from "../../constants/gameConfig";
import { type TimeOfDay } from "../../systems/gameStateSystem";

interface LightingRigProps {
  hellFactor: number;
  timeOfDay: TimeOfDay;
  timeProgress: number; // 0-1 progress toward next time period
}

export function LightingRig({
  hellFactor,
  timeOfDay,
  timeProgress
}: LightingRigProps) {
  // Main lights
  const ceilingLightRef = useRef<THREE.PointLight>(null);
  const windowLightRef = useRef<THREE.DirectionalLight>(null);
  const deskLampLightRef = useRef<THREE.PointLight>(null);
  const tvLightRef = useRef<THREE.PointLight>(null);
  const corner1LightRef = useRef<THREE.PointLight>(null);
  const corner2LightRef = useRef<THREE.PointLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  // Hell lights
  const hellLight1Ref = useRef<THREE.PointLight>(null);
  const hellLight2Ref = useRef<THREE.PointLight>(null);
  const hellLight3Ref = useRef<THREE.PointLight>(null);
  const hellLight4Ref = useRef<THREE.PointLight>(null);
  const hellLight5Ref = useRef<THREE.PointLight>(null);

  // Helper function to get time-of-day config with smooth transitions
  const getTimeConfig = (
    time: TimeOfDay,
    nextTime: TimeOfDay,
    progress: number
  ) => {
    const current = TIME_OF_DAY_CONFIG[time];
    const next = TIME_OF_DAY_CONFIG[nextTime];

    // Smooth lerp function for colors
    const lerpColor = (color1: number, color2: number, t: number): number => {
      const c1 = new THREE.Color(color1);
      const c2 = new THREE.Color(color2);
      return c1.lerp(c2, t).getHex();
    };

    // Smooth lerp for numbers
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

    return {
      fogColor: lerpColor(current.fogColor, next.fogColor, progress),
      ambientColor: lerpColor(
        current.ambientColor,
        next.ambientColor,
        progress
      ),
      ambientIntensity: lerp(
        current.ambientIntensity,
        next.ambientIntensity,
        progress
      ),
      windowColor: lerpColor(current.windowColor, next.windowColor, progress),
      windowIntensity: lerp(
        current.windowIntensity,
        next.windowIntensity,
        progress
      ),
      ceilingIntensity: lerp(
        current.ceilingIntensity,
        next.ceilingIntensity,
        progress
      ),
      ceilingColor: lerpColor(current.ceilingColor, next.ceilingColor, progress)
    };
  };

  // Determine next time period for smooth transitions
  const getNextTimePeriod = (current: TimeOfDay): TimeOfDay => {
    if (current === "morning") return "midday";
    if (current === "midday") return "night";
    return "morning";
  };

  // Update lights based on corruption level and time of day
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Get interpolated time-of-day configuration
    const nextTime = getNextTimePeriod(timeOfDay);
    const timeConfig = getTimeConfig(timeOfDay, nextTime, timeProgress);

    // Ambient light: blend time of day with corruption
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(timeConfig.ambientColor);
      ambientLightRef.current.intensity =
        timeConfig.ambientIntensity * (1.0 - hellFactor * 0.5);
    }

    // Ceiling light: blend time-of-day color with corruption
    if (ceilingLightRef.current) {
      const normalCeilingColor = new THREE.Color(timeConfig.ceilingColor);
      const hellCeilingColor = new THREE.Color(LIGHT_CONFIG.ceiling.hellColor);
      ceilingLightRef.current.color.lerpColors(
        normalCeilingColor,
        hellCeilingColor,
        hellFactor
      );
      ceilingLightRef.current.intensity =
        timeConfig.ceilingIntensity - hellFactor * 0.5;
    }

    // Window light: blend time-of-day with corruption
    if (windowLightRef.current) {
      const normalWindowColor = new THREE.Color(timeConfig.windowColor);
      const hellWindowColor = new THREE.Color(LIGHT_CONFIG.window.hellColor);
      windowLightRef.current.color.lerpColors(
        normalWindowColor,
        hellWindowColor,
        hellFactor
      );
      windowLightRef.current.intensity =
        timeConfig.windowIntensity * (1.0 - hellFactor * 0.8);
    }

    // Desk lamp: warm cream -> hellfire orange
    if (deskLampLightRef.current) {
      deskLampLightRef.current.color.lerpColors(
        new THREE.Color(LIGHT_CONFIG.deskLamp.color),
        new THREE.Color(LIGHT_CONFIG.deskLamp.hellColor),
        hellFactor
      );
      deskLampLightRef.current.intensity =
        LIGHT_CONFIG.deskLamp.intensity + hellFactor * 0.4;
    }

    // TV screen: bright blue -> blood red
    if (tvLightRef.current) {
      tvLightRef.current.color.lerpColors(
        new THREE.Color(LIGHT_CONFIG.tv.color),
        new THREE.Color(LIGHT_CONFIG.tv.hellColor),
        hellFactor
      );
      tvLightRef.current.intensity =
        LIGHT_CONFIG.tv.intensity + hellFactor * 0.6;
    }

    // Corner lights dim and turn red
    const cornerColor = new THREE.Color().lerpColors(
      new THREE.Color(LIGHT_CONFIG.corner1.color),
      new THREE.Color(LIGHT_CONFIG.corner1.hellColor),
      hellFactor
    );

    if (corner1LightRef.current) {
      corner1LightRef.current.color.copy(cornerColor);
      corner1LightRef.current.intensity =
        LIGHT_CONFIG.corner1.intensity * (1.0 - hellFactor * 0.5);
    }

    if (corner2LightRef.current) {
      corner2LightRef.current.color.copy(cornerColor);
      corner2LightRef.current.intensity =
        LIGHT_CONFIG.corner2.intensity * (1.0 - hellFactor * 0.5);
    }

    // Hell lights fade in progressively with pulsing effect
    const pulse = Math.sin(time * 2.3) * Math.cos(time * 1.7) * 0.5 + 0.5;
    const hellIntensity = hellFactor * 0.8;

    [
      hellLight1Ref,
      hellLight2Ref,
      hellLight3Ref,
      hellLight4Ref,
      hellLight5Ref
    ].forEach((lightRef, _index) => {
      if (lightRef.current) {
        lightRef.current.intensity = hellIntensity * (0.8 + pulse * 0.4);
      }
    });
  });

  return (
    <>
      {/* Ambient light */}
      <ambientLight
        ref={ambientLightRef}
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
