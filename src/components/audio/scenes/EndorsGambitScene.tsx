import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";
import { Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";
import cloudTextureUrl from "/src/assets/cloud.png";

const EndorsGambitScene: React.FC = () => {
  const data = useAudioAnalyser();
  const timeRef = useRef(0);
  const { camera, scene } = useThree();
  const cloudGroupRef = useRef<THREE.Group>(null);

  // Set camera and fog
  React.useEffect(() => {
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    const originalFog = scene.fog;
    
    camera.position.set(120, 40, 80);
    camera.lookAt(0, 20, 0);
    scene.fog = new THREE.Fog("#201520", 80, 250);
    
    return () => {
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
      scene.fog = originalFog;
    };
  }, [camera, scene]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    
    // Check if audio is active
    const avgVolume = data.length > 0 ? Array.from(data.slice(0, 32)).reduce((sum, val) => sum + val, 0) / 32 : 0;
    const isAudioActive = avgVolume > 5; // Threshold for detecting audio
    
    // Only animate clouds when music is playing
    if (isAudioActive && cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 0.3;
      cloudGroupRef.current.rotation.y += delta * 0.005;
      
      if (cloudGroupRef.current.position.x > 300) {
        cloudGroupRef.current.position.x = -300;
      }
    }
  });

  return (
    <group>
      {/* Skybox */}
      <mesh scale={[400, 400, 400]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#201520" 
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>

      {/* Clouds */}
      <group ref={cloudGroupRef} position={[-150, 25, 40]}>
        <Clouds material={THREE.MeshBasicMaterial} limit={1000} range={100} texture={cloudTextureUrl}>
          <Cloud
            seed={4}
            position={[0, 0, 0]}
            opacity={0.7}
            growth={12}
            speed={0.05}
            volume={25}
            bounds={[60, 25, 45]}
            color="#ffffff"
          />
          <Cloud
            seed={5}
            position={[100, -8, -15]}
            opacity={0.65}
            growth={10}
            speed={0.04}
            volume={20}
            bounds={[50, 20, 35]}
            color="#f8f8ff"
          />
          <Cloud
            seed={6}
            position={[200, 5, 10]}
            opacity={0.6}
            growth={14}
            speed={0.06}
            volume={30}
            bounds={[70, 30, 50]}
            color="#ffffff"
          />
          <Cloud
            seed={7}
            position={[300, -3, -8]}
            opacity={0.55}
            growth={9}
            speed={0.03}
            volume={18}
            bounds={[45, 18, 30]}
            color="#f0f0ff"
          />
          <Cloud
            seed={8}
            position={[400, 8, 5]}
            opacity={0.5}
            growth={13}
            speed={0.05}
            volume={28}
            bounds={[65, 28, 40]}
            color="#ffffff"
          />
        </Clouds>
      </group>

      {/* Basic atmospheric lighting */}
      <ambientLight intensity={0.2} color="#331133" />
      
      <directionalLight 
        position={[50, 30, 20]} 
        intensity={0.3} 
        color="#ffffff"
        castShadow
      />
      
      <pointLight 
        position={[-50, 20, 40]} 
        intensity={0.4} 
        color="#ffffff"
        distance={150}
      />
    </group>
  );
};

export default EndorsGambitScene;