import { NextRequest, NextResponse } from "next/server";
import { getContextualQuote, getRandomQuote } from "@/lib/quotes/utils";
import type { QuoteContext } from "@/lib/quotes/types";

export async function GET(req: NextRequest) {
  const context = req.nextUrl.searchParams.get("context") as QuoteContext | null;

  const quote = context ? getContextualQuote(context) : getRandomQuote();

  return NextResponse.json(quote);
}
