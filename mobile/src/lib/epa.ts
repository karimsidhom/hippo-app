import { apiRequest } from './api';
import {
  AiSuggestResponseSchema,
  type AiSuggestInput,
  type AiSuggestResponse,
} from '@hippo/shared/schemas/epa';

/**
 * Ask the server which EPAs this case maps to. Accepts either a
 * saved caseLogId (if the case was already POSTed) or inline
 * caseDetails (optimistic path — used immediately after the form is
 * submitted, before the server response lands). Matches the web
 * flow in src/app/(app)/log/page.tsx.
 */
export async function suggestEpas(input: AiSuggestInput): Promise<AiSuggestResponse> {
  return apiRequest({
    path: '/api/epa/ai-suggest',
    method: 'POST',
    body: input,
    schema: AiSuggestResponseSchema,
    // Gemini calls can take several seconds under load — bump the
    // timeout vs. the 15s default. Server has its own 8s per-model
    // timeout + fallback chain, so this budget is the outer envelope.
    timeoutMs: 25_000,
  });
}
