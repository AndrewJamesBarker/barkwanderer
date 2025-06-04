import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";

const ZeroScene: React.FC = () => {
  const data = useAudioAnalyser();
  const timeRef = useRef(0);
  const { camera, scene } = useThree();
  
  // Nebula refs
  const nebulaRef = useRef<THREE.Mesh>(null);
  
  // Star refs
  const starsRef = useRef<THREE.Points>(null);

  // Set up outer space environment
  React.useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    const originalFog = scene.fog;
    const originalBackground = scene.background;
    
    // Position camera for space view - further back to see everything
    camera.position.set(0, 5, 25);
    camera.lookAt(0, 0, 0);
    
    // Deep space background
    scene.background = new THREE.Color("#0a0a15");
    scene.fog = null; // No fog in space
    
    return () => {
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
      scene.fog = originalFog;
      scene.background = originalBackground;
    };
  }, [camera, scene]);

  // Advanced nebula shader material for cloud-like plasma effects
  const nebulaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioIntensity: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        uniform float audioIntensity;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        // Advanced noise functions for cloud-like texture
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          
          // Multi-layered cloud deformation
          vec3 pos = position;
          float scale1 = 0.3;
          float scale2 = 0.6;
          float scale3 = 1.2;
          
          // Large cloud structures
          float noise1 = snoise(pos * scale1 + time * 0.02) * 0.4;
          // Medium detail
          float noise2 = snoise(pos * scale2 + time * 0.05) * 0.25;
          // Fine detail
          float noise3 = snoise(pos * scale3 + time * 0.08) * 0.15;
          
          // Audio-reactive intensity
          float audioFactor = 1.0 + audioIntensity * 0.1;
          float totalNoise = (noise1 + noise2 + noise3) * audioFactor;
          
          // Apply cloud-like deformation
          pos += normal * totalNoise;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float audioIntensity;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        // Fractal Brownian Motion for cloud texture
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for(int i = 0; i < 4; i++) {
            value += amplitude * (sin(p.x * frequency) * sin(p.y * frequency) * sin(p.z * frequency));
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          // Sophisticated cloud colors - deep space nebula palette (darker)
          vec3 deepPurple = vec3(0.1, 0.05, 0.2);
          vec3 cosmicBlue = vec3(0.05, 0.15, 0.3);
          vec3 nebulaPink = vec3(0.3, 0.1, 0.2);
          vec3 stellarGold = vec3(0.4, 0.3, 0.1);
          
          // Complex texture mapping
          float cloudDensity = fbm(vPosition * 2.0 + time * 0.1);
          float energyFlow = fbm(vPosition * 1.5 + time * 0.15);
          float plasmaStreams = fbm(vPosition * 3.0 + time * 0.08);
          
          // Color mixing based on density and flow
          vec3 color = mix(deepPurple, cosmicBlue, cloudDensity * 0.5 + 0.5);
          color = mix(color, nebulaPink, energyFlow * 0.3 + 0.3);
          color = mix(color, stellarGold, plasmaStreams * 0.2 + 0.1);
          
          // Add plasma currents with more sophistication
          float plasma1 = sin(vPosition.x * 8.0 + time * 0.3) * cos(vPosition.y * 6.0 + time * 0.2);
          float plasma2 = sin(vPosition.z * 10.0 + time * 0.25) * cos(vPosition.x * 7.0 + time * 0.35);
          float plasmaIntensity = (plasma1 + plasma2) * 0.1 + 0.95;
          
          color *= plasmaIntensity;
          
          // Audio reactivity - very minimal
          color *= (1.0 + audioIntensity * 0.1);
          
          // Solid nebula with density-based variation only
          float alpha = 0.8 + cloudDensity * 0.2;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  // Refined star field - smaller, less frequent pulsing
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000 * 3); // More stars but smaller
    const sizes = new Float32Array(3000);
    
    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
      sizes[i] = Math.random() * 0.8 + 0.2; // Much smaller stars
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);

  // Refined star material with subtle, less frequent flickering
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        varying float vFlicker;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Much subtler, slower flickering
          float flicker = sin(time * 0.8 + position.x * 50.0) * 0.1 + 0.9;
          vFlicker = flicker;
          
          gl_PointSize = size * flicker * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vFlicker;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - (dist / 0.5);
          alpha *= vFlicker;
          
          // Subtle blue-white star color
          vec3 starColor = vec3(0.9, 0.95, 1.0);
          gl_FragColor = vec4(starColor, alpha * 1.2);
        }
      `,
      transparent: true,
    });
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    
    // Audio analysis
    const avgVolume = data.length > 0 ? Array.from(data.slice(0, 32)).reduce((sum, val) => sum + val, 0) / 32 : 0;
    const audioIntensity = avgVolume / 50;
    
    // Update nebula material
    if (nebulaRef.current?.material && nebulaRef.current.material instanceof THREE.ShaderMaterial) {
      nebulaRef.current.material.uniforms.time.value = timeRef.current;
      nebulaRef.current.material.uniforms.audioIntensity.value = audioIntensity;
    }
    
    // Update star material
    if (starsRef.current?.material) {
      (starsRef.current.material as THREE.ShaderMaterial).uniforms.time.value = timeRef.current;
    }
    
    // Very slow nebula rotation
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += delta * 0.02;
      nebulaRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <group>
      {/* Refined star field */}
      <points ref={starsRef} geometry={starGeometry} material={starMaterial} />
      
      {/* Cloud-like nebula with glow */}
      <mesh ref={nebulaRef} scale={[6, 4, 6]}>
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={nebulaMaterial} attach="material" />
      </mesh>
      
      {/* Nebula glow effect */}
      <mesh scale={[8, 6, 8]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#4a2c6a" 
          transparent 
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Subtle ambient lighting for depth */}
      <ambientLight intensity={0.08} color="#1a1a2e" />
      <pointLight position={[20, 10, 20]} intensity={0.15} color="#6a4c93" distance={50} />
      <pointLight position={[-15, -10, 15]} intensity={0.1} color="#9a6eae" distance={40} />
    </group>
  );
};

export default ZeroScene;


