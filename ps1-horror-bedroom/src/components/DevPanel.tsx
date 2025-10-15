import { useState } from 'react';
import { useInput } from '../systems/inputSystem';
import { type GamePhase } from '../systems/gameStateSystem';

interface DevPanelProps {
  cameraName: string;
  cinematicMode: boolean;
  hellFactor: number;
  autoCorruption: boolean;
  diceCount: number;
  coinCount: number;
  d3Count: number;
  d4Count: number;
  thumbTackCount: number;
  diceScore: number;
  diceShaderEnabled: boolean;
  towerCardEnabled: boolean;
  sunCardEnabled: boolean;
  diceOnTowerCard: number[];
  diceOnSunCard: number[];
  showCardDebugBounds: boolean;
  spotlightHeight: number;
  spotlightIntensity: number;
  spotlightAngle: number;
  timeOfDay: 'morning' | 'midday' | 'night';
  daysMarked: number;
  successfulRolls: number;
  currentAttempts: number;
  gamePhase: GamePhase;
  onDiceCountChange: (count: number) => void;
  onCoinCountChange: (count: number) => void;
  onD3CountChange: (count: number) => void;
  onD4CountChange: (count: number) => void;
  onThumbTackCountChange: (count: number) => void;
  onDiceShaderToggle: () => void;
  onTowerCardToggle: () => void;
  onSunCardToggle: () => void;
  onCardDebugToggle: () => void;
  onSpotlightHeightChange: (height: number) => void;
  onSpotlightIntensityChange: (intensity: number) => void;
  onSpotlightAngleChange: (angle: number) => void;
  onTestSuccessfulRoll?: () => void;
}

export function DevPanel({ cameraName, cinematicMode, hellFactor, autoCorruption, diceCount, coinCount, d3Count, d4Count, thumbTackCount, diceScore, diceShaderEnabled, towerCardEnabled, sunCardEnabled, diceOnTowerCard, diceOnSunCard, showCardDebugBounds, spotlightHeight, spotlightIntensity, spotlightAngle, timeOfDay, daysMarked, successfulRolls, currentAttempts, gamePhase, onDiceCountChange, onCoinCountChange, onD3CountChange, onD4CountChange, onThumbTackCountChange, onDiceShaderToggle, onTowerCardToggle, onSunCardToggle, onCardDebugToggle, onSpotlightHeightChange, onSpotlightIntensityChange, onSpotlightAngleChange, onTestSuccessfulRoll }: DevPanelProps) {
  const [visible, setVisible] = useState(true);

  useInput({
    onToggleUI: () => setVisible((prev) => !prev),
  });


  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#00ff00',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontFamily: 'Consolas, Monaco, monospace',
        border: '2px solid #00ff00',
        minWidth: '350px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
      }}
    >
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '15px',
        borderBottom: '2px solid #00ff00',
        paddingBottom: '10px',
        letterSpacing: '2px'
      }}>
        🎮  DEV PANEL
      </div>

      {/* Status Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          STATUS
        </div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ color: '#888' }}>Camera Mode:</span>{' '}
            <span style={{ color: cinematicMode ? '#00aaff' : '#ff6600' }}>
              {cinematicMode ? 'CINEMATIC' : 'FREE CAM'}
            </span>
          </div>
          {cinematicMode && (
            <div style={{ marginBottom: '5px' }}>
              <span style={{ color: '#888' }}>Current Angle:</span>{' '}
              <span style={{ color: '#ffcc00' }}>{cameraName}</span>
            </div>
          )}
          <div style={{ marginBottom: '5px' }}>
            <span style={{ color: '#888' }}>Corruption:</span>{' '}
            <span style={{
              color: hellFactor < 0.3 ? '#00ff00' : hellFactor < 0.6 ? '#ffcc00' : '#ff0000'
            }}>
              {(hellFactor * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ marginBottom: '5px' }}>
            <span style={{ color: '#888' }}>Auto-Corruption:</span>{' '}
            <span style={{ color: autoCorruption ? '#00ff00' : '#ff0000' }}>
              {autoCorruption ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Time Passage Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          TIME PASSAGE
        </div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Game Phase:</span>{' '}
            <span style={{
              color: gamePhase === 'idle' ? '#666' :
                     gamePhase === 'throwing' ? '#ff9900' :
                     gamePhase === 'settled' ? '#ffcc00' : '#00aaff',
              fontWeight: 'bold',
              fontSize: '11px'
            }}>
              {gamePhase.toUpperCase()}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Time of Day:</span>{' '}
            <span style={{
              color: timeOfDay === 'morning' ? '#ffcc00' : timeOfDay === 'midday' ? '#ff9900' : '#6666ff',
              fontWeight: 'bold'
            }}>
              {timeOfDay.toUpperCase()}
            </span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Calendar Day:</span>{' '}
            <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
              {daysMarked}
            </span>
            <span style={{ color: '#666', fontSize: '11px' }}> / 31</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Roll Progress:</span>{' '}
            <span style={{
              color: (successfulRolls % 3) >= 2 ? '#00ff00' : '#ffcc00',
              fontWeight: 'bold'
            }}>
              {successfulRolls % 3}
            </span>
            <span style={{ color: '#666' }}> / 3</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Round Attempts:</span>{' '}
            <span style={{
              color: currentAttempts >= 2 ? '#ff0000' : currentAttempts >= 1 ? '#ffcc00' : '#00ff00',
              fontWeight: 'bold'
            }}>
              {currentAttempts}
            </span>
            <span style={{ color: '#666' }}> / 2</span>
          </div>
          {onTestSuccessfulRoll && (
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={onTestSuccessfulRoll}
                style={{
                  background: '#1a4d1a',
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  width: '100%',
                }}
              >
                🧪 TEST: Trigger Successful Roll
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          CONTROLS
        </div>
        <div style={{ paddingLeft: '10px' }}>
          <KeyBinding keyLabel="H" description="Toggle this panel" />
          <KeyBinding keyLabel="C" description="Toggle camera mode" />
          {cinematicMode && (
            <KeyBinding keyLabel="N" description="Next camera angle" />
          )}
          {!cinematicMode && (
            <>
              <KeyBinding keyLabel="W/A/S/D" description="Move camera" />
              <KeyBinding keyLabel="Mouse" description="Look around" />
            </>
          )}
          <KeyBinding keyLabel="Q" description="Decrease corruption" />
          <KeyBinding keyLabel="E" description="Increase corruption" />
          <KeyBinding keyLabel="T" description="Toggle auto-corruption" />
        </div>
      </div>

      {/* Throwables Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          THROWABLES
        </div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <span style={{ color: '#00ff00' }}>Cinematic:</span>{' '}
            <span style={{ color: '#888' }}>Click to throw</span>
          </div>
          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <span style={{ color: '#ff6600' }}>Free Cam:</span>{' '}
            <span style={{ color: '#888' }}>Click where you're looking</span>
          </div>

          <ObjectCounter label="D6 Dice" count={diceCount} onChange={onDiceCountChange} />
          <ObjectCounter label="Coins" count={coinCount} onChange={onCoinCountChange} />
          <ObjectCounter label="D3 Dice" count={d3Count} onChange={onD3CountChange} />
          <ObjectCounter label="D4 Dice" count={d4Count} onChange={onD4CountChange} />
          <ObjectCounter label="Thumb Tacks" count={thumbTackCount} onChange={onThumbTackCountChange} />

          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>Last Score:</span>{' '}
            <span style={{
              color: diceScore > 0 ? '#00ff00' : '#666',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {diceScore || '-'}
            </span>
          </div>
          <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#888', marginRight: '10px' }}>Pulse Shader:</span>
            <button
              onClick={onDiceShaderToggle}
              style={{
                background: diceShaderEnabled ? '#1a4d1a' : '#1a1a1a',
                border: `1px solid ${diceShaderEnabled ? '#00ff00' : '#666'}`,
                color: diceShaderEnabled ? '#00ff00' : '#666',
                padding: '4px 12px',
                cursor: 'pointer',
                borderRadius: '3px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {diceShaderEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Receptacle Items Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          RECEPTACLE ITEMS
        </div>
        <div style={{ paddingLeft: '10px' }}>
          {/* Tower Card */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#888', fontSize: '12px' }}>Tower Card:</span>
            <button
              onClick={onTowerCardToggle}
              style={{
                background: towerCardEnabled ? '#1a4d1a' : '#1a1a1a',
                border: `1px solid ${towerCardEnabled ? '#00ff00' : '#666'}`,
                color: towerCardEnabled ? '#00ff00' : '#666',
                padding: '4px 12px',
                cursor: 'pointer',
                borderRadius: '3px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {towerCardEnabled ? 'PLACED' : 'REMOVED'}
            </button>
          </div>
          {towerCardEnabled && (
            <div style={{ marginLeft: '10px', marginBottom: '8px' }}>
              <span style={{ color: '#888', fontSize: '11px' }}>Dice on Tower:</span>{' '}
              <span style={{
                color: diceOnTowerCard.length > 0 ? '#0066ff' : '#666',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {diceOnTowerCard.length > 0 ? diceOnTowerCard.length : 'None'}
              </span>
            </div>
          )}

          {/* Sun Card */}
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#888', fontSize: '12px' }}>Sun Card:</span>
            <button
              onClick={onSunCardToggle}
              style={{
                background: sunCardEnabled ? '#1a4d1a' : '#1a1a1a',
                border: `1px solid ${sunCardEnabled ? '#00ff00' : '#666'}`,
                color: sunCardEnabled ? '#00ff00' : '#666',
                padding: '4px 12px',
                cursor: 'pointer',
                borderRadius: '3px',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {sunCardEnabled ? 'PLACED' : 'REMOVED'}
            </button>
          </div>
          {sunCardEnabled && (
            <div style={{ marginLeft: '10px', marginBottom: '8px' }}>
              <span style={{ color: '#888', fontSize: '11px' }}>Dice on Sun:</span>{' '}
              <span style={{
                color: diceOnSunCard.length > 0 ? '#0066ff' : '#666',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {diceOnSunCard.length > 0 ? diceOnSunCard.length : 'None'}
              </span>
            </div>
          )}

          {/* Debug Bounds Toggle - show when either card is enabled */}
          {(towerCardEnabled || sunCardEnabled) && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#888', fontSize: '11px' }}>Debug Bounds:</span>
              <button
                onClick={onCardDebugToggle}
                style={{
                  background: showCardDebugBounds ? '#4d1a1a' : '#1a1a1a',
                  border: `1px solid ${showCardDebugBounds ? '#ffcc00' : '#666'}`,
                  color: showCardDebugBounds ? '#ffcc00' : '#666',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
              >
                {showCardDebugBounds ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spotlight Settings Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          SPOTLIGHT SETTINGS
        </div>
        <div style={{ paddingLeft: '10px' }}>
          <SliderControl
            label="Height"
            value={spotlightHeight}
            min={0.1}
            max={2.0}
            step={0.1}
            onChange={onSpotlightHeightChange}
            unit="m"
          />
          <SliderControl
            label="Intensity"
            value={spotlightIntensity}
            min={0.0}
            max={5.0}
            step={0.1}
            onChange={onSpotlightIntensityChange}
            unit=""
          />
          <SliderControl
            label="Angle"
            value={spotlightAngle}
            min={Math.PI / 12}
            max={Math.PI / 3}
            step={Math.PI / 36}
            onChange={onSpotlightAngleChange}
            unit="°"
            displayValue={(v) => Math.round((v * 180) / Math.PI)}
          />
        </div>
      </div>

      {/* Corruption Stages */}
      <div>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '8px',
          letterSpacing: '1px'
        }}>
          CORRUPTION STAGES
        </div>
        <div style={{ paddingLeft: '10px', fontSize: '12px' }}>
          <Stage
            name="DUST"
            range="0-30%"
            active={hellFactor >= 0 && hellFactor < 0.3}
          />
          <Stage
            name="GRIME"
            range="20-50%"
            active={hellFactor >= 0.2 && hellFactor < 0.5}
          />
          <Stage
            name="RUST"
            range="40-70%"
            active={hellFactor >= 0.4 && hellFactor < 0.7}
          />
          <Stage
            name="BLOOD"
            range="60-90%"
            active={hellFactor >= 0.6 && hellFactor < 0.9}
          />
          <Stage
            name="PULSE"
            range="80-100%"
            active={hellFactor >= 0.8}
          />
        </div>
      </div>

      {/* Corruption Bar */}
      <div style={{ marginTop: '15px' }}>
        <div style={{
          width: '100%',
          height: '8px',
          background: '#1a1a1a',
          border: '1px solid #00ff00',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div
            style={{
              height: '100%',
              width: `${hellFactor * 100}%`,
              background: `linear-gradient(to right,
                #00ff00 0%,
                #ffcc00 30%,
                #ff6600 60%,
                #ff0000 100%)`,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #333',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center'
      }}>
        Press H to hide/show • React Three Fiber
      </div>
    </div>
  );
}

function ObjectCounter({ label, count, onChange }: { label: string; count: number; onChange: (count: number) => void }) {
  return (
    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: '#888', fontSize: '12px', minWidth: '90px' }}>{label}:</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => onChange(Math.max(0, count - 1))}
          style={{
            background: '#1a1a1a',
            border: '1px solid #00ff00',
            color: '#00ff00',
            padding: '2px 6px',
            cursor: 'pointer',
            borderRadius: '3px',
            fontSize: '11px',
          }}
        >
          -
        </button>
        <span style={{ color: count > 0 ? '#00ff00' : '#666', minWidth: '25px', textAlign: 'center', margin: '0 6px', fontSize: '12px' }}>
          {count}
        </span>
        <button
          onClick={() => onChange(Math.min(10, count + 1))}
          style={{
            background: '#1a1a1a',
            border: '1px solid #00ff00',
            color: '#00ff00',
            padding: '2px 6px',
            cursor: 'pointer',
            borderRadius: '3px',
            fontSize: '11px',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function KeyBinding({ keyLabel, description }: { keyLabel: string; description: string }) {
  return (
    <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
      <span style={{
        background: '#1a1a1a',
        border: '1px solid #00ff00',
        borderRadius: '3px',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '70px',
        display: 'inline-block',
        textAlign: 'center',
        marginRight: '10px',
      }}>
        {keyLabel}
      </span>
      <span style={{ color: '#aaa', fontSize: '12px' }}>{description}</span>
    </div>
  );
}

function Stage({ name, range, active }: { name: string; range: string; active: boolean }) {
  return (
    <div style={{
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      opacity: active ? 1 : 0.5,
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: active ? '#ff0000' : '#333',
        border: active ? '2px solid #ff0000' : '2px solid #555',
        marginRight: '8px',
        boxShadow: active ? '0 0 8px #ff0000' : 'none',
      }} />
      <span style={{
        fontWeight: active ? 'bold' : 'normal',
        color: active ? '#fff' : '#666',
        marginRight: '10px',
        minWidth: '60px',
      }}>
        {name}
      </span>
      <span style={{ color: '#555', fontSize: '11px' }}>{range}</span>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
  displayValue
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit: string;
  displayValue?: (value: number) => number;
}) {
  const displayVal = displayValue ? displayValue(value) : value.toFixed(1);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: '#888', fontSize: '11px' }}>{label}:</span>
        <span style={{ color: '#00ff00', fontSize: '11px', fontWeight: 'bold' }}>
          {displayVal}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#00ff00',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

export default DevPanel;
