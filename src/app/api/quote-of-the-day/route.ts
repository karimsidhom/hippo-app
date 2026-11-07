import { NextResponse } from "next/server";
import { getQuoteOfTheDay } from "@/lib/quotes/utils";

export async function GET() {
  const quote = getQuoteOfTheDay();
  return NextResponse.json(quote);
}
