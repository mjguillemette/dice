import { useState, useCallback } from "react";
import { audioManager, type SoundCategory } from "../../systems/audioSystem";
import { getDeviceOrientationConfig, updateDeviceOrientationConfig } from "../../systems/deviceOrientationControls";
import { useUISound } from "../../systems/audioSystem";
import "./OptionsMenu.css";

interface OptionsMenuProps {
  onClose: () => void;
  isMobile: boolean;
  onRecenterGyro?: () => void;
}

export function OptionsMenu({ onClose, isMobile, onRecenterGyro }: OptionsMenuProps) {
  const { playClick, playHover } = useUISound();

  // Audio state
  const audioState = audioManager.getState();
  const [masterVolume, setMasterVolume] = useState(audioState.masterVolume);
  const [sfxVolume, setSfxVolume] = useState(audioState.categoryVolumes.sfx);
  const [uiVolume, setUiVolume] = useState(audioState.categoryVolumes.ui);
  const [ambientVolume, setAmbientVolume] = useState(audioState.categoryVolumes.ambient);
  const [musicVolume, setMusicVolume] = useState(audioState.categoryVolumes.music);
  const [muted, setMuted] = useState(audioState.muted);

  // Mobile settings state
  const gyroConfig = getDeviceOrientationConfig();
  const [sensitivity, setSensitivity] = useState(gyroConfig.sensitivity);
  const [smoothing, setSmoothing] = useState(gyroConfig.smoothing);

  // Handle volume changes
  const handleMasterVolumeChange = useCallback((value: number) => {
    setMasterVolume(value);
    audioManager.setMasterVolume(value);
  }, []);

  const handleCategoryVolumeChange = useCallback((category: SoundCategory, value: number) => {
    audioManager.setCategoryVolume(category, value);

    switch (category) {
      case 'sfx':
        setSfxVolume(value);
        break;
      case 'ui':
        setUiVolume(value);
        break;
      case 'ambient':
        setAmbientVolume(value);
        break;
      case 'music':
        setMusicVolume(value);
        break;
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    audioManager.setMuted(newMuted);
  }, [muted]);

  // Handle mobile settings changes
  const handleSensitivityChange = useCallback((value: number) => {
    setSensitivity(value);
    updateDeviceOrientationConfig({ sensitivity: value });
  }, []);

  const handleSmoothingChange = useCallback((value: number) => {
    setSmoothing(value);
    updateDeviceOrientationConfig({ smoothing: value });
  }, []);

  const handleRecenter = useCallback(() => {
    playClick();
    onRecenterGyro?.();
  }, [playClick, onRecenterGyro]);

  const handleClose = useCallback(() => {
    playClick();
    onClose();
  }, [playClick, onClose]);

  return (
    <div className="options-menu-overlay">
      <div className="options-menu">
        <div className="options-header">
          <h2>OPTIONS</h2>
          <button
            className="close-btn"
            onClick={handleClose}
            onMouseEnter={() => playHover()}
          >
            ✕
          </button>
        </div>

        <div className="options-content">
          {/* Audio Settings */}
          <section className="options-section">
            <h3 className="section-title">
              <span className="section-icon">🔊</span>
              Audio
            </h3>

            <div className="option-row">
              <label className="option-label">
                Master Volume
                <span className="option-value">{Math.round(masterVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="volume-slider"
                onMouseEnter={() => playHover()}
              />
            </div>

            <div className="option-row">
              <label className="option-label">
                Sound Effects
                <span className="option-value">{Math.round(sfxVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxVolume}
                onChange={(e) => handleCategoryVolumeChange('sfx', parseFloat(e.target.value))}
                className="volume-slider"
                onMouseEnter={() => playHover()}
              />
            </div>

            <div className="option-row">
              <label className="option-label">
                UI Sounds
                <span className="option-value">{Math.round(uiVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={uiVolume}
                onChange={(e) => handleCategoryVolumeChange('ui', parseFloat(e.target.value))}
                className="volume-slider"
                onMouseEnter={() => playHover()}
              />
            </div>

            <div className="option-row">
              <label className="option-label">
                Ambient
                <span className="option-value">{Math.round(ambientVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambientVolume}
                onChange={(e) => handleCategoryVolumeChange('ambient', parseFloat(e.target.value))}
                className="volume-slider"
                onMouseEnter={() => playHover()}
              />
            </div>

            <div className="option-row">
              <label className="option-label">
                Music
                <span className="option-value">{Math.round(musicVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={(e) => handleCategoryVolumeChange('music', parseFloat(e.target.value))}
                className="volume-slider"
                onMouseEnter={() => playHover()}
              />
            </div>

            <div className="option-row">
              <button
                className={`mute-button ${muted ? 'muted' : ''}`}
                onClick={handleMuteToggle}
                onMouseEnter={() => playHover()}
              >
                {muted ? '🔇 Unmute' : '🔊 Mute All'}
              </button>
            </div>
          </section>

          {/* Mobile Settings */}
          {isMobile && (
            <section className="options-section">
              <h3 className="section-title">
                <span className="section-icon">📱</span>
                Mobile Controls
              </h3>

              <div className="option-row">
                <label className="option-label">
                  Gyro Sensitivity
                  <span className="option-value">{sensitivity.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                  className="volume-slider"
                  onMouseEnter={() => playHover()}
                />
              </div>

              <div className="option-row">
                <label className="option-label">
                  Camera Smoothing
                  <span className="option-value">{Math.round(smoothing * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={smoothing}
                  onChange={(e) => handleSmoothingChange(parseFloat(e.target.value))}
                  className="volume-slider"
                  onMouseEnter={() => playHover()}
                />
              </div>

              <div className="option-row">
                <button
                  className="recenter-button"
                  onClick={handleRecenter}
                  onMouseEnter={() => playHover()}
                >
                  🎯 Recenter View
                </button>
              </div>

              <div className="option-hint">
                <p>
                  💡 Use the gyroscope to look around by tilting your device.
                  If the view feels off-center, tap "Recenter View" while looking straight ahead.
                </p>
              </div>
            </section>
          )}
        </div>

        <div className="options-footer">
          <button
            className="done-button"
            onClick={handleClose}
            onMouseEnter={() => playHover()}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default OptionsMenu;
