---
title: Frontend Design System
description: Semantic tokens, color palette, dark mode strategy, unified components (InfoBox, TabBar, PickerPopover, CodeEditor), tab system conventions, and dark-mode lessons learned.
sidebar:
  order: 8
---
# SDNUChronoSync Frontend Design System (Design System / DESIGN.md)

> This document is the single source of truth for the frontend **visual, interaction, and theme design**.
> It records: the semantic token system, dark mode strategy, color palette, typography, radii/shadows, shared
> component classes, unified components (`InfoBox`/`TabBar`/`PickerPopover`/`CodeEditor`), conventions for the two
> kinds of tabs and their smooth switching, a full component inventory, and every pitfall we have hit.
>
> **Rule**: before adding or changing any color, font size, radius, shadow, dark-mode behavior, or interactive
> component, **read this document first** and stay consistent with the existing system.
>
> Companion docs: [Full changelog](/chronosync/about/changelog/); [Architecture](/chronosync/dev/architecture/);
> [Deployment guide](/chronosync/dev/deployment/); [Development guide](/chronosync/dev/development/).

## Table of Contents

1. [Purpose and Conventions](#1-purpose-and-conventions)
2. [Theme Strategy Overview](#2-theme-strategy-overview)
3. [Semantic Token System (CSS Variables)](#3-semantic-token-system-css-variables)
4. [Color System (Tailwind Palette)](#4-color-system-tailwind-palette)
5. [Typography](#5-typography)
6. [Radius / Shadows / Spacing](#6-radius--shadows--spacing)
7. [Shared Component Classes (addComponents)](#7-shared-component-classes-addcomponents)
8. [Unified Component 1: InfoBox](#8-unified-component-1-infobox)
9. [Unified Component 2: TabBar](#9-unified-component-2-tabbar)
10. [Unified Component 3: PickerPopover (Date/Time Picker)](#10-unified-component-3-pickerpopover-datetime-picker)
11. [Unified Component 4: CodeEditor](#11-unified-component-4-codeeditor)
12. [Tab System Conventions (Two Tab Types + Smooth Switching)](#12-tab-system-conventions-two-tab-types-smooth-switching)
13. [Avatar and Team Cover Palette](#13-avatar-and-team-cover-palette)
14. [Backend Integration (availability / Avatar Upload)](#14-backend-integration-availability--avatar-upload)
15. [Component Inventory (by Page/Feature)](#15-component-inventory-by-pagefeature)
16. [Dark Mode Lessons Learned](#16-dark-mode-lessons-learned)
17. [Verification Methodology (Browser Audit / Build)](#17-verification-methodology-browser-audit--build)
18. [Commit Conventions and Workflow](#18-commit-conventions-and-workflow)

---

## 1. Purpose and Conventions

### 1.1 Why This Document Exists

This project's dark mode, token system, and unified components were converged through **many iterations and a lot
of pitfalls**. Problems we have hit:

- Every component hardcoded its own colors → light/dark inconsistencies and repeated oversights;
- `:global(.dark)` does not compile inside Vue scoped styles → dark mode silently never applied and the cause was
  untraceable;
- Active tab was the same color as its container → "cannot tell which tab is active" in dark mode;
- Primary button hover turned near-white → white text became invisible;
- Nested modals closed on a single click;
- A repo-wide fix script misfired → deleted correct dark variants.

This document **freezes** those lessons so that future changes can be "right the first time", and so components
stay searchable and reusable.

### 1.2 Core Conventions (Mandatory)

1. **Use tokens whenever possible** (CSS variables); add `dark:` variants only for local tweaks; **never hardcode
   hex colors per component**.
2. **Always use `InfoBox` for callouts**; always use `TabBar` for tabs/segments, or follow its active-state baseline.
3. **Dark-mode active-state baseline**: container `dark:bg-neutral-800`, active `dark:bg-neutral-700`, text
   `dark:text-neutral-50`.
4. **Primary button hover uses `hover:bg-primary-500`** — never `hover:bg-primary-50`, never the invalid opacity
   `/300`.
5. **Dark overrides in scoped styles must live in a non-scoped `<style>` block** — `:global(html.dark)` inside
   `<style scoped>` does not compile.
6. **Use tokens for z-index** (`--layer-*`), not magic numbers like `z-[9999]`.
7. After changes: `grep -rnE "\]\s+dark:"` must be empty → `vue-tsc` → `eslint` → `astro build` → headless-browser
   per-page audit.

---

## 2. Theme Strategy Overview

### 2.1 Dark Mode Switch

- **`tailwind.config.mjs`**: `darkMode: 'class'`. Adding the `dark` class to `<html>` enters dark mode.
- **Store**: `frontend/src/stores/theme.ts` is the single read/write point. localStorage key: `app-theme`, values
  `dark` / `light`.
- **Theme toggle button** (`Navigation.vue`): to avoid SSR/client hydration mismatch (the Vue warn caused by
  different `d` paths on the sun/moon icons), **render both the sun and moon icons simultaneously** and toggle
  visibility with the CSS classes `dark:block` / `dark:hidden` instead of `v-if="isDark"`. This keeps the SSR and
  client DOM identical.

```html
<SunIcon class="h-5 w-5 hidden dark:block" aria-hidden="true" />
<MoonIcon class="h-5 w-5 dark:hidden" aria-hidden="true" />
```

### 2.2 No "Invert Filter" Dark Mode

There was historically a `filter: invert()` hack — it has been deleted. It inverted images, brand colors, and the
logo along with everything else, and could not be controlled precisely.

### 2.3 Two Parallel Mechanisms

| Mechanism | Use case | Notes |
|---|---|---|
| ① Semantic tokens (CSS variables) | **Page-level** large surfaces/borders/text/accent | Defined in `BaseLayout.astro`: `:root` light, `html.dark` dark; components consume `var(--...)` and switch automatically |
| ② Tailwind `dark:` variants | Small color patches inside a single component | Append `dark:bg-…`, `dark:text-…` etc. to class names |

> All six showcase mock components (`*Showcase.vue`, `PerspectiveSchedule.vue`) have been migrated to consume
> tokens (mechanism ①).

---

## 3. Semantic Token System (CSS Variables)

Defined in the global `<style is:global>` of `frontend/src/layouts/BaseLayout.astro`.

### 3.1 Layer (z-index) Tokens

| Variable | Value | Purpose |
|---|---|---|
| `--layer-dropdown` | 1200 | Dropdown menus |
| `--layer-popover` | 1250 | Popovers/pickers |
| `--layer-modal` | 1400 | Modals |
| `--layer-toast` | 1500 | Toast notifications (topmost) |

Usage: `style="z-index: var(--layer-modal)"`. **Never** hardcode magic numbers like `z-[9999]` (they fight with
the toast/modal layers).

### 3.2 Semantic Color Tokens

| Variable | Light | Dark (`html.dark`) | Purpose |
|---|---|---|---|
| `--bg-page` | `#f8fafc` | `#0f172a` | Page background |
| `--bg-card` | `#ffffff` | `#1e293b` | Card/panel surface |
| `--bg-muted` | `#f1f5f9` | `#334155` | Secondary surface (input background) |
| `--bg-subtle` | `#e2e8f0` | `#475569` | Weaker surface (divider/hover background) |
| `--border` | `#e2e8f0` | `#334155` | Regular borders |
| `--border-strong` | `#cbd5e1` | `#475569` | Emphasized borders |
| `--text` | `#0f172a` | `#f8fafc` | Primary text |
| `--text-2` | `#475569` | `#cbd5e1` | Secondary text |
| `--text-3` | `#64748b` | `#94a3b8` | Weak text/placeholder |
| `--text-4` | `#94a3b8` | `#64748b` | Weakest text |
| `--accent` | `#0ea5e9` | `#38bdf8` | Accent (primary color) |
| `--accent-strong` | `#0284c7` | `#0ea5e9` | Accent (pressed/solid) |
| `--accent-soft` | `#e0f2fe` | `#0c4a6e` | Accent light background |

Consumption example:

```css
.card {
  background: var(--bg-card);
  color: var(--text);
  border-color: var(--border);
}
```

---

## 4. Color System (Tailwind Palette)

`frontend/tailwind.config.mjs` → `theme.extend.colors`.

### 4.1 `primary` (Primary Accent = sky)

> The only accent color on the site. There was historically a `secondary` (fuchsia) palette — deleted; `sky` has
> also been folded into `primary`.

| Step | Value |
|---|---|
| 50 | `#f0f9ff` |
| 100 | `#e0f2fe` |
| 200 | `#bae6fd` |
| 300 | `#7dd3fc` |
| 400 | `#38bdf8` |
| 500 | `#0ea5e9` |
| 600 | `#0284c7` |
| 700 | `#0369a1` |
| 800 | `#075985` |
| 900 | `#0c4a6e` |

> ⚠️ **`primary` only has 50–900, no 950.** Any `primary-950` class is invalid and silently dropped by Tailwind
> (dark mode will not apply). For dark light-backgrounds use `primary-900`, e.g. `dark:bg-primary-900/30`.

### 4.2 `neutral` (Neutral = slate)

> The site uniformly uses `neutral` instead of scattered `gray`/`slate`. **Do not** introduce `gray-*`/`slate-*`.

| Step | Value |
|---|---|
| 50 | `#f8fafc` |
| 100 | `#f1f5f9` |
| 200 | `#e2e8f0` |
| 300 | `#cbd5e1` |
| 400 | `#94a3b8` |
| 500 | `#64748b` |
| 600 | `#475569` |
| 700 | `#334155` |
| 800 | `#1e293b` |
| 900 | `#0f172a` |
| 950 | `#020617` |

> `neutral-800` (#1e293b) is the standard dark for **cards/panels**; `neutral-700` (#334155) is the standard for
> **active states**; `neutral-900` (#0f172a) is the standard for **pages/inset tracks**.

### 4.3 Semantic Auxiliary Colors

Uses Tailwind's default `blue`/`emerald`/`amber`/`red` (all include 950). Unified dark convention:

| Semantics | Light | Dark |
|---|---|---|
| Info | `bg-blue-50 text-blue-800 border-blue-200` | `dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800` |
| Success | `bg-green-50 text-green-800` | `dark:bg-green-900/25 dark:text-green-200` |
| Warning | `bg-amber-50 text-amber-800` | `dark:bg-amber-900/25 dark:text-amber-200` |
| Danger | `bg-red-50 text-red-800` | `dark:bg-red-900/25 dark:text-red-200` |
| Accent (purple) | `bg-purple-50 text-purple-800` | `dark:bg-purple-900/30 dark:text-purple-200` |
| Accent (orange) | `bg-orange-50 text-orange-800` | `dark:bg-orange-900/25 dark:text-orange-200` |

---

## 5. Typography

`tailwind.config.mjs` → `theme.extend.fontFamily`.

| Family | Font stack | Purpose |
|---|---|---|
| `sans` | System sans-serif stack (`-apple-system`, `PingFang SC`, `Microsoft YaHei`, etc.) | Body/UI |
| `display` | Serif: `STSong`, `Songti SC`, `Noto Serif SC`, `SimSun`, etc. | Display/headings |

`BaseLayout.astro` sets `font-family: -apple-system, ...` globally on `html` for consistent Chinese rendering.

---

## 6. Radius / Shadows / Spacing

### 6.1 Radius Conventions

| Purpose | Value |
|---|---|
| Small buttons / badges | `rounded-md` / `rounded-lg` |
| Cards / panels | `rounded-xl` / `rounded-2xl` |
| Large panels / modals | `rounded-[28px]` (e.g. ShareScheduleView) |
| Pills (multi-select/segments) | `rounded-full` |

### 6.2 Shadow Conventions

- Card shadows are uniformly `shadow-sm` / `shadow-xl` (modals).
- **In dark mode, most card shadows are turned off** with `dark:shadow-none` (shadows are barely visible on dark
  backgrounds and look dirty).
- Primary button glow `shadow-[0_16px_36px_-18px_rgba(2,132,199,0.95)]` is light-mode only; dark mode uses
  `dark:shadow-none`.

### 6.3 Spacing

- Page padding `p-4 md:p-6`; modal inner padding `px-4 pb-4 pt-5 sm:p-6`.
- Tab/segment container padding `p-1`.

---

## 7. Shared Component Classes (addComponents)

Defined in `tailwind.config.mjs` → `plugins` → `addComponents`. All have `dark:` variants built in (unless noted).

| Class | Purpose | Dark |
|---|---|---|
| `.input-base` | Standard input | ✅ |
| `.select-base` | Standard select | ✅ |
| `.input-search` | Search input with left icon | ✅ |
| `.dropdown-button` / `.dropdown-menu` / `.dropdown-item` / `.dropdown-search` / `.dropdown-search-input` / `.dropdown-check` | Headless dropdown | ✅ |
| `.picker-input-base` / `.picker-trigger-button` | Picker input/trigger button | ✅ |
| `.btn-secondary` / `.btn-primary` | Secondary/primary buttons | ✅ |
| `.warning-surface` / `.warning-surface-soft` | Amber callout (legacy class; dark covered by `.dark .warning-surface` override) | ✅ |
| `.btn-clear-selection` | Clear-selection small button | ⚠️ still uses `slate-*`, not yet migrated to neutral |
| `.scrollbar-custom` | Custom scrollbar | — |

> Prefer reusing these classes in new code instead of hand-writing a whole set of `@apply`.
> ⚠️ Custom classes in `addComponents` have **no automatic `dark:` variants** — you must add `.dark .xxx { … }`
> overrides manually.

---

## 8. Unified Component 1: InfoBox

File: `frontend/src/components/InfoBox.vue`.

### 8.1 Background

There used to be many scattered semantic callouts ("Important", "Note", "Dangerous operation", "Temporary class
booking", "Logged into the academic system", "Code injection", etc.), each component hardcoding its own colors →
light/dark inconsistencies and repeated oversights. Now converged into a single component with three variants:

| variant | Semantics | Light | Dark |
|---|---|---|---|
| `info` | Explanation/note | `bg-primary-50 text-primary-900 border-primary-200` | `dark:bg-primary-900/25 dark:text-primary-100 dark:border-primary-800/70` |
| `warning` | Caution | `bg-amber-50 text-amber-900 border-amber-200` | `dark:bg-amber-900/25 dark:text-amber-100 dark:border-amber-800/70` |
| `danger` | Dangerous operation | `bg-red-50 text-red-900 border-red-200` | `dark:bg-red-900/25 dark:text-red-100 dark:border-red-800/70` |

### 8.2 Usage

```vue
<InfoBox variant="warning" title="注意事项">
  <ul class="list-disc list-inside">
    <li>转让后您将不再是团队创建者</li>
    <li>此操作不可撤销</li>
  </ul>
</InfoBox>
```

### 8.3 Migrated Locations

`TransferTeamModal` (caution), `DissolveTeamModal` (dangerous operation), `TemporaryTeamDrawer` (temporary class
booking notice), `ScheduleImporter` (important notice). Any new callout of the same kind must use `InfoBox` — **do
not write hardcoded color blocks again**.

---

## 9. Unified Component 2: TabBar

File: `frontend/src/components/TabBar.vue`.

### 9.1 Background

Tab bars in system settings, team management, etc. were each written separately with inconsistent active states
across light/dark (at one point the active tab and its container were both `dark:bg-neutral-800`, making it
"impossible to see which tab is active" in dark mode). Now converged into a single component.

### 9.2 Props and Usage

- `tabs: { id, name|label }[]`, `modelValue` (active id), `stretch?: boolean` (buttons split evenly to fill the width).
- Two-way binding via `v-model`.

```vue
<TabBar :tabs="tabs" v-model="activeTab" />
<TabBar stretch :tabs="[{id:'swap',name:'对调工作日'},{id:'holiday',name:'设置假期'}]" v-model="mode" />
```

### 9.3 Sliding Indicator (Smooth Switching)

Following `Tabs.vue` from `~/AinOfficialWiki`, implements a **sliding indicator pill**:

- Container is `relative`, with an absolutely positioned pill `<span>` (`bg-white shadow dark:bg-neutral-700`)
  laid under the buttons.
- Use `getBoundingClientRect` to measure the active button's `left`/`width` and write them into
  `transform: translate3d(...)` and `width`.
- CSS `transition-[width,transform,opacity] duration-200 ease-out` makes it glide smoothly to the active tab.
- Re-sync on `onMounted`/`resize`/`modelValue`/`tabs` changes.
- Buttons only keep the text color (active `dark:text-neutral-50`); the pill handles the background.

### 9.4 Migrated Locations

`admin/SystemSettings.vue` (site/storage/email/code injection), `TeamEditorModal.vue` (team info/member
management/visibility/actions), `ScheduleAdjuster.vue` (swap workdays/set holidays, `stretch`). Any new tabs must
use `TabBar`.

---

## 10. Unified Component 3: PickerPopover (Date/Time Picker)

File: `frontend/src/components/PickerPopover.vue`.

- Trigger button uses the shared classes `.picker-input-base` / `.picker-trigger-button` (`addComponents` has dark
  built in).
- The panel `panelClass` is a class string built in a **computed property**; it used to be the only light-mode leak
  (`bg-white` without dark) → now fixed with `dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-none
  dark:ring-neutral-700`.
- Calendar cells/time/minutes/clear/today/confirm buttons all have dark variants.
- ⚠️ When concatenating classes in a JS string, **do not forget the dark variants** (`.vue` module checks cannot
  see styles — verify against the build output).

---

## 11. Unified Component 4: CodeEditor

File: `frontend/src/components/CodeEditor.vue` (used by system settings "code injection").

- The scoped classes (`.code-editor-container`/`.line-numbers`/`.code-textarea`) hardcode light backgrounds and
  have **no automatic dark variants**.
- Fix: after the `<style scoped>` block, add a **non-scoped `<style>`** with `html.dark .code-editor-container { … }`
  overrides covering background, line numbers, text, error states, and scrollbar.
- ⚠️ This is the positive fix for the "`:global(html.dark)` does not compile in scoped styles" pitfall — see §16
  item 9.

---

## 12. Tab System Conventions (Two Tab Types + Smooth Switching)

This project has two kinds of tabs/switchers with **different conventions** — do not confuse them:

### 12.1 Scenario 1: Page Option Switching (TabBar / ProfilePage)

For "switching options on the same page": personal center, system settings, team management.

- Component: `TabBar.vue` (with sliding indicator).
- Container `bg-neutral-100 dark:bg-neutral-800`; the active state is handled by the **sliding pill** background,
  text `dark:text-neutral-50`.
- **No focus glow ring allowed** (`focus:ring-2 focus:ring-primary-500` causes "glows forever after clicking until
  you click elsewhere") — keep only `focus:outline-none`. Baseline: `ProfilePage.vue` (no glow).
- Dark active-state baseline: container `dark:bg-neutral-800`, active pill `dark:bg-neutral-700`, text
  `dark:text-neutral-50`.

### 12.2 Scenario 2: Selector Switching (Select All/Clear, Multi-Select, Smart Scheduling Switcher)

For "select all/multi-select/clear" or mode switching (week/day, week/date, permission select, etc.), scattered
across forms (`EmptyClassroomQuery`, `BatchTeamEventModal`, `TeamScheduleTaskModal`, `AllTeamsViewPage`,
`SystemSettings` storage switcher).

- Container **`bg-neutral-100 dark:bg-neutral-900`** (one step darker than the card's `neutral-800`, forming an
  **inset track** — otherwise it is indistinguishable from the card).
- Active: `bg-white dark:bg-neutral-700` + `dark:text-neutral-50` (text must be light, otherwise black text on a
  dark surface is unreadable).
- Inactive: `text-neutral-600 dark:text-neutral-300`, hover `dark:hover:bg-neutral-800`.
- Smooth: `transition-all` / `transition-colors` are already in place; color changes are smooth.

### 12.3 Key Lessons (Repeatedly Hit)

1. **Active text must have `dark:text-neutral-50`** — a script once deleted it, leaving black text on a dark
   surface unreadable.
2. **Active background must not equal the container color** (both `dark:bg-neutral-800` makes the active state
   invisible).
3. **The container background must differ from the card it sits in** (same `dark:bg-neutral-800` makes the track
   invisible) → selector tracks use `dark:bg-neutral-900`.
4. **Page tabs must not have a focus glow**.

---

## 13. Avatar and Team Cover Palette

- The 17 DiceBear-style `avatarPresets` groups are **converged to a single `primary`/`neutral` anchor tone** (no
  more rainbow colors).
- Preset avatar upload: `avatarPresetSvgToFile` **rasterizes the generated SVG to PNG** before uploading. Reason:
  the backend `ALLOWED_IMAGE_EXTENSIONS` only accepts `jpg/jpeg/png/gif/webp`, not SVG; and serving SVG statically
  is an XSS vector.
- Remote avatars (e.g. `gastigado.cnies.org`) without CORS headers block browser `fetch`; `<img>` display is
  unaffected.

---

## 14. Backend Integration (availability / Avatar Upload)

### 14.1 availability Week Parameter

- The frontend `getWeekNumber` returns a **calendar week** (max 53 per year); the backend availability routes
  originally limited `week ≤ 30` → returned 422.
- Fix: both the team and temporary availability routes raised the `week` cap `le=30 → le=53` (`reference_date` is
  the real basis for week resolution; `week` is only a fallback).

### 14.2 Avatar Upload

- Backend `ALLOWED_IMAGE_EXTENSIONS = {jpg,jpeg,png,gif,webp}`, **no SVG**.
- Frontend preset avatars are rasterized from SVG to PNG before upload, bypassing the backend validation and
  avoiding SVG XSS.

---

## 15. Component Inventory (by Page/Feature)

> The complete inventory for looking up "which component does this UI use, and is dark mode covered". All are
> dark-adapted unless noted.

### 15.1 Top-Level Layout

| Component | Purpose | Notes |
|---|---|---|
| `BaseLayout.astro` | Global token variables, fonts, body background | Dark-mode foundation |
| `Navigation.vue` | Desktop sidebar | Theme toggle button (dual-rendered icons, `dark:block/hidden`) |
| `MobileDrawer.vue` | Mobile drawer | |
| `MobileBottomTabBar.vue` | Mobile bottom bar | |
| `Footer.vue` | Footer | |

### 15.2 Schedule

| Component | Purpose |
|---|---|
| `MySchedulePage.vue` | My schedule main page (week/day/calendar/list views, schedule selection, share management, stats cards) |
| `ScheduleGanttWeekView.vue` / `ScheduleDayListView.vue` / `ScheduleCalendar.vue` | Week/day/calendar views (ScheduleCalendar's `.week-view`/`.time-column` use **non-scoped** `<style>` dark overrides) |
| `ScheduleEditor.vue` / `EventModal.vue` / `EventDetailModal.vue` / `StackedEventsModal.vue` / `TeamEventDetailModal.vue` | Editor/event modals |
| `ScheduleAdjuster.vue` | Schedule adjustment (swap workdays/set holidays, TabBar stretch) |
| `ScheduleImporter.vue` / `ImportScheduleModal.vue` / `JwxtConnectionModeSelector.vue` / `ImportOptionsModal.vue` | Schedule import (WebVPN/academic-system selection, step hints) |
| `ScheduleList.vue` | Schedule list |
| `ExportOptionsModal.vue` / `ShareOptionsModal.vue` / `ShareScheduleView.vue` / `TeamAvailabilityShareModal.vue` | Export/share |
| `PickerPopover.vue` | Date/time picker |
| `EmptyClassroomQuery.vue` / `CsvImportModal.vue` / `PersonalizationModal.vue` | Empty classroom query/CSV import/personalization |

### 15.3 Team

| Component | Purpose |
|---|---|
| `MyTeamsPage.vue` / `TeamList.vue` / `AllTeamsViewPage.vue` | My teams/team list/team view |
| `TeamViewPage.vue` | Team view (week/month/heatmap, filter bar) |
| `TeamEditorModal.vue` | Team management (team info/members/visibility/team actions; TabBar; batch-add schedule/smart scheduling/transfer/dissolve buttons) |
| `DissolveTeamModal.vue` / `TransferTeamModal.vue` / `LeaveTeamModal.vue` | Dissolve/transfer/leave confirmation modals |
| `TeamHeatmapDrawer.vue` / `TeamAvailabilityGrid.vue` / `TeamSlotDetailDrawer.vue` | Heatmap/common free time |
| `TeamScheduleTaskModal.vue` / `BatchTeamEventModal.vue` / `BatchOperationsLog.vue` / `TemporaryTeamDrawer.vue` | Smart scheduling/batch add/batch operation log/temporary booking |
| `CreateTeam.vue` / `JoinTeam.vue` / `AvatarPresetDrawer.vue` / `TutorialEntry.vue` | Create/join team, avatar presets |
| `UserScheduleViewer.vue` / `TeamMemberSchedulePanel.vue` / `TeamMemberStrip.vue` / `ActionConfirmModal.vue` / `FilterSidebar.vue` | Member schedule/member strip/confirm/filter |

### 15.4 Admin Backend

| Component | Purpose |
|---|---|
| `admin/UserManagementPage.vue` | User management (table/dropdown/ban) |
| `admin/AdminTeamManagement.vue` | Team management (edit/delete/members) |
| `admin/SystemSettings.vue` | System settings (site/storage/email/code injection; TabBar + CodeEditor) |
| `admin/UserEditModal.vue` / `admin/BanUserModal.vue` / `admin/UserScheduleModal.vue` / `admin/ConfirmDeleteModal.vue` / `admin/BatchRestoreConfirmToast.vue` | Sub-modals/confirmations/batch restore |

### 15.5 Auth / Landing / Navigation

| Component | Purpose |
|---|---|
| `LoginForm.vue` / `RegisterForm.vue` / `ForgetPasswordForm.vue` / `ForceBindEmailModal.vue` / `FirstStartAdminModal.vue` | Login/register/forgot password/email binding/initial admin |
| `LandingNavbar.vue` / `CTASection.vue` / `FeatureSection.vue` / 6 `*Showcase.vue` / `PerspectiveSchedule.vue` | Landing page |
| `ChangelogModal.vue` | Changelog (`dark:prose-invert`) |
| `InAppBrowserPrompt.vue` | In-app browser prompt |

### 15.6 Unified Components and Reuse Rules

1. **Callouts** → `InfoBox.vue`
2. **Tabs/segments** → `TabBar.vue`; selector switchers follow the "container `dark:bg-neutral-900` + active
   `dark:bg-neutral-700`" baseline
3. **Inputs/selects/pickers** → `.input-base`/`.select-base`/`.dropdown-*`/`.picker-*` (`addComponents`, dark built in)
4. **Semantic color blocks** → the unified `bg-*-50 dark:bg-*-900/N + text-*-800 dark:text-*-200` convention
5. **Primary button hover** → `bg-primary-600 hover:bg-primary-500` (not `hover:bg-primary-50`, not the invalid
   opacity `/300`)

---

## 16. Dark Mode Lessons Learned

> Each of these once caused "dark mode not applying", "build failure", or "interaction bug" — keep them in mind.

1. **`primary-950` does not exist.** `dark:bg-primary-950/30` is silently a no-op → the surface stays light in dark
   mode. Always use `primary-900`.
2. **`:global(.dark)` does not compile into Vue scoped styles.** The correct approaches: Tailwind `dark:` variants
   or CSS variables.
3. **Appending `dark:` outside a `:class` binding = build error.** Check: `grep -rnE "\]\s+dark:" components/`
   must be empty (the `]` inside `transition-[...]` arbitrary values is a false positive).
4. **`addComponents` custom classes have no automatic dark variants** — you must add `.dark .xxx { … }` overrides
   manually (e.g. `.warning-surface`).
5. **`hover:bg-white`/`hover:bg-neutral-50` brightens in dark mode** — add `dark:hover:bg-neutral-800`.
6. **WSL2 file watching is unreliable; the dev server goes stale.** Verify modules with `curl`, delete caches and
   restart clean, and trust `astro build` as the source of truth.
7. **Use tokens for z-index, not magic numbers.**
8. **Headless-browser audit**: record a stray light color when luminance
   `0.299r+0.587g+0.114b > 215` and area `>40×40`.
9. **`:global(html.dark)` is not compiled inside scoped styles** → use a **non-scoped `<style>`** with
   `html.dark .xxx` (ScheduleCalendar/CodeEditor/PersonalizationModal).
10. **Active tab = container color = invisible** → active uses `dark:bg-neutral-700`.
11. **Primary button `hover:bg-primary-50` makes white text disappear**; **invalid opacity `/300`** breaks the dark
    hover → use `hover:bg-primary-500`.
12. **Nested modals close on a single click**: the sub-modal `Teleport to="body"` lives outside the parent panel's
    DOM, so clicking the sub-modal triggers the parent's outside-click. Fix: add the sub-modal's open state to the
    parent `Dialog`'s `:static` **and** to the early-return guard in `handleClose`.
13. **Multiple dev servers fight over the port**: a stale process holds 4322 → the browser gets stale modules. Run
    `ss -tlnp | grep :4322` to confirm a single instance.
14. **Unified semantic color-block convention**: `bg-red-50 dark:bg-red-900/25`, `bg-blue-50 dark:bg-blue-900/30`
    etc. + `text-*-800 dark:text-*-200`.
15. **`hover:dark:` is a non-standard ordering and gets misjudged**: functionally equivalent to `dark:hover:`, but
    regexes matching `dark:bg-*` will false-match. Always write `dark:hover:`.
16. **A repo-wide "add dark per line" script misfires**: when a line already has another `dark:` variant, do not
    append a default color again; and do not treat `hover:dark:bg-*` as a conflicting background.
17. **JS strings concatenating classes must also carry dark** (e.g. PickerPopover's `panelClass`); `.vue` module
    checks cannot see styles — verify against the build output.

---

## 17. Verification Methodology (Browser Audit / Build)

### 17.1 Required Checklist

After any dark-mode/interaction change, run in order:

```bash
cd frontend
grep -rnE "\]\s+dark:" src/components/      # 必须为空
bun run type-check                            # vue-tsc 0 错误
bun run lint                                  # 0 错误（存量 warning 可忽略）
bun run build                                 # astro build 14 页成功
```

### 17.2 Headless-Browser Per-Page Audit

Open every page with Playwright/puppeteer, inject `access_token` + `app-theme=dark`, and iterate over all elements:

```js
const lum = (c) => { const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m ? 0.299*m[1]+0.587*m[2]+0.114*m[3] : -1; };
// 对每个元素：opacity>0.05 && width>40 && height>40 && lum(bgColor)>215 → 漏网浅色
```

Fix each occurrence in order of area.

### 17.3 Test Accounts

- Backend uses **PostgreSQL** (`DATABASE_URL=postgresql+psycopg://chronosync:...@localhost:5432/chronosync`), not
  SQLite. Users inserted into SQLite are **invalid** for the running backend.
- Admin account: `admin` / `975280hc` (test only).
- JWT is valid for 15 minutes; if the test interval is long, re-login to refresh the token.

### 17.4 Dev Server Troubleshooting

- Confirm only one astro dev process holds 4322: `ss -tlnp | grep :4322`.
- Is the module current: `curl http://localhost:4322/src/components/<File>.vue`.
- Is the style in the build: after `astro build`, grep the CSS/JS in `dist/` (`<style>` is injected separately, not
  in the `.vue` module).

---

## 18. Commit Conventions and Workflow

### 18.1 Conventional Commits

Group commits by feature/module, format `type(scope): subject`:

| type | Purpose |
|---|---|
| `feat` | New feature / dark-mode adaptation |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Refactor (no behavior change) |
| `chore` | Miscellaneous |

Example commits grouped by module:

```text
feat(dark-mode): establish design token system and unified UI components
feat(dark-mode): adapt schedule and classroom views
feat(dark-mode): adapt team, heatmap and temporary-scheduling views
feat(dark-mode): adapt admin user, team and system pages
feat(dark-mode): adapt auth, landing, navigation and showcase views
feat(avatar): converge preset accents to primary palette and rasterize to PNG
fix(api): accept calendar-week in availability queries
```

### 18.2 Commit Discipline

- **Only commit your own changes.** If you see things in git that are not yours (e.g. `_apkwork/*`, `server-sync/`
  in `.gitignore`, or someone else's uncommitted files), **leave them alone**; stage precisely with
  `git add <explicit files>`, never `git add .`.
- One commit per module; the body explains "why changed, constraints, trade-offs".
- Before committing, make sure `type-check` + `build` pass.

### 18.3 Modification Workflow

1. First read this `DESIGN.md` + `tailwind.config.mjs` + `BaseLayout.astro`.
2. Use tokens when possible; use `dark:` for local tweaks; use `InfoBox` for callouts; use `TabBar` for tabs.
3. After changes, run the §17.1 required checklist + headless-browser per-page audit.
4. Commit per module with Conventional Commits; `git add` only your own files.

---

## 19. Dark Mode Implementation Details (Correct vs Wrong)

### 19.1 Cards/Panels

```html
<!-- ✅ 正确：卡片在深色用 neutral-800，阴影关掉 -->
<div class="rounded-xl bg-white shadow-sm dark:bg-neutral-800 dark:shadow-none">

<!-- ❌ 错误：深色没补背景 → 白卡片 -->
<div class="rounded-xl bg-white shadow-sm">
```

### 19.2 Primary Button (White Text)

```html
<!-- ✅ 正确：hover 到 primary-500（仍够深，白字可见） -->
<button class="bg-primary-600 text-white hover:bg-primary-500">

<!-- ❌ 错误：hover 到 primary-50（近白）→ 白字看不见 -->
<button class="bg-primary-600 text-white hover:bg-primary-50">

<!-- ❌ 错误：非法透明度 /300（仅支持 /0–/100）→ 深色 hover 失效 -->
<button class="bg-primary-600 text-white dark:hover:bg-primary-900/300">
```

### 19.3 Page Tabs (TabBar)

```html
<!-- ✅ TabBar：激活由滑动胶囊负责，文字浅色，无 focus 光晕 -->
<TabBar :tabs="tabs" v-model="activeTab" />
```

### 19.4 Selector Switchers (Select All/Clear, etc.)

```html
<!-- ✅ 容器凹陷轨道 neutral-900（区别于卡片 800），激活 neutral-700 + 浅文字 -->
<div class="rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-900">
  <button :class="selected
    ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-neutral-50'
    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'">全选</button>

<!-- ❌ 错误：激活=容器同色（都 800）→ 看不出激活；激活文字没 dark:text → 黑字不可读 -->
```

### 19.5 Semantic Color Blocks

```html
<!-- ✅ 信息：bg-blue-50 dark:bg-blue-900/30 + text-blue-800 dark:text-blue-200 -->
<div class="rounded-md bg-blue-50 p-4 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">

<!-- ❌ 错误：只写浅色 -->
<div class="rounded-md bg-blue-50 p-4 text-blue-800">
```

### 19.6 Inputs

```html
<!-- ✅ 用共享类 .input-base（addComponents 内置 dark） -->
<input class="input-base" />

<!-- ❌ 错误：手写 bg-white 忘 dark -->
<input class="bg-white border-neutral-200" />
```

---

## 20. Dark Mode Implementation Playbook (Step by Step)

The complete steps for making a page/component dark:

1. **Read the conventions**: first check `DESIGN.md` §4 palette, §7 shared classes, §12 tab conventions.
2. **Find light colors**: `grep -nE "bg-white|bg-neutral-50|text-neutral-900|border-neutral-200" <File>.vue`.
3. **Split into categories**:
   - Page-level large surfaces/cards → tokens (`var(--bg-card)`) or `dark:bg-neutral-800/900`;
   - Semantic color blocks → per the §4.3 convention add `dark:bg-*-900/N + dark:text-*-200`;
   - Buttons/interactions → the correct patterns in §19.
4. **Colors hardcoded in scoped styles** → add a separate non-scoped `<style>` with `html.dark .xxx`.
5. **Verify**:
   - `grep -rnE "\]\s+dark:"` is empty;
   - `vue-tsc` and `astro build` pass;
   - headless-browser per-page audit (§17.2) confirms 0 leftover light colors, visible active states, and normal
     hovers.
6. **Commit**: per-module Conventional Commit `feat(dark-mode): ...`; `git add` only this module's files.

---

## 21. FAQ

**Q: A block is still white in dark mode even though the code has `dark:`?**
A: Most likely a stale dev server (§16 items 6 and 13). Verify the module with `curl`, confirm a single instance,
hard-refresh; trust the `astro build` output.

**Q: Cannot see the active tab?**
A: The active background equals the container color (both `dark:bg-neutral-800`). Change the active state to
`dark:bg-neutral-700` (§16 item 10).

**Q: There is a glowing border around the tab after clicking it?**
A: That is `focus:ring-2 focus:ring-primary-500`. Remove it, keep only `focus:outline-none` (§12.1).

**Q: The selected text is black and hard to read?**
A: The active state is missing `dark:text-neutral-50` (§16 items 10/15).

**Q: `:global(html.dark)` in scoped styles does not work?**
A: Vue scoped styles do not compile it. Use a non-scoped `<style>` block (§16 item 9).

**Q: Nested modal (dissolve) closes on a single click?**
A: The sub-modal teleports to body and triggers the parent modal's outside-click. Add the sub-modal's open state to
the parent's `:static` **and** to the `handleClose` guard (§16 item 12).

**Q: Is `hover:dark:bg-*` correct?**
A: Functionally equivalent to `dark:hover:bg-*`, but it is non-standard and gets misjudged by tooling — always
write `dark:hover:` (§16 item 15).

**Q: Backend availability returns 422?**
A: The frontend sends calendar weeks (max 53); the backend originally limited it to 30. Now relaxed to 53 (§14.1).

**Q: Preset avatar upload returns 400?**
A: SVG is not accepted by the backend. The frontend rasterizes it to PNG before upload (§13).

---

## 22. Dark Mode Implementation Notes per Module (Deep Retrospective)

### 22.1 Schedule Module

- `ScheduleCalendar.vue`'s `.week-view`/`.time-column`/`.time-column-header` are **scoped classes with hardcoded
  white backgrounds** — dark overrides were added with a **non-scoped `<style>`** using `html.dark` (§16 item 9).
  The scrollbar track/thumb are dark too.
- `MySchedulePage.vue`'s print/export views (inline `background:#ffffff`) are **intentionally white** (for
  printing) — **do not touch**.
- `ScheduleAdjuster.vue`'s "swap workdays/set holidays" has been migrated to `TabBar stretch` (two tabs split
  evenly).
- `EmptyClassroomQuery.vue`'s week/day/period selector: container `dark:bg-neutral-900` inset track + active
  `dark:bg-neutral-700`.

### 22.2 Team Module

- `TeamEditorModal.vue`'s batch-add schedule/smart scheduling/transfer/dissolve buttons: `bg-white
  dark:bg-neutral-800` + `border-*-300 dark:border-*-800` + `text-*-700 dark:text-*-300` +
  `hover:bg-*-50 dark:hover:bg-*-900/30`.
- The root cause of `DissolveTeamModal` closing on one click was the parent `TeamEditorModal`'s `handleClose` guard
  missing `showDissolveModal`; **fixed**: the `:static` list and the `handleClose` early return both include
  `showDissolveModal` (§16 item 12).
- Team member badges: creator `bg-blue-100 dark:bg-blue-900/40`, admin `bg-purple-100 dark:bg-purple-900/40`.

### 22.3 Admin Backend

- Table row-action dropdown `z-[260]`; row `focus-within:z-[220]` keeps the row with an open menu above adjacent
  rows (z-index convention).
- User list action cell `sticky right-0 z-[90]`; the dropdown menu lives inside the `z-[260]` container.
- `SystemSettings.vue`'s code injection uses `CodeEditor.vue` (non-scoped dark overrides).
- All three admin pages are fully dark: user-management (142 dark occurrences), team-management (139),
  system-settings (102).

### 22.4 Auth / Landing

- The theme toggle icon uses dual rendering + `dark:block/hidden` to eliminate the hydration mismatch (§2.1).
- The changelog `ChangelogModal` uses `dark:prose-invert` so the markdown body lightens in dark mode.
- The six showcase mocks consume tokens (`var(--bg-card)` etc.) and switch automatically.

### 22.5 Avatars

- The 17 preset accents converge to primary/neutral.
- Upload path: SVG→PNG rasterization (§13).
