import type { ScoreCategoryData } from "../../systems/scoringSystem";
import { getCategoryDisplayName } from "../../systems/scoringSystem";
import "./ScoreCard.css";

interface ScoreCardProps {
  scores: ScoreCategoryData[];
  timeOfDay: string;
}

export function ScoreCard({ scores, timeOfDay }: ScoreCardProps) {
  return (
    <div className="score-card">
      <div className="score-card-header">
        <h2>{timeOfDay.toUpperCase()} SCORES</h2>
      </div>
      <div className="score-card-body">
        {scores.map((score) => (
          <div
            key={score.category}
            className={`score-row ${score.achieved ? "achieved" : "not-achieved"}`}
          >
            <div className="score-category">
              {getCategoryDisplayName(score.category)}
            </div>
            <div className="score-value">
              {score.achieved ? score.score : "-"}
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
        ))}
      </div>
    </div>
  );
}

export default ScoreCard;
