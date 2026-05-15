const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = path.join(process.cwd(), 'data.db');
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
  // Seed a default development user if not present
  const seedName = 'wfh_user';
  const seedEmail = 'wfh_user@example.com';
  const seedPassword = 'VPNPass123!';

  db.get('SELECT id FROM users WHERE name = ? OR email = ?', [seedName, seedEmail], (err, row) => {
    if (err) return console.error('DB seed lookup error:', err);
    if (!row) {
      try {
        const hash = bcrypt.hashSync(seedPassword, 10);
        const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        stmt.run(seedName, seedEmail, hash, function (e) {
          if (e) return console.error('DB seed insert error:', e);
          console.log('Seed user created:', seedName);
        });
      } catch (e) {
        console.error('Error creating seed user:', e);
      }
    }
  });
});

module.exports = db;
