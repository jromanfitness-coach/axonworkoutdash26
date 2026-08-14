let memoryState = null;

const DEFAULT_STATE = {
  version: 540,
  updatedAt: null,
  updatedBy: "system",
  board: null,
  coaches: null,
  clients: null,
  revision: 0
};

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

function reply(statusCode, payload) {
  return { statusCode, headers, body: JSON.stringify(payload) };
}

function parseJson(event) {
  if (!event || !event.body) return {};
  try { return JSON.parse(event.body); }
  catch (error) { throw new Error("Invalid JSON body."); }
}

function mergeState(saved) {
  return Object.assign({}, DEFAULT_STATE, saved || {});
}

function loadBlobs() {
  try {
    const blobs = require("@netlify/blobs");
    if (!blobs || typeof blobs.getStore !== "function") {
      throw new Error("@netlify/blobs loaded, but getStore() is unavailable.");
    }
    return blobs;
  } catch (error) {
    throw new Error("Could not load @netlify/blobs. Confirm Netlify ran npm install. Detail: " + (error.message || error));
  }
}

function getBlobStore(event) {
  const blobs = loadBlobs();
  const siteID =
    process.env.NETLIFY_SITE_ID ||
    process.env.SITE_ID ||
    process.env.BLOBS_SITE_ID ||
    process.env.NETLIFY_BLOBS_SITE_ID;
  const token =
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.BLOBS_TOKEN ||
    process.env.NETLIFY_TOKEN;

  // Primary fix: Lambda compatibility mode requires connectLambda(event)
  // immediately before getStore().
  try {
    if (typeof blobs.connectLambda === "function") {
      blobs.connectLambda(event);
    }
    return blobs.getStore("axon-server-board");
  } catch (lambdaError) {
    // Optional fallback for manual/API mode if the user later adds env vars.
    if (siteID && token) {
      try {
        return blobs.getStore({ name: "axon-server-board", siteID, token });
      } catch (manualError) {
        throw new Error(
          "Netlify Blobs failed in Lambda mode and manual siteID/token fallback. Lambda detail: " +
            (lambdaError.message || lambdaError) +
            " Manual detail: " +
            (manualError.message || manualError)
        );
      }
    }

    throw new Error(
      "Netlify Blobs connection failed. This build now calls connectLambda(event) before getStore(). " +
        "If this still appears, confirm the deployed function receives the Netlify Blobs event context. Detail: " +
        (lambdaError.message || lambdaError)
    );
  }
}

async function readState(event) {
  if (process.env.NETLIFY_DEV === "true" && memoryState) return mergeState(memoryState);
  const store = getBlobStore(event);
  const saved = await store.get("axon-server-board-state", { type: "json" });
  const state = mergeState(saved);
  if (process.env.NETLIFY_DEV === "true") memoryState = state;
  return state;
}

async function writeState(event, state) {
  const next = mergeState(state);
  try {
    const store = getBlobStore(event);
    await store.setJSON("axon-server-board-state", next);
  } catch (error) {
    if (process.env.NETLIFY_DEV === "true") {
      memoryState = next;
      return;
    }
    throw error;
  }
}

function cleanActor(value) {
  return String(value || "coach").trim() || "coach";
}

function validBoard(board) {
  return !!board && typeof board === "object" && Array.isArray(board.weeks);
}

function validArray(value) {
  return Array.isArray(value);
}

exports.handler = async function handler(event) {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };

    if (event.httpMethod === "GET") {
      const state = await readState(event);
      return reply(200, {
        ok: true,
        state,
        runtime: {
          blobsBridge: "connectLambda",
          hasEventBlobs: !!(event && event.blobs),
          version: "v54"
        }
      });
    }

    if (event.httpMethod !== "POST") {
      return reply(405, { ok: false, error: "Method not allowed." });
    }

    const body = parseJson(event);
    const action = String(body.action || "").trim();
    const actor = cleanActor(body.actor);
    const state = await readState(event);

    if (action === "publishBoard") {
      if (!validBoard(body.board)) {
        return reply(400, { ok: false, error: "Invalid board payload. Expected object with weeks array." });
      }

      state.board = body.board;
      state.updatedAt = new Date().toISOString();
      state.updatedBy = actor;
      state.revision = Number(state.revision || 0) + 1;

      await writeState(event, state);
      return reply(200, { ok: true, state });
    }

    if (action === "publishAll") {
      if (body.board !== undefined) {
        if (!validBoard(body.board)) return reply(400, { ok: false, error: "Invalid board payload. Expected object with weeks array." });
        state.board = body.board;
      }
      if (body.coaches !== undefined) {
        if (!validArray(body.coaches)) return reply(400, { ok: false, error: "Invalid coaches payload. Expected array." });
        state.coaches = body.coaches;
      }
      if (body.clients !== undefined) {
        if (!validArray(body.clients)) return reply(400, { ok: false, error: "Invalid clients payload. Expected array." });
        state.clients = body.clients;
      }

      state.updatedAt = new Date().toISOString();
      state.updatedBy = actor;
      state.revision = Number(state.revision || 0) + 1;

      await writeState(event, state);
      return reply(200, { ok: true, state });
    }

    if (action === "publishCoaches") {
      if (!validArray(body.coaches)) return reply(400, { ok: false, error: "Invalid coaches payload. Expected array." });
      state.coaches = body.coaches;
      state.updatedAt = new Date().toISOString();
      state.updatedBy = actor;
      state.revision = Number(state.revision || 0) + 1;
      await writeState(event, state);
      return reply(200, { ok: true, state });
    }

    if (action === "publishClients") {
      if (!validArray(body.clients)) return reply(400, { ok: false, error: "Invalid clients payload. Expected array." });
      state.clients = body.clients;
      state.updatedAt = new Date().toISOString();
      state.updatedBy = actor;
      state.revision = Number(state.revision || 0) + 1;
      await writeState(event, state);
      return reply(200, { ok: true, state });
    }

    if (action === "reset") {
      const resetState = mergeState({
        version: 540,
        updatedAt: new Date().toISOString(),
        updatedBy: actor,
        board: null,
        coaches: null,
        clients: null,
        revision: 0
      });
      await writeState(event, resetState);
      return reply(200, { ok: true, state: resetState });
    }

    return reply(400, { ok: false, error: "Unknown server-board action: " + action });
  } catch (error) {
    console.error("server-board handler failed:", error);
    return reply(500, {
      ok: false,
      error: error.message || "Server board function failed.",
      hint:
        "v54 uses connectLambda(event) before getStore(). If this still fails, deploy with Clear cache and check Netlify → Functions → server-board logs."
    });
  }
};
