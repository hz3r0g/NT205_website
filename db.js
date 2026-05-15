const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default user if it doesn't exist
  const defaultLogin = 'wfh_user';
  const defaultPassword = 'VPNPass123!';
  db.get('SELECT id FROM users WHERE email = ? OR name = ?', [defaultLogin, defaultLogin], (err, row) => {
    if (err) return console.error('DB check default user error:', err);
    if (row) return; // already exists

    bcrypt.hash(defaultPassword, 10).then((hash) => {
      const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
      stmt.run(defaultLogin, defaultLogin, hash, function (err) {
        if (err) console.error('Error creating default user:', err);
        else console.log('Default user created: wfh_user');
      });
    }).catch((e) => console.error('Hash error:', e));
  });
});

module.exports = db;
