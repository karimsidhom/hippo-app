import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { loadProgramCommandCenter } from "@/lib/pd-command-center/load";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const data = await loadProgramCommandCenter(auth.user.id, request.nextUrl.searchParams.get("programId"));
  if (!data) {
    return NextResponse.json({ error: "Create or own a program to open the command center." }, { status: 404 });
  }
  return NextResponse.json(data);
}
