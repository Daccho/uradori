import type { InfoSource } from "@/lib/types";

const SOURCE_MAP: Record<InfoSource, { icon: string; label: string; color: string }> = {
  broadcast: { icon: "📺", label: "放送情報", color: "var(--cyan-primary)" },
  unaired: { icon: "📁", label: "未放送素材", color: "#f59e0b" },
  opendata: { icon: "🌐", label: "公開データ", color: "#22c55e" },
};

export function SourceBadge({ source }: { source: InfoSource }) {
  const info = SOURCE_MAP[source];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide border"
      style={{
        color: info.color,
        borderColor: `color-mix(in srgb, ${info.color} 25%, transparent)`,
        background: `color-mix(in srgb, ${info.color} 8%, transparent)`,
      }}
    >
      <span className="text-[11px]">{info.icon}</span>
      {info.label}
    </span>
  );
}
