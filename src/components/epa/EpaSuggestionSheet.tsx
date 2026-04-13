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
        background: "var(--bg-2, #141c28)",
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
            background: "var(--bg-3, #1a2332)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            flex: 1,
            height: 14,
            borderRadius: 4,
            background: "var(--bg-3, #1a2332)",
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
            background: "var(--bg-3, #1a2332)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            width: 80,
            height: 18,
            borderRadius: 4,
            background: "var(--bg-3, #1a2332)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--bg-3, #1a2332)",
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
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
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

      {/* Centered Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          background: "var(--bg-1, #0e1520)",
          border: "1px solid var(--border-mid)",
          borderRadius: 16,
          maxHeight: "85vh",
          width: "90vw",
          maxWidth: 520,
          display: "flex",
          flexDirection: "column",
          animation: "modalIn .25s cubic-bezier(.16,1,.3,1)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-1, #E2E8F0)",
              margin: 0,
            }}
          >
            Link to an EPA?
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-3, #475569)",
              margin: "4px 0 0",
            }}
          >
            {loading ? "AI is analyzing your case..." : "This case may count toward these EPAs"}
          </p>
        </div>

        {/* Suggestion List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 24px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, padding: "20px 0 12px",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.1)",
                  borderTop: "2px solid #0ea5e9",
                  animation: "spin .7s linear infinite",
                }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  Gemini is reading your case...
                </span>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : suggestions.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--text-3, #475569)",
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
                    background: "var(--bg-2, #141c28)",
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
                        color: "var(--text-1, #E2E8F0)",
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
                          color: "var(--text-3, #475569)",
                          background: "var(--bg-3, #1a2332)",
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
                        color: "var(--text-3, #475569)",
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
            padding: "12px 24px 20px",
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
              color: "var(--text-2, #64748B)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-2, #141c28)";
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
