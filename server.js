const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

const IN_PROD = process.env.NODE_ENV === 'production';
const DISABLE_SESSIONS = process.env.DISABLE_SESSIONS === 'true';

if (!DISABLE_SESSIONS) {
  app.use(session({
    name: process.env.SESSION_NAME || 'sid',
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: IN_PROD,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  }));

  // make current user available in all views
  app.use((req, res, next) => {
    res.locals.user = req.session && req.session.user ? req.session.user : null;
    next();
  });
} else {
  // Sessions disabled: clear any existing cookie and provide no session
  app.use((req, res, next) => {
    res.clearCookie(process.env.SESSION_NAME || 'sid');
    res.locals.user = null;
    req.session = null;
    next();
  });
}

// Simple request logger to help debug requests in production (prints method and url)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.render('register', { error: 'All fields required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    stmt.run(name, email, hash, function (err) {
      if (err) {
        return res.render('register', { error: 'Email already in use' });
      }
      req.session.user = { id: this.lastID, name, email };
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.redirect('/dashboard');
      });
    });
  } catch (e) {
    res.render('register', { error: 'Server error' });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Accept either username or email in the `identifier` field
app.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.render('login', { error: 'Missing fields' });

  const byEmail = identifier.includes('@');
  const sql = byEmail ? 'SELECT * FROM users WHERE email = ?' : 'SELECT * FROM users WHERE name = ?';
  const param = identifier;

  db.get(sql, [param], async (err, user) => {
    if (err || !user) return res.render('login', { error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Invalid credentials' });
    req.session.user = { id: user.id, name: user.name, email: user.email };
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.redirect('/dashboard');
    });
  });
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

// Accept POSTs to /dashboard and redirect to GET (prevents "Cannot POST /dashboard")
app.post('/dashboard', requireAuth, (req, res) => {
  res.redirect('/dashboard');
});

// Download VPN config (protected)
app.get('/download/wfh', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, 'public', 'wfh_user.ovpn');
  res.download(filePath, 'wfh_user.ovpn', (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) res.status(500).send('Error downloading file');
    }
  });
});

app.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => res.redirect('/'));
  } else {
    res.clearCookie(process.env.SESSION_NAME || 'sid');
    res.redirect('/');
  }
});

// Clear session cookie and destroy session if present
app.get('/clear-session', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie(process.env.SESSION_NAME || 'sid');
      res.redirect('/');
    });
  } else {
    res.clearCookie(process.env.SESSION_NAME || 'sid');
    res.redirect('/');
  }
});

// Export app for serverless platforms (Vercel) and for local start
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
