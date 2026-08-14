---
title: Contribution Overview
description: What the Contribution category documents, how the Docs Kit is organized, and how to add to it.
---

The **Contribution** category is the home for the project's own
style and component specifications — the hand-crafted, framework-free
UI kit behind the **Plumest** docs style.

This category did not exist before; it was introduced together with the kit.
Use it as the source of truth when extending the site's components:
check the conventions here first, then follow the checklist at the bottom.

## What the kit is

`src/lib/ui/` is a **pure TypeScript** implementation of a Plumest-style
documentation UI — the left sidebar, the ClerkTOC, document styles and the
common content components:

- **No React.** Builders are plain functions returning HTML strings.
- **No runtime dependencies.** Interactivity is ~350 lines of vanilla
  TypeScript in `src/lib/ui/runtime.ts`.
- **Server-safe.** Everything renders to static HTML at build time, so it
  works in Astro (via `set:html`), plain HTML, or any SSR environment.

The reference implementation lives in the local clone at `reference/`
(gitignored); read it when in doubt about intended
behavior, but keep the kit framework-free.

## Category contents

| Page | Covers |
| --- | --- |
| [Design System](/contribution/design-system/) | Principles, color, typography, spacing, icons, motion at a glance |
| [Styles](/contribution/styles/) | Design tokens, palette, typography, layout grid |
| [Components](/contribution/components/) | Component reference — one page per builder, live previews |

The docs pages themselves are rendered by Starlight with the kit visible
shell swapped in via component overrides; a live demo of the whole kit
(sidebar + ClerkTOC + components) is available at [/demo/](/demo/).

## Directory layout

```text
src/
├── lib/ui/                  # the kit (pure TS)
│   ├── html.ts             #   escape / attrs / el primitives
│   ├── types.ts             #   shared types (NavNode, TocItem, …)
│   ├── icons.ts             #   inline lucide-style SVG set
│   ├── tokens.ts            #   design tokens (TS → CSS variables)
│   ├── sidebar.ts           #   left sidebar builder
│   ├── toc.ts               #   ClerkTOC builder + heading collector
│   ├── components.ts        #   callout, cards, steps, tabs, … builders
│   ├── github-card.ts       #   GitHubCard builder + build-time fetch
│   ├── runtime.ts           #   framework-free client runtime
│   └── index.ts             #   public API barrel
├── styles/
│   ├── celestial-docs.css   # kit styles (cpd- prefixed, token-driven)
│   └── starlight-plumest.css # Starlight shell neutralization + docs chrome
├── components/
│   ├── starlight/           # Starlight overrides (Header, Sidebar, PageTitle, …)
│   │   └── …                #   13 overrides wiring the kit into the shell
│   ├── kit/Preview.astro    # live-preview frame for MDX component docs
│   └── DocsKitDemo.astro    # live demo page body
├── scripts/
│   └── celestial-docs-runtime.ts # injected into every docs page
├── layouts/
│   └── DocsKit.astro        # demo page layout (fonts + runtime)
└── pages/
    ├── demo.astro           # EN live demo
    └── zh/demo.astro        # ZH live demo
```

## Conventions (mandatory)

1. **Prefix everything.** Classes start with `cpd-`, CSS variables with
   `--cpd-`, interaction hooks are `data-cpd-*` attributes. Never style
   outside the prefix — Starlight and the home page must stay untouched.
2. **Tokens drive styles.** Add colors/layout values to
   `src/lib/ui/tokens.ts` first, then consume them via CSS variables in
   `celestial-docs.css`. Do not hard-code hex values in CSS.
3. **Builders escape.** All text content must go through the escaping in
   `html.ts` (`el`/`text`); never interpolate untrusted strings as raw HTML.
4. **Runtime is delegated.** New interactions attach to `data-cpd-*` hooks
   inside `initCelestialUI`; they must be idempotent and work on re-init.
5. **Bilingual.** Every new doc page ships EN (`src/content/docs/`) and
   ZH (`src/content/docs/zh/`) versions with matching slugs, plus the
   sidebar entry in `astro.config.mjs`.

## Adding a new component

1. Add the type to `src/lib/ui/types.ts` if it needs new shapes.
2. Add the builder to `src/lib/ui/components.ts` (or a new module), with a
   JSDoc comment and an HTML-string return.
3. Add the styles to `src/styles/celestial-docs.css` under a new `cpd-`
   section — light and dark must both be covered by the tokens.
4. If it needs behavior, add a `data-cpd-*` hook and wire it in
   `src/lib/ui/runtime.ts`.
5. Export it from `src/lib/ui/index.ts`, then add a page under
   [Components](/contribution/components/) — one page per builder, with live
   previews of its states (see `src/content/docs/contribution/components/`).
6. Verify: `bun run typecheck` → `bun run lint` → `bun run build`.
