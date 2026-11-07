import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getFavoriteQuotes } from "@/lib/quotes/utils";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const favorites = await db.userFavoriteQuote.findMany({
    where: { userId: user.id },
    orderBy: { favoritedAt: "desc" },
  });
  const quoteIds = favorites.map((f) => f.quoteId);
  const quotes = getFavoriteQuotes(quoteIds);

  return NextResponse.json({ userId: user.id, count: quotes.length, quotes });
}

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const quoteId = body.quoteId as number;

  if (!quoteId || typeof quoteId !== "number") {
    return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
  }

  const existing = await db.userFavoriteQuote.findUnique({
    where: { userId_quoteId: { userId: user.id, quoteId } },
  });

  if (existing) {
    await db.userFavoriteQuote.delete({
      where: { userId_quoteId: { userId: user.id, quoteId } },
    });
    return NextResponse.json({ favorited: false, quoteId });
  }

  await db.userFavoriteQuote.create({
    data: { userId: user.id, quoteId },
  });

  return NextResponse.json({ favorited: true, quoteId, userId: user.id });
}
