# Axon Workout Dashboard v37 — Shared Client Portal

## What this release changes

The Admin Workout Dashboard remains the same local-first display application:

- `/` — Admin dashboard and Local Board
- `/client` — Separate, view-only client workout portal
- **Manage Clients** remains admin-only
- The admin Local Board always saves in the browser first

This release adds one isolated shared sync layer using **Netlify Blobs**:

- Client names and PINs are written to the server when the admin syncs.
- Raw client PINs are hashed before they are stored in Blobs.
- Client phones can use their private PIN from any network.
- The most recently synced Local Board is available to the client portal.
- If Netlify Blobs has a problem, the admin login and Local Board still work normally.

## Required Netlify environment variable

Create this in **Project configuration → Environment variables**:

```text
ADMIN_PUBLISH_SECRET=make-this-a-long-random-secret
```

Scope it to **Functions** and **Production**.

Optional but recommended:

```text
AUTH_SESSION_SECRET=different-long-random-secret
```

`AUTH_SESSION_SECRET` signs client portal sessions. If it is omitted, the Function uses `ADMIN_PUBLISH_SECRET` for session signing.

Do not add Blob project IDs, Blob API tokens, client PINs, or admin login values as environment variables. Netlify Functions automatically receive access to this site’s Blob store.

## GitHub / Netlify deployment

1. Upload the **contents** of this folder to the root of your GitHub `main` branch.
2. Keep these files at the repository root:

```text
index.html
client.html
netlify.toml
package.json
package-lock.json
netlify/
README.md
```

3. In Netlify, set the production branch to `main`.
4. This package includes its own build command in `netlify.toml`. Do not leave an older UI build command such as `scripts/verify-build.cjs` in Netlify.
5. Trigger **Clear cache and deploy site** once after replacing older releases.

## First live sync

1. Log in to the Admin Dashboard.
2. Confirm your Local Board still contains your workouts.
3. Open **Menu → Set Publish Key** and enter the value of `ADMIN_PUBLISH_SECRET`.
4. Open **Manage Clients**, create a name + private PIN, and choose **Save & Sync**.
5. From Menu, choose **Sync Client Portal**.
6. Open `/client` from a separate phone/network and enter that client PIN.

Once the Publish Key is set in that admin browser session, Builder saves, TXT imports, and client record saves queue automatic shared sync.

## Test endpoints

After deployment:

```text
/.netlify/functions/workout-portal
```

A healthy Function returns JSON like:

```json
{"ok":true,"service":"axon-workout-portal","storage":"connected"}
```

## Security boundary

Client portal PIN validation and the latest shared board are server-side. Raw client PINs are never sent back to the browser after syncing.

The existing Admin dashboard login remains a convenience front-end gate inherited from the dashboard release. It is deliberately independent from shared client sync so a server outage cannot block live workout display. Use Netlify access controls later if you need robust staff authentication.
