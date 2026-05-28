OAuth Publisher server

1) Register a GitHub OAuth App:
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/auth/callback
   - Note the Client ID and Client Secret.

2) Create a `.env` file in `server/` from `.env.example` and set CLIENT_ID and CLIENT_SECRET.

3) Install and run:

```bash
cd server
npm install
npm start
```

4) Open `REDESIGN/admin.html` in your browser and use the "Publish to GitHub" button.

Security: the server stores access tokens in memory only for the duration of the authorization session. For production use, secure storage and CSRF protections are recommended.
