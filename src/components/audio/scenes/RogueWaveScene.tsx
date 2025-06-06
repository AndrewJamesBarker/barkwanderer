import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Water } from "three-stdlib";
import { useAudioAnalyser } from "../useAudioAnalyser";
import WaterNormals from "/src/assets/waternormals.jpeg";

export const RogueWaveScene: React.FC = () => {
  const ref = useRef<any>(null); // Must be "any" to access material.uniforms
  const { camera, scene } = useThree();
  const data = useAudioAnalyser();

  // Add fog once on mount
  useEffect(() => {
    const originalFog = scene.fog; // Store original fog
    scene.fog = new THREE.Fog("#020509", 1, 50); // cyber ink fog
    
    // Cleanup fog when component unmounts
    return () => {
      scene.fog = originalFog; // Restore original fog (usually null)
    };
  }, [scene]);

  const waterNormals = useLoader(THREE.TextureLoader, WaterNormals);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: new THREE.Color(0x3a1530), // dark purple-pink
      distortionScale: 4.0,
      fog: true,
      format: THREE.LinearSRGBColorSpace,
    }),
    [waterNormals]
  );

  const geometry = useMemo(() => new THREE.PlaneGeometry(1000, 1000), []);
  const water = useMemo(() => new Water(geometry, config), [geometry, config]);

  useFrame((_, delta) => {
    const volume = average(data.slice(0, 36));
    const silence = volume < 1;

    // Smooth camera always — just more when audio is active
    const targetPos = silence
      ? new THREE.Vector3(0, 7.5, 11.5)
      : new THREE.Vector3(0, 8, 12);
    camera.position.lerp(targetPos, 0.02);
    camera.lookAt(0, 1, 0); // Look slightly above horizon

    if (ref.current?.material?.uniforms) {
      const uniforms = ref.current.material.uniforms;

      // Animate water even if subtle
      uniforms.time.value += delta * (0.1 + volume * 0.001);

      // Subtle reactive ripples
      uniforms.distortionScale.value = 3.5 + volume * 0.03;

      // Blend toward gentle purple-pink if loud
      const baseColor = new THREE.Color(0x3a1530); // dark purple-pink
      const activeColor = new THREE.Color(0x7a4a70); // brighter purple-pink

      const blendFactor = Math.min(volume / 80, 6); // keep it subtle
      uniforms.waterColor.value.copy(baseColor).lerp(activeColor, blendFactor);
    }
  });

  return <primitive ref={ref} object={water} rotation={[-Math.PI / 2, 0, 0]} />;
};

export default RogueWaveScene;

function average(arr: Uint8Array): number {
  return arr.length === 0
    ? 0
    : arr.reduce((sum, val) => sum + val, 0) / arr.length;
}
