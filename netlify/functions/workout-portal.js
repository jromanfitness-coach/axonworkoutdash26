const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'axon-workout-client-portal-v1';
const BOARD_KEY = 'published-board';
const CLIENTS_KEY = 'client-directory';
const MAX_BOARD_BYTES = 1_500_000;
const MAX_CLIENTS = 250;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

const respond = (statusCode, body) => ({ statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) });
const now = () => new Date().toISOString();

function getHeader(headers = {}, name) {
  const target = String(name).toLowerCase();
  const found = Object.keys(headers).find((key) => key.toLowerCase() === target);
  return found ? String(headers[found] || '') : '';
}

function safeString(value, max = 200) {
  return String(value ?? '').trim().slice(0, max);
}

function makeId(value, fallback) {
  const cleaned = safeString(value, 90).replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned || fallback;
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.ADMIN_PUBLISH_SECRET || '';
}

function adminAuthorized(event) {
  const expected = String(process.env.ADMIN_PUBLISH_SECRET || '');
  const received = getHeader(event.headers, 'x-admin-publish-secret');
  if (!expected || !received || expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function pinHash(pin, salt) {
  return crypto.scryptSync(String(pin), salt, 32).toString('base64');
}

function sameSecret(a, b) {
  const first = Buffer.from(String(a || ''));
  const second = Buffer.from(String(b || ''));
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}

function verifyPin(pin, record) {
  if (!record || !record.salt || !record.pinHash) return false;
  const candidate = pinHash(pin, record.salt);
  return sameSecret(candidate, record.pinHash);
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function issueSession(client) {
  const secret = getSessionSecret();
  if (!secret) throw new Error('Server session secret is not configured.');
  const payload = {
    id: client.id,
    name: client.name,
    exp: Date.now() + 1000 * 60 * 60 * 8,
    nonce: crypto.randomBytes(12).toString('hex')
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function readSession(token) {
  const secret = getSessionSecret();
  if (!secret || !token || !String(token).includes('.')) return null;
  const [encoded, supplied] = String(token).split('.');
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (!sameSecret(expected, supplied)) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(encoded));
    if (!payload.id || !payload.exp || Number(payload.exp) < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function publicClient(record) {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt || '',
    updatedAt: record.updatedAt || ''
  };
}

function sanitizeBoard(board) {
  if (!board || typeof board !== 'object') throw new Error('A valid Local Board is required before publishing.');
  const cloned = JSON.parse(JSON.stringify(board));
  const size = Buffer.byteLength(JSON.stringify(cloned), 'utf8');
  if (size > MAX_BOARD_BYTES) throw new Error('The Local Board is too large to publish. Export a TXT backup and reduce its size first.');
  if (!Array.isArray(cloned.weeks)) throw new Error('The Local Board must contain workout weeks.');
  return cloned;
}

function normalizeIncomingAccounts(value) {
  if (!Array.isArray(value)) throw new Error('Client account data is missing.');
  if (value.length > MAX_CLIENTS) throw new Error(`Limit client accounts to ${MAX_CLIENTS}.`);
  const seenIds = new Set();
  const seenPins = new Set();
  return value.map((item, index) => {
    const id = makeId(item?.id, `client_${index}_${Date.now()}`);
    const name = safeString(item?.name, 60) || 'Client';
    const pin = safeString(item?.pin, 64);
    const pinSet = Boolean(item?.pinSet || pin);
    if (seenIds.has(id)) throw new Error('Client IDs must be unique.');
    if (pin && pin.length < 4) throw new Error(`PIN for ${name} must be at least 4 characters.`);
    if (pin) {
      const key = pin.toLowerCase();
      if (seenPins.has(key)) throw new Error('Each client PIN must be unique.');
      seenPins.add(key);
    }
    seenIds.add(id);
    return { id, name, pin, pinSet, createdAt: safeString(item?.createdAt, 40) || now() };
  });
}

async function readDirectory(store) {
  const directory = await store.get(CLIENTS_KEY, { type: 'json' });
  return Array.isArray(directory) ? directory : [];
}

async function upsertAccounts(store, incoming) {
  const normalized = normalizeIncomingAccounts(incoming);
  const existing = await readDirectory(store);
  const existingById = new Map(existing.map((record) => [record.id, record]));

  // Validate any new/changed raw PIN against every other existing client before storing it.
  for (const account of normalized) {
    if (!account.pin) continue;
    for (const record of existing) {
      if (record.id !== account.id && verifyPin(account.pin, record)) {
        throw new Error(`The PIN selected for ${account.name} is already assigned to another client.`);
      }
    }
  }

  const merged = existing.slice();
  for (const account of normalized) {
    const old = existingById.get(account.id);
    let next;
    if (account.pin) {
      const salt = crypto.randomBytes(16).toString('base64');
      next = {
        id: account.id,
        name: account.name,
        salt,
        pinHash: pinHash(account.pin, salt),
        createdAt: old?.createdAt || account.createdAt || now(),
        updatedAt: now()
      };
    } else if (old && account.pinSet) {
      next = { ...old, name: account.name, updatedAt: now() };
    } else {
      throw new Error(`Add a PIN for ${account.name} before syncing.`);
    }
    const index = merged.findIndex((record) => record.id === next.id);
    if (index >= 0) merged[index] = next;
    else merged.push(next);
  }

  await store.setJSON(CLIENTS_KEY, merged);
  return merged;
}

async function deleteAccount(store, id) {
  const existing = await readDirectory(store);
  const next = existing.filter((record) => record.id !== id);
  await store.setJSON(CLIENTS_KEY, next);
  return next;
}

function getStoreForSite() {
  // Standard Netlify Function runtime credentials are used automatically for this site.
  return getStore(STORE_NAME);
}

exports.handler = async function handler(event) {
  try {
    const store = getStoreForSite();

    if (event.httpMethod === 'GET') {
      await store.get(BOARD_KEY, { type: 'json' });
      return respond(200, { ok: true, service: 'axon-workout-portal', storage: 'connected' });
    }

    if (event.httpMethod !== 'POST') return respond(405, { ok: false, error: 'Method not allowed.' });

    let body = {};
    try { body = JSON.parse(event.body || '{}'); }
    catch { return respond(400, { ok: false, error: 'Invalid JSON request.' }); }

    const action = safeString(body.action, 40);

    if (action === 'publish') {
      if (!adminAuthorized(event)) return respond(401, { ok: false, error: 'Publish key was not accepted.' });
      const board = sanitizeBoard(body.board);
      // Validate all account changes before writing the board so malformed client data cannot leave an ambiguous publish state.
      const clients = await upsertAccounts(store, body.accounts);
      const publishedAt = now();
      await store.setJSON(BOARD_KEY, { board, publishedAt, schema: 1 });
      return respond(200, { ok: true, publishedAt, clientCount: clients.length });
    }

    if (action === 'admin-directory') {
      if (!adminAuthorized(event)) return respond(401, { ok: false, error: 'Publish key was not accepted.' });
      const clients = await readDirectory(store);
      return respond(200, { ok: true, clients: clients.map(publicClient) });
    }

    if (action === 'delete-client') {
      if (!adminAuthorized(event)) return respond(401, { ok: false, error: 'Publish key was not accepted.' });
      const id = makeId(body.id, '');
      if (!id) return respond(400, { ok: false, error: 'Client ID is required.' });
      const clients = await deleteAccount(store, id);
      return respond(200, { ok: true, clientCount: clients.length });
    }

    if (action === 'login') {
      const pin = safeString(body.pin, 64);
      if (!pin) return respond(400, { ok: false, error: 'Enter your client PIN.' });
      const clients = await readDirectory(store);
      const client = clients.find((record) => verifyPin(pin, record));
      if (!client) return respond(401, { ok: false, error: 'That client PIN is not recognized.' });
      const published = await store.get(BOARD_KEY, { type: 'json' });
      return respond(200, {
        ok: true,
        session: issueSession(client),
        client: publicClient(client),
        board: published?.board || { weeks: [] },
        publishedAt: published?.publishedAt || ''
      });
    }

    if (action === 'read') {
      const session = readSession(body.session);
      if (!session) return respond(401, { ok: false, error: 'Your portal session expired. Enter your PIN again.' });
      const clients = await readDirectory(store);
      const client = clients.find((record) => record.id === session.id);
      if (!client) return respond(401, { ok: false, error: 'This client access record is no longer active.' });
      const published = await store.get(BOARD_KEY, { type: 'json' });
      return respond(200, {
        ok: true,
        client: publicClient(client),
        board: published?.board || { weeks: [] },
        publishedAt: published?.publishedAt || ''
      });
    }

    return respond(400, { ok: false, error: 'Unknown portal action.' });
  } catch (error) {
    console.error('workout-portal function error', error);
    return respond(500, { ok: false, error: 'The shared client portal service is temporarily unavailable. The admin Local Board remains unaffected.' });
  }
};
