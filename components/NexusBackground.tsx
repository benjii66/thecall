"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Vertex Shader
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment Shader: Horizontal Wind Tunnel / Data Stream
const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorBg;
uniform vec3 uColorRibbon1;
uniform vec3 uColorRibbon2;
varying vec2 vUv;

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    // Smooth Interpolation
    vec2 u = f*f*(3.0-2.0*f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

// Fractional Brownian Motion for "Smoke/Air" texture
float fbm (in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    // Loop of octaves
    for (int i = 0; i < 3; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}



// --- FOG / ENERGY FLOW ONLY ---
void main() {
    vec2 st = vUv;
    float ar = uResolution.x / uResolution.y;
    st.x *= ar;

    vec3 color = uColorBg; // Dynamic Deep background
    float t = uTime * 0.04; 

    // WARP UVs logic for organic flow
    vec2 flowSt = vec2(st.x * 0.3 + t, st.y * 3.0); 
    flowSt.y += noise(vec2(st.x * 0.8 + t * 0.5, 0.0)) * 0.5;

    float flow = fbm(flowSt);
    
    // Sharpen flow into ribbons
    float ribbons = 0.0;
    float r1 = 0.02 / (abs(flow - 0.5) + 0.005);
    ribbons += r1 * 0.3;
    float r2 = 0.012 / (abs(flow - 0.65) + 0.005);
    ribbons += r2 * 0.25;

    // Mask edges
    float mask = smoothstep(0.0, 0.2, st.x) * smoothstep(ar + 0.1, ar - 0.5, st.x);
    // Full screen vertical flow
    float vMask = smoothstep(-0.2, 0.2, st.y);

    // Color Gradient
    vec3 ribbonColor = mix(uColorRibbon1, uColorRibbon2, flow * 1.5);
    
    // Add Fog (Extremely Subtle / Deep)
    color += ribbonColor * ribbons * 0.25 * mask * vMask;
    
    // Ambient Glow (Minimal)
    color += ribbonColor * 0.02 * vMask;
    
    // Vignette
    float v = distance(vUv, vec2(0.5));
    color *= smoothstep(1.5, 0.2, v); 

    gl_FragColor = vec4(color, 1.0);
}
`;

type Theme = 'default' | 'victory' | 'defeat' | 'profile';

const THEMES: Record<Theme, { bg: [number, number, number], r1: [number, number, number], r2: [number, number, number] }> = {
  default: {
    bg: [0.01, 0.02, 0.05],
    r1: [0.0, 0.1, 0.5],
    r2: [0.0, 0.8, 1.0]
  },
  victory: {
    bg: [0.01, 0.03, 0.02], // Dark Greenish
    r1: [0.0, 0.4, 0.2], // Forest Green
    r2: [0.0, 1.0, 0.6]  // Spring Green/Cyan
  },
  defeat: {
    bg: [0.03, 0.01, 0.01], // Dark Reddish
    r1: [0.4, 0.0, 0.1], // Crimson
    r2: [1.0, 0.2, 0.2]  // Bright Red
  },
  profile: {
    bg: [0.03, 0.01, 0.05], // Dark Purple
    r1: [0.3, 0.0, 0.5], // Deep Purple
    r2: [0.6, 0.2, 1.0]  // Violet
  }
};

function BackgroundShader({ theme, customColors }: { 
  theme: Theme; 
  customColors?: { bg: [number, number, number], r1: [number, number, number], r2: [number, number, number] } 
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const { size, viewport } = useThree();

  const themeColors = THEMES[theme];
  const colors = customColors || themeColors;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorBg: { value: new THREE.Vector3(...colors.bg) },
      uColorRibbon1: { value: new THREE.Vector3(...colors.r1) },
      uColorRibbon2: { value: new THREE.Vector3(...colors.r2) },
    }),
    []
  );

  useFrame((state) => {
    const { clock } = state;
    if (mesh.current) {
        const mat = mesh.current.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = clock.getElapsedTime();
        mat.uniforms.uResolution.value.set(size.width, size.height);
        
        const activeColors = customColors || THEMES[theme];
        mat.uniforms.uColorBg.value.set(...activeColors.bg);
        mat.uniforms.uColorRibbon1.value.set(...activeColors.r1);
        mat.uniforms.uColorRibbon2.value.set(...activeColors.r2);
    }
  });

  return (
    <mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
}

import { useThemeStore } from "@/lib/store/themeStore";

export function NexusBackground({ theme: propTheme }: { theme?: Theme }) {
  const { theme: storeTheme, customColors } = useThemeStore();
  const activeTheme = propTheme || storeTheme || 'default';

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-1] overflow-hidden bg-[#05060b] transition-colors duration-1000">
        <Canvas 
            dpr={[1, 1.5]} 
            gl={{ 
                powerPreference: "high-performance", 
                antialias: false, 
                stencil: false,
                depth: false
            }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
            <BackgroundShader theme={activeTheme} customColors={customColors} />
        </Canvas>
    </div>
  );
}
