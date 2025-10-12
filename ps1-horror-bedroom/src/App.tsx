import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import DevPanel from './components/DevPanel';
import './App.css';

function App() {
  const [cameraName, setCameraName] = useState('Bedroom Overview');
  const [cinematicMode, setCinematicMode] = useState(true);
  const [hellFactor, setHellFactor] = useState(0);
  const [autoCorruption, setAutoCorruption] = useState(true);
  const [diceCount, setDiceCount] = useState(2);
  const [coinCount, setCoinCount] = useState(2);
  const [d3Count, setD3Count] = useState(2);
  const [d4Count, setD4Count] = useState(2);
  const [thumbTackCount, setThumbTackCount] = useState(2);
  const [diceScore, setDiceScore] = useState(0);
  const [diceShaderEnabled, setDiceShaderEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [diceOnCard, setDiceOnCard] = useState<number[]>([]);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.6, 5] }}
        gl={{ antialias: false }}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
        }}
      >
        <Scene
          onCameraNameChange={setCameraName}
          onCameraModeChange={setCinematicMode}
          onHellFactorChange={setHellFactor}
          onAutoCorruptionChange={setAutoCorruption}
          diceCount={diceCount}
          coinCount={coinCount}
          d3Count={d3Count}
          d4Count={d4Count}
          thumbTackCount={thumbTackCount}
          onDiceScoreChange={setDiceScore}
          diceShaderEnabled={diceShaderEnabled}
          cardEnabled={cardEnabled}
          onCardItemsChange={setDiceOnCard}
        />
      </Canvas>
      <DevPanel
        cameraName={cameraName}
        cinematicMode={cinematicMode}
        hellFactor={hellFactor}
        autoCorruption={autoCorruption}
        diceCount={diceCount}
        coinCount={coinCount}
        d3Count={d3Count}
        d4Count={d4Count}
        thumbTackCount={thumbTackCount}
        diceScore={diceScore}
        diceShaderEnabled={diceShaderEnabled}
        cardEnabled={cardEnabled}
        diceOnCard={diceOnCard}
        onDiceCountChange={setDiceCount}
        onCoinCountChange={setCoinCount}
        onD3CountChange={setD3Count}
        onD4CountChange={setD4Count}
        onThumbTackCountChange={setThumbTackCount}
        onDiceShaderToggle={() => setDiceShaderEnabled(!diceShaderEnabled)}
        onCardToggle={() => setCardEnabled(!cardEnabled)}
      />
    </div>
  );
}

export default App;
