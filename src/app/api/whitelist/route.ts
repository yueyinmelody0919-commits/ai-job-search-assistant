/**
 * GET /api/whitelist — List whitelisted emails
 * POST /api/whitelist — Add email to whitelist
 * DELETE /api/whitelist — Remove email from whitelist
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAgentAction } from "@/lib/memory/store";

export async function GET() {
  try {
    const entries = await db.select().from(schema.whitelist);
    return NextResponse.json({ whitelist: entries });
  } catch {
    return NextResponse.json({ whitelist: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, approvedBy } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    // Check if already exists
    const existing = await db
      .select()
      .from(schema.whitelist)
      .where(eq(schema.whitelist.email, email.toLowerCase()));

    if (existing.length > 0) {
      return NextResponse.json({ message: "Already whitelisted", email });
    }

    await db.insert(schema.whitelist).values({
      email: email.toLowerCase(),
      approvedBy: approvedBy || "engineer",
    });

    await logAgentAction("engineer", "whitelist_add", { email });

    return NextResponse.json({ success: true, email });
  } catch {
    return NextResponse.json({ error: "Failed to add to whitelist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    await db
      .delete(schema.whitelist)
      .where(eq(schema.whitelist.email, email.toLowerCase()));

    await logAgentAction("engineer", "whitelist_remove", { email });

    return NextResponse.json({ success: true, email });
  } catch {
    return NextResponse.json({ error: "Failed to remove from whitelist" }, { status: 500 });
  }
}
