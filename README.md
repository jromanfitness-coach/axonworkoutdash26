# Axon Performance Workout Dashboard v50 — Clean Builder Rebuild

This package intentionally removes the legacy Local Board/Workout Builder code path. The dashboard is rebuilt around a direct, reliable Local Board modal.

## Login
- Username: `Admin1999`
- Password: `jaxroman`

## What changed
- Clean single-page dashboard.
- Local Board button opens the rebuilt Workout Builder directly.
- Menu → Local Board opens the same builder.
- Save Local Board updates the dashboard immediately and writes localStorage backups.
- Import/export JSON backup included.
- No legacy Tifton Fitness references.
- No fragile old `openAdmin()` or cached DOM integration.

## Deployment
Upload the contents of this ZIP to the root of the repo. Do not place the files inside an extra folder.

## v51 Full-Width Tiles + Hour Count-Up Timer
- Removed the right-side On Hour Timer panel.
- Removed the right-side circuit button list.
- Main workout tiles now expand across the full dashboard width.
- Added an automatic hourly count-up timer inside the program header.
- Timer reads elapsed time within the current clock hour: 00:00 through 59:59, then resets every hour.
- Timer color progression: green early, yellow late-session, red final wrap-up window.
- July workouts are included in the clean default board data.

## v52 Dropdown + Button Animation Polish
- Added a premium Active Coach dropdown card matching the reference aesthetic.
- Dropdown opens with a smooth scale/fade animation.
- Buttons, menu buttons, quick actions, tabs, and selects now use high-quality gradient hover states.
- Hover states include electric-blue/cyan glow, slight lift, and border bloom.
- Local Board / Workout Builder logic is unchanged from v51.

## v53 Multi-Circuit + Tile Fit
- Removed the visible Active Coach dropdown card from the workout dashboard.
- Kept the premium gradient hover animations and button/select polish from v52.
- Reworked workout tile typography with smart text-size classes so long exercise names fit better.
- Replaced the old Compact button with a Multi-Circuit button.
- Multi-Circuit mode displays the current circuit and the next circuit together.
- Multi-Circuit uses square-style tile groups with two circuits on screen.
- Local Board / Workout Builder logic remains unchanged from v52.

## v53.1 Circuit Label + Axon Insignia
- Replaced the top-left AX text mark with the uploaded Axon blue insignia image.
- Added a prominent active circuit label in the program header.
- Circuit label updates/pulses whenever Skip Left or Skip Right changes the active circuit.
- Multi-Circuit mode label shows both displayed circuits.

## v53.2 White SVG Logo Support
- Replaced the top-left logo asset with the uploaded white Axon insignia SVG.
- Renamed the uploaded SVG to a Netlify/GitHub-safe filename: assets/axon-insignia-white.svg.
- Removed the older blue PNG logo asset from this package.
- Preserved the v53.1 circuit label behavior and Multi-Circuit functionality.

## v53.3 Client Access Directory
- Rebuilt Client Access popup into a polished client directory matching the reference style.
- Client profiles show only name, email, and PIN.
- PINs are editable only while logged into the admin dashboard.
- Added search, filters, add client, delete client, copy PIN, import TXT/CSV/JSON, and export JSON.
- Seeded current client profiles from the reference list.
- Preserved v53.2 white logo, active circuit label, and Multi-Circuit behavior.

## v53.4 Optimized Client View
- Rebuilt client.html as a self-contained static client portal.
- Removed the broken server sync dependency and replaced it with packaged/default board data plus JSON import fallback.
- Client PIN login works from seeded client records and demo PIN axon26.
- Client view shows client name/email, week/program/circuit selectors, active circuit label, and workout tiles.
- Client portal can import a board JSON backup directly if admin wants to update a device manually.
- This version avoids the “no way to sync” failure because the client page no longer depends on Netlify Functions.

## v53.5 Multi-Coach Access + Admin Coach Management
- Added multi-coach login using username + PIN.
- Admin1999 / jaxroman remains the master admin login.
- Added a Coaches Management button that appears only for Admin1999.
- Admin can create coaches, set their username/PIN, lock/unlock them, delete them, and edit button permissions.
- Permission controls include Local Board, Clients, Weekly, Export, Multi-Circuit, and Skip controls.
- Coaches can update the Local Board and use all enabled dashboard functions.
- Client PIN editing remains admin-only.

## v53.6 Coach Management Visibility Fix
- Fixed the coach add/edit cards not appearing after adding a coach.
- Root cause: the new coach management cards reused the old `.coach-card` class, which was still hidden by the removed Active Coach dropdown CSS.
- Renamed management cards to `.coach-account-card` and forced visibility inside the Coaches Management popup.
- Added clearer status messages when adding, saving, locking, activating, or deleting coaches.
- Admin1999 can now add a coach and immediately see/edit that coach's username, PIN, and permissions.

## v53.7 Server Board Sync
- Activated Netlify Functions + Netlify Blobs server board storage.
- Local Board saves now auto-publish to the server.
- Coaches can log in from another device and pull the latest server board.
- New Server Sync popup shows revision, updated-by, pull, publish, publish-all, and reset controls.
- Coach and client directories can publish to the same server store.
- Local browser backup remains as an offline fallback.
- Client portal remains on standby for now.

Deploy notes:
- Upload all package contents to the repo root.
- Netlify build command: npm run build.
- Publish directory: .
- No BLOBS_SITE_ID or BLOBS_ACCESS_TOKEN env vars are needed for normal Netlify Blobs usage.

## v53.9 Server Save 502 Fix
- Rebuilt `netlify/functions/server-board.js` to avoid raw 502 crashes.
- Switched to a defensive lazy `@netlify/blobs` import so dependency/runtime problems return a readable JSON error.
- Updated Netlify Blobs usage to the stable `getStore("axon-server-board")` call.
- Added a Test Server button inside Server Sync.
- Removed stale `package-lock.json` so Netlify installs a fresh compatible dependency tree.
- Keeps the v53.8 installed workout board and server-sync UI.

## v54 Netlify Blobs connectLambda Fix
- Fixes the exact deployed error: "The environment has not been configured to use Netlify Blobs."
- Root cause: this project uses Netlify Lambda-compatible Functions, and Blobs must be initialized with `connectLambda(event)` before `getStore()`.
- Rebuilt `server-board.js` so every request connects the Lambda event before opening the `axon-server-board` store.
- Keeps optional siteID/token fallback support, but it should not be required after this fix.
- Keeps the installed workout board and server-sync UI from v53.8/v53.9.
