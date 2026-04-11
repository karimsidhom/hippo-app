import { NextRequest, NextResponse } from "next/server";
import { filterQuotes, getQuoteStats } from "@/lib/quotes/utils";
import type {
  QuoteAuthor,
  QuoteCategory,
  QuoteMood,
  QuoteTheme,
  QuoteUseCase,
} from "@/lib/quotes/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const theme = searchParams.get("theme") as QuoteTheme | null;
  const mood = searchParams.get("mood") as QuoteMood | null;
  const author = searchParams.get("author") as QuoteAuthor | null;
  const category = searchParams.get("category") as QuoteCategory | null;
  const useCase = searchParams.get("use_case") as QuoteUseCase | null;
  const verified = searchParams.get("verified");
  const stats = searchParams.get("stats");

  if (stats === "true") {
    return NextResponse.json(getQuoteStats());
  }

  const quotes = filterQuotes({
    theme: theme || undefined,
    mood: mood || undefined,
    author: author || undefined,
    category: category || undefined,
    useCase: useCase || undefined,
    verified: verified ? verified === "true" : undefined,
  });

  return NextResponse.json({
    count: quotes.length,
    quotes,
  });
}
