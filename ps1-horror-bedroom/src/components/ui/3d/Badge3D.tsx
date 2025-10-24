import { UIPanel3D } from "./UIPanel3D"; // Assumes UIPanel3D is in the same folder
import { Text3D } from "./Text3D";

interface Badge3DProps {
  label: string;
  color: string;
  [key: string]: any; // for position
}

export const Badge3D = ({ label, color, ...props }: Badge3DProps) => {
  const width = label.length * 0.03 + 0.04; // Simple width calculation
  const height = 0.06;

  return (
    <UIPanel3D width={width} height={height} depth={0.01} {...props}>
      <meshBasicMaterial color={color} />
      <Text3D
        fontSize={0.035}
        color="#FFFFFF"
        anchorX="center"
        position={[0, 0, 0.006]}
        font="Jersey25-Regular.ttf"
      >
        {label}
      </Text3D>
    </UIPanel3D>
  );
};
