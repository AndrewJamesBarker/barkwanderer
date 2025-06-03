import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";
import * as THREE from "three";

const DigitalBeachScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const jellyfishRefs = useRef<THREE.Mesh[]>([]);
  const data = useAudioAnalyser();
  
  const timeRef = useRef(0);
  const driftProgressRefs = useRef<number[]>([]);

  // Force fresh state on each mount
  const [mountKey] = React.useState(() => Math.random());

  // Create multiple jellyfish data - FRESH EVERY TIME
  const jellyfishData = useMemo(() => {
    // Hard-coded positions that are guaranteed to be visible and separated
    return [
      { id: 0, scale: 0.7, startX: -4, startY: 0, startZ: -4, driftRadius: 0.5, driftSpeed: 0.4, rotationSpeed: 0.02, phase: 0, colorVariant: 0 },
      { id: 1, scale: 0.7, startX: 4, startY: 0, startZ: -4, driftRadius: 0.5, driftSpeed: 0.5, rotationSpeed: 0.03, phase: 1, colorVariant: 0.125 },
      { id: 2, scale: 0.7, startX: 0, startY: 2, startZ: -4, driftRadius: 0.5, driftSpeed: 0.6, rotationSpeed: 0.025, phase: 2, colorVariant: 0.25 },
      { id: 3, scale: 0.7, startX: 0, startY: -2, startZ: -4, driftRadius: 0.5, driftSpeed: 0.7, rotationSpeed: 0.035, phase: 3, colorVariant: 0.375 },
      { id: 4, scale: 0.7, startX: -2, startY: 1, startZ: -6, driftRadius: 0.5, driftSpeed: 0.45, rotationSpeed: 0.028, phase: 4, colorVariant: 0.5 },
      { id: 5, scale: 0.7, startX: 2, startY: 1, startZ: -6, driftRadius: 0.5, driftSpeed: 0.55, rotationSpeed: 0.032, phase: 5, colorVariant: 0.625 },
      { id: 6, scale: 0.7, startX: -2, startY: -1, startZ: -6, driftRadius: 0.5, driftSpeed: 0.65, rotationSpeed: 0.022, phase: 6, colorVariant: 0.75 },
      { id: 7, scale: 0.7, startX: 2, startY: -1, startZ: -6, driftRadius: 0.5, driftSpeed: 0.75, rotationSpeed: 0.038, phase: 7, colorVariant: 0.875 }
    ];
  }, [mountKey]); // Fresh on each mount

  // Initialize jellyfish refs and drift progress
  React.useEffect(() => {
    // Force create exactly 8 slots - no dependencies on jellyfishData.length
    jellyfishRefs.current = new Array(8).fill(null);
    driftProgressRefs.current = new Array(8).fill(0);
  }, []); // No dependencies - run once and only once

  // Enhanced organic jellyfish material with pastel highlights
  const createJellyfishMaterial = (colorVariant: number) => {
    const colorMod = colorVariant * 0.3;
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        isPlaying: { value: 0 },
        color1: { value: new THREE.Color().setHSL(0.75 + colorMod * 0.1, 0.6, 0.7) }, // Individual colors
        color2: { value: new THREE.Color().setHSL(0.85 + colorMod * 0.1, 0.6, 0.7) },
        color3: { value: new THREE.Color().setHSL(0.65 + colorMod * 0.1, 0.6, 0.7) },
        highlight1: { value: new THREE.Color(0x9070ff) }, // Dark purple highlight
        highlight2: { value: new THREE.Color(0xff70b8) }, // Dark pink highlight
        highlight3: { value: new THREE.Color(0x7090ff) }, // Dark blue highlight
        opacity: { value: 0.5 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        uniform float time;
        uniform float audioLevel;
        uniform float isPlaying;
        
        // Smoother organic noise functions
        float smoothNoise(vec3 p) {
          return sin(p.x * 1.8 + time * isPlaying) * sin(p.y * 1.6 + time * 0.8 * isPlaying) * sin(p.z * 2.0 + time * 1.2 * isPlaying);
        }
        
        // Ultra-smooth multi-octave noise for maximum roundedness
        float organicNoise(vec3 p) {
          float n = 0.0;
          float amplitude = 1.0;
          float frequency = 1.0;
          
          for (int i = 0; i < 6; i++) {
            n += smoothNoise(p * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return n * 0.3; // Reduced intensity for smoother form
        }
        
        // Soft smoothstep function for ultra-round transitions
        float ultraSmooth(float edge0, float edge1, float x) {
          float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
          return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); // Smootherstep
        }
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          // Create ultra-organic, flowing form
          vec3 pos = position;
          
          // Main pulsing - only when music plays
          float pulse = 1.0 + sin(time * 1.2 * isPlaying) * 0.15 + sin(time * 2.4 * isPlaying) * 0.08;
          
          // Ultra-soft organic ripples
          float ripple1 = sin(pos.x * 2.5 + time * 1.8 * isPlaying) * sin(pos.y * 2.2 + time * 1.3 * isPlaying) * 0.12;
          float ripple2 = cos(pos.z * 3.2 + time * 1.5 * isPlaying) * cos(pos.y * 2.8 + time * 1.9 * isPlaying) * 0.09;
          float ripple3 = sin(pos.x * 4.1 + pos.z * 2.7 + time * 1.1 * isPlaying) * 0.06;
          
          // Ultra-smooth organic displacement
          float organic = organicNoise(pos * 1.2 + time * 0.25 * isPlaying) * 0.2;
          
          // Audio-reactive flowing - only when playing (INCREASED SENSITIVITY)
          float audioFlow = audioLevel * 0.8 * sin(time * 2.8 * isPlaying + pos.y * 1.8) * isPlaying;
          
          // Smooth tentacle-like extensions (part of the same ultra-round form)
          float tentacleFlow = 0.0;
          if (pos.y < -0.2) {
            float tentacleIntensity = ultraSmooth(-0.2, -1.4, pos.y);
            tentacleFlow = sin(pos.x * 6.0 + time * 2.2 * isPlaying) * cos(pos.z * 5.0 + time * 1.6 * isPlaying) * tentacleIntensity * 0.4;
            tentacleFlow += organicNoise(pos * 2.5 + time * 0.4 * isPlaying) * tentacleIntensity * 0.25;
            tentacleFlow += audioLevel * 0.6 * tentacleIntensity * isPlaying; // Audio-reactive tentacles
          }
          
          // Combine all ultra-soft organic movements
          vec3 displacement = normalize(pos) * (ripple1 + ripple2 + ripple3 + organic + audioFlow + tentacleFlow);
          pos = pos * pulse + displacement;
          
          // Update normal for enhanced lighting
          vNormal = normalize(normalMatrix * normalize(pos));
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float audioLevel;
        uniform float isPlaying;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform vec3 highlight1;
        uniform vec3 highlight2;
        uniform vec3 highlight3;
        uniform float opacity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          // Ultra-organic color flow patterns
          float flow1 = sin(vPosition.x * 2.5 + vPosition.y * 1.8 + time * 1.1 * isPlaying) * 0.5 + 0.5;
          float flow2 = cos(vPosition.z * 3.2 + vPosition.x * 1.3 + time * 0.7 * isPlaying) * 0.5 + 0.5;
          float flow3 = sin(vPosition.y * 4.0 + vPosition.z * 2.5 + time * 1.3 * isPlaying) * 0.5 + 0.5;
          
          // Smooth color blending
          vec3 baseColor = mix(color1, color2, smoothstep(0.2, 0.8, flow1));
          baseColor = mix(baseColor, color3, smoothstep(0.3, 0.7, flow2) * 0.6);
          
          // Enhanced pastel highlights
          float highlight = sin(vPosition.x * 8.0 + time * 2.5 * isPlaying) * cos(vPosition.z * 6.0 + time * 1.8 * isPlaying) * 0.3 + 0.3;
          vec3 highlightColor = mix(highlight1, highlight2, flow3);
          highlightColor = mix(highlightColor, highlight3, flow1 * 0.7);
          
          // Apply highlights with smooth transitions
          baseColor = mix(baseColor, highlightColor, smoothstep(0.4, 0.9, highlight));
          
          // Ultra-soft shimmer effect
          float shimmer = sin(vPosition.x * 12.0 + time * 3.2 * isPlaying) * 
                         cos(vPosition.y * 10.0 + time * 2.8 * isPlaying) * 
                         sin(vPosition.z * 9.0 + time * 2.1 * isPlaying) * 0.08 + 0.08;
          baseColor += shimmer * vec3(0.2, 0.25, 0.3);
          
          // Enhanced fresnel for ultra-soft translucency
          float fresnel = pow(1.0 - abs(dot(vNormal, normalize(vPosition))), 2.0);
          
          // Audio-reactive soft glow - only when playing (INCREASED SENSITIVITY)
          float glow = (audioLevel * 0.8 + fresnel * 0.3) * isPlaying;
          baseColor += glow * vec3(0.2, 0.3, 0.35);
          
          // Ultra-organic opacity with soft ripples (INCREASED AUDIO SENSITIVITY)
          float rippleOpacity = sin(vPosition.y * 5.0 + time * isPlaying) * 0.08;
          float finalOpacity = opacity + fresnel * 0.2 + audioLevel * 0.4 + rippleOpacity;
          
          gl_FragColor = vec4(baseColor, finalOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  };

  // Store materials for each jellyfish - FRESH EVERY TIME
  const jellyfishMaterials = useMemo(() => {
    return jellyfishData.map(jData => createJellyfishMaterial(jData.colorVariant));
  }, [jellyfishData, mountKey]); // Force refresh with data changes AND random

  // Ultra-rounded organic geometry - FRESH EVERY TIME
  const organicGeometry = useMemo(() => {
    // Higher subdivision for maximum smoothness
    const geometry = new THREE.IcosahedronGeometry(1, 6);
    
    // Create ultra-soft jellyfish form
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Ultra-smooth organic jellyfish shape
      
      // Ultra-soft bell dome (upper part)
      if (y > 0) {
        const bellCurve = Math.pow(1 - y * 0.7, 0.3); // Softer curve
        const softening = 1 - Math.pow(y, 4) * 0.2; // Additional softening
        positions[i] = x * bellCurve * softening;
        positions[i + 2] = z * bellCurve * softening;
        positions[i + 1] = y * 0.75; // Gentler flattening
      }
      // Ultra-flowing tentacle region (lower part)
      else {
        const tentacleStretch = 1 + Math.abs(y) * 1.2; // Less dramatic stretch
        const organicVariation = 1 + Math.sin(Math.atan2(z, x) * 8) * 0.25; // Smoother variation
        const roundingFactor = 1 - Math.pow(Math.abs(y), 2) * 0.1; // Additional rounding
        positions[i] = x * organicVariation * roundingFactor;
        positions[i + 1] = y * tentacleStretch;
        positions[i + 2] = z * organicVariation * roundingFactor;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, [mountKey]); // Force fresh geometry every time

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Extract audio data
    const avgVolume = data.length > 0 ? 
      Array.from(data.slice(0, 64)).reduce((sum, val) => sum + val, 0) / 64 : 0;
    
    // Always animate - remove all complex audio detection logic
    const isPlaying = 1.0; // Always on!
    
    // Always update time - no conditions
    timeRef.current += delta;
    
    // Update each jellyfish individually - ensure we always try all 8
    for (let index = 0; index < jellyfishData.length; index++) {
      const jellyfish = jellyfishRefs.current[index];
      const jData = jellyfishData[index];
      
      if (!jellyfish || !jData) continue; // Skip this one but continue with others
      
      // Ultra-organic drifting motion - ALWAYS ACTIVE
      driftProgressRefs.current[index] = (timeRef.current * jData.driftSpeed / 120) % 1;
      const driftAngle = driftProgressRefs.current[index] * Math.PI * 2 + jData.phase;
      
      // Individual movement patterns based on jellyfish data - constrained to stay in view
      const driftX = jData.startX + Math.cos(driftAngle) * jData.driftRadius + Math.sin(timeRef.current * 0.25) * 0.5;
      const driftY = jData.startY + Math.sin(driftAngle * 0.25) * 0.5 + Math.cos(timeRef.current * 0.35) * 0.3;
      const driftZ = jData.startZ + Math.sin(driftAngle) * 0.8 + Math.cos(timeRef.current * 0.2) * 0.6;
      
      // Ultra-gentle audio-reactive swaying
      const audioSway = Math.sin(timeRef.current * 1.2 + jData.phase) * (avgVolume / 600);
      const audioBob = Math.cos(timeRef.current * 1.5 + jData.phase) * (avgVolume / 800);
      
      // Clamp positions to keep jellyfish in a reasonable viewing area
      jellyfish.position.set(
        Math.max(-6, Math.min(6, driftX + audioSway)),
        Math.max(-2, Math.min(2, driftY + audioBob)),
        Math.max(-8, Math.min(-1, driftZ))
      );
      
      // Individual scaling based on base scale
      const organicScale = jData.scale * (0.5 + Math.sin(timeRef.current * 1.0 + jData.phase) * 0.12 + Math.cos(timeRef.current * 1.8 + jData.phase) * 0.06);
      const audioScale = 1 + (avgVolume / 800);
      jellyfish.scale.setScalar(organicScale * audioScale);
      
      // Individual rotation
      jellyfish.rotation.y += delta * jData.rotationSpeed;
      jellyfish.rotation.x = Math.sin(timeRef.current * 0.25 + jData.phase) * 0.08;
      jellyfish.rotation.z = Math.cos(timeRef.current * 0.3 + jData.phase) * 0.06;
      
      // Update material uniforms with slight color variations
      const material = jellyfish.material as THREE.ShaderMaterial;
      if (material && material.uniforms) {
        material.uniforms.time.value = timeRef.current;
        material.uniforms.audioLevel.value = avgVolume / 150;
        material.uniforms.isPlaying.value = isPlaying;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Colored, atmospheric lighting - no white wash */}
      <ambientLight intensity={0.15} color="#8060a0" />
      <pointLight 
        position={[3, 4, 5]} 
        intensity={0.8} 
        color="#b080d0" 
        distance={15}
      />
      <pointLight 
        position={[-2, 2, -4]} 
        intensity={0.6} 
        color="#d080b0" 
        distance={10}
      />
      <pointLight 
        position={[1, -1, 3]} 
        intensity={0.5} 
        color="#8090d0" 
        distance={8}
      />
      
      {/* Ultra-organic amorphous jellyfish - ALWAYS 8 */}
      {Array.from({ length: 8 }, (_, index) => (
        <mesh
          key={`jellyfish-${index}`} // Fixed key
          ref={(ref) => {
            if (ref) {
              jellyfishRefs.current[index] = ref;
            }
          }}
          position={[
            jellyfishData[index]?.startX || 0,
            jellyfishData[index]?.startY || 0,
            jellyfishData[index]?.startZ || -5
          ]} // Initial position fallback
          scale={jellyfishData[index]?.scale || 0.6} // Initial scale fallback
        >
          <primitive object={organicGeometry} />
          <primitive object={jellyfishMaterials[index] || jellyfishMaterials[0]} />
        </mesh>
      ))}
    </group>
  );
};

export default DigitalBeachScene;
