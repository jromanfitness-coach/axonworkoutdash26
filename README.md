# Axon Workout Dashboard — v41 Axon Tile Refinement

This release keeps the current workout dashboard and client-portal structure intact while upgrading the visual system to the new Axon Performance design language.

## Highlights
- Premium Axon Performance dark navy / electric-blue visual system
- Montserrat typography and improved text hierarchy
- Layered glass panels, technical grid textures, diagonal light flares, and low-opacity insignia-style depth elements
- Upgraded hover states, panel glow, motion polish, and smoother button emphasis
- Admin dashboard and client portal both refreshed to the new Axon aesthetic
- Existing workout-builder / local-board / client-sync behavior preserved

## Deploy
Upload the contents of this package to the GitHub repository root for your Netlify site.

## Netlify
Keep the same Netlify environment variables already used by the shared client-sync version.

## v41 Tile Refinement
- Removed duplicated bottom-left reps/work text from workout tiles.
- Enlarged and emphasized the top-right work/rep badge.
- Kept coach notes visible on the lower-right of each tile.

## v42 Font & Spacing Refinement
- Preserved the v40-v41 Axon aesthetic while keeping the Montserrat-based font treatment.
- Centered and respaced the main exercise text in station tiles for easier reading.
- Removed the remaining visible Tifton Fitness export label and replaced it with Axon Performance.

## v43 Tile Text + Menu Fix
- Main exercise text in station tiles is now bold and left-aligned.
- Removed the centered exercise-title treatment from v42.
- Menu dropdown is forced above the dashboard/workout tiles and no longer clips underneath the topbar.
- Mobile menu uses a fixed overlay position for better Safari behavior.

## v44 Station Tile Layout
- Rebuilt station tile layout to match the reference: station label top-left, large exercise text left/centered vertically, and reps badge centered on the right.
- Removed lower tile note/prescription row from display tiles to prevent text sinking.
- Preserved compact multi-view readability.

## v46 Functionality Restore
- Started from v44 stable visual package, not v45.
- Undid the larger v45 station tile text sizing.
- Hardened Local Board opener and editor mode without capture-event button hacks.
- Added safe local/session/memory storage fallback.
- Raised Menu and Local Board overlay z-index without changing core button behavior.
- Preserved existing Local Board storage keys so restored workouts remain available.
