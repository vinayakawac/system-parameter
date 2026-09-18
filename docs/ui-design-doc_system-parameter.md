# UI design doc — System Parameter

> Composition plan required by rui-page-builder rule 0. Written before the JSX in `app.jsx` and kept in
> sync with it. The `uidl-creator/references/ui-design-doc.md` template and `choose.md` are not vendored in
> this repo, so region citations below name the `choose.md` section by title; re-check against the plugin
> copy when it is available.

## Scope

Body-only page. The navbar, sidebar and app shell come from the runtime and are not authored here
(see `references/examples/dashboard-page.tsx`). Root wrapper carries `theme-rxd`. Because this prototype runs without the runtime shell, the root wrapper also carries `bg-white` as the page canvas; drop it when the page is hosted inside the shell.

## Regions

| Region | Layout wrapper (Tailwind) | Nb* component | choose.md section |
|---|---|---|---|
| Blank rail (shell substitute) | `div` — `w-14 shrink-0 border-r border-gray-200`, `aria-hidden` | none | — |
| Skip link | `div` — `sr-only focus-within:not-sr-only` | `NbHyperlink` (`variant="primary"`, `wordWrap="nowrap"`) | Links and navigation |
| Page header row | `div` — `flex items-center justify-between gap-4 px-6! py-3` (important: Nebula ships an unlayered `*` padding reset that beats layered utilities here) | `NbBreadcrumbs`; `NbBadge` (sample-data marker); `NbButton` ghost (Help) | Navigation · Display · Action |
| Page title block | `div` — `flex flex-col gap-2` inside `section p-6 gap-6` | `NbHeading tag="h2"`; `NbParagraph size="font-13" color="neutral"` | Typography |
| Section container | `div` — `flex min-h-0 flex-1 flex-col gap-4` (NbPanel dropped once border and header were removed; a bare panel added nothing and its internal wrappers cannot stretch to fill the viewport) | — | Containers |
| Section title | `div` — `flex items-center gap-2` | `NbHeading tag="h4"`; `NbBadge` (record count) | Typography · Display |
| Toolbar | `div` — `flex md:justify-end` | `NbTextbox` search with `startIcon`. (A view-mode filter such as All / Modified would be `NbToggleButtonGroup`, not `NbTab`; removed because a single option remains.) | Form inputs |
| Save error | `div role="alert"` | `NbParagraph color="error"` | Feedback |
| Data region | `div` — `relative min-h-0 flex-1 overflow-auto [&_thead]:sticky [&_thead]:top-0` plus `[&_.NbTable]:overflow-visible!` (the grid is the only scroll container; root is `h-screen overflow-hidden`; NbTable has no sticky prop and its own container scrolls, which would otherwise trap the sticky header) | `NbTable` (`enableHeader`, `headerData` object, `tableData` rows); `NbLoader` (`position="container"`) while saving; `NbEmptyState` when no rows | Data · Feedback |
| Row cells | `div` — `flex items-start gap-2` (value cell only); badge wrapper `flex h-9 shrink-0 items-center`, `invisible` when unmodified so the input width and badge position never shift when a badge or validation message appears | `NbParagraph` (name, accepted, remarks); `NbTextbox` (value); `NbBadge` "Modified" when draft differs from saved | Form inputs · Display |
| Pagination row | `div` — `flex md:justify-between gap-4` | `NbParagraph` range label; `NbPagination variant="number"` | Progress · Pagination |
| Bottom action bar (shell substitute) | `div` — `flex shrink-0 gap-4 bg-white px-6! py-6 md:justify-between` (pinned by the fixed-height layout, no top border) | `NbParagraph` status (`role="status"`); `NbButton` secondary (Discard); `NbButton` primary with `startIcon` (Save) | Action |
| Help | — | `NbDialogModal size="sm"` with `NbParagraph` body and footer primary button | Overlay |

## Design-guideline decisions

- **Spacing rhythm:** `p-6` page and panel padding, `gap-6` between sections, `gap-4` between rows/fields, `gap-2` for clusters.
- **Hierarchy:** `h2` page title, `h4` section and dialog titles, supporting text `font-13 neutral`.
- **Density:** single `medium` family for every button, textbox, badge and loader.
- **Colour:** only via `color` props (`neutral`, `primary`, `error`). No colour or typography classes on wrappers.
- **Data region states:** `NbLoader` during save, `NbEmptyState` for zero results.
- **Responsive:** toolbar, pagination and action rows stack below `md`; table columns use percentage widths; only the grid scrolls, the page never does.
- **Accessibility:** skip link, `role="alert"` on save error, `role="status"` on save state, `ariaDescribedby` from value to accepted-value cell.

## Shell substitute (remove when hosted in the runtime)

A blank neutral rail on the left that reserves the sidebar width, requested by the product owner for the standalone prototype. It uses a light surface with a neutral border and no icons. The runtime shell replaces it, together with the top navbar and any fixed footer surfaces.
