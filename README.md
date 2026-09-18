# System Parameter

React implementation of the System Parameter PRD using the official `@ramco-platform/studio-components@3.0.0-studio.55` Nebula library. The former custom `nebula.js` and `nebula.css` layer has been removed.

## Run locally

Use Node.js 22.12+ or 24. Installation requires access to the private Ramco packages through your local npm configuration. Registry configuration and credentials are excluded from this repository.

```powershell
npm ci --ignore-scripts --legacy-peer-deps
npm start
```

Open http://localhost:4173. `legacy-peer-deps` is required because the library bundles dependencies with conflicting React peer ranges; this app uses React 18.3.1, supported by Nebula.

```powershell
npm run check
npm test
npm run build
npm run preview
```

Stop the dev server before starting the preview: both use port 4173. `build` produces static assets in `dist/`; `preview` serves that production build locally.

## Official components

| UI | Package component |
| --- | --- |
| Batch Save, Discard, filters, Help | `NbButton` |
| Inline parameter values and search | `NbTextbox` |
| Four-column parameter grid | `NbTable` with `NbTextbox` value cells |
| Parameter panel | `NbPanel` |
| Record count and sample marker | `NbBadge` |
| Page navigation | `NbPagination` |
| Help dialog | `NbDialogModal` |
| No matches / no modifications | `NbEmptyState` |
| Breadcrumb and navigation links | `NbBreadcrumbs`, `NbHyperlink` |
| Headings, metadata, validation summary and save status | `NbHeading`, `NbParagraph` |

All UI controls are imported from the official package. Native semantic HTML supplies the page landmarks and layout wrappers. `styles.css` controls page composition, table density, modified-row highlighting, and responsive positioning; it does not recreate the controls. Nebula supplies its own styles, fonts and icons. Its internal dependencies include other UI libraries; this application does not import those directly.

The distributed Nebula package is a single large module with icon collections and embedded styles. The production bundle is correspondingly large; the application uses the package as published without modifying its source. Its default focused invalid textbox retains a blue focus border while exposing `aria-invalid` and its error message.

## Behavior

- Four PRD columns; only System Parameter Value is editable.
- 64 illustrative parameters, 48 records per page, and a desktop grid viewport for 16 standard rows.
- Draft values survive search, filters and pagination. Modified rows are highlighted.
- One Save action validates and persists every modified row. Invalid values focus the first error; storage failures preserve drafts for retry.
- Sample values persist in browser localStorage. This is not a production backend.
- Discard restores the saved values. Keyboard shortcuts: `/` searches; Ctrl/Cmd+S saves.
- Compact screens retain horizontal table scrolling and accessible controls.

## PRD integration boundary

Role–organization-unit access and enterprise services remain unconnected. Replace sample data in `data.js` and localStorage persistence in `app.jsx` when service contracts are available.

| PRD contract | Integration |
| --- | --- |
| `Cdepsysparmainpgdeffetchsr`, `spdref` | Fetch parameter rows |
| `_systemparametername` | `name`, read-only |
| `_systemparametervalue` | `value`, editable |
| `_acceptedvalue` | `accepted`, read-only |
| `_remarks` | `remarks`, read-only |
| `depsysparmainpgsavtr`, `Cdepsysparmainpgsavtrsr` | Persist modified rows in one batch |

## Confidential files

`.gitignore` excludes local registry credentials, environment files, the RXD design folder, private reference documents, node_modules, generated builds and browser artifacts. Do not put tokens in source code or use a `VITE_`-prefixed environment variable for secrets: those variables are exposed to browser code.

`npm run check:secrets` scans tracked and unignored working-tree text files; `npm run check:secrets -- --staged` scans staged blobs. Findings show paths and categories without printing matching values. Environment-only npm token references are allowed; literal tokens are rejected. This is a heuristic scanner, not a Git-history audit or a guarantee against every secret format. Binary files are counted but not content-scanned.

Enable the commit hook per clone with `git config core.hooksPath .githooks`. Tests use isolated temporary repositories and do not modify this repository's index.

## Vercel deployment

`vercel.json` selects Vite, installs the locked dependencies with the same compatibility flags used locally (including build-time dev dependencies), runs `npm run build`, and publishes `dist/`. `package.json` selects Node.js 24. The production build includes the React app, Tailwind layout CSS, and Nebula assets used locally.

Connect this repository with production branch `main` and the repository root as the Root Directory. Private Ramco packages require registry authentication before installation: configure the project's sensitive `NPM_RC` environment variable with the required registry configuration, following [Vercel's private dependency guide](https://vercel.com/kb/guide/using-private-dependencies-with-vercel). If that configuration references a token environment variable, configure it separately as sensitive too. Enable these for Production and, if needed, Preview. Never commit the local `.npmrc` or copy credentials into frontend variables.

After configuring registry access, redeploy the latest `main` commit. Verify the production deployment succeeds; a Git push alone does not confirm deployment. Browser-local sample values are origin-specific, so saved localhost values do not transfer to the deployed site.
