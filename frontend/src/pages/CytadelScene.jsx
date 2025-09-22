// CytadelScene.jsx
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

function CytadelModel() {
  const { scene } = useGLTF("/models/cytadel.glb");
  return <primitive object={scene} scale={1} />;
}

export default function CytadelScene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 60 }}
      style={{ width: "100vw", height: "100vh", background: "black" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      <Suspense fallback={null}>
        <CytadelModel />
      </Suspense>

      <OrbitControls enableZoom={true} />
    </Canvas>
  );
}
