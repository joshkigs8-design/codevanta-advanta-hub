import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { StudentBenefit } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const benefits = db
      .prepare(`SELECT * FROM student_benefits WHERE is_active = 1 ORDER BY created_at ASC`)
      .all() as StudentBenefit[];

    return NextResponse.json({ benefits, total: benefits.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
