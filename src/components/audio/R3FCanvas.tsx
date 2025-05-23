import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";


interface R3FCanvasProps {
  children: React.ReactNode;
}

const R3FCanvas: React.FC<R3FCanvasProps> = ({ children }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 25 }}
      style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none" }}
    >
      {/* <directionalLight position={[0, 0, 2]} intensity={1} /> */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={false} />
      {children}
    </Canvas>
  );
};
export default R3FCanvas;