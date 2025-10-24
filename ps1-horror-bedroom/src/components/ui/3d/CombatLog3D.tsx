import { Text3D } from "./Text3D";
import { UIPanel3D } from "./UIPanel3D";

export interface CombatLogMessage {
  id: string;
  text: string;
  color?: string;
  timestamp: number;
}

interface CombatLog3DProps {
  messages: CombatLogMessage[];
  maxMessages?: number;
  position?: [number, number, number];
  [key: string]: any;
}

export function CombatLog3D({
  messages,
  maxMessages = 8,
  position = [0, 0, 0],
  ...props
}: CombatLog3DProps) {
  const displayedMessages = messages.slice(-maxMessages);
  const LOG_WIDTH = 2.5;
  const LOG_HEIGHT = 1.2;
  const LINE_HEIGHT = 0.12;
  const FONT_SIZE = 0.22;

  return (
    <group position={position} {...props}>
      {/* Background panel */}
      <UIPanel3D
        width={LOG_WIDTH}
        height={LOG_HEIGHT}
        color="#000000"
        opacity={0}
      >
        {/* Title */}
        <Text3D
          position={[-LOG_WIDTH / 2 + 0.1, LOG_HEIGHT / 2 - 0.12, 0.01]}
          fontSize={0.1}
          color="#FFD700"
          font="Jersey25-Regular.ttf"
          anchorX="left"
        >
          COMBAT LOG
        </Text3D>

        {/* Messages */}
        {displayedMessages.map((msg, index) => {
          const yPos = LOG_HEIGHT / 2 - 0.25 - index * LINE_HEIGHT;
          return (
            <Text3D
              key={msg.id}
              position={[-LOG_WIDTH / 2 + 0.1, yPos, 0.01]}
              fontSize={FONT_SIZE}
              color={msg.color || "#FFFFFF"}
              font="Jersey25-Regular.ttf"
              anchorX="left"
              maxWidth={LOG_WIDTH - 0.2}
            >
              {msg.text}
            </Text3D>
          );
        })}

        {/* No messages text */}
        {displayedMessages.length === 0 && (
          <Text3D
            position={[0, 0, 0.01]}
            fontSize={FONT_SIZE}
            color="#666666"
            font="Jersey25-Regular.ttf"
            anchorX="center"
          >
            Awaiting combat...
          </Text3D>
        )}
      </UIPanel3D>
    </group>
  );
}
