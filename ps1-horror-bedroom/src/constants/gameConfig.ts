import * as THREE from 'three';

// Corruption system constants
export const CORRUPTION_SPEED = 0.0003;

// Camera constants
export const CAMERA_TRANSITION_DURATION = 2;
export const CAMERA_HOLD_DURATION = 8;

// Movement constants
export const MOVEMENT_SPEED = 0.05;

// Corruption stages thresholds
export const CORRUPTION_STAGES = {
  DUST: { start: 0.0, end: 0.3 },
  GRIME: { start: 0.2, end: 0.5 },
  RUST: { start: 0.4, end: 0.7 },
  BLOOD: { start: 0.6, end: 0.9 },
  PULSE: { start: 0.8, end: 1.0 },
};

// Swappable objects fade thresholds
export const FADE_THRESHOLD = 0.3;
export const FADE_RANGE = 0.4;

// PS1 vertex snapping constants
export const BASE_GRID_SIZE = 150.0;
export const CORRUPTION_GRID_REDUCTION = 30.0;

// Cinematic camera angles
export interface CinematicAngle {
  pos: THREE.Vector3;
  lookAt: THREE.Vector3;
  name: string;
}

export const CINEMATIC_ANGLES: CinematicAngle[] = [
  // Wide establishing shot from corner
  {
    pos: new THREE.Vector3(4, 2.5, 4),
    lookAt: new THREE.Vector3(-2, 1, -2),
    name: "Bedroom Overview"
  },

  // Focus on bed - where teddy bear corrupts
  {
    pos: new THREE.Vector3(-3.5, 1.2, -0.5),
    lookAt: new THREE.Vector3(-2.8, 0.8, -2),
    name: "Bed Detail"
  },

  // Close on ceiling light transformation
  {
    pos: new THREE.Vector3(0, 3.8, 0.5),
    lookAt: new THREE.Vector3(0, 4.7, 0),
    name: "Ceiling Light"
  },

  // Window view - watch it turn blood red
  {
    pos: new THREE.Vector3(1.5, 2.2, -3),
    lookAt: new THREE.Vector3(3, 2.5, -4.9),
    name: "Window Corruption"
  },

  // Bureau and lamp close-up
  {
    pos: new THREE.Vector3(2.5, 1.5, -2),
    lookAt: new THREE.Vector3(3.6, 1.8, -3),
    name: "Desk Lamp"
  },

  // TV screen transformation
  {
    pos: new THREE.Vector3(0, 1.6, -1),
    lookAt: new THREE.Vector3(0, 1.4, -4.3),
    name: "TV Screen"
  },

  // Low dramatic angle across floor and rug
  {
    pos: new THREE.Vector3(-2, 0.4, 1),
    lookAt: new THREE.Vector3(1, 0.3, -2),
    name: "Floor Decay"
  },

  // High corner showing full room corruption
  {
    pos: new THREE.Vector3(-4, 3.5, 3),
    lookAt: new THREE.Vector3(0, 1.5, -2),
    name: "Room Descent"
  },

  // Close on wall textures and decay
  {
    pos: new THREE.Vector3(-3, 2, -3.5),
    lookAt: new THREE.Vector3(-4.5, 2.5, -4),
    name: "Wall Corruption"
  },

  // Dramatic low angle looking up at ceiling
  {
    pos: new THREE.Vector3(0, 0.5, 0),
    lookAt: new THREE.Vector3(0, 4.5, -2),
    name: "Ascension"
  },
];

// Light configuration
export const LIGHT_CONFIG = {
  ambient: {
    color: 0xffffff,
    intensity: 1.5, // Increased from 0.2 to 1.5
  },
  ceiling: {
    color: 0xffffbb,
    intensity: 3.0, // Increased from 1.2 to 3.0
    distance: 25,
    position: new THREE.Vector3(0, 4.7, 0),
    hellColor: 0xff0000,
  },
  window: {
    color: 0x88bbff,
    intensity: 2.5, // Increased from 0.8 to 2.5
    position: new THREE.Vector3(5, 5, -5),
    hellColor: 0x330000,
  },
  deskLamp: {
    color: 0xffeecc,
    intensity: 2.0, // Increased from 0.8 to 2.0
    distance: 8,
    position: new THREE.Vector3(3.6, 2.0, -3),
    hellColor: 0xff3300,
  },
  tv: {
    color: 0x3366ff,
    intensity: 1.5, // Increased from 0.6 to 1.5
    distance: 7,
    position: new THREE.Vector3(0, 1.4, -4),
    hellColor: 0xcc0000,
  },
  corner1: {
    color: 0xffffff,
    intensity: 1.0, // Increased from 0.3 to 1.0
    distance: 12,
    position: new THREE.Vector3(-4, 1, -4),
    hellColor: 0x660000,
  },
  corner2: {
    color: 0xffffff,
    intensity: 1.0, // Increased from 0.3 to 1.0
    distance: 12,
    position: new THREE.Vector3(4, 1, 3),
    hellColor: 0x660000,
  },
};

// Hell lights (appear during corruption)
export const HELL_LIGHTS = [
  { color: 0xff0000, intensity: 0, distance: 10, position: new THREE.Vector3(-3, 2, -3) },
  { color: 0xff0000, intensity: 0, distance: 10, position: new THREE.Vector3(3, 2, 2) },
  { color: 0xaa0000, intensity: 0, distance: 8, position: new THREE.Vector3(0, 0.5, -2) },
  { color: 0xff3300, intensity: 0, distance: 12, position: new THREE.Vector3(-2, 3, 0) },
  { color: 0x880000, intensity: 0, distance: 7, position: new THREE.Vector3(2, 1, -4) },
];

// Fog configuration
export const FOG_CONFIG = {
  normalColor: 0x87ceeb,
  hellColor: 0x0a0000,
  near: 1,
  far: 20,
};

// Camera bounds for free mode (large bounds - rely on collision detection)
export const CAMERA_BOUNDS = {
  minX: -20,
  maxX: 20,
  minZ: -20,
  maxZ: 20,
};
