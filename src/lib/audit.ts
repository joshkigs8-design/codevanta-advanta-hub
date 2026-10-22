import { getDb } from "./db";
import crypto from "node:crypto";

export function logAdminAction(
  adminUserId: string,
  action: string,
  targetEntity: string,
  targetId: string,
  details: Record<string, unknown>,
  ipAddress?: string
) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO admin_audit_logs (id, admin_user_id, action, target_entity, target_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, adminUserId, action, targetEntity, targetId, JSON.stringify(details), ipAddress || null, now);
}
