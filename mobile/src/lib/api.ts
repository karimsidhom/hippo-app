/**
 * Typed fetch wrapper for the hippomedicine.com API.
 *
 * The mobile app hits the same Next.js API routes as the web —
 * `/api/case-log`, `/api/epa/ai-suggest`, `/api/voice-log`, etc. —
 * authenticated with the Supabase JWT from SecureStore. This keeps
 * business logic in ONE place and avoids drift between platforms.
 *
 * Every caller should pass a Zod schema so the runtime response is
 * validated before touching UI state. Invalid shapes throw rather
 * than corrupt the client cache.
 */

import Constants from 'expo-constants';
import type { ZodSchema } from 'zod';
import { supabase } from './supabase';

const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl
  ?? process.env.EXPO_PUBLIC_API_URL
  ?? 'https://hippomedicine.com';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestOpts<TSchema extends ZodSchema> {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  schema: TSchema;
  timeoutMs?: number;
}

export async function apiRequest<TSchema extends ZodSchema>(
  opts: RequestOpts<TSchema>,
): Promise<ReturnType<TSchema['parse']>> {
  const { path, method = 'GET', body, schema, timeoutMs = 15_000 } = opts;
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(await authHeader()),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      throw new ApiError(res.status, path, `Non-JSON response (${res.status})`, text);
    }

    if (!res.ok) {
      const message =
        (parsed && typeof parsed === 'object' && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : `Request failed (${res.status})`);
      throw new ApiError(res.status, path, message, parsed);
    }

    return schema.parse(parsed);
  } finally {
    clearTimeout(timer);
  }
}
