import type { GeneratedQuestion } from "@/lib/types";

export function QuestionList({ questions }: { questions: GeneratedQuestion[] }) {
  if (questions.length === 0) return null;

  return (
    <div className="glass-panel overflow-hidden fade-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border)] bg-[rgba(230,57,70,0.06)]">
        <span className="inline-block w-1.5 h-1.5 bg-[var(--red-primary)] rounded-sm" />
        <span className="text-[11px] font-bold text-[var(--red-primary)] tracking-wider">
          視聴者からの質問
        </span>
        <span
          className="text-[10px] text-[var(--text-muted)] ml-auto tabular-nums"
          style={{ fontFamily: "var(--font-share-tech), monospace" }}
        >
          {questions.length} Q
        </span>
      </div>

      {/* Questions */}
      <div className="divide-y divide-[var(--glass-border)]">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-3 px-3 py-2.5 telop-enter"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-[var(--red-primary)] bg-[rgba(230,57,70,0.12)] border border-[rgba(230,57,70,0.2)] mt-0.5"
              style={{ fontFamily: "var(--font-share-tech), monospace" }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">
                {q.text}
              </p>
              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 inline-block">
                {q.basedOnCount}人の声をもとに生成
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
