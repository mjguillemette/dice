import { useEffect, useState } from 'react';
import './ScoreDisplay.css';

interface ScoreDisplayProps {
  currentScore: number;
  rollHistory: number[]; // Last 3 roll scores
  currentAttempt: number; // 1 or 2
  maxAttempts: number; // Usually 2
  isSettled: boolean; // Whether dice are settled
}

/**
 * ScoreDisplay Component
 *
 * A PS1 horror-themed score display showing:
 * - Current toss score (live updating)
 * - Last 3 completed roll scores
 * - Attempt counter
 */
export function ScoreDisplay({
  currentScore,
  rollHistory,
  currentAttempt,
  maxAttempts,
  isSettled
}: ScoreDisplayProps) {
  const [glitchActive, setGlitchActive] = useState(false);

  // Trigger glitch effect when score updates
  useEffect(() => {
    if (currentScore > 0) {
      setGlitchActive(true);
      const timeout = setTimeout(() => setGlitchActive(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [currentScore]);

  // Determine if we're on the last attempt (critical)
  const isLastAttempt = currentAttempt >= maxAttempts;

  return (
    <div className="score-display">
      {/* Scanline overlay for CRT effect */}
      <div className="scanlines"></div>

      {/* Current toss section */}
      <div className={`score-section current ${glitchActive ? 'glitch' : ''}`}>
        <div className="score-label">CURRENT TOSS</div>
        <div className={`score-value ${isSettled ? 'settled' : 'active'}`}>
          {currentScore > 0 ? currentScore.toString().padStart(2, '0') : '--'}
        </div>

        {/* Attempt indicator */}
        <div className={`attempt-indicator ${isLastAttempt ? 'critical' : ''}`}>
          <div className="attempt-label">ATTEMPT</div>
          <div className="attempt-dots">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <div
                key={i}
                className={`attempt-dot ${i < currentAttempt ? 'used' : ''} ${
                  i === currentAttempt - 1 && isLastAttempt ? 'critical' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="score-divider"></div>

      {/* Roll history section */}
      <div className="score-section history">
        <div className="score-label">LAST 3 ROLLS</div>
        <div className="history-list">
          {rollHistory.length === 0 ? (
            <div className="history-item empty">NO DATA</div>
          ) : (
            rollHistory.slice(-3).reverse().map((score, index) => (
              <div
                key={index}
                className={`history-item ${index === 0 ? 'recent' : ''}`}
              >
                <span className="history-number">{3 - index}.</span>
                <span className="history-value">
                  {score.toString().padStart(2, '0')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ScoreDisplay;
