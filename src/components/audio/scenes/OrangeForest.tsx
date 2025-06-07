import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useAudioAnalyser } from '../useAudioAnalyser';

/**
 * FireFlyMaterial class rendering firefly particles with customizable properties.
 */
class FireFlyMaterial extends THREE.ShaderMaterial {
  constructor(options: { uTime?: number; uFireFlyRadius?: number; uColor?: THREE.Color } = {}) {
    const { uTime = 0, uFireFlyRadius = 0.1, uColor = new THREE.Color('#ffffff') } = options;

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
          float displacementX = sin(uTime + float(gl_InstanceID) * 0.10) * 0.3;
          float displacementY = sin(uTime + float(gl_InstanceID) * 0.15) * 0.3;
          float displacementZ = sin(uTime + float(gl_InstanceID) * 0.13) * 0.3;

          float pulseSpeed = 1.2; // Slower pulse
          float pulsePhase = float(gl_InstanceID) * 0.8;
          float pulse = sin(uTime * pulseSpeed + pulsePhase) * 0.5 + 0.5;
          
          float dramaticPulse = pulse * pulse * pulse;
          float minScale = 0.05;
          float maxScale = 1.0;
          float scale = mix(minScale, maxScale, dramaticPulse);

          float rotation = 0.0;
          vec2 rotatedPosition = vec2(
            cos(rotation) * position.x - sin(rotation) * position.y,
            sin(rotation) * position.x + cos(rotation) * position.y
          ) * scale;

          vec4 finalPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          finalPosition.xy += rotatedPosition;

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

          float flash = sin(uTime * 3.0 + vOffset * 0.12) * 0.5 + 0.5;
          float alpha = clamp((glow + disk) * flash, 0.0, 1.0);

          vec3 glowColor = uColor * 3. * flash;
          vec3 fireFlyColor = uColor * 3.;

          vec3 finalColor = mix(glowColor, fireFlyColor, disk);

          gl_FragColor = vec4(finalColor, alpha);
        }`
    });
  }

  updateTime(time: number): void {
    this.uniforms.uTime.value = time;
  }
}

const OrangeForestScene: React.FC = () => {
  const orbRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const data = useAudioAnalyser();
  const [isSceneActive, setIsSceneActive] = React.useState(true);
  const { camera, scene } = useThree();
  
  // Song duration constants for moon arc
  const SONG_DURATION = 163; // 2:43 in seconds
  const ARC_START_X = -8; // Closer left side for better visibility
  const ARC_END_X = 8; // Right side of visible area
  const ARC_HEIGHT = 1; // Even lower peak height
  const ARC_BASE_Y = 2.0; // Even lower in the sky
  const ARC_Z = -10; // Much closer to camera for better visibility

  // Firefly material and geometry
  const fireflyMaterial = useMemo(() => {
    return new FireFlyMaterial({
      uTime: 0,
      uFireFlyRadius: 0.15, // Larger radius for better visibility
      uColor: new THREE.Color(0xff66bb) // Even pinker
    });
  }, []);

  const fireflyGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(0.35, 0.35); // Smaller size
  }, []);

  // Initialize firefly positions
  const fireflyData = useMemo(() => {
    const data = [];
    const numFireflies = 5; // Even fewer fireflies
    
    for (let i = 0; i < numFireflies; i++) {
      data.push({
        startX: (Math.random() - 0.5) * 15, // Closer to camera view
        startY: Math.random() * 3 + 0.5, // Even lower positioning
        startZ: (Math.random() - 0.5) * 10 - 10, // In front of camera (negative Z)
        speedX: (Math.random() - 0.5) * 0.25, // Slower movement
        speedY: (Math.random() - 0.5) * 0.2, // Slower movement
        speedZ: (Math.random() - 0.5) * 0.25, // Slower movement
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        amplitude: Math.random() * 2 + 1,
        frequency: Math.random() * 0.25 + 0.2, // Slower overall frequency
      });
    }
    
    return data;
  }, []);

  // Create individual grid lines with traveling pulses (like BlockScene)
  const gridLines = useMemo(() => {
    const lines = [];
    const gridSize = 200;
    const gridSpacing = 5;
    const numLines = Math.floor(gridSize / gridSpacing);
    
    // Create line material for individual pulses
    const createLineMaterial = (delay: number, lineType: string = 'horizontal') => {
      return new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          audioLevel: { value: 0 },
          isPlaying: { value: 0 },
          delay: { value: delay },
          lineType: { value: lineType === 'horizontal' ? 0.0 : 1.0 }
        },
        vertexShader: `
          uniform float time;
          uniform float audioLevel;
          uniform float isPlaying;
          uniform float delay;
          uniform float lineType;
          varying float vPulse;
          
          void main() {
            // Calculate correct progress based on line type
            float lineProgress;
            if (lineType < 0.5) {
              // Horizontal line: use X coordinate (left to right)
              lineProgress = (position.x + 100.0) / 200.0;
            } else {
              // Vertical line: use Z coordinate (front to back)
              lineProgress = (position.z + 100.0) / 200.0;
            }
            
            // Single traveling wave - slow but visible
            float wavePosition = mod(time * 0.03 + delay, 1.0); // Slightly faster so we can see it
            
            // Create wider, hazier traveling pulse with clean edges
            float distance = abs(lineProgress - wavePosition);
            float pulse = smoothstep(0.12, 0.03, distance); // Main pulse
            
            // Add subtle hazy glow that doesn't persist
            float glow = smoothstep(0.18, 0.08, distance) * 0.2; // Tighter, dimmer glow
            pulse = max(pulse, glow);
            
            // Ensure clean cutoff - no static lighting
            if (distance > 0.2) pulse = 0.0;
            
            // Strong audio enhancement when music plays
            pulse *= (0.5 + audioLevel * 1.5) * isPlaying;
            
            vPulse = pulse;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying float vPulse;
          
          void main() {
            // Simple light pink and white (like BlockScene simplicity)
            vec3 baseColor = vec3(0.95, 0.95, 0.98); // Very light off-white
            vec3 pinkColor = vec3(1.0, 0.8, 0.9); // Light pink
            
            // Simple color mixing
            vec3 finalColor = mix(baseColor, pinkColor, vPulse);
            
            // Clear alpha for visible pulses
            float alpha = 0.2 + vPulse * 0.8;
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true
      });
    };

    // Create horizontal lines (left to right movement)
    for (let i = 0; i <= numLines; i++) {
      const z = -gridSize/2 + i * gridSpacing;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        -gridSize/2, 0, z,
        gridSize/2, 0, z
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      lines.push({
        geometry,
        material: createLineMaterial(i * 0.5, 'horizontal'), // Mark as horizontal
        position: [0, -12, -80],
        rotation: [0, 0, 0]
      });
    }

    // Create vertical lines (front to back movement)
    for (let i = 0; i <= numLines; i++) {
      const x = -gridSize/2 + i * gridSpacing;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([
        x, 0, -gridSize/2,
        x, 0, gridSize/2
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      lines.push({
        geometry,
        material: createLineMaterial(i * 0.6, 'vertical'), // Mark as vertical
        position: [0, -12, -80],
        rotation: [0, 0, 0]
      });
    }

    return lines;
  }, []);

  // Camera setup for this scene - start from bird's eye view and swoop to landscape
  useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    const originalFog = scene.fog;
    const originalBackground = scene.background;
    
    // Set initial bird's eye view position (high up looking down)
    camera.position.set(0, 25, 15);
    camera.lookAt(0, 0, 0);
    
    // Set scene atmosphere
    scene.fog = new THREE.Fog("#1a0a0f", 1, 50); // Dark forest fog
    scene.background = new THREE.Color("#0a0408"); // Very dark background
    
    return () => {
      // Restore original settings when component unmounts
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
      scene.fog = originalFog;
      scene.background = originalBackground;
    };
  }, [camera, scene]);

  // Scene activation detection and reset
  React.useEffect(() => {
    setIsSceneActive(true);
    timeRef.current = 0; // Reset time when scene activates
    
    return () => {
      setIsSceneActive(false);
    };
  }, []);

  useFrame((_, delta) => {
    // Smooth camera swooping from bird's eye to landscape view (like RogueWave)
    const targetPos = new THREE.Vector3(0, 2, 8); // Landscape position - slightly higher and further back
    camera.position.lerp(targetPos, 0.015); // Slightly slower swoop for dramatic effect
    camera.lookAt(0, 0, -5); // Look forward into the forest scene
    
    // Check if there's audio activity (more robust detection)
    const avgVolume = data.length > 0 ? Array.from(data.slice(0, 32)).reduce((sum, val) => sum + val, 0) / 32 : 0;
    const isAudioActive = data.length > 0 && avgVolume > 5; // Threshold for detecting audio
    
    // Only advance time when music is playing
    if (isAudioActive) {
      timeRef.current += delta;
    }
    
    // Always ensure orb exists
    if (orbRef.current) {
      // Calculate progress through the song (0 to 1)
      const progress = Math.min(timeRef.current / SONG_DURATION, 1);
      
      // Calculate arc position
      const arcX = ARC_START_X + (ARC_END_X - ARC_START_X) * progress;
      
      // Create parabolic arc for Y position (starts low, peaks in middle, ends low)
      const arcY = ARC_BASE_Y + Math.sin(progress * Math.PI) * ARC_HEIGHT;
      
      // Update orb position along the arc
      orbRef.current.position.x = arcX;
      orbRef.current.position.y = arcY;
      orbRef.current.position.z = ARC_Z; // Keep consistent Z position
      
      if (isAudioActive) {
        // Slow rotation while moving
        orbRef.current.rotation.y += delta * 0.1;
        orbRef.current.rotation.x += delta * 0.05;
      }
      
      // Simple audio detection (like BlockScene)
      const isPlaying = avgVolume > 5 ? 1.0 : 0.0;
      
      // Update all grid line materials - simple and clean
      gridLines.forEach(line => {
        if (line.material.uniforms) {
          line.material.uniforms.time.value = timeRef.current;
          line.material.uniforms.audioLevel.value = Math.max(avgVolume / 120, 0.05);
          line.material.uniforms.isPlaying.value = isPlaying;
        }
      });
      
      // Update firefly positions
      if (instancedMeshRef.current) {
        const matrix = new THREE.Matrix4();
        
        fireflyData.forEach((firefly, index) => {
          const t = timeRef.current * firefly.frequency;
          
          // Gentle floating movement through the forest
          const x = firefly.startX + 
            Math.sin(t * firefly.speedX + firefly.phaseX) * firefly.amplitude;
          
          const y = firefly.startY + 
            Math.sin(t * firefly.speedY + firefly.phaseY) * (firefly.amplitude * 0.4);
          
          const z = firefly.startZ + 
            Math.cos(t * firefly.speedZ + firefly.phaseZ) * firefly.amplitude;
          
          // Keep fireflies in visible bounds
          const boundedX = Math.max(-10, Math.min(10, x));
          const boundedY = Math.max(-1, Math.min(5, y)); // Lower bounds
          const boundedZ = Math.max(-20, Math.min(-5, z)); // Always in front of camera
          
          // Set instance matrix
          matrix.setPosition(boundedX, boundedY, boundedZ);
          instancedMeshRef.current!.setMatrixAt(index, matrix);
        });
        
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        
        // Update firefly material time
        fireflyMaterial.updateTime(timeRef.current);
      }
      
      // When music stops, orb stays in its current position (no animation updates)
      // But the orb itself remains visible and rendered
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      
      {/* Individual grid lines with traveling pulses */}
      {gridLines.map((line, index) => (
        <group key={index} position={line.position as [number, number, number]} rotation={line.rotation as [number, number, number]}>
          <line>
            <primitive object={line.geometry} />
            <primitive object={line.material} />
          </line>
        </group>
      ))}
      
      {/* Wireframe orb - moon traveling across the sky */}
      <mesh ref={orbRef} position={[ARC_START_X, ARC_BASE_Y, ARC_Z]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshBasicMaterial 
          color="#f8bbd9" 
          wireframe
        />
      </mesh>
      
      {/* Orange fireflies floating through the forest */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[fireflyGeometry, fireflyMaterial, fireflyData.length]}
      />
      
      <group position={[0, -10, 0]}>
        <ContactShadows scale={30} blur={15} far={30} />
      </group>
    </group>
  );
};

export default OrangeForestScene;