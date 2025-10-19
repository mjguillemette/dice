import "./DiceInfo.css"; // Reuse similar styling

export interface TableItemData {
  itemId: "cigarette" | "incense";
  name: string;
  description: string;
  thisRoundImpact?: string;
  totalImpact?: string;
  position: { x: number; y: number }; // Screen position for tooltip
}

interface TableItemInfoProps {
  itemData: TableItemData | null;
}

export function TableItemInfo({ itemData }: TableItemInfoProps) {
  if (!itemData) return null;

  return (
    <div
      className="dice-info-tooltip table-item-tooltip"
      style={{
        left: `${itemData.position.x + 20}px`,
        top: `${itemData.position.y - 10}px`,
        minWidth: "200px"
      }}
    >
      <div className="dice-info-header">
        <span className="dice-type">{itemData.name}</span>
      </div>

      <div className="dice-info-body">
        <div className="dice-info-row" style={{ marginBottom: "8px" }}>
          <span className="dice-info-value" style={{ fontSize: "0.85em", opacity: 0.9 }}>
            {itemData.description}
          </span>
        </div>

        {itemData.thisRoundImpact && (
          <div className="dice-info-row">
            <span className="dice-info-label">This Round:</span>
            <span className="dice-info-value">{itemData.thisRoundImpact}</span>
          </div>
        )}

        {itemData.totalImpact && (
          <div className="dice-info-row">
            <span className="dice-info-label">Total Impact:</span>
            <span className="dice-info-value">{itemData.totalImpact}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TableItemInfo;
