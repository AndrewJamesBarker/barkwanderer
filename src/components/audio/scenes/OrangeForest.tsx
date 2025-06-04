import React, { Suspense, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useAudioAnalyser } from '../useAudioAnalyser';

const MODELS = {
  Beech: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/tree-beech/model.gltf',
  Lime: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/tree-lime/model.gltf',
  Spruce: 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/tree-spruce/model.gltf'
};

function Model({ url, position, ...props }: { url: string; position: [number, number, number]; [key: string]: any }) {
  const { scene } = useGLTF(url);
  const data = useAudioAnalyser();
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const [isModelReady, setIsModelReady] = React.useState(false);

  // Reset time when component mounts or scene changes
  React.useEffect(() => {
    timeRef.current = 0;
    setIsModelReady(false);
    
    // Cleanup function to dispose of resources when component unmounts
    return () => {
      if (groupRef.current) {
        groupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }
    };
  }, [url]); // Reset when URL changes

  // Wireframe material with full pastel spectrum based on frequency
  const wireframeMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        lowFreq: { value: 0 },
        midFreq: { value: 0 },
        highFreq: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float lowFreq;
        uniform float midFreq;
        uniform float highFreq;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        
        void main() {
          // Pure white wireframes with subtle shading
          vec3 baseColor = vec3(1.0, 1.0, 1.0);
          
          // Add subtle depth shading based on normal
          vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.5));
          float lightIntensity = dot(normalize(vNormal), lightDirection);
          lightIntensity = lightIntensity * 0.3 + 0.7; // Subtle shading
          
          baseColor *= lightIntensity;
          
          gl_FragColor = vec4(baseColor, 0.9);
        }
      `,
      wireframe: true,
      transparent: true,
    });
  }, []);

  // Replace all materials with wireframe
  React.useEffect(() => {
    if (scene && wireframeMaterial) {
      // Clear any existing content first
      if (groupRef.current) {
        groupRef.current.clear();
      }

      // Always work with a fresh clone to avoid mutating the cached scene
      const clonedScene = scene.clone();
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = wireframeMaterial.clone(); // Clone material too
        }
      });
      
      // Store the prepared clone
      if (groupRef.current) {
        groupRef.current.add(clonedScene);
        setIsModelReady(true);
      }
    }
  }, [scene, wireframeMaterial]); // React to both scene and material changes

  useFrame((_, delta) => {
    if (!isModelReady || !groupRef.current) return;

    timeRef.current += delta;
    
    // Update shader uniforms with frequency range data (safe to do always)
    if (wireframeMaterial.uniforms) {
      if (data.length > 0) {
        // Sample different frequency ranges from the audio data
        const lowFreqData = Array.from(data.slice(0, 8));    // Bass frequencies
        const midFreqData = Array.from(data.slice(8, 20));   // Mid frequencies
        const highFreqData = Array.from(data.slice(20, 32)); // High frequencies
        
        const avgLowFreq = lowFreqData.reduce((sum, val) => sum + val, 0) / 8;
        const avgMidFreq = midFreqData.reduce((sum, val) => sum + val, 0) / 12;
        const avgHighFreq = highFreqData.reduce((sum, val) => sum + val, 0) / 12;
        
        wireframeMaterial.uniforms.lowFreq.value = avgLowFreq / 80;    // More sensitive
        wireframeMaterial.uniforms.midFreq.value = avgMidFreq / 80;    // More sensitive
        wireframeMaterial.uniforms.highFreq.value = avgHighFreq / 80;  // More sensitive
      } else {
        // Reset audio values when no data
        wireframeMaterial.uniforms.lowFreq.value = 0;
        wireframeMaterial.uniforms.midFreq.value = 0;
        wireframeMaterial.uniforms.highFreq.value = 0;
      }
      wireframeMaterial.uniforms.time.value = timeRef.current;
    }
    
    // Always ensure the group exists and maintain basic transformations
    if (groupRef.current) {
      if (data.length > 0) {
        const avgVolume = Array.from(data.slice(0, 32)).reduce((sum, val) => sum + val, 0) / 32;
        
        // Very gentle swaying
        const sway = Math.sin(timeRef.current * 0.2) * 0.005;
        groupRef.current.rotation.z = sway;
        groupRef.current.rotation.x = sway * 0.3;
        
        // Much less sensitive audio scaling
        const scale = 1 + (avgVolume / 5000) * Math.sin(timeRef.current * 0.3);
        groupRef.current.scale.setScalar(scale * 0.6); // Bigger tree
      } else {
        // Maintain basic scale when no audio
        groupRef.current.scale.setScalar(0.6);
        groupRef.current.rotation.z = 0;
        groupRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} {...props}>
      {/* Scene will be added via useEffect to avoid cache mutation */}
    </group>
  );
}

const OrangeForestScene: React.FC = () => {
  const orbRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const data = useAudioAnalyser();
  const [isSceneActive, setIsSceneActive] = React.useState(true);
  const { camera } = useThree();

  // Reset camera position for this scene
  React.useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    
    // Set appropriate camera position for viewing the forest
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    return () => {
      // Restore original camera position when component unmounts
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
    };
  }, [camera]);

  // Scene activation detection and reset
  React.useEffect(() => {
    setIsSceneActive(true);
    
    // Reset all state when scene becomes active
    timeRef.current = 0;
    if (orbRef.current) {
      orbRef.current.position.set(-20, 5, -60);
      orbRef.current.rotation.set(0, 0, 0);
    }

    // Cleanup when scene becomes inactive
    return () => {
      setIsSceneActive(false);
    };
  }, []); // Empty dependency array ensures this runs on mount/unmount

  // Additional reset when data changes (indicating scene switch)
  React.useEffect(() => {
    if (isSceneActive) {
      timeRef.current = 0;
      if (orbRef.current) {
        orbRef.current.position.set(-20, 5, -60);
        orbRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [isSceneActive]);

  useFrame((_, delta) => {
    // Check if there's audio activity (more robust detection)
    const avgVolume = data.length > 0 ? Array.from(data.slice(0, 32)).reduce((sum, val) => sum + val, 0) / 32 : 0;
    const isAudioActive = data.length > 0 && avgVolume > 5; // Threshold for detecting audio
    
    // Only advance time when music is playing
    if (isAudioActive) {
      timeRef.current += delta;
    }
    
    // Always ensure orb exists
    if (orbRef.current) {
      if (isAudioActive) {
        // Slow left-to-right traversal with arcing motion (only when music plays)
        const traverseSpeed = 0.3; // Slow speed
        const arcWidth = 40; // Width of the traverse
        const arcHeight = 7; // Height of the arc
        
        // Calculate horizontal position (oscillates left to right)
        const horizontalProgress = (Math.sin(timeRef.current * traverseSpeed) + 1) / 2; // 0 to 1
        const xPosition = (horizontalProgress - 0.5) * arcWidth; // -20 to +20
        
        // Calculate arcing vertical motion (peaks in the middle)
        const arcProgress = Math.sin(horizontalProgress * Math.PI); // Creates arc shape
        const yPosition = 5 + arcProgress * arcHeight; // Base height + arc
        
        orbRef.current.position.x = xPosition;
        orbRef.current.position.y = yPosition;
        
        // Keep gentle rotation when music is playing
        orbRef.current.rotation.y += delta * 0.2;
        orbRef.current.rotation.x += delta * 0.1;
      }
      // When music stops, orb stays in its current position (no animation updates)
      // But the orb itself remains visible and rendered
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      
      {/* Wireframe orb */}
      <mesh ref={orbRef} position={[-20, 5, -60]}>
        <sphereGeometry args={[1.5, 12, 8]} />
        <meshStandardMaterial 
          color="white" 
          wireframe 
          emissive="white"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      <group position={[0, -10, 0]}>
        <Suspense fallback={null}>
          <Model position={[15, 3, -85]} url={MODELS.Beech} />
          <Model position={[-15, 3, -85]} url={MODELS.Lime} />
          <Model position={[0, 1.5, -40]} url={MODELS.Spruce} />
        </Suspense>
        <ContactShadows scale={30} blur={15} far={30} />
      </group>
    </group>
  );
};

export default OrangeForestScene;