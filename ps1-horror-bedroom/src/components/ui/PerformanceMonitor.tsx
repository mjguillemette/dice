import { useState, useEffect } from 'react';

interface PerformanceStats {
  fps: number;
  frameTime: number;
  memoryUsed: number;
}

/**
 * Performance Monitor - Pure React component (no R3F hooks)
 * Tracks FPS and memory using browser APIs only
 */
export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.67,
    memoryUsed: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let lastFrameTime = lastTime;
    const frameTimes: number[] = [];

    const measureFrame = () => {
      const now = performance.now();
      const frameTime = now - lastFrameTime;
      lastFrameTime = now;

      frameTimes.push(frameTime);
      if (frameTimes.length > 60) {
        frameTimes.shift();
      }

      frameCount++;

      // Update stats every second
      if (now >= lastTime + 1000) {
        const avgFrameTime =
          frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;

        setStats({
          fps: frameCount,
          frameTime: avgFrameTime,
          memoryUsed: (performance as any).memory?.usedJSHeapSize
            ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
            : 0
        });

        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measureFrame);
    };

    const rafId = requestAnimationFrame(measureFrame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Get performance rating
  const getPerformanceRating = () => {
    if (stats.fps >= 58) return { color: '#4CAF50', label: 'Excellent' };
    if (stats.fps >= 45) return { color: '#FFC107', label: 'Good' };
    if (stats.fps >= 30) return { color: '#FF9800', label: 'Fair' };
    return { color: '#F44336', label: 'Poor' };
  };

  const rating = getPerformanceRating();

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4c4b0',
        backgroundColor: 'rgba(26, 20, 16, 0.95)',
        padding: '12px',
        borderRadius: '4px',
        border: '1px solid #4a3828'
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          fontSize: '14px',
          color: rating.color
        }}
      >
        ⚡ Performance: {rating.label}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
        <div style={{ color: '#8a7a6a' }}>FPS:</div>
        <div
          style={{
            fontWeight: 'bold',
            color: rating.color
          }}
        >
          {stats.fps}
        </div>

        <div style={{ color: '#8a7a6a' }}>Frame Time:</div>
        <div>{stats.frameTime.toFixed(2)} ms</div>

        {stats.memoryUsed > 0 && (
          <>
            <div style={{ color: '#8a7a6a' }}>Memory:</div>
            <div>{stats.memoryUsed} MB</div>
          </>
        )}
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: 'rgba(74, 56, 40, 0.3)',
          borderRadius: '3px',
          fontSize: '10px',
          color: '#a89884'
        }}
      >
        <div>
          <strong>Target:</strong> 60 FPS (16.67ms)
        </div>
        <div style={{ marginTop: '4px', fontSize: '9px' }}>
          Note: For detailed WebGL metrics (draw calls, triangles),
          use browser DevTools Performance tab.
        </div>
      </div>
    </div>
  );
}

export default PerformanceMonitor;
