import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";

// Create purple-tinted grass material with audio reactivity
const GrassMaterial = shaderMaterial(
  {
    bladeHeight: 1,
    time: 0,
    audioLevel: 0,
    tipColor: new THREE.Color(0.8, 0.3, 0.6).convertSRGBToLinear(), // Dark pink tip
    bottomColor: new THREE.Color(0.5, 0.2, 0.4).convertSRGBToLinear(), // Dark pink base
  },
  // Vertex Shader
  `
    precision mediump float;
    attribute vec3 offset;
    attribute vec4 orientation;
    attribute float halfRootAngleSin;
    attribute float halfRootAngleCos;
    attribute float stretch;
    uniform float time;
    uniform float bladeHeight;
    uniform float audioLevel;
    varying vec2 vUv;
    varying float frc;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    // Quaternion rotation
    vec3 rotateVectorByQuaternion(vec3 v, vec4 q) {
      return 2.0 * cross(q.xyz, v * q.w + cross(q.xyz, v)) + v;
    }
    
    // Quaternion slerp
    vec4 slerp(vec4 v0, vec4 v1, float t) {
      normalize(v0);
      normalize(v1);
      float dot_ = dot(v0, v1);
      if (dot_ < 0.0) {
        v1 = -v1;
        dot_ = -dot_;
      }
      const float DOT_THRESHOLD = 0.9995;
      if (dot_ > DOT_THRESHOLD) {
        vec4 result = t*(v1 - v0) + v0;
        normalize(result);
        return result;
      }
      float theta_0 = acos(dot_);
      float theta = theta_0*t;
      float sin_theta = sin(theta);
      float sin_theta_0 = sin(theta_0);
      float s0 = cos(theta) - dot_ * sin_theta / sin_theta_0;
      float s1 = sin_theta / sin_theta_0;
      return (s0 * v0) + (s1 * v1);
    }
    
    void main() {
      frc = position.y / float(bladeHeight);
      
      // Enhanced wind with audio reactivity
      float noise = 1.0 - (snoise(vec2((time - offset.x/50.0), (time - offset.z/50.0))));
      float windStrength = 0.15 + audioLevel * 0.3; // Audio-reactive wind
      
      vec4 direction = vec4(0.0, halfRootAngleSin, 0.0, halfRootAngleCos);
      direction = slerp(direction, orientation, frc);
      
      vec3 vPosition = vec3(position.x, position.y + position.y * stretch, position.z);
      vPosition = rotateVectorByQuaternion(vPosition, direction);
      
      // Apply wind with audio enhancement
      float halfAngle = noise * windStrength;
      vPosition = rotateVectorByQuaternion(vPosition, normalize(vec4(sin(halfAngle), 0.0, -sin(halfAngle), cos(halfAngle))));
      
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(offset + vPosition, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision mediump float;
    uniform vec3 tipColor;
    uniform vec3 bottomColor;
    uniform float audioLevel;
    varying vec2 vUv;
    varying float frc;
    
    void main() {
      // Create grass blade shape
      float alpha = 1.0 - abs(vUv.x - 0.5) * 2.0; // Blade shape
      alpha *= (1.0 - vUv.y * vUv.y); // Fade to tip
      
      if(alpha < 0.1) discard;
      
      // Purple gradient with audio-reactive glow
      vec3 grassColor = mix(bottomColor, tipColor, frc);
      
      // Add audio-reactive purple glow
      vec3 glowColor = vec3(0.8, 0.4, 1.0);
      grassColor = mix(grassColor, glowColor, audioLevel * 0.3 * frc);
      
             gl_FragColor = vec4(grassColor, alpha);
    }
  `,
  (self: any) => {
    if (self) {
      self.side = THREE.DoubleSide;
      self.transparent = true;
    }
  }
);

extend({ GrassMaterial });

// Declare module for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      grassMaterial: any;
    }
  }
}

// Simple noise function for ground generation
function simpleNoise2D(x: number, z: number): number {
  return Math.sin(x * 0.02) * Math.cos(z * 0.02) * 0.5 + 
         Math.sin(x * 0.01) * Math.cos(z * 0.01) * 1.0;
}

function getAttributeData(instances: number, width: number) {
  const offsets: number[] = [];
  const orientations: number[] = [];
  const stretches: number[] = [];
  const halfRootAngleSin: number[] = [];
  const halfRootAngleCos: number[] = [];

  const min = -0.25;
  const max = 0.25;

  for (let i = 0; i < instances; i++) {
    // Offset of the roots - much denser clustering
    const clusterSize = width * 0.3; // Use only 30% of the available space
    const offsetX = (Math.random() - 0.5) * clusterSize;
    const offsetZ = (Math.random() - 0.5) * clusterSize;
    const offsetY = simpleNoise2D(offsetX, offsetZ);
    offsets.push(offsetX, offsetY, offsetZ);

    // Growth directions
    let angle = Math.PI - Math.random() * (2 * Math.PI);
    halfRootAngleSin.push(Math.sin(0.5 * angle));
    halfRootAngleCos.push(Math.cos(0.5 * angle));

    // Create quaternion for orientation
    let quaternion = new THREE.Vector4();
    
    // Rotate around Y
    let RotationAxis = new THREE.Vector3(0, 1, 0);
    let x = RotationAxis.x * Math.sin(angle / 2.0);
    let y = RotationAxis.y * Math.sin(angle / 2.0);
    let z = RotationAxis.z * Math.sin(angle / 2.0);
    let w = Math.cos(angle / 2.0);
    quaternion.set(x, y, z, w).normalize();

    // Rotate around X
    angle = Math.random() * (max - min) + min;
    RotationAxis = new THREE.Vector3(1, 0, 0);
    x = RotationAxis.x * Math.sin(angle / 2.0);
    y = RotationAxis.y * Math.sin(angle / 2.0);
    z = RotationAxis.z * Math.sin(angle / 2.0);
    w = Math.cos(angle / 2.0);
    
    const quaternion2 = new THREE.Vector4(x, y, z, w).normalize();
    
    // Multiply quaternions
    const qx = quaternion.x * quaternion2.w + quaternion.y * quaternion2.z - quaternion.z * quaternion2.y + quaternion.w * quaternion2.x;
    const qy = -quaternion.x * quaternion2.z + quaternion.y * quaternion2.w + quaternion.z * quaternion2.x + quaternion.w * quaternion2.y;
    const qz = quaternion.x * quaternion2.y - quaternion.y * quaternion2.x + quaternion.z * quaternion2.w + quaternion.w * quaternion2.z;
    const qw = -quaternion.x * quaternion2.x - quaternion.y * quaternion2.y - quaternion.z * quaternion2.z + quaternion.w * quaternion2.w;
    
    orientations.push(qx, qy, qz, qw);

    // Height variety
    if (i < instances / 3) {
      stretches.push(Math.random() * 1.8);
    } else {
      stretches.push(Math.random());
    }
  }

  return {
    offsets,
    orientations,
    stretches,
    halfRootAngleCos,
    halfRootAngleSin,
  };
}

const FlowersScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<any>(null);
  const data = useAudioAnalyser();
  const smoothedAudioRef = useRef(0);
  const { camera } = useThree();

  // Camera reset for FlowersScene
  React.useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    
    // Reset camera to default position for FlowersScene
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    return () => {
      // Restore original camera position when component unmounts
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
    };
  }, [camera]);

  // Grass configuration
  const grassOptions = { bW: 0.06, bH: 0.5, joints: 3 };
  const width = 200;
  const instances = 142000;

  // Generate attribute data
  const attributeData = useMemo(() => getAttributeData(instances, width), [instances, width]);
  
  // Create base geometry for grass blades
  const baseGeom = useMemo(() => {
    const { bW, bH, joints } = grassOptions;
    return new THREE.PlaneGeometry(bW, bH, 1, joints).translate(0, bH / 2, 0);
  }, [grassOptions]);

  // Create ground geometry
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, width, 32, 32);
    const positions = geo.attributes.position.array as Float32Array;
    
    // Modify vertices for terrain
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = simpleNoise2D(x, z); // Y position
    }
    
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.rotateX(-Math.PI / 2);
    
    return geo;
  }, [width]);

    // Audio-reactive animation
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4;
      
      // Calculate audio level from only the lowest frequencies (very stable)
      const bassRange = data.length > 0 ? 
        Array.from(data.slice(0, 8)).reduce((sum: number, val: number) => sum + val, 0) / 8 : 0;
      
      // Smooth the audio response with very heavy damping
      const targetLevel = bassRange > 50 ? bassRange / 200 : 0.05; // Higher threshold at 50
      smoothedAudioRef.current += (targetLevel - smoothedAudioRef.current) * 0.015; // Much slower lerp
      
      materialRef.current.uniforms.audioLevel.value = Math.max(smoothedAudioRef.current, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, -8]} rotation={[0, 0, 0]}>
      {/* Ambient lighting for the scene */}
      <ambientLight intensity={0.3} color="#9d4edd" />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.5} 
        color="#ffffff"
        castShadow
      />
      
      {/* Grass field */}
      <mesh>
        <instancedBufferGeometry 
          index={baseGeom.index} 
          attributes-position={baseGeom.attributes.position} 
          attributes-uv={baseGeom.attributes.uv}
        >
          <instancedBufferAttribute 
            attach="attributes-offset" 
            args={[new Float32Array(attributeData.offsets), 3]} 
          />
          <instancedBufferAttribute 
            attach="attributes-orientation" 
            args={[new Float32Array(attributeData.orientations), 4]} 
          />
          <instancedBufferAttribute 
            attach="attributes-stretch" 
            args={[new Float32Array(attributeData.stretches), 1]} 
          />
          <instancedBufferAttribute 
            attach="attributes-halfRootAngleSin" 
            args={[new Float32Array(attributeData.halfRootAngleSin), 1]} 
          />
          <instancedBufferAttribute 
            attach="attributes-halfRootAngleCos" 
            args={[new Float32Array(attributeData.halfRootAngleCos), 1]} 
          />
        </instancedBufferGeometry>
        <primitive object={new (GrassMaterial as any)()} ref={materialRef} toneMapped={false} />
      </mesh>
      
             {/* Ground */}
       <mesh position={[0, -0.5, 0]} geometry={groundGeo} receiveShadow>
         <meshStandardMaterial color="#4a2c3a" />
       </mesh>
    </group>
  );
};

export default FlowersScene;


