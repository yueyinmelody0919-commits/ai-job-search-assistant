/**
 * GET /api/bugs — List bug reports (optionally filter by status)
 * GET /api/bugs?prompts=true — Get concatenated fix prompts for all open bugs
 * PATCH /api/bugs — Update bug status
 */

import { NextRequest, NextResponse } from "next/server";
import { getBugs, updateBugStatus, getAllOpenBugPrompts } from "@/lib/agents/bugs";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const prompts = request.nextUrl.searchParams.get("prompts");

  try {
    if (prompts === "true") {
      const allPrompts = await getAllOpenBugPrompts();
      return NextResponse.json({ prompts: allPrompts });
    }

    const bugs = await getBugs(status || undefined);
    return NextResponse.json({ bugs });
  } catch {
    return NextResponse.json({ bugs: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { bugId, status } = await request.json();

    if (!bugId || !status) {
      return NextResponse.json({ error: "bugId and status required" }, { status: 400 });
    }

    if (!["open", "in_progress", "fixed", "wont_fix"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await updateBugStatus(bugId, status);
    return NextResponse.json({ success: true, bugId, status });
  } catch {
    return NextResponse.json({ error: "Failed to update bug" }, { status: 500 });
  }
}
