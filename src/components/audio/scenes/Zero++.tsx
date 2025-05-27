import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, MeshRefractionMaterial, useEnvironment } from "@react-three/drei";
import { useAudioAnalyser } from "../useAudioAnalyser";
import type { InstancedMesh } from "three";

const ZeroScene: React.FC = () => {
  const env = useEnvironment({ files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/peppermint_powerplant_2_1k.hdr' });
  const data = useAudioAnalyser();
  const instRef = useRef<InstancedMesh>(null);
  const { nodes } = useGLTF('/3-stone-transformed.glb') as any;

  useFrame(() => {
    if (!instRef.current || data.length === 0) return;

    const volume = average(data.slice(0, 32));
    const material = instRef.current.material as any;
    if (material.uniforms) {
      material.uniforms.aberrationStrength.value = 0.01 + volume * 0.0001;
      material.uniforms.time.value += 0.01 + volume * 0.001;
    }
  });

  return (
    <instancedMesh
      ref={instRef}
      args={[nodes.mesh_4.geometry, undefined, 65]}
      instanceMatrix={nodes.mesh_4.instanceMatrix}
    >
      <MeshRefractionMaterial
        envMap={env}
        side={THREE.DoubleSide}
        color="#ffffff"
        toneMapped={false}
        aberrationStrength={0.02}
        attach="material"
      />
    </instancedMesh>
  );
};

export default ZeroScene;

function average(arr: Uint8Array): number {
  return arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;
}
