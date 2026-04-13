"use client";

import type { EpaSuggestion } from "@/lib/types";

interface EpaSuggestionSheetProps {
  suggestions: EpaSuggestion[];
  onSelect: (suggestion: EpaSuggestion) => void;
  onSkip: () => void;
  loading?: boolean;
}

function getStageColor(epaId: string): string {
  const id = epaId.toUpperCase();
  if (id.startsWith("TTP")) return "#10b981";
  if (id.startsWith("TD")) return "#6366f1";
  if (id.startsWith("C")) return "#0ea5e9";
  if (id.startsWith("F")) return "#f59e0b";
  return "#0ea5e9";
}

function getConfidenceColor(confidence: "high" | "medium" | "low"): string {
  if (confidence === "high") return "#10b981";
  if (confidence === "medium") return "#f59e0b";
  return "#64748b";
}

function getConfidenceLabel(confidence: "high" | "medium" | "low"): string {
  if (confidence === "high") return "High match";
  if (confidence === "medium") return "Medium match";
  return "Low match";
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border-mid)",
        borderRadius: 10,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 20,
            borderRadius: 4,
            background: "var(--bg-3)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            flex: 1,
            height: 14,
            borderRadius: 4,
            background: "var(--bg-3)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div
          style={{
            width: 60,
            height: 18,
            borderRadius: 4,
            background: "var(--bg-3)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: 80,
            height: 18,
            borderRadius: 4,
            background: "var(--bg-3)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--bg-3)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export function EpaSuggestionSheet({
  suggestions,
  onSelect,
  onSkip,
  loading,
}: EpaSuggestionSheetProps) {
  return (
    <>
      {/* Pulse keyframe for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onSkip}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          animation: "fadeIn .2s ease-out",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1001,
          background: "var(--bg-1)",
          borderTop: "1px solid var(--border-mid)",
          borderRadius: "16px 16px 0 0",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp .3s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 10,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "var(--border-mid)",
            }}
          />
        </div>

        {/* Header */}
        <div style={{ padding: "8px 20px 16px" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-1)",
              margin: 0,
            }}
          >
            Link to an EPA?
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-3)",
              margin: "4px 0 0",
            }}
          >
            This case may count toward these EPAs
          </p>
        </div>

        {/* Suggestion List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 20px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : suggestions.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 13,
              }}
            >
              No EPA suggestions for this case.
            </div>
          ) : (
            suggestions.map((suggestion) => {
              const stageColor = getStageColor(suggestion.epaId);
              const confColor = getConfidenceColor(suggestion.confidence);
              const progress = suggestion.currentProgress;
              const progressPct =
                progress.targetCount > 0
                  ? Math.round(
                      (progress.observations / progress.targetCount) * 100
                    )
                  : 0;

              return (
                <div
                  key={suggestion.epaId}
                  onClick={() => onSelect(suggestion)}
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--border-mid)",
                    borderRadius: 10,
                    padding: 14,
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      stageColor;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "var(--border-mid)";
                  }}
                >
                  {/* Top row: badge + title + confidence */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: stageColor,
                        fontFamily: "'Geist Mono', monospace",
                        background: `${stageColor}15`,
                        padding: "2px 6px",
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      {suggestion.epaId}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-1)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {suggestion.epaTitle}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: confColor,
                        background: `${confColor}15`,
                        padding: "2px 7px",
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      {getConfidenceLabel(suggestion.confidence)}
                    </span>
                  </div>

                  {/* Match reasons */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    {suggestion.matchReasons.map((reason, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10,
                          color: "var(--text-3)",
                          background: "var(--bg-3)",
                          padding: "2px 6px",
                          borderRadius: 3,
                        }}
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "var(--border-mid)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          width: `${progressPct}%`,
                          background: stageColor,
                          transition:
                            "width .5s cubic-bezier(.16,1,.3,1)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontFamily: "'Geist Mono', monospace",
                        flexShrink: 0,
                      }}
                    >
                      {progress.observations}/{progress.targetCount}{" "}
                      observations
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px 20px",
            borderTop: "1px solid var(--border-mid)",
          }}
        >
          <button
            onClick={onSkip}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              border: "1px solid var(--border-mid)",
              borderRadius: 8,
              color: "var(--text-2)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </>
  );
}
