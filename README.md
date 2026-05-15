# Company Simple Site (Node.js + SQLite)

Quick scaffold for a simple company website with registration and login.

Setup & Run

```bash
cd NT205_website
npm install
npm start
# open http://localhost:3000
```

Notes

- This variant uses an in-memory user store (no persistent database). Registered users are ephemeral and lost when the server restarts — suitable if you "don't need to save users".
- Session secret can be set via `SESSION_SECRET` env var for production.
 - A default ephemeral account is created on startup for convenience:
	 - username/email: `wfh_user`
	 - password: `VPNPass123!`
	 Use that to log in on a fresh server; remember the account is not persisted across restarts.
