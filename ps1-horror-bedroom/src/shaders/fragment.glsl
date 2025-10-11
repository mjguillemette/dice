uniform vec3 normalColor;
uniform vec3 hellColor;
uniform float hellFactor;
uniform float time;
uniform float opacity;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 5; i++) {
        value += amplitude * noise2(p * frequency);
        frequency *= 2.17;
        amplitude *= 0.5;
    }
    return value;
}

// PS1-style texture mapping
vec3 ps1Texture(vec2 uv, vec3 baseColor) {
    // Very subtle noise variation - almost imperceptible
    float noise1 = fbm(uv * 80.0 + vPosition.xy * 2.0) * 0.5 + 0.5;
    float noise2 = fbm(uv * 120.0 - vPosition.yz * 3.0) * 0.5 + 0.5;

    // Combine subtle variations
    float variation = mix(noise1, noise2, 0.5);

    // PS1-style dithering pattern
    float dither = mod(floor(uv.x * 128.0) + floor(uv.y * 128.0), 2.0);

    // Apply very subtle variation and dithering
    vec3 textured = baseColor;
    textured *= 0.96 + variation * 0.08;  // Very subtle brightness variation
    textured += (dither - 0.5) * 0.06;    // Keep nice dithering

    return textured;
}

// Wood grain texture
vec3 woodGrain(vec2 uv, vec3 baseColor) {
    float grain = fbm(vec2(uv.x * 25.0, uv.y * 80.0) + vPosition.xy * 0.5);
    float rings = sin(uv.x * 60.0 + grain * 8.0) * 0.5 + 0.5;
    rings = smoothstep(0.3, 0.7, rings);

    vec3 darkWood = baseColor * 0.6;
    vec3 lightWood = baseColor * 1.2;

    return mix(darkWood, lightWood, rings * 0.4 + grain * 0.3);
}

// Fabric texture
vec3 fabricTexture(vec2 uv, vec3 baseColor) {
    float weave1 = sin(uv.x * 150.0) * sin(uv.y * 150.0);
    float weave2 = sin(uv.x * 200.0 + 0.5) * sin(uv.y * 200.0 + 0.5);
    float weave = (weave1 + weave2) * 0.5;

    float fuzz = fbm(uv * 100.0 + vPosition.xy * 3.0) * 0.1;

    return baseColor * (0.9 + weave * 0.15 + fuzz);
}

// Wall texture (subtle pattern like painted drywall)
vec3 wallTexture(vec2 uv, vec3 baseColor) {
    // Subtle paint texture with slight variations
    float paintNoise = fbm(uv * 45.0 + vPosition.xy * 1.5);

    // Very subtle vertical streaks (like paint strokes)
    float streaks = fbm(vec2(uv.x * 80.0, uv.y * 20.0) + vPosition.xy * 0.8);

    // Tiny bumps/imperfections
    float bumps = fbm(uv * 120.0 + vPosition.xz * 2.0);

    // Combine subtle variations
    float variation = paintNoise * 0.5 + streaks * 0.3 + bumps * 0.2;

    // Apply very subtle texture (walls should still look mostly clean)
    return baseColor * (0.95 + variation * 0.1);
}

void main() {
    vec2 pixelUv = floor(vUv * 64.0) / 64.0;
    vec2 organicUv = vUv;

    float n = noise(pixelUv * 10.0 + time * 0.5);

    vec3 baseColor = mix(normalColor, hellColor, hellFactor);

    // Apply PS1-style texturing based on surface
    // Detect surface type by color/position
    float isWood = step(0.3, normalColor.r) * step(normalColor.r, 0.6) * step(normalColor.g, 0.4);
    float isFabric = step(0.4, normalColor.b);
    float isWall = step(0.8, normalColor.r) * step(0.8, normalColor.g) * step(0.8, normalColor.b);

    if (isWall > 0.5) {
        // Walls are completely clean - no texture at all
        baseColor = baseColor;
    } else if (isWood > 0.5) {
        baseColor = woodGrain(vUv, baseColor);
    } else if (isFabric > 0.5) {
        baseColor = fabricTexture(vUv, baseColor);
    } else {
        baseColor = ps1Texture(vUv, baseColor);
    }

    // Progressive corruption stages
    float stage1 = smoothstep(0.0, 0.3, hellFactor);
    float stage2 = smoothstep(0.2, 0.5, hellFactor);
    float stage3 = smoothstep(0.4, 0.7, hellFactor);
    float stage4 = smoothstep(0.6, 0.9, hellFactor);
    float stage5 = smoothstep(0.8, 1.0, hellFactor);

    // STAGE 1: Light dust
    float dustPattern = fbm(organicUv * 25.0 + vPosition.xy * 0.5);
    float dust = smoothstep(0.4, 0.7, dustPattern) * stage1;
    vec3 dustColor = vec3(0.5, 0.48, 0.45);
    baseColor = mix(baseColor, dustColor, dust * 0.15);

    // STAGE 2: Grime and mold
    float dirtPattern = fbm(organicUv * 18.0 + vPosition.xy * 0.7 + time * 0.02);
    float grime = fbm(organicUv * 11.0 + vPosition.yz * 0.4 + vec2(time * 0.01, 0.0));
    float stains = fbm(organicUv * 23.0 + vPosition.xz * 0.9 + vec2(0.0, time * 0.015));

    float dirtAmount = (dirtPattern * 0.4 + grime * 0.3 + stains * 0.3);
    dirtAmount = smoothstep(0.25, 0.75, dirtAmount) * stage2;

    vec3 dirtColor = mix(
        vec3(0.4, 0.35, 0.3),
        vec3(0.2, 0.05, 0.0),
        hellFactor
    );
    baseColor = mix(baseColor, dirtColor, dirtAmount * 0.5);

    float moldPattern = fbm(organicUv * 14.0 + vPosition.xy * 1.1 + time * 0.03);
    moldPattern *= fbm(organicUv * 9.0 + vPosition.yz * 0.5);
    float mold = smoothstep(0.6, 0.8, moldPattern) * stage2;
    vec3 moldColor = mix(vec3(0.1, 0.15, 0.05), vec3(0.05, 0.08, 0.0), hellFactor);
    baseColor = mix(baseColor, moldColor, mold * 0.4);

    // STAGE 3: Rust
    float rust = fbm(organicUv * 21.0 + vPosition.xz * 0.8 + time * 0.04);
    rust *= fbm(organicUv * 13.0 - vPosition.xy * 0.3);
    rust = smoothstep(0.45, 0.75, rust) * stage3;
    vec3 rustColor = vec3(0.3, 0.1, 0.0);
    baseColor = mix(baseColor, rustColor, rust * 0.35);

    // STAGE 4: Blood and veins
    float bloodStains = fbm(organicUv * 28.0 + vPosition.xy * 1.2 + time * 0.08);
    bloodStains *= fbm(organicUv * 15.0 - vPosition.xz * 0.6 + time * 0.05);
    bloodStains = smoothstep(0.55, 0.85, bloodStains) * stage4;
    vec3 bloodColor = vec3(0.4, 0.0, 0.0);
    baseColor = mix(baseColor, bloodColor, bloodStains * 0.5);

    float veinNoise1 = fbm(organicUv * 35.0 + vPosition.xy * 2.3 + time * 0.3);
    float veinNoise2 = fbm(organicUv * 27.0 - vPosition.xz * 1.8 - time * 0.2);
    float veins1 = sin(organicUv.x * 47.0 + time + vPosition.y * 3.0 + veinNoise1 * 5.0) *
                   cos(organicUv.y * 53.0 - time * 0.7 + vPosition.x * 2.0 + veinNoise2 * 4.0);
    float veins2 = sin(organicUv.x * 31.0 - time * 0.5 + vPosition.z * 4.0 + veinNoise2 * 3.0) *
                   cos(organicUv.y * 41.0 + time * 0.8 + veinNoise1 * 6.0);
    float veins = (veins1 + veins2 * 0.7);

    float veinThickness = fbm(organicUv * 20.0 + vPosition.xy * 0.5);
    veins = smoothstep(0.65 + veinThickness * 0.15, 0.95, veins) * stage4;
    baseColor = mix(baseColor, vec3(0.5, 0.0, 0.0), veins * 0.6);

    // STAGE 5: Pulsing
    float pulsePattern = fbm(organicUv * 8.0 + vPosition.xz * 0.3);
    float pulse = sin(time * 2.3 + vPosition.x + pulsePattern * 3.0) *
                 cos(time * 1.7 + vPosition.z + pulsePattern * 2.0) * 0.5 + 0.5;
    baseColor += vec3(0.2, 0.0, 0.0) * pulse * stage5 * 0.5;

    baseColor += (n - 0.5) * 0.1 * hellFactor;

    // Simple directional lighting simulation (fixed light direction)
    vec3 lightDir1 = normalize(vec3(0.5, 1.0, 0.5));
    vec3 lightDir2 = normalize(vec3(-0.3, 0.8, -0.4));

    float diffuse1 = max(dot(normalize(vNormal), lightDir1), 0.0);
    float diffuse2 = max(dot(normalize(vNormal), lightDir2), 0.0) * 0.5;

    // Combine diffuse lighting with ambient
    float lighting = 0.6 + diffuse1 * 0.8 + diffuse2 * 0.4; // Much brighter ambient base
    baseColor *= lighting;

    baseColor *= (1.0 - hellFactor * 0.3); // Less darkening from corruption

    float gray = dot(baseColor, vec3(0.299, 0.587, 0.114));
    baseColor = mix(baseColor, vec3(gray), hellFactor * 0.3);

    gl_FragColor = vec4(baseColor, opacity);
}
