"use client";

import { useMemo, useState, useCallback } from "react";
import { getQuoteOfTheDay } from "@/lib/quotes/utils";
import { Heart } from "lucide-react";

export function TodaysPrinciple() {
  const quote = useMemo(() => getQuoteOfTheDay(), []);
  const [favorited, setFavorited] = useState(false);
  const [animating, setAnimating] = useState(false);

  const toggleFavorite = useCallback(async () => {
    setAnimating(true);
    setFavorited((prev) => !prev);
    setTimeout(() => setAnimating(false), 300);

    try {
      await fetch("/api/quotes/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      });
    } catch {
      // silently fail — offline-friendly
    }
  }, [quote.id]);

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Label — uppercase like the logo wordmark */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "1.6px",
          marginBottom: 14,
          opacity: 0,
          animation: "principleLabel .6s ease .1s forwards",
        }}
      >
        Today&rsquo;s Principle
      </div>

      {/* Scalpel accent line — the brand gesture */}
      <div
        style={{
          width: 0,
          height: 1,
          background: "linear-gradient(90deg, var(--primary), transparent)",
          marginBottom: 16,
          animation: "principleLine .8s cubic-bezier(.16,1,.3,1) .2s forwards",
        }}
      />

      {/* Quote — confident weight, generous measure */}
      <div
        style={{
          fontSize: 17,
          fontWeight: 400,
          color: "var(--text)",
          lineHeight: 1.55,
          letterSpacing: "-.15px",
          maxWidth: 480,
          opacity: 0,
          transform: "translateY(8px)",
          animation: "principleQuote .7s cubic-bezier(.16,1,.3,1) .35s forwards",
        }}
      >
        &ldquo;{quote.short_quote || quote.quote}&rdquo;
      </div>

      {/* Attribution + favorite */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 10,
          opacity: 0,
          animation: "principleAttrib .5s ease .55s forwards",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "var(--text-2)",
            letterSpacing: ".2px",
            flex: 1,
          }}
        >
          <span style={{ color: "var(--text-3)" }}>&mdash;</span>{" "}
          {quote.author}
          {quote.era && (
            <span style={{ color: "var(--text-3)", marginLeft: 6 }}>
              ({quote.era})
            </span>
          )}
        </div>

        <button
          onClick={toggleFavorite}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: favorited ? "#EF4444" : "var(--text-3)",
            transition: "color .2s, transform .2s",
            transform: animating ? "scale(1.3)" : "scale(1)",
          }}
        >
          <Heart
            size={14}
            fill={favorited ? "#EF4444" : "none"}
            strokeWidth={1.5}
          />
        </button>
      </div>
    </div>
  );
}
