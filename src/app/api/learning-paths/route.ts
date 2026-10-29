import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { LearningPath } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const paths = db
      .prepare(`SELECT * FROM learning_paths WHERE is_published = 1 ORDER BY display_order ASC`)
      .all() as LearningPath[];

    return NextResponse.json({ paths, total: paths.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
