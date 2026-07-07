# Axon Workout Dashboard v34 — Client Button Fix

Static Netlify build. No Node build, Functions, environment variables, or dependencies are required.

## Fix
- The Clients quick-action now has a direct event listener and a defensive modal opener.
- The Client Management modal is forced above the dashboard/menu overlays.
- Client PINs are still saved locally in the admin browser.

Deploy the contents of this folder at the GitHub repository root. In Netlify leave Base directory, Build command, Publish directory, and Functions directory blank.


## v35 UI placement
- Keeps the dashboard home screen unchanged.
- Moves client actions into the main quick-action control strip beside Local Board and Skip Right.
- Adds Client View (preview) and Manage Clients controls.
