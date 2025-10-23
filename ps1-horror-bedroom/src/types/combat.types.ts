export interface Enemy {
  id: number;
  type: string;
  position: [number, number, number];
  hp: number;
  maxHp: number;
  portalProgress: number;
  entranceAnimationProgress: number;
}
