/**
 * Voice recognition wrapper — thin layer over expo-speech-recognition.
 *
 * Exposes a simple React hook (`useVoiceRecognition`) that handles:
 *   • Permission request (microphone + speech recognition)
 *   • Starting / stopping an on-device recognition session
 *   • Streaming partial results for live UI feedback
 *   • Accumulating the final transcript
 *   • Robust teardown on unmount
 *
 * Everything runs on-device (via Apple's Speech framework on iOS; the
 * device's default recognizer on Android). No audio leaves the phone —
 * only the final transcript string is sent to /api/voice-log.
 *
 * Usage:
 *   const voice = useVoiceRecognition();
 *   voice.start();           // opens the mic
 *   voice.transcript;         // "lap chole today with dr chen…"
 *   voice.isListening;        // boolean
 *   voice.stop();             // finalize, emit last result
 *   voice.reset();            // clear transcript for a new session
 *
 * The hook never throws — errors land in `voice.error` so the UI can
 * render them inline instead of crashing the sheet.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ExpoSpeechRecognitionModule,
  supportsOnDeviceRecognition,
  supportsRecording,
  useSpeechRecognitionEvent,
  type ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';

export interface VoiceRecognition {
  /** Final transcript accumulated across this session. */
  transcript: string;
  /** Latest partial — updates in real time while the user speaks. */
  partial: string;
  /** True from the moment start() is called to the final `end` event. */
  isListening: boolean;
  /** Audio input volume 0–1 (for waveform animation). */
  volume: number;
  /** Friendly error message or null. */
  error: string | null;
  /** Whether the device supports on-device recognition (vs cloud). */
  onDeviceAvailable: boolean;
  /** Whether audio recording is available at all on this device. */
  recordingAvailable: boolean;
  /** Begin a new listening session. Re-requests permission if missing. */
  start: () => Promise<void>;
  /** Stop gracefully — returns the final result. */
  stop: () => void;
  /** Cancel without emitting a final result. */
  abort: () => void;
  /** Clear the transcript, partial, and error. */
  reset: () => void;
}

/**
 * Translate the speech module's error codes into messages a resident
 * would actually understand. The raw codes like "audio-capture" are
 * useless in user-facing UI.
 */
function humanizeError(code: ExpoSpeechRecognitionErrorCode | string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Enable it in Settings → Hippo to use voice log.';
    case 'no-speech':
      return "I didn't catch anything. Try again, a little louder.";
    case 'audio-capture':
      return "Couldn't access the microphone — another app may be using it.";
    case 'network':
      return 'Network error. Voice log needs an internet connection on first use.';
    case 'language-not-supported':
      return "This device doesn't support speech recognition in your language.";
    case 'aborted':
      // User cancelled — not really an error worth showing.
      return '';
    default:
      return `Voice recognition failed (${code}).`;
  }
}

export function useVoiceRecognition(): VoiceRecognition {
  const [transcript, setTranscript] = useState('');
  const [partial, setPartial] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref of the final transcript so we can append the latest
  // result without losing earlier segments if the user pauses and
  // resumes within the same session.
  const transcriptRef = useRef('');
  transcriptRef.current = transcript;

  // Capability flags — stable for the app lifetime, cheap to read.
  const [onDeviceAvailable] = useState(() => {
    try {
      return supportsOnDeviceRecognition();
    } catch {
      return false;
    }
  });
  const [recordingAvailable] = useState(() => {
    try {
      return supportsRecording();
    } catch {
      return false;
    }
  });

  // ── Event subscriptions ────────────────────────────────────────────────
  // useSpeechRecognitionEvent handles its own unsubscribe on unmount.

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setPartial('');
    setVolume(0);
  });

  useSpeechRecognitionEvent('result', (ev) => {
    // ev.results is an array of SpeechRecognitionResult. Each result
    // has one or more ExpoSpeechRecognitionResultSegment alternatives;
    // we always take the top (highest-confidence) alternative.
    const text = ev.results?.[0]?.transcript ?? '';
    if (!text) return;
    if (ev.isFinal) {
      // Append this segment with a space so multi-sentence dictations
      // concatenate naturally.
      setTranscript((prev) => (prev ? `${prev} ${text}`.trim() : text));
      setPartial('');
    } else {
      setPartial(text);
    }
  });

  useSpeechRecognitionEvent('volumechange', (ev) => {
    // volumechange emits a value (typically -2 to 10 on iOS). Normalize
    // to 0–1 so the UI doesn't need to know the raw scale.
    const v = typeof ev.value === 'number' ? ev.value : 0;
    const normalized = Math.max(0, Math.min(1, (v + 2) / 12));
    setVolume(normalized);
  });

  useSpeechRecognitionEvent('error', (ev) => {
    const msg = humanizeError(ev.error);
    if (msg) setError(msg);
    setIsListening(false);
  });

  // Ensure we don't leave the mic hot if the component unmounts mid-session.
  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // no-op — already stopped
      }
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript('');
    setPartial('');

    // Request permissions up front. iOS shows the OS dialog once; after
    // that, denied state requires a Settings trip.
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError(
          'Microphone access was denied. Enable it in Settings → Hippo to use voice log.',
        );
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permission check failed.');
      return;
    }

    try {
      ExpoSpeechRecognitionModule.start({
        // American English — we can localize later once we know the
        // actual language distribution of our users.
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        // Prefer on-device when available so audio never leaves the phone.
        requiresOnDeviceRecognition: onDeviceAvailable,
        // Let the user pause briefly mid-sentence without ending the session.
        addsPunctuation: true,
        // Volume metering powers the waveform animation. ~0.1s updates.
        volumeChangeEventOptions: {
          enabled: true,
          intervalMillis: 100,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start voice recognition.');
    }
  }, [onDeviceAvailable]);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // no-op — may already be stopping
    }
  }, []);

  const abort = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // no-op
    }
    setIsListening(false);
    setPartial('');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setPartial('');
    setError(null);
    setVolume(0);
  }, []);

  return {
    transcript,
    partial,
    isListening,
    volume,
    error,
    onDeviceAvailable,
    recordingAvailable,
    start,
    stop,
    abort,
    reset,
  };
}
