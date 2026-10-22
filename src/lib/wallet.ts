import { getDb } from "./db";
import crypto from "node:crypto";
import { getProgramStatus } from "./referral";
import {
  WalletAccount,
  WalletLedgerEntry,
  WithdrawalRequest,
  WithdrawalStatus,
} from "@/types";

export function getWallet(userId: string): {
  wallet: WalletAccount;
  ledger: WalletLedgerEntry[];
  withdrawals: WithdrawalRequest[];
} {
  const db = getDb();
  let wallet = db
    .prepare("SELECT * FROM wallet_accounts WHERE user_id = ?")
    .get(userId) as WalletAccount | undefined;

  if (!wallet) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO wallet_accounts (id, user_id, currency, pending_balance, approved_balance, withdrawn_balance, created_at, updated_at)
      VALUES (?, ?, 'KES', 0.0, 0.0, 0.0, ?, ?)
    `).run(id, userId, now, now);

    wallet = {
      id,
      user_id: userId,
      currency: "KES",
      pending_balance: 0.0,
      approved_balance: 0.0,
      withdrawn_balance: 0.0,
      created_at: now,
      updated_at: now,
    };
  }

  const ledger = db
    .prepare("SELECT * FROM wallet_ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(userId) as unknown as WalletLedgerEntry[];

  const withdrawals = db
    .prepare("SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as unknown as WithdrawalRequest[];

  return { wallet, ledger, withdrawals };
}

export function submitWithdrawalRequest(
  userId: string,
  amountKes: number,
  phoneNumber: string,
  accountName: string,
  paymentMethod: "mpesa_b2c" | "manual_mpesa" | "manual_bank" = "mpesa_b2c"
): { success: boolean; error?: string; request?: WithdrawalRequest } {
  const db = getDb();

  // 1. Compliance Legal Gate Check
  const programStatus = getProgramStatus();
  if (programStatus !== "approved_for_launch") {
    return {
      success: false,
      error: `Payouts are currently locked in '${programStatus.toUpperCase()}' mode. Kenyan legal compliance review must be formally signed off by an authorized advocate before real-money withdrawals can be processed.`,
    };
  }

  // 2. Minimum withdrawal check
  const minSetting = db
    .prepare("SELECT value FROM programme_settings WHERE key = 'minimum_withdrawal_kes'")
    .get() as { value: string } | undefined;
  const minAmount = minSetting ? parseFloat(minSetting.value) : 100;

  if (amountKes < minAmount) {
    return {
      success: false,
      error: `Minimum withdrawal amount is KES ${minAmount.toLocaleString()}. Requested: KES ${amountKes.toLocaleString()}.`,
    };
  }

  // 3. Fee calculation
  const feeSetting = db
    .prepare("SELECT value FROM programme_settings WHERE key = 'default_payout_fee_kes'")
    .get() as { value: string } | undefined;
  const feeKes = feeSetting ? parseFloat(feeSetting.value) : 0;
  const netAmountKes = amountKes - feeKes;

  if (netAmountKes <= 0) {
    return { success: false, error: "Withdrawal amount cannot be less than or equal to processing fee." };
  }

  const { wallet } = getWallet(userId);
  if (wallet.approved_balance < amountKes) {
    return {
      success: false,
      error: `Insufficient approved balance. Available: KES ${wallet.approved_balance.toLocaleString()}, Requested: KES ${amountKes.toLocaleString()}.`,
    };
  }

  const requestId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  db.exec("BEGIN IMMEDIATE;");
  try {
    // Deduct approved balance
    const newBalance = wallet.approved_balance - amountKes;
    db.prepare("UPDATE wallet_accounts SET approved_balance = ?, updated_at = ? WHERE id = ?")
      .run(newBalance, nowIso, wallet.id);

    // Insert withdrawal request
    db.prepare(`
      INSERT INTO withdrawal_requests (
        id, user_id, amount_kes, fee_kes, net_amount_kes, phone_number, account_name, payment_method, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
    `).run(
      requestId,
      userId,
      amountKes,
      feeKes,
      netAmountKes,
      phoneNumber,
      accountName,
      paymentMethod,
      nowIso,
      nowIso
    );

    // Record ledger entry
    const ledgerId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO wallet_ledger_entries (
        id, wallet_id, user_id, entry_type, amount_kes, balance_after_kes, reference_type, reference_id, notes, created_at
      ) VALUES (?, ?, ?, 'withdrawal_request', ?, ?, 'withdrawal_request', ?, ?, ?)
    `).run(
      ledgerId,
      wallet.id,
      userId,
      -amountKes,
      newBalance,
      requestId,
      `Withdrawal request submitted for KES ${amountKes} via ${paymentMethod} to ${phoneNumber}`,
      nowIso
    );

    db.exec("COMMIT;");

    const createdRequest: WithdrawalRequest = {
      id: requestId,
      user_id: userId,
      amount_kes: amountKes,
      fee_kes: feeKes,
      net_amount_kes: netAmountKes,
      phone_number: phoneNumber,
      account_name: accountName,
      payment_method: paymentMethod,
      status: "submitted",
      created_at: nowIso,
      updated_at: nowIso,
    };

    return { success: true, request: createdRequest };
  } catch (err: unknown) {
    db.exec("ROLLBACK;");
    return { success: false, error: err instanceof Error ? err.message : "Database error processing withdrawal" };
  }
}

export function processWithdrawalRequest(
  requestId: string,
  adminUserId: string,
  action: "approve" | "reject",
  externalTransactionId?: string,
  notes?: string
): { success: boolean; error?: string } {
  const db = getDb();
  const request = db
    .prepare("SELECT * FROM withdrawal_requests WHERE id = ?")
    .get(requestId) as WithdrawalRequest | undefined;

  if (!request) {
    return { success: false, error: "Withdrawal request not found." };
  }

  if (request.status === "paid" || request.status === "rejected") {
    return { success: false, error: `Withdrawal request is already ${request.status}.` };
  }

  const nowIso = new Date().toISOString();
  const { wallet } = getWallet(request.user_id);

  db.exec("BEGIN IMMEDIATE;");
  try {
    if (action === "approve") {
      // Mark as paid and update withdrawn balance
      const newWithdrawn = wallet.withdrawn_balance + request.amount_kes;
      db.prepare("UPDATE wallet_accounts SET withdrawn_balance = ?, updated_at = ? WHERE id = ?")
        .run(newWithdrawn, nowIso, wallet.id);

      db.prepare(`
        UPDATE withdrawal_requests
        SET status = 'paid', external_transaction_id = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(externalTransactionId || "MANUAL-DISBURSED", notes || "Processed successfully", adminUserId, nowIso, nowIso, requestId);

      const ledgerId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO wallet_ledger_entries (
          id, wallet_id, user_id, entry_type, amount_kes, balance_after_kes, reference_type, reference_id, notes, created_at
        ) VALUES (?, ?, ?, 'withdrawal_approved', ?, ?, 'withdrawal_request', ?, ?, ?)
      `).run(
        ledgerId,
        wallet.id,
        request.user_id,
        0,
        wallet.approved_balance,
        requestId,
        `Withdrawal completed. Ref: ${externalTransactionId || "Manual"}`,
        nowIso
      );
    } else {
      // Reject: Return amount to approved balance
      if (!notes) {
        db.exec("ROLLBACK;");
        return { success: false, error: "A clear rejection reason is required when rejecting a withdrawal." };
      }

      const refundedApproved = wallet.approved_balance + request.amount_kes;
      db.prepare("UPDATE wallet_accounts SET approved_balance = ?, updated_at = ? WHERE id = ?")
        .run(refundedApproved, nowIso, wallet.id);

      db.prepare(`
        UPDATE withdrawal_requests
        SET status = 'rejected', rejection_reason = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(notes, notes, adminUserId, nowIso, nowIso, requestId);

      const ledgerId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO wallet_ledger_entries (
          id, wallet_id, user_id, entry_type, amount_kes, balance_after_kes, reference_type, reference_id, notes, created_at
        ) VALUES (?, ?, ?, 'withdrawal_rejected', ?, ?, 'withdrawal_request', ?, ?, ?)
      `).run(
        ledgerId,
        wallet.id,
        request.user_id,
        request.amount_kes,
        refundedApproved,
        requestId,
        `Withdrawal rejected: ${notes}. Funds refunded to balance.`,
        nowIso
      );
    }

    db.exec("COMMIT;");
    return { success: true };
  } catch (err: unknown) {
    db.exec("ROLLBACK;");
    return { success: false, error: err instanceof Error ? err.message : "Database error updating withdrawal status" };
  }
}
