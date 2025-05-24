import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";
import { Mesh, MeshStandardMaterial } from "three";

const DigitalBeachScene: React.FC = () => {
  const meshRef = useRef<Mesh>(null);
  const data = useAudioAnalyser();

  useFrame(() => {
    if (!meshRef.current || data.length === 0) return;

    const bass = data[2]; 
    const scale = 1 + bass / 100;

    meshRef.current.scale.set(scale, scale, scale);

    const material = meshRef.current.material as MeshStandardMaterial;
    if (material) {
      material.transparent = true;
      material.opacity = 0.2 + bass / 255; 
      material.emissive.setRGB(bass / 255, bass / 400, bass / 600); // Glow effect
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
};

export default DigitalBeachScene;
