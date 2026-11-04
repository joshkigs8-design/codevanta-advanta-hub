import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { syncUsersToDb, fetchAndSyncFirestoreUsers } from "@/lib/firestoreSync";
import { verifyFirebaseIdToken } from "@/lib/verifyFirebaseToken";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable if Bearer token is provided
    }

    const sessionUser = getCurrentUser();
    let isAuthorized = Boolean(sessionUser && sessionUser.role === "admin");

    // Also support token-based admin authentication
    const token = bearerToken || (typeof body?.idToken === "string" ? body.idToken.trim() : null);
    if (!isAuthorized && token) {
      const verified = await verifyFirebaseIdToken(token);
      const adminEmails = [
        "joshkigs8@gmail.com",
        (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim(),
      ].filter(Boolean);
      if (verified && adminEmails.includes(verified.email.toLowerCase())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required to synchronize users" },
        { status: 403 }
      );
    }

    const db = getDb();
    let syncedFromPayload = 0;
    let syncedFromRest = 0;

    // 1. Sync users submitted directly from the client Firestore SDK
    if (Array.isArray(body?.users) && body.users.length > 0) {
      syncedFromPayload = syncUsersToDb(db, body.users);
    }

    // 2. Fetch and sync from Firestore REST API if token is provided
    if (token) {
      syncedFromRest = await fetchAndSyncFirestoreUsers(db, token);
    }

    const totalRow = db.prepare("SELECT COUNT(*) as count FROM profiles").get() as { count: number };

    return NextResponse.json({
      success: true,
      total: totalRow.count,
      syncedFromPayload,
      syncedFromRest,
    });
  } catch (err) {
    console.error("Admin user sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal sync error" },
      { status: 500 }
    );
  }
}

