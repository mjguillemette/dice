import {
  useState,
  useCallback,
  useEffect
  /* removed useMemo */
} from "react";
import { useSpring, a, config as springConfig } from "@react-spring/three";
import { audioManager, type SoundCategory } from "../../../systems/audioSystem";
import {
  getDeviceOrientationConfig,
  updateDeviceOrientationConfig
} from "../../../systems/deviceOrientationControls";
import { useUISound } from "../../../systems/audioSystem";
// Import config getters and updaters directly
import {
  getPhysicsConfig,
  getActivePreset,
  updatePhysicsConfig,
  resetPhysics,
  applyPreset
} from "../../../config/physics.config";
import {
  updateCollisionBoundsOffset,
  COLLISION_BOUNDS_OFFSET,
  updateReceptacleDimensions,
  RECEPTACLE_DIMENSIONS
} from "../../../constants/receptacleConfig";
import {
  getShowDiceTrayBounds,
  setShowDiceTrayBounds
} from "../../../config/devState";
import type { GamePhase } from "../../../systems/gameStateSystem";
import { Stats } from "@react-three/drei";

// Import 3D UI Components
import { Menu3D } from "./Menu3D";
import { Slider3D } from "./Slider3D";
import { Toggle3D } from "./Toggle3D";
import { Text3D } from "./Text3D";
import { Button3D } from "./Button3D";
import { StatBar3D } from "./StatBar3D"; // Corrected import name

interface CombinedMenu3DProps {
  cameraName: string;
  cinematicMode: boolean;
  hellFactor: number;
  diceScore: number;
  timeOfDay: "morning" | "midday" | "night";
  daysMarked: number;
  successfulRolls: number;
  currentAttempts: number;
  gamePhase: GamePhase;
  isMobile: boolean;
  onRecenterGyro?: () => void;
  onClose: () => void;
  visible?: boolean;
  [key: string]: any;
}

const rowY = (baseY: number, rowIndex: number, spacing = 0.15) =>
  baseY - rowIndex * spacing;

export function CombinedMenu3D({
  cameraName,
  cinematicMode,
  hellFactor,
  diceScore,
  timeOfDay,
  daysMarked,
  successfulRolls,
  currentAttempts,
  gamePhase,
  isMobile,
  onRecenterGyro,
  onClose,
  visible = true,
  ...props
}: CombinedMenu3DProps) {
  const { playClick } = useUISound();

  // --- State Management ---
  const [isMenuVisible, setIsMenuVisible] = useState(visible);
  useEffect(() => {
    setIsMenuVisible(visible);
  }, [visible]);

  // Toggle with 'O' or 'M' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "o" || e.key === "O") {
        setIsMenuVisible((v) => !v);
      } else if (e.key === "m" || e.key === "M") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Audio State
  const audioState = audioManager.getState();
  const [masterVolume, setMasterVolume] = useState(audioState.masterVolume);
  const [sfxVolume, setSfxVolume] = useState(audioState.categoryVolumes.sfx);
  const [uiVolume, setUiVolume] = useState(audioState.categoryVolumes.ui);
  const [ambientVolume, setAmbientVolume] = useState(
    audioState.categoryVolumes.ambient
  );
  const [musicVolume, setMusicVolume] = useState(
    audioState.categoryVolumes.music
  );
  const [muted, setMuted] = useState(audioState.muted);

  // Mobile State
  const [sensitivity, setSensitivity] = useState(
    getDeviceOrientationConfig().sensitivity
  );
  const [smoothing, setSmoothing] = useState(
    getDeviceOrientationConfig().smoothing
  );
  const [invertX, setInvertX] = useState(getDeviceOrientationConfig().invertX);
  const [invertY, setInvertY] = useState(getDeviceOrientationConfig().invertY);

  // Dev State
  const [showBoundsDebug, setShowBoundsDebug] = useState(
    getShowDiceTrayBounds()
  );
  const [showStats, setShowStats] = useState(false);
  const [, forceUpdate] = useState({});

  // --- Read external configs directly --- NO useMemo
  const physics = getPhysicsConfig();
  const activePreset = getActivePreset();
  const collisionOffsets = COLLISION_BOUNDS_OFFSET;
  const receptacleDimensions = RECEPTACLE_DIMENSIONS;

  // Sync internal state with external periodically
  useEffect(() => {
    if (!isMenuVisible) return;
    const interval = setInterval(() => {
      const config = getDeviceOrientationConfig(); // Read once
      if (sensitivity !== config.sensitivity)
        setSensitivity(config.sensitivity);
      if (smoothing !== config.smoothing) setSmoothing(config.smoothing);
      if (invertX !== config.invertX) setInvertX(config.invertX);
      if (invertY !== config.invertY) setInvertY(config.invertY);

      const bounds = getShowDiceTrayBounds();
      if (showBoundsDebug !== bounds) setShowBoundsDebug(bounds);

      forceUpdate({}); // Still trigger re-render to pick up direct config reads
    }, 200);
    return () => clearInterval(interval);
  }, [
    isMenuVisible,
    sensitivity,
    smoothing,
    invertX,
    invertY,
    showBoundsDebug
  ]); // Include dependencies

  // --- Callbacks ---
  const handleMasterVolumeChange = useCallback((value: number) => {
    setMasterVolume(value);
    audioManager.setMasterVolume(value);
  }, []);
  const handleCategoryVolumeChange = useCallback(
    (category: SoundCategory, value: number) => {
      audioManager.setCategoryVolume(category, value);
      switch (category) {
        case "sfx":
          setSfxVolume(value);
          break;
        case "ui":
          setUiVolume(value);
          break;
        case "ambient":
          setAmbientVolume(value);
          break;
        case "music":
          setMusicVolume(value);
          break;
      }
    },
    []
  );
  const handleMuteToggle = useCallback(
    (newValue: boolean) => {
      setMuted(newValue);
      audioManager.setMuted(newValue);
      playClick();
    },
    [playClick]
  );
  const handleSensitivityChange = useCallback((value: number) => {
    setSensitivity(value);
    updateDeviceOrientationConfig({ sensitivity: value });
  }, []);
  const handleSmoothingChange = useCallback((value: number) => {
    setSmoothing(value);
    updateDeviceOrientationConfig({ smoothing: value });
  }, []);
  const handleInvertXToggle = useCallback(
    (newValue: boolean) => {
      setInvertX(newValue);
      updateDeviceOrientationConfig({ invertX: newValue });
      playClick();
    },
    [playClick]
  );
  const handleInvertYToggle = useCallback(
    (newValue: boolean) => {
      setInvertY(newValue);
      updateDeviceOrientationConfig({ invertY: newValue });
      playClick();
    },
    [playClick]
  );
  const handleRecenter = useCallback(() => {
    playClick();
    onRecenterGyro?.();
  }, [playClick, onRecenterGyro]);
  const handleBoundsDebugToggle = useCallback(
    (newValue: boolean) => {
      setShowBoundsDebug(newValue);
      setShowDiceTrayBounds(newValue);
      playClick();
    },
    [playClick]
  );
  const handleApplyPreset = useCallback(
    (preset: "gentle" | "normal" | "aggressive" | "slowMotion") => {
      applyPreset(preset);
      forceUpdate({});
      playClick();
    },
    [playClick]
  );
  const handleResetPhysics = useCallback(() => {
    resetPhysics();
    forceUpdate({});
    playClick();
  }, [playClick]);
  const handleShowStatsToggle = useCallback(
    (newValue: boolean) => {
      setShowStats(newValue);
      playClick();
    },
    [playClick]
  );
  // --- UPDATED Updaters to include forceUpdate ---
  const handleUpdatePhysics = useCallback(
    (config: Partial<ReturnType<typeof getPhysicsConfig>>) => {
      updatePhysicsConfig(config);
      forceUpdate({});
    },
    []
  );
  const handleUpdateCollision = useCallback(
    (config: Partial<typeof collisionOffsets>) => {
      updateCollisionBoundsOffset(config);
      forceUpdate({});
    },
    []
  );
  const handleUpdateReceptacle = useCallback(
    (config: Partial<typeof receptacleDimensions>) => {
      updateReceptacleDimensions(config);
      forceUpdate({});
    },
    []
  );
  const handleClose = useCallback(() => {
    playClick();
    onClose();
  }, [playClick, onClose]);

  // --- Layout ---
  const menuWidth = 3.0;
  const menuHeight = 2.2;
  const contentWidth = menuWidth - 0.2;
  const baseY = menuHeight / 2 - 0.2;
  const sliderWidth = 1.4;
  const labelWidth = contentWidth - sliderWidth - 0.1;

  // --- Menu Animation (Slide in/out) ---
  const menuSpring = useSpring({
    scale: isMenuVisible ? 1 : 0,
    position: isMenuVisible
      ? [0, 0, 0]
      : [0, -0.5, 0],
    config: springConfig.stiff
  });

  // --- Tab Definitions ---
  const tabs = [
    // Options Tab
    {
      label: "Options",
      content: (
        <group position={[0, 0, 0.01]}>
          {/* Audio Section */}
          <Text3D
            position={[-contentWidth / 2 + 0.1, baseY + 0.05, 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🔊 Audio
          </Text3D>
          <group position={[0, rowY(baseY, 1), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Master:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${Math.round(masterVolume * 100)}%`}</Text3D>
            <Slider3D
              value={masterVolume}
              onChange={handleMasterVolumeChange}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 2), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              SFX:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${Math.round(sfxVolume * 100)}%`}</Text3D>
            <Slider3D
              value={sfxVolume}
              onChange={(v) => handleCategoryVolumeChange("sfx", v)}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 3), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              UI:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${Math.round(uiVolume * 100)}%`}</Text3D>
            <Slider3D
              value={uiVolume}
              onChange={(v) => handleCategoryVolumeChange("ui", v)}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 4), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Ambient:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${Math.round(ambientVolume * 100)}%`}</Text3D>
            <Slider3D
              value={ambientVolume}
              onChange={(v) => handleCategoryVolumeChange("ambient", v)}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Music:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${Math.round(musicVolume * 100)}%`}</Text3D>
            <Slider3D
              value={musicVolume}
              onChange={(v) => handleCategoryVolumeChange("music", v)}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 6.2), 0]}>
            <Text3D position={[-0.15, 0, 0]} anchorX="right" fontSize={0.07}>
              Mute All:
            </Text3D>
            <Toggle3D
              value={muted}
              onChange={handleMuteToggle}
              position={[0, 0, 0]}
            />
            <Text3D position={[0.15, 0, 0]} anchorX="left" fontSize={0.06}>
              {muted ? "MUTED" : "ON"}
            </Text3D>
          </group>

          {/* Mobile Section */}
          {isMobile && (
            <>
              <Text3D
                position={[-contentWidth / 2 + 0.1, rowY(baseY, 7.5), 0]}
                anchorX="left"
                fontSize={0.08}
                color="#AAAAAA"
              >
                📱 Mobile Controls
              </Text3D>
              <group position={[0, rowY(baseY, 8.5), 0]}>
                <Text3D
                  position={[-contentWidth / 2, 0, 0]}
                  anchorX="left"
                  fontSize={0.07}
                >
                  Gyro Sens:
                </Text3D>
                <Text3D
                  position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
                  anchorX="left"
                  fontSize={0.06}
                >{`${sensitivity.toFixed(1)}x`}</Text3D>
                <Slider3D
                  value={sensitivity}
                  onChange={handleSensitivityChange}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  width={sliderWidth}
                  position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
                />
              </group>
              <group position={[0, rowY(baseY, 9.5), 0]}>
                <Text3D
                  position={[-contentWidth / 2, 0, 0]}
                  anchorX="left"
                  fontSize={0.07}
                >
                  Smoothing:
                </Text3D>
                <Text3D
                  position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
                  anchorX="left"
                  fontSize={0.06}
                >{`${Math.round(smoothing * 100)}%`}</Text3D>
                <Slider3D
                  value={smoothing}
                  onChange={handleSmoothingChange}
                  min={0}
                  max={1}
                  step={0.05}
                  width={sliderWidth}
                  position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
                />
              </group>
              <group position={[-contentWidth / 4, rowY(baseY, 10.5), 0]}>
                <Text3D
                  position={[-0.15, 0, 0]}
                  anchorX="right"
                  fontSize={0.07}
                >
                  Invert X:
                </Text3D>
                <Toggle3D
                  value={invertX}
                  onChange={handleInvertXToggle}
                  position={[0, 0, 0]}
                  size={0.08}
                />
                <Text3D position={[0.15, 0, 0]} anchorX="left" fontSize={0.06}>
                  {invertX ? "ON" : "OFF"}
                </Text3D>
              </group>
              <group position={[contentWidth / 4, rowY(baseY, 10.5), 0]}>
                <Text3D
                  position={[-0.15, 0, 0]}
                  anchorX="right"
                  fontSize={0.07}
                >
                  Invert Y:
                </Text3D>
                <Toggle3D
                  value={invertY}
                  onChange={handleInvertYToggle}
                  position={[0, 0, 0]}
                  size={0.08}
                />
                <Text3D position={[0.15, 0, 0]} anchorX="left" fontSize={0.06}>
                  {invertY ? "ON" : "OFF"}
                </Text3D>
              </group>
              <Button3D
                label="Recenter View"
                onClick={handleRecenter}
                width={1.0}
                height={0.2}
                position={[0, rowY(baseY, 11.8), 0]}
              />
            </>
          )}
        </group>
      )
    },
    // Status Tab
    {
      label: "Status",
      content: (
        <group position={[0, 0, 0.01]}>
          <Text3D
            position={[-contentWidth / 2 + 0.1, baseY + 0.05, 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            📊 Game State
          </Text3D>
          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 1), 0]}
            anchorX="left"
            fontSize={0.07}
          >
            Phase:
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 1), 0]}
            anchorX="right"
            fontSize={0.07}
            color="#00FFDD"
          >
            {gamePhase.toUpperCase()}
          </Text3D>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 2), 0]}
            anchorX="left"
            fontSize={0.07}
          >
            Time:
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 2), 0]}
            anchorX="right"
            fontSize={0.07}
          >
            {timeOfDay.toUpperCase()}
          </Text3D>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 3), 0]}
            anchorX="left"
            fontSize={0.07}
          >
            Day:
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 3), 0]}
            anchorX="right"
            fontSize={0.07}
          >
            {daysMarked}
          </Text3D>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 4), 0]}
            anchorX="left"
            fontSize={0.07}
          >
            Roll Progress:
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 4), 0]}
            anchorX="right"
            fontSize={0.07}
          >{`${successfulRolls % 3} / 3`}</Text3D>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 5), 0]}
            anchorX="left"
            fontSize={0.07}
          >
            Attempts:
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 5), 0]}
            anchorX="right"
            fontSize={0.07}
          >{`${currentAttempts} / 2`}</Text3D>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 6.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🎥 Camera
          </Text3D>
          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 7.5), 0]}
            anchorX="left"
            fontSize={0.07}
          >
            Mode:
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 7.5), 0]}
            anchorX="right"
            fontSize={0.07}
          >
            {cinematicMode ? "CINEMATIC" : "FREE CAM"}
          </Text3D>
          {cinematicMode && (
            <>
              <Text3D
                position={[-contentWidth / 2 + 0.1, rowY(baseY, 8.5), 0]}
                anchorX="left"
                fontSize={0.07}
              >
                Angle:
              </Text3D>
              <Text3D
                position={[contentWidth / 2 - 0.1, rowY(baseY, 8.5), 0]}
                anchorX="right"
                fontSize={0.07}
              >
                {cameraName}
              </Text3D>
            </>
          )}

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 10), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🔥 Corruption
          </Text3D>
          <StatBar3D
            value={hellFactor}
            max={1}
            width={contentWidth - 0.2}
            height={0.05}
            color="#FF4D6D"
            position={[0, rowY(baseY, 11), 0]}
          />
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 11.5), 0]}
            anchorX="right"
            fontSize={0.07}
          >{`${(hellFactor * 100).toFixed(1)}%`}</Text3D>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 12.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🎲 Last Score
          </Text3D>
          <Text3D
            position={[contentWidth / 2 - 0.1, rowY(baseY, 12.5), 0]}
            anchorX="right"
            fontSize={0.12}
          >
            {diceScore || "—"}
          </Text3D>
        </group>
      )
    },
    // Physics Tab
    {
      label: "Physics",
      content: (
        <group position={[0, 0, 0.01]}>
          <Text3D
            position={[-contentWidth / 2 + 0.1, baseY + 0.05, 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            ⚙️ Physics Presets
          </Text3D>
          <Text3D
            position={[0, rowY(baseY, 1), 0]}
            anchorX="center"
            fontSize={0.07}
          >{`Active: ${activePreset?.toUpperCase() ?? "CUSTOM"}`}</Text3D>
          <group position={[0, rowY(baseY, 2.2), 0]}>
            <Button3D
              label="Gentle"
              onClick={() => handleApplyPreset("gentle")}
              width={0.5}
              height={0.15}
              position={[-0.9, 0, 0]}
              color={activePreset === "gentle" ? "#0074D9" : "#555"}
            />
            <Button3D
              label="Normal"
              onClick={() => handleApplyPreset("normal")}
              width={0.5}
              height={0.15}
              position={[-0.3, 0, 0]}
              color={activePreset === "normal" ? "#0074D9" : "#555"}
            />
            <Button3D
              label="Aggro"
              onClick={() => handleApplyPreset("aggressive")}
              width={0.5}
              height={0.15}
              position={[0.3, 0, 0]}
              color={activePreset === "aggressive" ? "#0074D9" : "#555"}
            />
            <Button3D
              label="SlowMo"
              onClick={() => handleApplyPreset("slowMotion")}
              width={0.5}
              height={0.15}
              position={[0.9, 0, 0]}
              color={activePreset === "slowMotion" ? "#0074D9" : "#555"}
            />
          </group>
          <Button3D
            label="Reset Physics"
            onClick={handleResetPhysics}
            width={1.0}
            height={0.18}
            position={[0, rowY(baseY, 3.5), 0]}
          />

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 4.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            💨 Throw Force
          </Text3D>
          <group position={[0, rowY(baseY, 5.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Base Power:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.basePower.toFixed(1)}`}</Text3D>
            <Slider3D
              value={physics.basePower}
              onChange={(v) => handleUpdatePhysics({ basePower: v })}
              min={0.5}
              max={5.0}
              step={0.1}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 6.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Distance Mult:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.distanceMultiplier.toFixed(2)}`}</Text3D>
            <Slider3D
              value={physics.distanceMultiplier}
              onChange={(v) => handleUpdatePhysics({ distanceMultiplier: v })}
              min={0.1}
              max={1.0}
              step={0.05}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 7.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Power Variation:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.powerVariation.toFixed(2)}`}</Text3D>
            <Slider3D
              value={physics.powerVariation}
              onChange={(v) => handleUpdatePhysics({ powerVariation: v })}
              min={0}
              max={1.0}
              step={0.05}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 8.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🏹 Lob Arc
          </Text3D>
          <group position={[0, rowY(baseY, 9.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Upward Vel:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.baseUpwardVelocity.toFixed(1)}`}</Text3D>
            <Slider3D
              value={physics.baseUpwardVelocity}
              onChange={(v) => handleUpdatePhysics({ baseUpwardVelocity: v })}
              min={-3.0}
              max={0}
              step={0.1}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 10.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Arc Boost Mult:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.arcBoostMultiplier.toFixed(2)}`}</Text3D>
            <Slider3D
              value={physics.arcBoostMultiplier}
              onChange={(v) => handleUpdatePhysics({ arcBoostMultiplier: v })}
              min={0}
              max={1.0}
              step={0.05}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 11.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Max Arc Boost:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.maxArcBoost.toFixed(1)}`}</Text3D>
            <Slider3D
              value={physics.maxArcBoost}
              onChange={(v) => handleUpdatePhysics({ maxArcBoost: v })}
              min={0}
              max={2.0}
              step={0.1}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 12.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🔄 Tumbling
          </Text3D>
          <group position={[0, rowY(baseY, 13.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Angular Vel:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${physics.angularVelocity.toFixed(0)}`}</Text3D>
            <Slider3D
              value={physics.angularVelocity}
              onChange={(v) => handleUpdatePhysics({ angularVelocity: v })}
              min={0}
              max={30}
              step={1}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
        </group>
      )
    },
    // Collision Tab
    {
      label: "Collision",
      content: (
        <group position={[0, 0, 0.01]}>
          <Text3D
            position={[-contentWidth / 2 + 0.1, baseY + 0.05, 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            👁️ Debug
          </Text3D>
          <group position={[0, rowY(baseY, 1), 0]}>
            <Text3D position={[-0.3, 0, 0]} anchorX="right" fontSize={0.07}>
              Show Bounds:
            </Text3D>
            <Toggle3D
              value={showBoundsDebug}
              onChange={handleBoundsDebugToggle}
              position={[0, 0, 0]}
              size={0.08}
            />
            <Text3D position={[0.3, 0, 0]} anchorX="left" fontSize={0.06}>
              {showBoundsDebug ? "ON" : "OFF"}
            </Text3D>
          </group>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 2.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            📦 Base Dimensions
          </Text3D>
          <group position={[0, rowY(baseY, 3.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Width (X):
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${receptacleDimensions.width.toFixed(2)}m`}</Text3D>
            <Slider3D
              value={receptacleDimensions.width}
              onChange={(v) => handleUpdateReceptacle({ width: v })}
              min={0.5}
              max={1.5}
              step={0.01}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 4.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Depth (Z):
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${receptacleDimensions.depth.toFixed(2)}m`}</Text3D>
            <Slider3D
              value={receptacleDimensions.depth}
              onChange={(v) => handleUpdateReceptacle({ depth: v })}
              min={0.2}
              max={0.8}
              step={0.01}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 6), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            ↔️ Edge Offsets
          </Text3D>
          <group position={[0, rowY(baseY, 7), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Left (minX):
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${collisionOffsets.minX.toFixed(2)}m`}</Text3D>
            <Slider3D
              value={collisionOffsets.minX}
              onChange={(v) => handleUpdateCollision({ minX: v })}
              min={-0.2}
              max={0.2}
              step={0.01}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 8), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Right (maxX):
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${collisionOffsets.maxX.toFixed(2)}m`}</Text3D>
            <Slider3D
              value={collisionOffsets.maxX}
              onChange={(v) => handleUpdateCollision({ maxX: v })}
              min={-0.2}
              max={0.2}
              step={0.01}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 9), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Front (minZ):
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${collisionOffsets.minZ.toFixed(2)}m`}</Text3D>
            <Slider3D
              value={collisionOffsets.minZ}
              onChange={(v) => handleUpdateCollision({ minZ: v })}
              min={-0.2}
              max={0.2}
              step={0.01}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 10), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Back (maxZ):
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${collisionOffsets.maxZ.toFixed(2)}m`}</Text3D>
            <Slider3D
              value={collisionOffsets.maxZ}
              onChange={(v) => handleUpdateCollision({ maxZ: v })}
              min={-0.2}
              max={0.2}
              step={0.01}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>

          <Text3D
            position={[-contentWidth / 2 + 0.1, rowY(baseY, 11.5), 0]}
            anchorX="left"
            fontSize={0.08}
            color="#AAAAAA"
          >
            🧱 Wall/Floor
          </Text3D>
          <group position={[0, rowY(baseY, 12.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Wall Height:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${collisionOffsets.wallHeight.toFixed(3)}m`}</Text3D>
            <Slider3D
              value={collisionOffsets.wallHeight}
              onChange={(v) => handleUpdateCollision({ wallHeight: v })}
              min={-0.05}
              max={0.1}
              step={0.005}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
          <group position={[0, rowY(baseY, 13.5), 0]}>
            <Text3D
              position={[-contentWidth / 2, 0, 0]}
              anchorX="left"
              fontSize={0.07}
            >
              Floor Depth:
            </Text3D>
            <Text3D
              position={[labelWidth - contentWidth / 2 + 0.05, 0, 0]}
              anchorX="left"
              fontSize={0.06}
            >{`${collisionOffsets.depth.toFixed(3)}m`}</Text3D>
            <Slider3D
              value={collisionOffsets.depth}
              onChange={(v) => handleUpdateCollision({ depth: v })}
              min={-0.05}
              max={0.05}
              step={0.005}
              width={sliderWidth}
              position={[contentWidth / 2 - sliderWidth / 2, 0, 0]}
            />
          </group>
        </group>
      )
    },
    // Performance Tab
    {
      label: "Perf",
      content: (
        <group position={[0, 0, 0.01]}>
          <Text3D
            position={[0, baseY + 0.05, 0]}
            anchorX="center"
            fontSize={0.08}
            color="#AAAAAA"
          >
            📈 Performance
          </Text3D>
          <group position={[0, rowY(baseY, 1), 0]}>
            <Text3D position={[-0.3, 0, 0]} anchorX="right" fontSize={0.07}>
              Show Stats:
            </Text3D>
            <Toggle3D
              value={showStats}
              onChange={handleShowStatsToggle}
              position={[0, 0, 0]}
              size={0.08}
            />
            <Text3D position={[0.3, 0, 0]} anchorX="left" fontSize={0.06}>
              {showStats ? "ON" : "OFF"}
            </Text3D>
          </group>
          <Text3D
            fontSize={0.06}
            color="#DDDDDD"
            maxWidth={contentWidth - 0.2}
            textAlign="center"
            anchorX="center"
            anchorY="top"
            position={[0, rowY(baseY, 2.5), 0]}
          >
            Real-time performance metrics (FPS, ms, Mem) are shown via the
            toggle above.
          </Text3D>
        </group>
      )
    }
  ];

  const statsElement =
    isMenuVisible && showStats ? (
      <group
        position={[
          (props.position?.[0] ?? 0) - 1.5,
          (props.position?.[1] ?? 0) + 1.0,
          props.position?.[2] ?? 0
        ]}
      >
        <Stats showPanel={0} className="stats-panel-3d" />
      </group>
    ) : null;

  return (
    <>
      <a.group {...props} scale={menuSpring.scale} position={menuSpring.position as any}>
        <Menu3D tabs={tabs} width={menuWidth} height={menuHeight} />
        <Button3D
          label="Close (O/M)"
          onClick={handleClose}
          width={1.0} // Wider close button
          height={0.2}
          position={[0, -menuHeight / 2 - 0.15, 0]} // Position below the menu
          color="#AA0000"
          hoverColor="#DD0000"
        />
      </a.group>
      {statsElement}
    </>
  );
}
