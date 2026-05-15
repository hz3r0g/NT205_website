const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  // Hardcoded default user (no DB)
  const defaultUser = 'wfh_user';
  const defaultPass = 'VPNPass123!';

  if (username !== defaultUser || password !== defaultPass) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ name: username }, SECRET, { expiresIn: '7d' });

  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800;${secure ? ' Secure; SameSite=Lax' : ''}`);
  res.status(200).json({ ok: true });
};
