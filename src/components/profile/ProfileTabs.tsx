"use client";

export type ProfileTab = "portfolio" | "pearls" | "about";

interface Props {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  pearlCount?: number;
  portfolioCount?: number;
}

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "portfolio", label: "Portfolio" },
  { key: "pearls", label: "Pearls" },
  { key: "about", label: "About" },
];

export function ProfileTabs({ active, onChange, pearlCount, portfolioCount }: Props) {
  return (
    <div style={{
      display: "flex",
      borderBottom: "1px solid var(--border)",
      marginBottom: 20,
      gap: 0,
    }}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = tab.key === "pearls" ? pearlCount : tab.key === "portfolio" ? portfolioCount : undefined;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
              color: isActive ? "var(--text)" : "var(--text-3)",
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              cursor: "pointer",
              fontFamily: "'Geist', sans-serif",
              transition: "all .15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
            }}
          >
            {tab.label}
            {count !== undefined && count > 0 && (
              <span style={{
                fontSize: 10,
                color: isActive ? "var(--primary)" : "var(--text-3)",
                fontFamily: "'Geist Mono', monospace",
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
