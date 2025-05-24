import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAudioAnalyser } from "../useAudioAnalyser";
import type { Mesh, ShaderMaterial } from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  uniform float uTime;
  uniform float uVolume;
  varying vec2 vUv;

  float ripple(vec2 uv, float time) {
    float dist = distance(uv, vec2(0.5));
    float speed = 0.5 + uVolume * 0.01; // modulate speed with bass
    float wave = sin((dist - time * speed) * 40.0); // wavefront expands
    float envelope = exp(-6.0 * dist); // fade ripple with distance
    float gate = step(5.0, uVolume); // 0 if volume < 5, 1 if volume ≥ 5
    return wave * envelope * gate;
  }

  void main() {
  float r = ripple(vUv, uTime);
  float edge = 1.0 - smoothstep(0.005, 0.01, abs(r));

  // Gate output: only show ripples if volume is above threshold
  if (uVolume < 100.0) {
    discard; // fully transparent pixel, no blending
  }

  vec3 color = vec3(edge); // sharp white ring
  float fade = smoothstep(5.0, 6.0, uVolume); // fade in between 5 and 6
  float alpha = edge * fade;      // full transparency in between

  gl_FragColor = vec4(color, alpha);
}

`;

const RogueWaveScene: React.FC = () => {
  const meshRef = useRef<Mesh>(null);
  const shaderRef = useRef<ShaderMaterial>(null);
  const data = useAudioAnalyser();
  const timeRef = useRef(0);

  const uniforms = useRef<{
    uTime: { value: number };
    uVolume: { value: number };
  }>({
    uTime: { value: 0 },
    uVolume: { value: 0 },
  }).current;

  useFrame((_, delta) => {
    timeRef.current += delta;
    const bass = data[2] ?? 0;

    uniforms.uTime.value = timeRef.current;
    uniforms.uVolume.value = bass;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10, 128, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
};

export default RogueWaveScene;
