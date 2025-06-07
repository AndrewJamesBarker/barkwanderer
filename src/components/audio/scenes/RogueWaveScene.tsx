import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Water } from "three-stdlib";
import { useAudioAnalyser } from "../useAudioAnalyser";
import WaterNormals from "/src/assets/waternormals.jpeg";

export const RogueWaveScene: React.FC = () => {
  const ref = useRef<any>(null); // Must be "any" to access material.uniforms
  const starsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const { camera, scene } = useThree();
  const data = useAudioAnalyser();

  // Add fog, background, and camera setup once on mount
  useEffect(() => {
    const originalFog = scene.fog; // Store original fog
    const originalBackground = scene.background; // Store original background
    const originalPosition = camera.position.clone(); // Store original camera position
    const originalRotation = camera.rotation.clone(); // Store original camera rotation
    
    scene.fog = new THREE.Fog("#020509", 1, 50); // cyber ink fog
    scene.background = new THREE.Color("#000000"); // Black sky
    
    // Cleanup fog, background, and camera when component unmounts
    return () => {
      scene.fog = originalFog; // Restore original fog (usually null)
      scene.background = originalBackground; // Restore original background
      camera.position.copy(originalPosition); // Restore original camera position
      camera.rotation.copy(originalRotation); // Restore original camera rotation
    };
  }, [scene, camera]);

  const waterNormals = useLoader(THREE.TextureLoader, WaterNormals);
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  // Star field for the black sky only
  const starGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(1200 * 3); // More stars for richer sky
    const sizes = new Float32Array(1200);
    
    for (let i = 0; i < 1200; i++) {
      // Create a gradient density - more stars higher in the sky, fewer near horizon
      const skyHeight = Math.random();
      const densityFactor = skyHeight * skyHeight; // Quadratic distribution - more stars higher up
      
      // More gradual star gradient - skip more stars the lower they are
      const skipProbability = Math.pow(1.0 - skyHeight, 2) * 0.6; // Gradual fade
      if (Math.random() < skipProbability) {
        // Skip this star (creates gradual density reduction toward horizon)
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000; // Hide it way below
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
        continue;
      }
      
      // Position stars in the sky portion of the landscape
      positions[i * 3] = (Math.random() - 0.5) * 800; // Wide spread
      positions[i * 3 + 1] = skyHeight * 20 + 6; // Y: 6-26, slightly lower in the sky
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800 - 100; // Far back in the distance
      // Create varied star sizes - some small, some medium, some bright large stars
      const sizeVariation = Math.random();
      let starSize;
      
      if (sizeVariation < 0.65) {
        // Most stars are small to medium
        starSize = Math.random() * 0.8 + 0.3; // 0.3 - 1.1
      } else if (sizeVariation < 0.85) {
        // Some medium-large stars
        starSize = Math.random() * 1.2 + 1.2; // 1.2 - 2.4
      } else if (sizeVariation < 0.96) {
        // Bright large stars
        starSize = Math.random() * 1.8 + 2.2; // 2.2 - 4.0
      } else {
        // Very few hero stars - really bright
        starSize = Math.random() * 2.0 + 4.0; // 4.0 - 6.0
      }
      
      // Slightly bigger stars higher in the sky
      starSize *= (0.8 + densityFactor * 0.4);
      
      sizes[i] = starSize;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }, []);

  // Star material with subtle flickering
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        attribute float size;
        varying float vFlicker;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Very subtle pulsing with individual star variation
          float basePulse = sin(time * 0.3) * 0.1 + 0.9; // Global subtle pulse
          float starPulse = sin(time * 0.8 + position.x * 20.0 + position.z * 15.0) * 0.08 + 0.92; // Individual variation
          float flicker = basePulse * starPulse;
          vFlicker = flicker;
          
          gl_PointSize = size * flicker * (500.0 / -mvPosition.z); // Bigger stars
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vFlicker;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - (dist / 0.5);
          alpha *= vFlicker * 2.2; // Brighter with subtle pulse
          
          // Bright white stars
          vec3 starColor = vec3(1.0, 1.0, 1.0);
          gl_FragColor = vec4(starColor, alpha);
        }
      `,
      transparent: true,
    });
  }, []);

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
    timeRef.current += delta;
    const volume = average(data.slice(0, 36));

    // Fixed camera position for stable landscape view
    const targetPos = new THREE.Vector3(0, 6, 10); // No movement with audio
    camera.position.lerp(targetPos, 0.02);
    camera.lookAt(0, 4, -5); // Tilt back more to show horizon and sky

    // Update star material
    if (starsRef.current?.material) {
      (starsRef.current.material as THREE.ShaderMaterial).uniforms.time.value = timeRef.current;
    }

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

  return (
    <>
      {/* Star field in the black sky */}
      <points ref={starsRef} geometry={starGeometry} material={starMaterial} />
      
      {/* Water surface */}
      <primitive ref={ref} object={water} rotation={[-Math.PI / 2, 0, 0]} />
    </>
  );
};

export default RogueWaveScene;

function average(arr: Uint8Array): number {
  return arr.length === 0
    ? 0
    : arr.reduce((sum, val) => sum + val, 0) / arr.length;
}
