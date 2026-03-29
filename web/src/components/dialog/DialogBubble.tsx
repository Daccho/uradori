import type { DialogMessage } from "@/lib/types";
import { SourceBadge } from "./SourceBadge";

const SPEAKER_CONFIG = {
  sorajiro: {
    name: "ソラジロー",
    accentColor: "var(--cyan-primary)",
    bgColor: "rgba(0, 212, 255, 0.06)",
    borderColor: "rgba(0, 212, 255, 0.15)",
  },
  audience: {
    name: "視聴者代表",
    accentColor: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.06)",
    borderColor: "rgba(34, 197, 94, 0.15)",
  },
};

export function DialogBubble({
  message,
  index,
}: {
  message: DialogMessage;
  index: number;
}) {
  const config = SPEAKER_CONFIG[message.speaker];

  return (
    <div
      className="telop-enter"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="relative rounded overflow-hidden"
        style={{
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        {/* Speaker name telop */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b"
          style={{ borderColor: config.borderColor }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: config.accentColor }}
            />
            <span
              className="text-[11px] font-bold tracking-wide"
              style={{ color: config.accentColor }}
            >
              {config.name}
            </span>
          </div>
          {message.source && <SourceBadge source={message.source} />}
        </div>

        {/* Message text */}
        <div className="px-3 py-2.5">
          <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}
