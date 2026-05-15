const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
// In-memory user store (ephemeral). No persistent DB required.
const users = [];
let nextUserId = 1;

// Create default account (ephemeral)
try {
  const defaultPass = 'VPNPass123!';
  const defaultHash = bcrypt.hashSync(defaultPass, 10);
  const defaultUser = { id: nextUserId++, name: 'wfh_user', email: 'wfh_user', password: defaultHash };
  users.push(defaultUser);
  console.log('Default user created: username/email=wfh_user, password=VPNPass123!');
} catch (e) {
  console.error('Failed to create default user', e);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
}));

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
    if (users.find(u => u.email === email)) return res.render('register', { error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: nextUserId++, name, email, password: hash };
    users.push(user);
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.redirect('/dashboard');
  } catch (e) {
    res.render('register', { error: 'Server error' });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('login', { error: 'Missing fields' });
  const user = users.find(u => u.email === email);
  if (!user) return res.render('login', { error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render('login', { error: 'Invalid credentials' });
  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

// Download VPN config (protected)
app.get('/download/wfh', requireAuth, (req, res) => {
  const filePath = path.join(__dirname, 'public', 'css', 'wfh_user.ovpn');
  res.download(filePath, 'wfh_user.ovpn', (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) res.status(500).send('Error downloading file');
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
