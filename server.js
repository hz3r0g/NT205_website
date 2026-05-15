const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Minimal local server for development. In production on Vercel,
// serverless functions under /api handle auth and downloads.
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('index', { user: null });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Local login for development (no DB)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'wfh_user' && password === 'VPNPass123!') {
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { user: { name: 'wfh_user' } });
});

app.get('/download/wfh', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'files', 'wfh_user.ovpn');
  res.download(filePath, 'wfh_user.ovpn', (err) => {
    if (err) console.error('Download error:', err);
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
