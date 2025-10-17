import "./DiceInfo.css";

export interface DiceData {
  id: number;
  type: string; // "d6", "d4", "d3", "coin", "thumbtack"
  faceValue: number;
  score: number;
  modifiers: string[];
  position: { x: number; y: number }; // Screen position for tooltip
}

interface DiceInfoProps {
  diceData: DiceData | null;
}

export function DiceInfo({ diceData }: DiceInfoProps) {
  if (!diceData) return null;

  const getDiceTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      d6: "D6",
      d4: "D4",
      d3: "D3",
      coin: "Coin",
      thumbtack: "Thumbtack"
    };
    return typeMap[type] || type.toUpperCase();
  };

  return (
    <div
      className="dice-info-tooltip"
      style={{
        left: `${diceData.position.x + 20}px`,
        top: `${diceData.position.y - 10}px`
      }}
    >
      <div className="dice-info-header">
        <span className="dice-type">{getDiceTypeDisplay(diceData.type)}</span>
        <span className="dice-id">#{diceData.id}</span>
      </div>

      <div className="dice-info-body">
        <div className="dice-info-row">
          <span className="dice-info-label">Face Value:</span>
          <span className="dice-info-value dice-face">{diceData.faceValue}</span>
        </div>

        <div className="dice-info-row">
          <span className="dice-info-label">Score:</span>
          <span className="dice-info-value dice-score">{diceData.score}</span>
        </div>

        {diceData.modifiers.length > 0 && (
          <div className="dice-info-modifiers">
            <span className="dice-info-label">Modifiers:</span>
            <div className="modifier-list">
              {diceData.modifiers.map((mod, idx) => (
                <span key={idx} className="modifier-tag">
                  {mod}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiceInfo;
