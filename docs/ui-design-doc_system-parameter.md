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
| Icon rail (shell substitute) | `div` — `flex w-14 flex-col items-center gap-2 border-r border-gray-200 py-3`, `role="navigation"` | `NbActionIcon` × 5 (`Menu`, `Home`, `LayoutGrid`, `Settings` current with `showBorder`, `Filter`), all `size="medium"` | Action · Icon |
| Skip link | `div` — `sr-only focus-within:not-sr-only` | `NbHyperlink` (`variant="primary"`, `wordWrap="nowrap"`) | Links and navigation |
| Page header row | `div` — `flex items-center justify-between gap-4 px-6 py-3` | `NbBreadcrumbs`; `NbBadge` (sample-data marker); `NbButton` ghost (Help) | Navigation · Display · Action |
| Page title block | `div` — `flex flex-col gap-2` inside `section p-6 gap-6` | `NbHeading tag="h2"`; `NbParagraph size="font-13" color="neutral"` | Typography |
| Titled section container | — | `NbPanel` (`enableborder`, no header, no padding; inner `div p-6 gap-4`) | Containers · Panel |
| Section title | `div` — `flex items-center gap-2` | `NbHeading tag="h4"`; `NbBadge` (record count) | Typography · Display |
| Toolbar | `div` — `flex md:flex-row md:justify-between gap-4` | `NbButton` × 2 (filter toggles, `ariaPressed`); `NbTextbox` search with `startIcon` | Action · Form inputs |
| Save error | `div role="alert"` | `NbParagraph color="error"` | Feedback |
| Data region | `div` — `relative min-h-[240px] max-h-[640px] overflow-auto` | `NbTable` (`enableHeader`, `headerData` object, `tableData` rows); `NbLoader` (`position="container"`) while saving; `NbEmptyState` when no rows | Data · Feedback |
| Row cells | `div` — `flex items-center gap-2` (value cell only) | `NbParagraph` (name, accepted, remarks); `NbTextbox` (value); `NbBadge` "Modified" when draft differs from saved | Form inputs · Display |
| Pagination row | `div` — `flex md:justify-between gap-4` | `NbParagraph` range label; `NbPagination variant="number"` | Progress · Pagination |
| Save actions | `div` — `flex md:justify-between gap-4` | `NbParagraph` status (`role="status"`); `NbButton` secondary (Discard); `NbButton` primary with `startIcon` (Save) | Action |
| Help | — | `NbDialogModal size="sm"` with `NbParagraph` body and footer primary button | Overlay |

## Design-guideline decisions

- **Spacing rhythm:** `p-6` page and panel padding, `gap-6` between sections, `gap-4` between rows/fields, `gap-2` for clusters.
- **Hierarchy:** `h2` page title, `h4` section and dialog titles, supporting text `font-13 neutral`.
- **Density:** single `medium` family for every button, textbox, badge and loader.
- **Colour:** only via `color` props (`neutral`, `primary`, `error`). No colour or typography classes on wrappers.
- **Data region states:** `NbLoader` during save, `NbEmptyState` for zero results.
- **Responsive:** toolbar, pagination and action rows stack below `md`; table scrolls horizontally below 960px.
- **Accessibility:** skip link, `role="group"` on filters, `role="alert"` on save error, `role="status"` on save state, `ariaDescribedby` from value to accepted-value cell.

## Shell substitute (remove when hosted in the runtime)

A compact neutral icon rail on the left, requested by the product owner for the standalone prototype. It uses a light surface with a neutral border instead of the dark brand sidebar seen in rTask. The runtime shell replaces it, together with the top navbar and any fixed footer surfaces.
