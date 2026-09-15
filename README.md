# System Parameter — RXD UI prototype

A desktop-first, interactive System Parameter screen based on the supplied PRD and RXD design-system references. Private design references and local verification artifacts are excluded from this repository. No installation or build step is required.

## Run

```powershell
npm start
```

Open http://localhost:4173. Run `npm run check` for JavaScript syntax checks.

## Vercel deployment

`vercel.json` selects the Other framework preset, runs `npm run build`, and publishes `dist/` as a static site. The build copies only `index.html`, `styles.css`, `app.js`, and `data.js`; the local server and private references are not deployment assets.

`server.mjs` is for local preview only. This browser-based prototype does not require a Vercel server function. Push an explicitly authorized commit to the connected `main` branch to trigger deployment.

## Included

- Four PRD columns. Only System Parameter Value is editable.
- 64 clearly labeled sample parameters, 48 records per page, a 16-row desktop viewport, and sticky column headers.
- Search, modified-only review, retained drafts across pages and filters, and discard of unsaved changes.
- One Save action for all modified records; blur/submit validation, saving feedback, success notification, and recoverable failure feedback.
- Saved sample values persist in browser localStorage. No production services or authentication are connected.
- Accessible labels, visible keyboard focus, search shortcut `/`, save shortcut `Ctrl/Cmd+S`, reduced motion, and a compact layout with horizontal table scrolling.
- Smaller screens preserve readable columns through horizontal scrolling. Below 600px the table viewport reduces to 520px.

## Production integration boundary

| PRD item | Integration requirement |
| --- | --- |
| ILBO `systemparameter` | Initialize the screen and resolve authorized role/OU context server-side. |
| Default fetch `Cdepsysparmainpgdeffetchsr` | Replace sample records with the `spdref` segment. |
| `_systemparametername` | Map to `name` (read-only). |
| `_systemparametervalue` | Map to `value` (editable). |
| `_acceptedvalue` | Map to `accepted` (read-only). |
| `_remarks` | Map to `remarks` (read-only). |
| Save task `depsysparmainpgsavtr` | Submit all modified records in one task. |
| Service `Cdepsysparmainpgsavtrsr` | Replace localStorage write with the save service; update baseline only on confirmed success. |
| RBAC | Enforce role–organization-unit authorization on both fetch and save. Authentication and authorization are not connected in this prototype. |

`data.js` contains illustrative names, values, and validators because actual parameter records and service contracts were not supplied. Replace these with backend-owned parameter definitions; do not infer validation by parsing display text in a production adapter.

The PRD says “No error state” but explicitly requires errors and correction after failed saves. This design includes local field and save feedback for that specified workflow.

## Visual system

RXD brand blue, neutral surfaces, IBM Plex Sans / Mono, 8px control radii, 12px panel radius, 40px controls and rows, 32px inline editors, and the 8/16/24 spacing rhythm. Layout dimensions such as the navigation width and table columns are composition-specific. Secondary metadata uses the RXD 10–13px heading/caption scales; main table names use 13px. Fonts load from Google Fonts with system fallbacks when offline.

Files: `index.html` (layout), `styles.css` (tokens and responsive styling), `app.js` (interactions and simulated persistence), `data.js` (sample records), and `server.mjs` (local-only server).
