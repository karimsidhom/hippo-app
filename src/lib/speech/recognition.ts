// ---------------------------------------------------------------------------
// Minimal Web Speech API type declarations.
//
// The standard DOM lib does not include SpeechRecognition types (the API is
// vendor-prefixed in Safari and not yet in the TS DOM lib). We declare only
// the surface we use — if we need more later, extend here rather than
// reaching for `any`.
// ---------------------------------------------------------------------------

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

/**
 * Return the browser's SpeechRecognition constructor, or null if the API is
 * not available (Firefox, older Safari, anything not behind HTTPS, etc).
 *
 * Always call this in a `useEffect` / `useMemo` — it reads `window`, which
 * must not be touched during SSR.
 */
export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True when the current browser can run the Web Speech API. */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}
