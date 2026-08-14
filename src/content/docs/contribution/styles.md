---
title: Styles
description: Design tokens, palette, typography and layout metrics of the Docs Kit.
---

The Docs Kit styles live in `src/styles/celestial-docs.css` and are driven
by design tokens in `src/lib/ui/tokens.ts`. Everything is namespaced:
classes use the `cpd-` prefix, variables use `--cpd-*`.

The palette is the **Plumest default theme**: a neutral zinc base with a
near-black primary.

## Tokens

Tokens are the single source of truth. The palette in `tokens.ts` declares
each variable's **light** and **dark** value; the CSS injects them under
`:root` (light) and `:root[data-cpd-theme='dark']`.

### Palette

| Variable | Light | Dark |
| --- | --- | --- |
| `--cpd-background` | `hsl(0 0% 96%)` | `hsl(0 0% 7.04%)` |
| `--cpd-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 92%)` |
| `--cpd-muted` | `hsl(0 0% 96.1%)` | `hsl(0 0% 12.9%)` |
| `--cpd-muted-foreground` | `hsl(0 0% 45.1%)` | `hsl(0 0% 70% / 0.8)` |
| `--cpd-popover` | `hsl(0 0% 98%)` | `hsl(0 0% 11.6%)` |
| `--cpd-popover-foreground` | `hsl(0 0% 15.1%)` | `hsl(0 0% 86.9%)` |
| `--cpd-card` | `hsl(0 0% 94.7%)` | `hsl(0 0% 9.8%)` |
| `--cpd-card-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` |
| `--cpd-border` | `hsl(0 0% 80% / 0.5)` | `hsl(0 0% 40% / 0.2)` |
| `--cpd-primary` | `hsl(0 0% 9%)` | `hsl(0 0% 98%)` |
| `--cpd-primary-foreground` | `hsl(0 0% 98%)` | `hsl(0 0% 9%)` |
| `--cpd-secondary` | `hsl(0 0% 93.1%)` | `hsl(0 0% 12.9%)` |
| `--cpd-secondary-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 92%)` |
| `--cpd-accent` | `hsl(0 0% 82% / 0.5)` | `hsl(0 0% 40.9% / 0.3)` |
| `--cpd-accent-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 90%)` |
| `--cpd-ring` | `hsl(0 0% 63.9%)` | `hsl(0 0% 54.9%)` |
| `--cpd-overlay` | `hsl(0 0% 0% / 0.2)` | `hsl(0 0% 0% / 0.2)` |
| `--cpd-sidebar` | `hsl(0 0% 96%)` | `hsl(0 0% 7.04%)` |
| `--cpd-sidebar-foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 92%)` |
| `--cpd-sidebar-border` | `hsl(0 0% 80% / 0.5)` | `hsl(0 0% 40% / 0.2)` |
| `--cpd-sidebar-accent` | `hsl(0 0% 82% / 0.5)` | `hsl(0 0% 40.9% / 0.3)` |
| `--cpd-sidebar-accent-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 90%)` |

`--cpd-primary` is Plumest's neutral near-black (light `#171717` / dark
`#fafafa`); it drives active links, sidebar active items, the ClerkTOC track
and emphasis. The home page keeps its own celestial palette untouched.

### Semantic colors

Shared between light and dark, used by callouts, badges and the TOC step dots:

| Variable | Value |
| --- | --- |
| `--cpd-info` | `oklch(62.3% 0.214 259.815)` |
| `--cpd-warning` | `oklch(76.9% 0.188 70.08)` |
| `--cpd-error` | `oklch(63.7% 0.237 25.331)` |
| `--cpd-success` | `oklch(72.3% 0.219 149.579)` |
| `--cpd-idea` | `oklch(70.5% 0.209 60.849)` |

### Layout variables

| Variable | Value | Meaning |
| --- | --- | --- |
| `--cpd-sidebar-width` | `256px` | desktop sidebar width |
| `--cpd-toc-width-desktop` | `256px` | TOC rail width at ≥1280px |
| `--cpd-layout-width` | `97rem` | overall layout max width (demo grid) |
| `--cpd-page-max-width` | `800px` | article column max width |
| `--cpd-radius` | `8px` | base border radius |
| `--cpd-spacing` | `0.25rem` | spacing unit (indents are `calc(N * var(--cpd-spacing))`) |
| `--cpd-header-height` | `0 / 56px` | in-grid top bar (mobile only) |

## Theme switching

The kit supports three modes:

1. **Explicit:** `html[data-cpd-theme='dark']` → dark; absent → light.
2. **System:** when no explicit attribute is set, a
   `prefers-color-scheme: dark` media query flips to dark automatically.
3. **Toggle:** `data-cpd-theme-toggle` buttons call `applyTheme()` from
   `tokens.ts` and persist to `localStorage['celplume-theme']` (shared key
   with the home page). On the docs site, Starlight's `data-theme` attribute
   and the expressive-code code theme follow the same value.

## Typography

| Family | Variable | Usage |
| --- | --- | --- |
| Manrope + LxgwNeoXiHei | `--cpd-font-sans` | body, UI |
| Plus Jakarta Sans + LxgwNeoXiHei | `--cpd-font-display` | headings, nav, breadcrumb, kbd |
| Maple Mono + Fira Code | `--cpd-font-mono` | code, TOC step numbers |
| Libertine + LxgwNeoZhiSong | `--cpd-font-serif` | brand serif (header, sidebar) |

Body copy is `1rem / 1.75` line-height; article headings scale from
`2rem` (h1) down to `1.05rem` (h4), weight 600, with negative
letter-spacing on large sizes. Inline code uses a bordered `--cpd-secondary`
chip; code blocks (astro-expressive-code on the docs pages) render as a
single `--cpd-card` layer with `13px` mono text, a `1px` border and a ghost
copy button — matching Plumest.

## Layout

### Docs pages (Starlight shell)

The visible chrome is replaced via Starlight component overrides in
`src/components/starlight/`:

- a fixed 56px header (`brand + search + language switch + theme toggle`),
- a fixed 256px sidebar column with its own scroll (Plumest behavior),
- an article column capped at 800px (no right-hand TOC rail).

### Demo pages (`/demo/`, `/zh/demo/`)

The demo still uses the five-column CSS grid (ported from Plumest):

```text
"sidebar sidebar header toc toc"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar main toc toc"  1fr
```

- Column widths: `1fr | sidebar | content | toc | 1fr`, where content is
  `minmax(0, calc(layout − sidebar − toc))` and the article caps itself at
  `800px`.
- **≥1280px:** sidebar + TOC visible.
- **768–1279px:** TOC hidden, sidebar stays.
- **<768px:** sidebar becomes a slide-in drawer with an overlay; the header's
  hamburger opens it.

Collapsing the sidebar sets `data-cpd-collapsed` on `.cpd-layout`, which
shrinks the sidebar grid column to `0` and slides the aside out; a floating
expand button reappears.

## Icons

The kit ships its own lucide-style stroke icons in `src/lib/ui/icons/` —
**one file per icon** (rule in `AGENTS.md`). A new icon is a new `<name>.ts`
file exporting a function; `icons/index.ts` aggregates them into `Icon`:

```ts
// src/lib/ui/icons/star.ts
import { svg } from './svg';
import type { IconOptions } from './svg';

export const star = (o?: IconOptions) => svg('<path d="…"/>', o);
```

Use `Icon.<name>({ class })` inside builders. Size is controlled by `class`;
color inherits `currentColor`. Do not add a new icon by editing an existing
file — create a new one.

## Motion

Micro-interactions animate at `150ms ease` (links, cards, copy buttons,
chevrons); larger surfaces at `200ms ease` (drawers, accordions, tree
folders). Motion only touches `opacity`, `transform` and `background-color`
— never layout properties.

## Adding a token

1. Add the entry to `PALETTE` (or a new constant) in `src/lib/ui/tokens.ts`
   with both `light` and `dark` values.
2. Emit the variable under `:root` and `:root[data-cpd-theme='dark']` in
   `celestial-docs.css` (and the `prefers-color-scheme` block when it must
   follow the system).
3. Document it in the tables above.
