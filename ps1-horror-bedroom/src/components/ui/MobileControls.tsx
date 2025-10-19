import { isMobileDevice } from "../../utils/mobileDetection";
import "./GameHUD.css";

interface MobileControlsProps {
  onRecenterGyro?: () => void;
  hasGyroPermission?: boolean;
}

export function MobileControls({
  onRecenterGyro,
  hasGyroPermission = false
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
    </div>
  );
}

export default MobileControls;
