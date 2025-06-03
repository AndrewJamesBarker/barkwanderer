import React from "react";
import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";

/**
 * Options for the FireFlyMaterial constructor.
 */
interface FireFlyMaterialOptions {
  uTime?: number; // Time for animation
  uFireFlyRadius?: number; // Radius for fireflies
  uColor?: THREE.Color; // Color for fireflies
}

/**
 * FireFlyMaterial class rendering firefly particles with customizable properties.
 */
class FireFlyMaterial extends THREE.ShaderMaterial {
  constructor(options: FireFlyMaterialOptions = {}) {
    // Destructure options with default values
    const { uTime = 0, uFireFlyRadius = 0.1, uColor = new THREE.Color('#ffffff') } = options;

    // Call the parent constructor
    super({
      transparent: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: uTime },
        uFireFlyRadius: { value: uFireFlyRadius },
        uColor: { value: uColor }
      },
      vertexShader: `uniform float uTime;
        varying vec2 vUv;
        varying float vOffset;

        void main() {
          // Apply noise to the particle motion
          float displacementX = sin(uTime + float(gl_InstanceID) * 0.10) * 0.3;
          float displacementY = sin(uTime + float(gl_InstanceID) * 0.15) * 0.3;
          float displacementZ = sin(uTime + float(gl_InstanceID) * 0.13) * 0.3;

          // Dramatic pulsing effect - shrink all the way down and back up
          float pulseSpeed = 2.0; // Speed of pulsing
          float pulsePhase = float(gl_InstanceID) * 0.8; // Different phase for each firefly
          float pulse = sin(uTime * pulseSpeed + pulsePhase) * 0.5 + 0.5; // 0 to 1
          
          // Make pulse more dramatic - goes almost to zero
          float dramaticPulse = pulse * pulse * pulse; // Cubic for more dramatic effect
          float minScale = 0.05; // Very small minimum
          float maxScale = 1.0;
          float scale = mix(minScale, maxScale, dramaticPulse);

          // Make the object face the camera like a pointMaterial.
          float rotation = 0.0;
          vec2 rotatedPosition = vec2(
            cos(rotation) * position.x - sin(rotation) * position.y,
            sin(rotation) * position.x + cos(rotation) * position.y
          ) * scale; // Apply dramatic scaling

          vec4 finalPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          finalPosition.xy += rotatedPosition;

          // Make the particles move (reduced movement)
          finalPosition.x += displacementX;
          finalPosition.y += displacementY;
          finalPosition.z += displacementZ;

          gl_Position = projectionMatrix * finalPosition;

          vUv = uv;
          vOffset = float(gl_InstanceID);
        }`,
      fragmentShader: `varying vec2 vUv;
        uniform float uTime;
        uniform float uFireFlyRadius;
        uniform vec3 uColor;
        varying float vOffset;

        void main() {
          float distance = length(vUv - 0.5);
          float glow = smoothstep(0.50, uFireFlyRadius, distance);
          float disk = smoothstep(uFireFlyRadius, uFireFlyRadius - 0.01, distance);

          // Add a flashing effect using the time uniform
          float flash = sin(uTime * 3.0 + vOffset * 0.12) * 0.5 + 0.5; // Adjust the frequency and amplitude as desired
          float alpha = clamp((glow + disk) * flash, 0.0, 1.0);

          vec3 glowColor = uColor * 3. * flash;
          vec3 fireFlyColor = uColor * 3.;

          vec3 finalColor = mix(glowColor, fireFlyColor, disk);

          gl_FragColor = vec4(finalColor, alpha);
        }`
    });
  }

  /**
   * Update time uniform for animation.
   * @param {number} time - The time to update the uniform with.
   */
  updateTime(time: number): void {
    this.uniforms.uTime.value = time;
  }

  /**
   * Set the firefly color uniform.
   * @param {THREE.Color} color - The color for the fireflies.
   */
  setColor(color: THREE.Color): void {
    this.uniforms.uColor.value.copy(color);
  }

  /**
   * Set the firefly radius uniform.
   * @param {number} radius - The radius for fireflies.
   */
  setFireFlyRadius(radius: number): void {
    this.uniforms.uFireFlyRadius.value = radius;
  }
}

const TheBlockScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const data = useAudioAnalyser();
  const { camera } = useThree();
  
  const timeRef = useRef(0);

  // Set bird's eye view camera angle for this scene only
  React.useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    
    // Position camera closer for zoomed-in view
    camera.position.set(0, 12, 0);
    camera.lookAt(0, 0, 0);
    
    return () => {
      // Restore original camera position when component unmounts
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
    };
  }, [camera]);

  // Circuit board base material - translucent and elegant
  const baseMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#5a4a5a", // More subtle, elegant background
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.3, // Much more translucent
    });
  }, []);

  // Create multiple layer materials for depth - brighter lights
  const createLayerMaterial = (opacity: number, brightness: number) => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioLevel: { value: 0 },
        isPlaying: { value: 0 },
        fiberId: { value: 0 },
        baseColor: { value: new THREE.Color(0x4a3a4a).multiplyScalar(brightness * 0.7) }, // Back to more subtle base
        currentColor: { value: new THREE.Color(0xff88dd).multiplyScalar(brightness * 1.2) }, // Brighter traveling light
        glowColor: { value: new THREE.Color(0xffffff).multiplyScalar(brightness * 0.8) }, // Bright white glow
        layerOpacity: { value: opacity },
      },
      vertexShader: `
        uniform float time;
        uniform float audioLevel;
        uniform float isPlaying;
        uniform float fiberId;
        varying vec3 vPosition;
        varying float vFiberId;
        varying vec2 vUv;
        
        void main() {
          vPosition = position;
          vFiberId = fiberId;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float audioLevel;
        uniform float isPlaying;
        uniform vec3 baseColor;
        uniform vec3 currentColor;
        uniform vec3 glowColor;
        uniform float layerOpacity;
        varying vec3 vPosition;
        varying float vFiberId;
        varying vec2 vUv;
        
        void main() {
          // Create traveling light effect - SLOWER and SHORTER pulses
          float lineProgress = vUv.x; // Use UV coordinate for position along line
          
          // Much slower and more mellow traveling pulse
          float travelSpeed = 0.4; // Even slower for mellow feel
          float pulsePosition = mod(time * travelSpeed * isPlaying + vFiberId * 0.5, 1.0);
          float travelPulse = 1.0 - smoothstep(0.0, 0.08, abs(lineProgress - pulsePosition)); // Much shorter pulse
          
          // Secondary pulse - also slower and shorter
          float pulse2Position = mod(-time * travelSpeed * 0.5 * isPlaying + vFiberId * 0.3, 1.0);
          float travelPulse2 = 1.0 - smoothstep(0.0, 0.06, abs(lineProgress - pulse2Position)); // Even shorter
          
          // Brighter base intensity
          float baseIntensity = 0.15;
          
          // Enhanced audio-reactive traveling intensity
          float audioReactivity = audioLevel * 0.8 + 0.2; // Stronger response
          float totalPulse = (travelPulse + travelPulse2 * 0.7) * audioReactivity;
          
          // Brighter color mixing
          vec3 color = baseColor;
          color = mix(color, currentColor, baseIntensity + totalPulse * 1.0);
          color = mix(color, glowColor, totalPulse * 0.6);
          
          // Enhanced visibility
          float alpha = (baseIntensity + totalPulse * 0.8) * layerOpacity;
          alpha = clamp(alpha, 0.1, 0.9);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
    });
  };

  // Structured fiber trace material - main layer
  const fiberMaterial = useMemo(() => createLayerMaterial(1.0, 1.0), []);

  // Floating electrical orb material - simplified for visibility
  const orbMaterial = useMemo(() => {
    return new FireFlyMaterial({
      uTime: 0,
      uFireFlyRadius: 0.08, // Smaller radius
      uColor: new THREE.Color(0xff66dd)
    });
  }, []);

  // Remove the organic geometry for now - use simple sphere
  const simpleFireflyGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(0.2, 0.2); // Much smaller plane
  }, []);

  // Instanced mesh ref
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // Initialize firefly positions
  const fireflyData = useMemo(() => {
    const data = [];
    const numFireflies = 12; // Increased from 8 to 12
    
    for (let i = 0; i < numFireflies; i++) {
      data.push({
        startX: (Math.random() - 0.5) * 12,
        startY: Math.random() * 3 + 2,
        startZ: (Math.random() - 0.5) * 12,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.5,
        speedZ: (Math.random() - 0.5) * 0.8,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        amplitude: Math.random() * 2 + 1.5,
        frequency: Math.random() * 0.4 + 0.3,
      });
    }
    
    return data;
  }, []);

  // Create intelligent, structured fiber network with multiple layers - LESS BUSY
  const createMatrixLayer = (gridSize: number, spacing: number, fiberId: number, material: THREE.ShaderMaterial) => {
    const fibers: { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial }[] = [];
    let currentFiberId = fiberId;
    
    // Smooth curve creation function
    const createStraightPath = (startX: number, startZ: number, endX: number, endZ: number, yOffset: number = 0) => {
      const geometry = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const uvs: number[] = [];
      const segments = 40;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        
        // Straight line interpolation
        const x = startX + (endX - startX) * t;
        const z = startZ + (endZ - startZ) * t;
        
        // Very subtle height variation for depth
        const y = yOffset;
        
        points.push(new THREE.Vector3(x, y, z));
        uvs.push(t, 0); // UV coordinate for traveling effect
      }
      
      geometry.setFromPoints(points);
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      
      const layerMaterial = material.clone();
      layerMaterial.uniforms.fiberId.value = currentFiberId++;
      
      return { geometry, material: layerMaterial };
    };
    
    // Horizontal grid lines
    for (let z = -gridSize; z <= gridSize; z += spacing) {
      fibers.push(createStraightPath(-gridSize, z, gridSize, z));
    }
    
    // Vertical grid lines
    for (let x = -gridSize; x <= gridSize; x += spacing) {
      fibers.push(createStraightPath(x, -gridSize, x, gridSize));
    }
    
    // Reduced crisscross diagonal matrices - less busy
    const diagonalSpacing = spacing * 4; // Wider spacing for less busy look
    
    // Only main diagonals (45 degrees) - reduced density
    for (let offset = -gridSize; offset <= gridSize; offset += diagonalSpacing) {
      // Top-left to bottom-right
      if (offset >= -gridSize && offset <= gridSize) {
        fibers.push(createStraightPath(-gridSize, offset, gridSize - offset, gridSize));
        if (offset !== 0) {
          fibers.push(createStraightPath(offset, -gridSize, gridSize, gridSize - offset));
        }
      }
    }
    
    return fibers;
  };

  // Create multiple matrix layers - smaller and less dense + distant layer
  const allLayers = useMemo(() => {
    let fiberId = 0;
    const layers = [];
    
    // Main layer (closest to camera) - smaller grid, wider spacing
    const mainLayer = createMatrixLayer(12, 1.5, fiberId, fiberMaterial);
    fiberId += mainLayer.length;
    layers.push(...mainLayer.map(fiber => ({ ...fiber, yOffset: 0 })));
    
    // Second layer (deeper) - even less dense
    const layer2Material = createLayerMaterial(0.6, 0.7);
    const layer2 = createMatrixLayer(10, 2.0, fiberId, layer2Material);
    fiberId += layer2.length;
    layers.push(...layer2.map(fiber => ({ ...fiber, yOffset: -0.1 })));
    
    // Third layer (medium distance)
    const layer3Material = createLayerMaterial(0.4, 0.5);
    const layer3 = createMatrixLayer(18, 2.5, fiberId, layer3Material);
    fiberId += layer3.length;
    layers.push(...layer3.map(fiber => ({ ...fiber, yOffset: -0.4 })));
    
    // Fourth layer (far distance)
    const layer4Material = createLayerMaterial(0.25, 0.35);
    const layer4 = createMatrixLayer(22, 3.5, fiberId, layer4Material);
    fiberId += layer4.length;
    layers.push(...layer4.map(fiber => ({ ...fiber, yOffset: -0.6 })));
    
    // Fifth layer (very far in the distance) - much larger coverage
    const layer5Material = createLayerMaterial(0.15, 0.2);
    const layer5 = createMatrixLayer(30, 4.0, fiberId, layer5Material); // Even bigger grid
    fiberId += layer5.length;
    layers.push(...layer5.map(fiber => ({ ...fiber, yOffset: -1.2 }))); // Much farther back
    
    return layers;
  }, [fiberMaterial]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Extract audio data
    const avgVolume = data.length > 0 ? 
      Array.from(data.slice(0, 64)).reduce((sum, val) => sum + val, 0) / 64 : 0;
    
    // Detect if music is playing (lower threshold)
    const isPlaying = avgVolume > 1 ? 1.0 : 0.0;
    
    // Always animate for base electrical effect
    timeRef.current += delta;
    
    // Update instanced firefly positions
    if (instancedMeshRef.current) {
      const matrix = new THREE.Matrix4();
      
      fireflyData.forEach((firefly, index) => {
        const t = timeRef.current * firefly.frequency;
        
        // Simple floating movement
        const x = firefly.startX + 
          Math.sin(t * firefly.speedX + firefly.phaseX) * firefly.amplitude;
        
        const y = firefly.startY + 
          Math.sin(t * firefly.speedY + firefly.phaseY) * (firefly.amplitude * 0.5);
        
        const z = firefly.startZ + 
          Math.cos(t * firefly.speedZ + firefly.phaseZ) * firefly.amplitude;
        
        // Keep fireflies in clearly visible area
        const boundedX = Math.max(-10, Math.min(10, x));
        const boundedY = Math.max(1, Math.min(6, y));
        const boundedZ = Math.max(-10, Math.min(10, z));
        
        // Set instance matrix
        matrix.setPosition(boundedX, boundedY, boundedZ);
        instancedMeshRef.current!.setMatrixAt(index, matrix);
      });
      
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      
      // Update firefly material time
      if (orbMaterial instanceof FireFlyMaterial) {
        orbMaterial.updateTime(timeRef.current);
      }
    }
    
    // Update all layer materials
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Group) {
        child.children.forEach((lineChild) => {
          if (lineChild instanceof THREE.Line && lineChild.material instanceof THREE.ShaderMaterial) {
            lineChild.material.uniforms.time.value = timeRef.current;
            lineChild.material.uniforms.audioLevel.value = Math.max(avgVolume / 80, 0.05); // Much more subtle
            lineChild.material.uniforms.isPlaying.value = Math.max(isPlaying, 0.2); // Subtle base animation
          }
        });
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Much more subtle lighting */}
      <ambientLight intensity={0.05} color="#2a1a2a" />
      <pointLight 
        position={[0, 20, 0]} 
        intensity={0.2} 
        color="#c8a4d8" 
        distance={50}
      />
      
      {/* Circuit board base - positioned for bird's eye view */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <planeGeometry args={[50, 50]} />
        <primitive object={baseMaterial} />
      </mesh>
      
      {/* Multiple layered matrix grids */}
      {allLayers.map((layer, index) => (
        <group key={index} position={[0, layer.yOffset, 0]}>
          <line>
            <primitive object={layer.geometry} />
            <primitive object={layer.material} />
          </line>
        </group>
      ))}
      
      {/* Floating electrical orbs as instanced mesh */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[simpleFireflyGeometry, orbMaterial, fireflyData.length]}
      />
    </group>
  );
};

export default TheBlockScene;