import './Crosshair.css';

/**
 * Crosshair Component
 *
 * A simple centered crosshair for first-person aiming.
 */
export function Crosshair() {
  return (
    <div className="crosshair">
      <div className="crosshair-horizontal"></div>
      <div className="crosshair-vertical"></div>
      <div className="crosshair-dot"></div>
    </div>
  );
}

export default Crosshair;
