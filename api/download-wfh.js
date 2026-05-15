const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

module.exports = (req, res) => {
  // Only allow GET
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const cookie = req.headers.cookie || '';
  const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('token='));
  if (!match) return res.status(401).send('Unauthorized');
  const token = match.split('=')[1];
  try {
    jwt.verify(token, SECRET);
  } catch (e) {
    return res.status(401).send('Unauthorized');
  }

  const filePath = path.join(__dirname, '..', 'public', 'files', 'wfh_user.ovpn');
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=wfh_user.ovpn');
  fs.createReadStream(filePath).pipe(res);
};
