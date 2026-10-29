import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const db = getDb();

    const plan = db
      .prepare(
        `SELECT
          mp.*,
          COALESCE(sub.subscriber_count, 0) AS subscriber_count
        FROM membership_plans mp
        LEFT JOIN (
          SELECT plan_id, COUNT(*) AS subscriber_count
          FROM memberships
          WHERE status = 'active'
          GROUP BY plan_id
        ) sub ON sub.plan_id = mp.id
        WHERE mp.id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: {
        ...plan,
        is_active: Boolean(plan.is_active),
        entitlements:
          typeof plan.entitlements === "string"
            ? JSON.parse(plan.entitlements as string)
            : plan.entitlements,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const db = getDb();

    const existing = db
      .prepare("SELECT * FROM membership_plans WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const body = await req.json();
    const errors: Record<string, string> = {};

    // Validate individual fields if present
    if (body.name !== undefined && (!body.name || typeof body.name !== "string" || body.name.trim().length === 0)) {
      errors.name = "Name cannot be empty";
    }
    if (body.description !== undefined && (!body.description || typeof body.description !== "string" || body.description.trim().length === 0)) {
      errors.description = "Description cannot be empty";
    }
    if (body.price_kes !== undefined && (Number(body.price_kes) <= 0 || isNaN(Number(body.price_kes)))) {
      errors.price_kes = "Price must be greater than 0";
    }
    if (body.direct_referral_reward_kes !== undefined && (Number(body.direct_referral_reward_kes) < 0 || isNaN(Number(body.direct_referral_reward_kes)))) {
      errors.direct_referral_reward_kes = "Referral reward must be 0 or greater";
    }
    const validCycles = ["lifetime", "monthly", "annual"];
    if (body.billing_cycle !== undefined && !validCycles.includes(body.billing_cycle)) {
      errors.billing_cycle = "Billing cycle must be lifetime, monthly, or annual";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const now = new Date().toISOString();
    const changes: Record<string, unknown> = {};

    // Build the update
    const updatableFields = ["name", "description", "price_kes", "direct_referral_reward_kes", "billing_cycle"];
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        const val = field === "price_kes" || field === "direct_referral_reward_kes"
          ? Number(body[field])
          : typeof body[field] === "string" ? body[field].trim() : body[field];
        setClauses.push(`${field} = ?`);
        values.push(val);
        changes[field] = { from: existing[field], to: val };
      }
    }

    if (body.is_active !== undefined) {
      const activeVal = body.is_active ? 1 : 0;
      setClauses.push("is_active = ?");
      values.push(activeVal);
      changes.is_active = { from: existing.is_active, to: activeVal };
    }

    if (body.entitlements !== undefined) {
      const entitlementsStr = JSON.stringify(body.entitlements);
      setClauses.push("entitlements = ?");
      values.push(entitlementsStr);
      changes.entitlements = { from: existing.entitlements, to: body.entitlements };
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    setClauses.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.prepare(
      `UPDATE membership_plans SET ${setClauses.join(", ")} WHERE id = ?`
    ).run(...values);

    logAdminAction(session.userId, "update_plan", "membership_plans", id, changes);

    const updated = db
      .prepare("SELECT * FROM membership_plans WHERE id = ?")
      .get(id) as Record<string, unknown>;

    return NextResponse.json({
      plan: {
        ...updated,
        is_active: Boolean(updated.is_active),
        entitlements:
          typeof updated.entitlements === "string"
            ? JSON.parse(updated.entitlements as string)
            : updated.entitlements,
      },
      message: "Plan updated successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const db = getDb();

    const plan = db
      .prepare("SELECT * FROM membership_plans WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check for active memberships
    const activeMemberships = db
      .prepare(
        "SELECT COUNT(*) AS count FROM memberships WHERE plan_id = ? AND status = 'active'"
      )
      .get(id) as { count: number };

    if (activeMemberships.count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete plan with ${activeMemberships.count} active membership(s). Deactivate the plan instead.`,
        },
        { status: 409 }
      );
    }

    // Soft-delete by setting is_active = 0
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE membership_plans SET is_active = 0, updated_at = ? WHERE id = ?"
    ).run(now, id);

    logAdminAction(session.userId, "soft_delete_plan", "membership_plans", id, {
      slug: plan.slug,
      name: plan.name,
    });

    return NextResponse.json({ message: "Plan deactivated successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
