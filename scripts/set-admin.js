const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../codevanta.sqlite');
const db = new DatabaseSync(dbPath);

const hash = bcrypt.hashSync('Josh3940.', 10);
const res = db.prepare("UPDATE profiles SET email = 'joshkigs8@gmail.com', password_hash = ?, full_name = 'Josh' WHERE role = 'admin' OR id = '00000000-0000-4000-a000-000000000001'").run(hash);

console.log('Updated admin rows:', res.changes);
console.log('Current profiles in SQLite:');
console.table(db.prepare("SELECT id, email, role, full_name FROM profiles").all());

