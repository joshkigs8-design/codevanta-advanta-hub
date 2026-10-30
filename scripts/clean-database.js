const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.resolve(__dirname, '../codevanta.sqlite');
console.log('Opening database:', dbPath);
const db = new DatabaseSync(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
console.log('Existing tables:', tables);

function safeDelete(tableName, condition = "") {
  if (tables.includes(tableName)) {
    const sql = condition ? `DELETE FROM ${tableName} WHERE ${condition}` : `DELETE FROM ${tableName}`;
    const result = db.prepare(sql).run();
    console.log(`Cleaned ${tableName}: ${result.changes} rows deleted`);
  }
}

db.exec('PRAGMA foreign_keys = OFF;');

safeDelete('payments');
safeDelete('payment_events');
safeDelete('referral_attributions');
safeDelete('referral_rewards');
safeDelete('withdrawal_requests');
safeDelete('wallet_ledger_entries');
safeDelete('bookmarks');
safeDelete('user_bookmarks');
safeDelete('admin_audit_logs');
safeDelete('resource_submissions');
safeDelete('memberships');
safeDelete('referral_codes', "user_id != '00000000-0000-4000-a000-000000000001'");
safeDelete('wallet_accounts', "user_id != '00000000-0000-4000-a000-000000000001'");
safeDelete('profiles', "role != 'admin'");

// Reset admin stats
if (tables.includes('referral_codes')) {
  db.prepare("UPDATE referral_codes SET clicks = 0 WHERE user_id = '00000000-0000-4000-a000-000000000001'").run();
}
if (tables.includes('wallet_accounts')) {
  db.prepare("UPDATE wallet_accounts SET pending_balance = 0, approved_balance = 0, withdrawn_balance = 0 WHERE user_id = '00000000-0000-4000-a000-000000000001'").run();
}

db.exec('PRAGMA foreign_keys = ON;');
db.exec('VACUUM;');

console.log('\n--- PURGE RESULT ---');
console.log('Remaining Profiles:', db.prepare("SELECT email, role FROM profiles").all());
console.log('Remaining Referral Codes:', db.prepare("SELECT code, clicks FROM referral_codes").all());
console.log('Remaining Wallet Accounts:', db.prepare("SELECT user_id, pending_balance, approved_balance FROM wallet_accounts").all());
console.log('Remaining Payments:', db.prepare("SELECT COUNT(*) as c FROM payments").get().c);
console.log('Remaining Memberships:', db.prepare("SELECT COUNT(*) as c FROM memberships").get().c);
console.log('Resources count:', db.prepare("SELECT COUNT(*) as c FROM resources").get().c);
console.log('Categories count:', db.prepare("SELECT COUNT(*) as c FROM categories").get().c);
console.log('Tutorials count:', db.prepare("SELECT COUNT(*) as c FROM tutorials").get().c);
console.log('Learning paths count:', db.prepare("SELECT COUNT(*) as c FROM learning_paths").get().c);
console.log('Projects count:', db.prepare("SELECT COUNT(*) as c FROM guided_projects").get().c);
