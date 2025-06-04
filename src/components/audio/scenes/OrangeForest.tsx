import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useAudioAnalyser } from '../useAudioAnalyser';

const OrangeForestScene: React.FC = () => {
  const orbRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const data = useAudioAnalyser();
  const [isSceneActive, setIsSceneActive] = React.useState(true);
  const { camera } = useThree();

  // Camera reset for this scene
  React.useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    
    // Reset camera to default position for OrangeForest
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
      // Position orb in the scene
      orbRef.current.position.set(0, 5, -40);
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
        // Position orb in the scene
        orbRef.current.position.set(0, 5, -40);
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
        // Slow rotation
        orbRef.current.rotation.y += delta * 0.1;
        orbRef.current.rotation.x += delta * 0.05;
      }
      // When music stops, orb stays in its current position (no animation updates)
      // But the orb itself remains visible and rendered
    }
  });

  return (
    <group>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      
      {/* Wireframe landscape ground grid */}
      <mesh position={[0, -12, -80]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200, 40, 40]} />
        <meshBasicMaterial color="white" wireframe transparent opacity={0.3} />
      </mesh>
      
      {/* Wireframe orb - floating in the scene */}
      <mesh ref={orbRef} position={[0, 5, -40]}>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshStandardMaterial 
          color="white" 
          wireframe
          emissive="white"
          emissiveIntensity={0.05}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      <group position={[0, -10, 0]}>
        <ContactShadows scale={30} blur={15} far={30} />
      </group>
    </group>
  );
};

export default OrangeForestScene;