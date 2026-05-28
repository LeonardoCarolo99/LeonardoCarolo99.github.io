require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const crypto = require('crypto');
const cors = require('cors');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/callback';
const PORT = process.env.PORT || 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('Warning: CLIENT_ID and CLIENT_SECRET not set. Configure .env or environment variables.');
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// In-memory stores (not persistent)
const stateStore = {}; // state -> { returnTo, owner, repo, branch }
const tokenStore = {}; // state -> access_token

function genState() { return crypto.randomBytes(16).toString('hex'); }

app.get('/auth/start', (req, res) => {
  const { returnTo, owner, repo, branch, gallery } = req.query;
  const state = genState();
  stateStore[state] = { returnTo: returnTo || '/', owner, repo, branch, gallery };

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'repo',
    state
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state || !stateStore[state]) return res.status(400).send('Invalid callback');

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: CALLBACK_URL })
    });
    const tokenJson = await tokenRes.json();
    if (tokenJson.error) return res.status(500).send('OAuth error: ' + tokenJson.error_description || tokenJson.error);
    const access_token = tokenJson.access_token;
    tokenStore[state] = access_token;

    const info = stateStore[state] || {};
    const returnTo = info.returnTo || '/';
    const sep = returnTo.includes('?') ? '&' : '?';
    res.redirect(`${returnTo}${sep}oauth_state=${state}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('OAuth exchange failed');
  }
});

// Publish endpoint: receives { state, gallery, projects }
app.post('/publish', async (req, res) => {
  const { state, gallery, projects } = req.body;
  if (!state || !tokenStore[state] || !stateStore[state]) return res.status(400).json({ error: 'Missing state or not authorized' });
  const token = tokenStore[state];
  const { owner, repo, branch } = stateStore[state];
  if (!owner || !repo) return res.status(400).json({ error: 'Repository owner/name not provided' });

  try {
    const uploads = [];
    for (const proj of projects) {
      const projFolder = `images/${gallery}/${proj.id}`;
      if (proj.displayImage && proj.displayImage.startsWith('data:')) {
        const m = proj.displayImage.match(/^data:(image\/[^;]+);base64,(.*)$/);
        if (m) {
          const mime = m[1];
          const ext = mime.split('/')[1] || 'jpg';
          const fname = `cover.${ext}`;
          const path = `${projFolder}/${fname}`;
          uploads.push({ path, base64: m[2] });
          proj.displayImage = path;
        }
      }
      if (Array.isArray(proj.images)) {
        for (let i = 0; i < proj.images.length; i++) {
          const img = proj.images[i];
          if (img.src && img.src.startsWith('data:')) {
            const m = img.src.match(/^data:(image\/[^;]+);base64,(.*)$/);
            if (m) {
              const mime = m[1];
              const ext = mime.split('/')[1] || 'jpg';
              const safeName = (img.alt || `photo-${i}`).replace(/[^a-z0-9._-]/gi, '_').slice(0,40) || `photo-${i}`;
              const fname = `${Date.now()}-${safeName}.${ext}`;
              const path = `${projFolder}/${fname}`;
              uploads.push({ path, base64: m[2] });
              img.src = path;
            }
          }
        }
      }
    }

    // helper to get file sha if exists
    async function getFileSha(path) {
      const api = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch || 'main')}`;
      const r = await fetch(api, { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } });
      if (r.status === 200) { const j = await r.json(); return j.sha; }
      return null;
    }

    // upload files sequentially
    for (const f of uploads) {
      const sha = await getFileSha(f.path);
      const api = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(f.path)}`;
      const body = { message: `Add ${f.path}`, content: f.base64, branch: branch || 'main' };
      if (sha) body.sha = sha;
      const putRes = await fetch(api, { method: 'PUT', headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!putRes.ok) {
        const txt = await putRes.text();
        throw new Error(`Upload failed for ${f.path}: ${putRes.status} ${txt}`);
      }
    }

    // write projects json
    const jsonPath = `projects-${gallery}.json`;
    const jsonSha = await getFileSha(jsonPath);
    const jsonApi = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(jsonPath)}`;
    const jsonContent = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');
    const jsonBody = { message: `Update ${jsonPath}`, content: jsonContent, branch: branch || 'main' };
    if (jsonSha) jsonBody.sha = jsonSha;
    const putJson = await fetch(jsonApi, { method: 'PUT', headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(jsonBody) });
    if (!putJson.ok) {
      const txt = await putJson.text();
      throw new Error(`Updating ${jsonPath} failed: ${putJson.status} ${txt}`);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => console.log(`OAuth publisher listening on http://localhost:${PORT}`));
