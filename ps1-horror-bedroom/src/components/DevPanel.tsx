import { useState, useEffect } from "react";
import { useInput } from "../systems/inputSystem";
import { type GamePhase } from "../systems/gameStateSystem";
import {
  getPhysicsConfig,
  getActivePreset,
  updatePhysicsConfig,
  resetPhysics,
  applyPreset
} from "../config/physics.config";
import { updateCollisionBoundsOffset, COLLISION_BOUNDS_OFFSET, updateReceptacleDimensions, RECEPTACLE_DIMENSIONS } from "../constants/receptacleConfig";
import { getShowDiceTrayBounds, setShowDiceTrayBounds } from "../config/devState";
import "./DevPanel.css";

interface DevPanelProps {
  cameraName: string;
  cinematicMode: boolean;
  hellFactor: number;
  diceScore: number;
  timeOfDay: "morning" | "midday" | "night";
  daysMarked: number;
  successfulRolls: number;
  currentAttempts: number;
  gamePhase: GamePhase;
  onCinematicModeToggle?: () => void;
}

export function DevPanel({
  cameraName,
  cinematicMode,
  hellFactor,
  diceScore,
  timeOfDay,
  daysMarked,
  successfulRolls,
  currentAttempts,
  gamePhase,
  onCinematicModeToggle
}: DevPanelProps) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "physics" | "collision">("status");
  const [showBoundsDebug, setShowBoundsDebug] = useState(getShowDiceTrayBounds());
  const [, forceUpdate] = useState({});

  // Force re-render every 100ms when dev panel is visible to sync with global configs
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => clearInterval(interval);
  }, [visible]);

  // Sync local state with global state
  const handleBoundsDebugToggle = () => {
    const newValue = !showBoundsDebug;
    setShowBoundsDebug(newValue);
    setShowDiceTrayBounds(newValue);
  };

  useInput({
    onToggleUI: () => setVisible((prev) => !prev)
  });

  if (!visible) return null;

  const physics = getPhysicsConfig();
  const activePreset = getActivePreset();

  return (
    <div className="dev-panel">
      <div className="dev-panel-header">
        <h2>DEVELOPER TOOLS</h2>
        <button className="dev-panel-close" onClick={() => setVisible(false)}>×</button>
      </div>

      {/* Tab Navigation */}
      <div className="dev-panel-tabs">
        <button
          className={`dev-tab ${activeTab === "status" ? "active" : ""}`}
          onClick={() => setActiveTab("status")}
        >
          Status
        </button>
        <button
          className={`dev-tab ${activeTab === "physics" ? "active" : ""}`}
          onClick={() => setActiveTab("physics")}
        >
          Physics
        </button>
        <button
          className={`dev-tab ${activeTab === "collision" ? "active" : ""}`}
          onClick={() => setActiveTab("collision")}
        >
          Collision
        </button>
      </div>

      <div className="dev-panel-content">
        {/* STATUS TAB */}
        {activeTab === "status" && (
          <div className="dev-section">
            <div className="dev-group">
              <h3>Game State</h3>
              <div className="dev-stat">
                <span className="dev-label">Phase:</span>
                <span className="dev-value highlight">{gamePhase.toUpperCase()}</span>
              </div>
              <div className="dev-stat">
                <span className="dev-label">Time:</span>
                <span className="dev-value">{timeOfDay.toUpperCase()}</span>
              </div>
              <div className="dev-stat">
                <span className="dev-label">Day:</span>
                <span className="dev-value">{daysMarked}</span>
              </div>
              <div className="dev-stat">
                <span className="dev-label">Roll Progress:</span>
                <span className="dev-value">{successfulRolls % 3} / 3</span>
              </div>
              <div className="dev-stat">
                <span className="dev-label">Attempts:</span>
                <span className="dev-value">{currentAttempts} / 2</span>
              </div>
            </div>

            <div className="dev-group">
              <h3>Camera</h3>
              <div className="dev-stat">
                <span className="dev-label">Mode:</span>
                <span className="dev-value">{cinematicMode ? "CINEMATIC" : "FREE CAM"}</span>
              </div>
              {cinematicMode && (
                <div className="dev-stat">
                  <span className="dev-label">Angle:</span>
                  <span className="dev-value">{cameraName}</span>
                </div>
              )}
              <button className="dev-button" onClick={onCinematicModeToggle}>
                Toggle Camera Mode (C)
              </button>
            </div>

            <div className="dev-group">
              <h3>Corruption</h3>
              <div className="corruption-bar-container">
                <div
                  className="corruption-bar-fill"
                  style={{ width: `${hellFactor * 100}%` }}
                />
              </div>
              <div className="dev-stat">
                <span className="dev-label">Level:</span>
                <span className="dev-value">{(hellFactor * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="dev-group">
              <h3>Last Score</h3>
              <div className="dev-score">{diceScore || "—"}</div>
            </div>
          </div>
        )}

        {/* PHYSICS TAB */}
        {activeTab === "physics" && (
          <div className="dev-section">
            <div className="dev-group">
              <h3>Quick Presets</h3>
              {activePreset && (
                <div className="dev-stat" style={{ marginBottom: "12px" }}>
                  <span className="dev-label">Active:</span>
                  <span className="dev-value highlight">{activePreset.toUpperCase()}</span>
                </div>
              )}
              <div className="dev-preset-buttons">
                <button
                  className={`dev-button small ${activePreset === "gentle" ? "active" : ""}`}
                  onClick={() => applyPreset("gentle")}
                >
                  Gentle
                </button>
                <button
                  className={`dev-button small ${activePreset === "normal" ? "active" : ""}`}
                  onClick={() => applyPreset("normal")}
                >
                  Normal
                </button>
                <button
                  className={`dev-button small ${activePreset === "aggressive" ? "active" : ""}`}
                  onClick={() => applyPreset("aggressive")}
                >
                  Aggressive
                </button>
                <button
                  className={`dev-button small ${activePreset === "slowMotion" ? "active" : ""}`}
                  onClick={() => applyPreset("slowMotion")}
                >
                  Slow-Mo
                </button>
              </div>
              <button className="dev-button" onClick={resetPhysics}>
                Reset to Default
              </button>
            </div>

            <div className="dev-group">
              <h3>Throw Force</h3>
              <Slider
                label="Base Power"
                value={physics.basePower}
                min={0.5}
                max={5.0}
                step={0.1}
                onChange={(v) => updatePhysicsConfig({ basePower: v })}
              />
              <Slider
                label="Distance Multiplier"
                value={physics.distanceMultiplier}
                min={0.1}
                max={1.0}
                step={0.05}
                onChange={(v) => updatePhysicsConfig({ distanceMultiplier: v })}
              />
              <Slider
                label="Power Variation"
                value={physics.powerVariation}
                min={0}
                max={1.0}
                step={0.05}
                onChange={(v) => updatePhysicsConfig({ powerVariation: v })}
              />
            </div>

            <div className="dev-group">
              <h3>Lob Arc</h3>
              <Slider
                label="Upward Velocity"
                value={physics.baseUpwardVelocity}
                min={-3.0}
                max={0}
                step={0.1}
                onChange={(v) => updatePhysicsConfig({ baseUpwardVelocity: v })}
              />
              <Slider
                label="Arc Boost Multiplier"
                value={physics.arcBoostMultiplier}
                min={0}
                max={1.0}
                step={0.05}
                onChange={(v) => updatePhysicsConfig({ arcBoostMultiplier: v })}
              />
              <Slider
                label="Max Arc Boost"
                value={physics.maxArcBoost}
                min={0}
                max={2.0}
                step={0.1}
                onChange={(v) => updatePhysicsConfig({ maxArcBoost: v })}
              />
            </div>

            <div className="dev-group">
              <h3>Tumbling</h3>
              <Slider
                label="Angular Velocity"
                value={physics.angularVelocity}
                min={0}
                max={30}
                step={1}
                onChange={(v) => updatePhysicsConfig({ angularVelocity: v })}
              />
            </div>
          </div>
        )}

        {/* COLLISION TAB */}
        {activeTab === "collision" && (
          <div className="dev-section">
            <div className="dev-group">
              <h3>Debug Visualization</h3>
              <div className="dev-stat">
                <span className="dev-label">Show Bounds:</span>
                <button
                  className={`dev-button small ${showBoundsDebug ? "active" : ""}`}
                  onClick={handleBoundsDebugToggle}
                  style={{ marginTop: 0, marginBottom: "16px" }}
                >
                  {showBoundsDebug ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            <div className="dev-group">
              <h3>Base Dimensions</h3>
              <p className="dev-help">
                Adjust the overall size of the dice tray collision area.
              </p>

              <Slider
                label="Width (X)"
                value={RECEPTACLE_DIMENSIONS.width}
                min={0.5}
                max={1.5}
                step={0.01}
                onChange={(v) => updateReceptacleDimensions({ width: v })}
                unit="m"
              />
              <Slider
                label="Depth (Z)"
                value={RECEPTACLE_DIMENSIONS.depth}
                min={0.2}
                max={0.8}
                step={0.01}
                onChange={(v) => updateReceptacleDimensions({ depth: v })}
                unit="m"
              />
            </div>

            <div className="dev-group">
              <h3>Edge Offsets</h3>
              <p className="dev-help">
                Fine-tune individual edges.<br/>
                Negative values shrink, positive values expand.
              </p>

              <Slider
                label="Left Edge (minX)"
                value={COLLISION_BOUNDS_OFFSET.minX}
                min={-0.2}
                max={0.2}
                step={0.01}
                onChange={(v) => updateCollisionBoundsOffset({ minX: v })}
                unit="m"
              />
              <Slider
                label="Right Edge (maxX)"
                value={COLLISION_BOUNDS_OFFSET.maxX}
                min={-0.2}
                max={0.2}
                step={0.01}
                onChange={(v) => updateCollisionBoundsOffset({ maxX: v })}
                unit="m"
              />
              <Slider
                label="Front Edge (minZ)"
                value={COLLISION_BOUNDS_OFFSET.minZ}
                min={-0.2}
                max={0.2}
                step={0.01}
                onChange={(v) => updateCollisionBoundsOffset({ minZ: v })}
                unit="m"
              />
              <Slider
                label="Back Edge (maxZ)"
                value={COLLISION_BOUNDS_OFFSET.maxZ}
                min={-0.2}
                max={0.2}
                step={0.01}
                onChange={(v) => updateCollisionBoundsOffset({ maxZ: v })}
                unit="m"
              />
            </div>

            <div className="dev-group">
              <h3>Wall Settings</h3>
              <Slider
                label="Wall Height"
                value={COLLISION_BOUNDS_OFFSET.wallHeight}
                min={-0.05}
                max={0.1}
                step={0.005}
                onChange={(v) => updateCollisionBoundsOffset({ wallHeight: v })}
                unit="m"
              />
              <Slider
                label="Floor Depth"
                value={COLLISION_BOUNDS_OFFSET.depth}
                min={-0.05}
                max={0.05}
                step={0.005}
                onChange={(v) => updateCollisionBoundsOffset({ depth: v })}
                unit="m"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="dev-panel-footer">
        Press <kbd>H</kbd> to toggle dev panel
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = ""
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}) {
  return (
    <div className="dev-slider">
      <div className="dev-slider-header">
        <span className="dev-slider-label">{label}</span>
        <span className="dev-slider-value">
          {value.toFixed(step < 0.1 ? 2 : 1)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="dev-slider-input"
      />
    </div>
  );
}

export default DevPanel;
