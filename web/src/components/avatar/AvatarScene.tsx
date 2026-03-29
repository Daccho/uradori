"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Speaker } from "@/lib/types";
import { SorajiroModel } from "./SorajiroModel";
import { AudienceModel } from "./AudienceModel";
import { StudioStage, StudioLighting } from "./StudioStage";

function SceneContent({
  currentSpeaker,
  isSpeaking,
}: {
  currentSpeaker: Speaker | null;
  isSpeaking: boolean;
}) {
  const activeSide =
    isSpeaking && currentSpeaker === "sorajiro"
      ? "left"
      : isSpeaking && currentSpeaker === "audience"
        ? "right"
        : null;

  return (
    <>
      <StudioLighting activeSide={activeSide} />
      <StudioStage />
      <Suspense fallback={null}>
        <SorajiroModel
          isSpeaking={isSpeaking && currentSpeaker === "sorajiro"}
        />
        <AudienceModel
          isSpeaking={isSpeaking && currentSpeaker === "audience"}
        />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.5, 0]}
      />
    </>
  );
}

export function AvatarScene({
  currentSpeaker,
  isSpeaking,
}: {
  currentSpeaker: Speaker | null;
  isSpeaking: boolean;
}) {
  return (
    <div className="w-full rounded overflow-hidden" style={{ height: 280 }}>
      <Canvas
        camera={{ position: [0, 1.2, 2.5], fov: 45 }}
        dpr={[1, 1.5]}
        shadows
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <SceneContent
          currentSpeaker={currentSpeaker}
          isSpeaking={isSpeaking}
        />
      </Canvas>

      {/* Speaker labels overlay */}
      <div className="flex justify-between px-4 -mt-8 relative z-10">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold tracking-wide"
            style={{
              color:
                isSpeaking && currentSpeaker === "sorajiro"
                  ? "#00d4ff"
                  : "#4a5568",
              fontFamily: "var(--font-share-tech), monospace",
            }}
          >
            SORAJIRO AI
          </span>
          {isSpeaking && currentSpeaker === "sorajiro" && (
            <span
              className="text-[8px] font-bold tracking-widest px-1 py-0.5 rounded"
              style={{
                color: "#00d4ff",
                background: "rgba(0, 212, 255, 0.15)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
              }}
            >
              SPEAKING
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isSpeaking && currentSpeaker === "audience" && (
            <span
              className="text-[8px] font-bold tracking-widest px-1 py-0.5 rounded"
              style={{
                color: "#22c55e",
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              SPEAKING
            </span>
          )}
          <span
            className="text-[10px] font-bold tracking-wide"
            style={{
              color:
                isSpeaking && currentSpeaker === "audience"
                  ? "#22c55e"
                  : "#4a5568",
              fontFamily: "var(--font-share-tech), monospace",
            }}
          >
            VIEWER AI
          </span>
        </div>
      </div>
    </div>
  );
}
