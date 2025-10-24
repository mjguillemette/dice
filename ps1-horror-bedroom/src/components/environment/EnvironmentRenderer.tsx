import House from "../house/House";
import Room from "../models/Room";
import Bed from "../models/Bed";
import Bureau from "../models/Bureau";
import TVStand from "../models/TVStand";
import CeilingLight from "../models/CeilingLight";
import Decorations from "../models/Decorations";
import Ashtray from "../models/Ashtray";
import Cigarette from "../models/Cigarette";
import IncenseStick from "../models/IncenseStick";
import BoardGame from "../models/BoardGame";
import { RECEPTACLE_POSITION } from "../../constants/receptacleConfig";
import type { PlayerInventory } from "../../systems/itemSystem";
import { isConsumableActive } from "../../systems/itemSystem";

interface EnvironmentRendererProps {
  hellFactor: number;
  inventory: PlayerInventory;
  daysMarked: number;
  onTableItemHover?: (item: "cigarette" | "incense" | null) => void;
}

/**
 * EnvironmentRenderer - Renders the static environment (room, furniture, decorations)
 * Extracted from Scene.tsx to improve organization
 */
export function EnvironmentRenderer({
  hellFactor,
  inventory,
  daysMarked,
  onTableItemHover
}: EnvironmentRendererProps) {
  return (
    <>
      {/* House exterior */}
      <House hellFactor={hellFactor} />

      {/* Room structure and furniture */}
      <Room hellFactor={hellFactor} />
      <Bed hellFactor={hellFactor} />
      <Bureau hellFactor={hellFactor} />
      <TVStand hellFactor={hellFactor} />
      <CeilingLight hellFactor={hellFactor} />
      <Decorations hellFactor={hellFactor} />

      {/* Ashtray - always present */}
      <Ashtray
        hellFactor={hellFactor}
        cigaretteCount={inventory.passiveEffects.cigarette}
      />

      {/* Cigarette - conditional based on inventory */}
      {inventory.passiveEffects.cigarette > 0 && (
        <Cigarette
          position={[
            RECEPTACLE_POSITION[0] - 0.666,
            RECEPTACLE_POSITION[1] + 0.12,
            RECEPTACLE_POSITION[2] - 0.22
          ]}
          rotation={[Math.PI / 2, Math.PI, Math.PI / 4]}
          scale={1.8}
          count={inventory.passiveEffects.cigarette}
          onHover={(isHovered) =>
            onTableItemHover?.(isHovered ? "cigarette" : null)
          }
        />
      )}

      {/* Incense stick - conditional based on inventory */}
      {inventory.consumables.find((c) => c.itemId === "incense") && (
        <IncenseStick
          position={[
            RECEPTACLE_POSITION[0] + 0.456,
            RECEPTACLE_POSITION[1] + 0.2,
            RECEPTACLE_POSITION[2] - 0.249
          ]}
          rotation={[-Math.PI / -2.3, 0.6, Math.PI / 4]}
          scale={2.66}
          isActive={isConsumableActive(inventory, "incense")}
          onHover={(isHovered) =>
            onTableItemHover?.(isHovered ? "incense" : null)
          }
        />
      )}

      {/* Board game - always present */}
      <BoardGame
        position={[2.01, 1.55, 4.88]}
        hellFactor={hellFactor}
        daysMarked={daysMarked}
      />
    </>
  );
}
