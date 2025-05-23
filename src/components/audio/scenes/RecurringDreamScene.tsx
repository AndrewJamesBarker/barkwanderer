// src/components/audio/scenes/RecurringDreamScene.tsx

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Clouds, Cloud } from "@react-three/drei";
import { useAudioAnalyser } from "../useAudioAnalyser";

const RecurringDreamScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const data = useAudioAnalyser();

  useFrame((_, delta) => {
    if (!groupRef.current || data.length === 0) return;

    const volume = average(data.slice(0, 128));
    const isActive = volume > 9;

    if (isActive) {
      groupRef.current.rotation.y += delta * 0.04;
      groupRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Clouds material={THREE.MeshBasicMaterial} limit={800} range={40}>
        <Cloud
          key="stable"
          seed={1}
          position={[0, 0, 0]}
          opacity={0.25}
          growth={3.5}
          speed={0}
          volume={6}
          bounds={[5, 2, 5]}
          color="#ffffff"
        />

        {/* <Cloud
          concentrate="outside"
          growth={10}
          color="#ffffff"
          opacity={0.15}
          seed={.5}
          bounds={200}
          volume={100}
        /> */}
      </Clouds>
    </group>
  );
};

export default RecurringDreamScene;

function average(arr: Uint8Array): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}
