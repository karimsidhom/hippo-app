import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { callClaude, LlmUnavailableError, AiDisabledError } from "@/lib/dictation/llm";

// Second-pass PHI preflight. The regex-based `lib/phia` scrub catches the
// obvious patterns (dates, MRNs, room numbers) but misses paraphrased
// identifiers ("the 64-year-old from Brandon last Tuesday"). Gemini gets a
// holistic look at title+content, returns a redacted version with an
// itemized list of what was scrubbed, and a boolean verdict. The UI shows
// the diff and the user accepts or keeps editing.
//
// This is the compliance story that matters for program directors: the
// platform doesn't *trust* users to be compliant, it verifies.

const SYSTEM_PROMPT = `You are a PHIA/HIPAA compliance reviewer for a surgical \
education social network. Given a draft post (title + body) from a surgeon \
or resident, return a JSON object with these fields:
{
  "safe": true if the draft contains no patient identifiers at all, else false,
  "redactedTitle": the title with ALL identifiers replaced with clinical generic \
terms (e.g. "a 64-year-old" -> "a middle-aged patient"; "last Tuesday" -> \
"recently"; "Dr. Smith's case" -> "a case"),
  "redactedContent": same for the body,
  "warnings": array of human-readable strings describing what you removed or why \
the draft is still risky. Be specific — quote the problematic phrase.
}
Treat as identifiers: exact ages, exact dates, specific weekdays, hospital \
names, attending names, patient names, MRNs, room/bed numbers, rare \
combinations (procedure + city + day). Do NOT flag generic teaching content. \
Preserve all teaching value, medical terminology, and surgical technique. \
Output ONLY the JSON object. Use Canadian spellings.`;

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;


  const { title, content } = (await req.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
  };
  if (!title?.trim() && !content?.trim()) {
    return NextResponse.json({ error: "title or content required" }, { status: 400 });
  }

  try {
    const result = await callClaude({
      system: SYSTEM_PROMPT,
      user: `TITLE:\n${title ?? ""}\n\nBODY:\n${content ?? ""}`,
      temperature: 0.1,
      maxTokens: 1500,
    });
    const clean = result.text
      .trim()
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
    const parsed = JSON.parse(clean);
    return NextResponse.json({
      safe: Boolean(parsed.safe),
      redactedTitle: String(parsed.redactedTitle ?? title ?? ""),
      redactedContent: String(parsed.redactedContent ?? content ?? ""),
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.filter((w: unknown): w is string => typeof w === "string")
        : [],
    });
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    }
    const msg =
      err instanceof LlmUnavailableError ? err.message : err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `Preflight failed: ${msg}` }, { status: 502 });
  }
}
