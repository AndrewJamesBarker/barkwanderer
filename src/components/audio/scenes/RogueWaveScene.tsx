import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";
import { Mesh, MeshStandardMaterial } from "three";

const RogueWaveScene: React.FC = () => {
  const meshRef = useRef<Mesh>(null);
  const data = useAudioAnalyser();

  useFrame(({ clock }) => {
  if (!meshRef.current || data.length === 0) return;

  const bass = data[3]; // low frequency
  const treble = data[60]; // higher frequency
  const time = clock.getElapsedTime();

  // Scale pulsation
  const scale = 1 + bass / 300;
  meshRef.current.scale.set(scale, scale, scale);

  // Position bobbing
  meshRef.current.position.y = Math.sin(time * 2) * (bass / 500);

  // Subtle orbital movement
  meshRef.current.position.x = Math.sin(time * 0.8) * (treble / 800);
  meshRef.current.position.z = Math.cos(time * 0.8) * (treble / 800);

  // Rotation (can be treble-reactive)
  meshRef.current.rotation.y += (treble / 1000) * 0.01;
  meshRef.current.rotation.x += (bass / 1000) * 0.01;

  // Material changes
  const material = meshRef.current.material as MeshStandardMaterial;
  if (material) {
    material.opacity = bass / 255;
    material.emissive.setRGB(bass / 255, bass / 400, bass / 600);
  }
});

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="black" />
    </mesh>
  );
};

export default RogueWaveScene;
