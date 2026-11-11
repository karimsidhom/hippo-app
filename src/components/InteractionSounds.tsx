"use client";

import { useEffect, useState } from "react";

const KEY = "hippo-interface-sounds";
const CHANGED = "hippo:interface-sounds";

function readEnabled() {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function InteractionSounds() {
  useEffect(() => {
    let enabled = readEnabled();
    let audio: AudioContext | undefined;
    let lastClick = -Infinity;
    const sync = () => { enabled = readEnabled(); };

    async function play() {
      try {
        audio ??= new AudioContext();
        if (audio.state === "suspended") await audio.resume();
        if (!enabled || audio.state !== "running") return;

        const start = audio.currentTime;
        const tone = audio.createOscillator();
        const gain = audio.createGain();
        tone.type = "sine";
        tone.frequency.setValueAtTime(660, start);
        tone.frequency.exponentialRampToValueAtTime(410, start + .042);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.exponentialRampToValueAtTime(.05, start + .005);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .065);
        tone.connect(gain);
        gain.connect(audio.destination);
        tone.onended = () => { tone.disconnect(); gain.disconnect(); };
        tone.start(start);
        tone.stop(start + .07);
      } catch {
        // Audio availability must never affect the control that was activated.
      }
    }

    function onClick(event: MouseEvent) {
      if (!enabled || !event.isTrusted || !(event.target instanceof Element)) return;
      const control = event.target.closest('button, a[href], [role="button"], [role="tab"]');
      if (!control || control.closest('[disabled], [aria-disabled="true"], [data-silent-click], [inert]')) return;
      const now = performance.now();
      if (now - lastClick < 90) return;
      lastClick = now;
      void play();
    }

    window.addEventListener(CHANGED, sync);
    window.addEventListener("storage", sync);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener("storage", sync);
      document.removeEventListener("click", onClick, true);
      if (audio) void audio.close().catch(() => {});
    };
  }, []);
  return null;
}

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const sync = () => setEnabled(readEnabled());
    sync();
    window.addEventListener(CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <label data-silent-click style={{
      display: "inline-flex", alignItems: "center", gap: 9,
      minHeight: 44, color: "var(--text)", fontSize: 13, cursor: "pointer",
    }}>
      <input type="checkbox" checked={enabled} onChange={(event) => {
        const next = event.currentTarget.checked;
        try {
          localStorage.setItem(KEY, next ? "on" : "off");
          window.dispatchEvent(new Event(CHANGED));
        } catch {
          // The sound preference stays off if browser storage is unavailable.
        }
      }} />
      Interface sounds
    </label>
  );
}
