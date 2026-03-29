"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import type { Mesh } from "three";

export function StudioStage() {
  const floorRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Reflective floor */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial
          color="#060d1a"
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Grid overlay matching broadcast monitor lines */}
      <Grid
        position={[0, 0, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#0a6e85"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#00d4ff"
        fadeDistance={6}
        fadeStrength={1.5}
        infiniteGrid
      />
    </group>
  );
}

export function StudioLighting({
  activeSide,
}: {
  activeSide: "left" | "right" | null;
}) {
  const leftSpotRef = useRef<any>(null);
  const rightSpotRef = useRef<any>(null);

  useFrame(() => {
    if (leftSpotRef.current) {
      const target = activeSide === "left" ? 2.5 : 0.8;
      leftSpotRef.current.intensity +=
        (target - leftSpotRef.current.intensity) * 0.1;
    }
    if (rightSpotRef.current) {
      const target = activeSide === "right" ? 2.5 : 0.8;
      rightSpotRef.current.intensity +=
        (target - rightSpotRef.current.intensity) * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} color="#0c1829" />

      {/* Key light - overhead */}
      <directionalLight
        position={[0, 5, 3]}
        intensity={0.4}
        color="#f0f2f5"
        castShadow
      />

      {/* Left spot (Sorajiro - cyan) */}
      <spotLight
        ref={leftSpotRef}
        position={[-1.5, 3, 2]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.8}
        color="#00d4ff"
        castShadow
      />

      {/* Right spot (Audience - green) */}
      <spotLight
        ref={rightSpotRef}
        position={[1.5, 3, 2]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.8}
        color="#22c55e"
        castShadow
      />

      {/* Backlight rim */}
      <pointLight position={[0, 2, -3]} intensity={0.3} color="#e63946" />
    </>
  );
}
