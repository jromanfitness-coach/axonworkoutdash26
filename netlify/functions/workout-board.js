const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const STORE_NAME = 'axon-workout-board';
const BOARD_KEY = 'current';

function reply(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    },
    body: JSON.stringify(body)
  };
}

function text(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

function number(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(999, Math.round(n))) : fallback;
}

function normalizeBoard(source) {
  const weeks = Array.isArray(source && source.weeks) ? source.weeks.slice(0, 52).map((week, weekIndex) => ({
    week: text(week && week.week, 120) || `Training Week ${weekIndex + 1}`,
    summary: text(week && week.summary, 1200),
    display: text(week && week.display, 80),
    programs: Array.isArray(week && week.programs) ? week.programs.slice(0, 30).map((program, programIndex) => ({
      name: text(program && program.name, 160) || `Workout ${programIndex + 1}`,
      mode: String(program && program.mode).toLowerCase() === 'timed' ? 'timed' : 'strength',
      desc: text(program && program.desc, 1200),
      rounds: number(program && program.rounds, 3),
      work: number(program && program.work, 0),
      rest: number(program && program.rest, 0),
      circuits: Array.isArray(program && program.circuits) ? program.circuits.slice(0, 24).map((circuit, circuitIndex) => ({
        name: text(circuit && circuit.name, 160) || `Circuit ${circuitIndex + 1}`,
        stations: Array.isArray(circuit && circuit.stations) ? circuit.stations.slice(0, 30).map((station) => ({
          exercise: text(station && station.exercise, 220) || 'Exercise',
          prescription: text(station && station.prescription, 120),
          note: text(station && station.note, 800)
        })) : []
      })) : []
    })) : []
  })) : [];
  return {
    brand: text(source && source.brand, 160),
    heading: text(source && source.heading, 160),
    footerLeft: text(source && source.footerLeft, 160),
    footerRight: text(source && source.footerRight, 160),
    weeks
  };
}

function safeEquals(actual, expected) {
  const a = Buffer.from(String(actual || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

exports.handler = async (event) => {
  try {
    const store = getStore(STORE_NAME);

    if (event.httpMethod === 'GET') {
      const health = String((event.queryStringParameters || {}).health || '') === '1';
      const saved = await store.get(BOARD_KEY, { type: 'json' });
      if (health) return reply(200, { ok: true, service: 'workout-board', storage: 'connected', published: Boolean(saved && saved.board) });
      if (!saved || !saved.board) return reply(404, { ok: false, error: 'No shared workout board has been published yet.' });
      return reply(200, { ok: true, publishedAt: saved.publishedAt, board: saved.board });
    }

    if (event.httpMethod !== 'POST') return reply(405, { ok: false, error: 'Method not allowed.' });

    const expected = process.env.ADMIN_PUBLISH_SECRET || '';
    if (!expected) return reply(503, { ok: false, error: 'Publishing is not configured for this Netlify site yet.' });

    const provided = event.headers['x-admin-publish-secret'] || event.headers['X-Admin-Publish-Secret'] || '';
    if (!safeEquals(provided, expected)) return reply(401, { ok: false, error: 'The publish key was not accepted.' });

    const body = JSON.parse(event.body || '{}');
    const board = normalizeBoard(body.board || {});
    if (!board.weeks.length) return reply(400, { ok: false, error: 'Add at least one training week before publishing.' });

    const publishedAt = new Date().toISOString();
    await store.setJSON(BOARD_KEY, { version: 1, publishedAt, board });
    return reply(200, { ok: true, publishedAt, weekCount: board.weeks.length });
  } catch (error) {
    console.error('workout-board function error', error);
    return reply(503, { ok: false, error: 'Shared board storage is unavailable. The Local Board is not affected.' });
  }
};
