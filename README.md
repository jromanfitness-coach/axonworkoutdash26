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
