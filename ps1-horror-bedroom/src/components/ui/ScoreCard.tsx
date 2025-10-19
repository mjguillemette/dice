import type { ScoreCategoryData } from "../../systems/scoringSystem";
import { getCategoryDisplayName } from "../../systems/scoringSystem";
import "./ScoreCard.css";

interface ScoreCardProps {
  scores: ScoreCategoryData[];
  timeOfDay: string;
  currentAttempts?: number;
  maxAttempts?: number;
  incenseActive?: boolean; // Whether incense item is active
  currentScore?: number;
}

export function ScoreCard({
  scores,
  timeOfDay,
  currentAttempts = 0,
  maxAttempts = 2,
  incenseActive = false,
  currentScore = 0
}: ScoreCardProps) {
  // Get multi-score multiplier from the first score that has it
  const multiScoreMultiplier = scores.find(s => s.multiScoreMultiplier)?.multiScoreMultiplier || 1.0;

  // Calculate how many non-highest-total scores were achieved this round
  const achievedScoresThisRound = scores.filter(
    (s) => s.achieved && s.category !== "highest_total" && s.lastUpdatedAttempt === currentAttempts
  ).length;

  const hasMultiScoreBonus = achievedScoresThisRound >= 2 && multiScoreMultiplier > 1.0;

  return (
    <div className="score-card">
      {/* Header */}
      <div className="score-card-header">
        <div className="score-card-title">
          <span className="time-badge">{timeOfDay.toUpperCase()}</span>
          <h2>SCORECARD</h2>
        </div>
        <div className="score-card-meta">
          <div className="attempt-tracker">
            <span className="meta-label">ATTEMPT</span>
            <span className="meta-value">
              {currentAttempts}/{maxAttempts}
            </span>
          </div>
          {currentScore > 0 && (
            <div className="current-score">
              <span className="meta-label">SCORE</span>
              <span className="meta-value highlight">{currentScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-score combo bonus indicator */}
      {hasMultiScoreBonus && (
        <div className="multi-score-bonus">
          <span className="bonus-icon">⚡</span>
          <span className="bonus-text">
            {achievedScoresThisRound}× COMBO
          </span>
          <span className="bonus-multiplier">
            +{Math.floor((multiScoreMultiplier - 1) * 100)}%
          </span>
        </div>
      )}

      {/* Scores */}
      <div className="score-card-body">
        {scores.map((score) => {
          const hasCombo = score.comboCount && score.comboCount > 1;
          const isIncenseCombo = incenseActive && hasCombo;

          return (
            <div
              key={score.category}
              className={`score-row ${score.achieved ? "achieved" : "not-achieved"} ${isIncenseCombo ? "incense-combo" : ""}`}
            >
              <div className="score-row-main">
                <div className="score-category">
                  {getCategoryDisplayName(score.category)}
                </div>
                <div className="score-meta">
                  <div className="score-value">
                    {score.achieved ? score.score : "—"}
                  </div>
                  {isIncenseCombo && (
                    <div className="score-streak incense-active" title={`Incense: ${score.comboCount}× streak!`}>
                      <span className="streak-icon">🔥</span>
                      <span className="streak-count">×{score.comboCount}</span>
                    </div>
                  )}
                </div>
              </div>
              {score.achieved && score.diceValues && score.diceValues.length > 0 && (
                <div className="score-dice">
                  {score.diceValues.map((val, idx) => (
                    <span key={idx} className="dice-pip">
                      {val}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScoreCard;
