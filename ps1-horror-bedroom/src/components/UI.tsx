import { useState, useEffect } from 'react';
import { useInput } from '../systems/inputSystem';

interface UIProps {
  cameraName: string;
  cinematicMode: boolean;
  hellFactor: number;
}

export function UI({ cameraName, cinematicMode, hellFactor }: UIProps) {
  const [visible, setVisible] = useState(false);

  useInput({
    onToggleUI: () => setVisible((prev) => !prev),
  });

  return (
    <>
      {/* Info Panel */}
      <div
        id="info"
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        C to toggle cinematic/free camera
        <br />
        {!cinematicMode && (
          <>
            Mouse to look around | WASD to move
            <br />
          </>
        )}
        {cinematicMode && (
          <>
            N for next camera angle
            <br />
          </>
        )}
        Q/E manual corruption | T auto-corruption
        <br />
        {cinematicMode && (
          <span style={{ color: '#ffcc00', marginTop: '5px', display: 'block' }}>
            {cameraName}
          </span>
        )}
      </div>

      {/* Hell Meter */}
      <div
        id="hellMeter"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div>CORRUPTION LEVEL</div>
        <div
          id="hellBar"
          style={{
            width: '200px',
            height: '20px',
            background: '#333',
            border: '2px solid #666',
            marginTop: '5px',
          }}
        >
          <div
            id="hellFill"
            style={{
              height: '100%',
              background: 'linear-gradient(to right, #4169e1, #ff0000)',
              width: `${hellFactor * 100}%`,
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
    </>
  );
}

export default UI;
