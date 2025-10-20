import { isMobileDevice } from "../../utils/mobileDetection";
import "./GameHUD.css";

interface MobileControlsProps {
  onRecenterGyro?: () => void;
  hasGyroPermission?: boolean;
  onToggleDevPanel?: () => void;
}

export function MobileControls({
  onRecenterGyro,
  hasGyroPermission = false,
  onToggleDevPanel
}: MobileControlsProps) {
  const isMobile = isMobileDevice();

  if (!isMobile) return null;

  return (
    <div className="mobile-controls">
      {hasGyroPermission && onRecenterGyro && (
        <button
          className="mobile-control-btn gyro-btn"
          onClick={onRecenterGyro}
          title="Recenter gyro view"
        >
          🎯
        </button>
      )}
      {onToggleDevPanel && (
        <button
          className="mobile-control-btn dev-btn"
          onClick={onToggleDevPanel}
          title="Toggle dev tools"
        >
          🛠️
        </button>
      )}
    </div>
  );
}

export default MobileControls;
