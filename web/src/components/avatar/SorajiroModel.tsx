"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import type { Group } from "three";
import * as THREE from "three";

const MODEL_PATH = "/models/sorajiro.glb";

export function SorajiroModel({ isSpeaking }: { isSpeaking: boolean }) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, groupRef);
  const speakingRef = useRef(false);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Apply speaking animation from model if available
  useEffect(() => {
    speakingRef.current = isSpeaking;
    const idleAction = actions["idle"] ?? actions[Object.keys(actions)[0]!];
    if (idleAction) {
      idleAction.reset().fadeIn(0.3).play();
    }
  }, [actions, isSpeaking]);

  // Procedural speaking animation: subtle bounce + scale pulse
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetScale = speakingRef.current ? 1.05 : 1.0;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
    groupRef.current.scale.setScalar(newScale);

    // Subtle floating motion
    const time = performance.now() / 1000;
    const floatSpeed = speakingRef.current ? 3 : 1.5;
    const floatAmount = speakingRef.current ? 0.03 : 0.015;
    groupRef.current.position.y = Math.sin(time * floatSpeed) * floatAmount;
  });

  return (
    <group ref={groupRef} position={[-0.8, 0, 0]}>
      <primitive object={clonedScene} />
      {/* Cyan glow ring at base when speaking */}
      {isSpeaking && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.3, 0.5, 32]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
