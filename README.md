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
