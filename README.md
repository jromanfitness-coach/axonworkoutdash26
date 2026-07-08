# Axon Workout Dashboard v38 — public npm lock repair

This release is a targeted repair for Netlify dependency-install failures caused by package-lock URLs pointing at a private OpenAI registry.

## What changed

- `package-lock.json` now resolves every dependency from `https://registry.npmjs.org/`.
- `.npmrc` explicitly selects the public npm registry.
- The workout dashboard, Local Board keys, client portal, and Function source are otherwise unchanged from v37.

## Deploy

1. Replace the contents of your GitHub repository `main` branch with the files in this folder.
2. In Netlify, set the Build command to `npm run build` or leave the existing harmless build command unchanged.
3. Trigger **Clear cache and deploy site**.

## Netlify variables

Keep only the values required by your existing shared portal configuration:

- `ADMIN_PUBLISH_SECRET`
- `AUTH_SESSION_SECRET` (recommended)

Do not add `BLOBS_SITE_ID`, `BLOBS_ACCESS_TOKEN`, or `NPM_CONFIG_REGISTRY`.

## Verify

A successful deploy must show package installation from `registry.npmjs.org`, then function packaging for `workout-portal.js`.
