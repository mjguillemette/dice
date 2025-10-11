varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
uniform float time;
uniform float hellFactor;

void main() {
    vUv = uv;
    vNormal = normal;
    vPosition = position;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Apply PS1 vertex snapping in screen space AFTER projection
    vec4 snappedPosition = gl_Position;
    float gridSize = 150.0 - (hellFactor * 30.0);
    snappedPosition.xyz = snappedPosition.xyz / snappedPosition.w;
    snappedPosition.xy = floor(snappedPosition.xy * gridSize) / gridSize;
    snappedPosition.xyz *= snappedPosition.w;

    gl_Position = snappedPosition;
}
