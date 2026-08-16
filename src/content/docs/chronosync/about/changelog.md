---
title: Changelog
description: Full version history of SDNUChronoSync.
sidebar:
  order: 7
---
All versions are archived here; the homepage only displays the last three months.

## Changelog

### v3.6.5 (2026-08-16) - Unified academic query module: empty classrooms / exams / grades

**Unified academic query entry**

- Reworked "empty classroom lookup" into a unified "Academic Query" entry (nav "Academic Query", URL `/dashboard/query`) with three tabs: empty classrooms / exams / grades; backend consolidated onto `/api/query` session and routes, removing the old `/api/classroom`
- Empty classroom query: filter by semester / campus / building / venue category / capacity / venue name / weeks / weekday / periods, with export support
- Tabs span the full page width (consistent on landscape / portrait); welcome page shown by default after login; URL `?tab=grade` deep-links to a tab

**Exam query and import**

- Exam query: filter by exam name / time / college / course, showing date, time, location, seat, offering college
- One-click import to schedule: import into an existing schedule or create a new one (title "Course name (Exam)", auto-parsed start/end times and location)

**Grade query and profile display**

- Grade query: auto-selects the current semester and shows results directly; shows both all-semester GPA and current-semester GPA, with the all-semester GPA counted as the official one
- Grade filters: all / pass / fail / makeup / retake-pass (based on the academic system's exam-nature field)
- "Show in profile" checkbox persists a semester grade snapshot to the profile "Grades" tab, viewable without re-login

**Academic login and session**

- Academic login is now a two-step dialog (WebVPN → academic account), captcha refreshes on click
- Removed local session timeout: every query live-checks the academic system; upstream login-expiry pages (including unified-auth security-wall pages) now show a unified "academic login expired" prompt and re-login dialog
- Exams / grades default to the current semester, falling back to the just-ended spring semester during summer break

**Academic login gate and queue**

- Login serialization: global 30s login gate + queue cap of 10 (credentials not queued in gate mode; the frontend submits real login only when it's the user's turn); 3 login attempts within 30 minutes for the same account lock it for 30 minutes
- Global circuit breaker: evidence of the school's security-wall (3 times / 10 minutes) pauses login for 1-5 minutes to avoid triggering school CAS risk control
- Queue UX: login dialog shows "position / estimated wait", auto-submits when it's the user's turn; timed-out queue items auto-re-enqueue (max 2 times); closing the dialog cancels the queue
- Session keep-alive: successful academic sessions are lightly probed every 25 minutes (multi-worker election via Redis distributed lock); security-wall detection marks the session expired and reports a breaker event
- Encrypted cookie storage: academic cookie jars are Fernet-encrypted into the database and Redis hot cache (`jwxt:session:*`); keys live only in server files / environment variables
- Redis deployment: docker-compose adds a `redis:7-alpine` service (isolated internal network, health checks); app and Redis share gate / queue / breaker / cache state

**Concurrency and security fixes**

- Lock ownership: login gate and keep-alive distributed locks carry random owner tokens; release compares tokens (compare-and-delete) so stale holders cannot delete a new holder's lock
- Atomicity: queueing (enqueue / peek / head-consume), breaker counts, session cache projections, and keep-alive scanning claims all moved to Redis Lua atomic scripts; an in-process fallback provides an equivalent single-lock implementation
- Redis fail-closed: startup refused when `REDIS_URL` is configured but unreachable; runtime gate failures return 503 for login
- Key security: Fernet key file created atomically (O_EXCL + 0600); encryption failures error out instead of writing plaintext cookies; key file excluded from the Docker build context and image
- Session serialization: per-user mutex for academic operations (login / captcha / query / keep-alive probe); keep-alive scans use short per-user transactions
- Version protection: session persistence and invalidation use `updated_at` version CAS in a single transaction, so stale keep-alive/probes cannot overwrite a fresh login
- Database connection release: query / login / keep-alive routes close and return DB connections during upstream HTTP; persistence/invalidation use short transactions
- Import session hardening: schedule import sessions moved to shared encrypted storage, bound to the creating user, atomically claimed; ZFW import is a single transaction
- Auth hardening: legacy password-hash upgrades use version CAS; `token_version` increments atomically in SQL; production `SECRET_KEY` requires ≥32 chars and rejects placeholders; email uniqueness moved to a case-insensitive unique index; captcha emails get per-IP hourly quotas
- Idempotent writes: duplicate shared-schedule imports return the original schedule (import ledger); ICS imports update idempotently by `source_uid`; batch/smart scheduling support `Idempotency-Key`
- Team concurrency: batch deletion / member management use team row locks with stable ordering to avoid reverse lock-ring deadlocks; scheduling re-checks conflicts inside the row lock; preview endpoints are read-only; team transfer carries creator CAS
- Public-share minimization: public share responses strip student IDs / class / grade / college; share permission enums reject unknown values with 422
- Frontend flow governance: login / queue flows carry generation markers so stale polling/login responses are not written back; "remember password" cache gets a 7-day TTL and generation guard; 401 handling compares the token at request time

**Site config and stability fixes**

- Added a "default semester start date" to site settings: admins set it under Settings → Site Config (saved to `config.toml`); it pre-fills the start date when users create schedules (also for academic / ICS import-created schedules), falling back to the creation day when unset
- Fixed: academic login queue overflow (10 people) now correctly returns 429 with a "retry later" message, previously returning 500 due to a route variable shadowing `fastapi.status`; added route-level regression tests

**Data migration and deployment**

- Added 5 Alembic revisions (current head `d3e5f7a9b1c3`): email unique index, `email_send_logs`, `schedule_share_imports`, `events.source_uid`, batch/scheduling `idempotency_key`
- PostgreSQL deployments must run `alembic upgrade head` before startup; production direct academic endpoints refuse plaintext HTTP (unless explicitly `JWXT_ALLOW_PLAIN_HTTP=1`)

### v3.6.4 (2026-08-13) - Full dark mode refactor and frontend design system

**Semantic Token System**

- Established semantic CSS-variable tokens: `--bg-page/--bg-card/--bg-muted/--border/--text/--accent` etc., defined in `BaseLayout.astro`, with `:root` for light and `html.dark` for dark auto-switching; added layer tokens `--layer-dropdown(1200)/popover(1250)/modal(1400)/toast(1500)`
- Tailwind `darkMode: 'class'`; `neutral` unifies scattered `gray/slate`, `primary` absorbs `sky`, removed `secondary` fuchsia palette
- Six landing-page showcase mocks switched to consuming tokens (`var(--bg-card)` etc.), no more per-component hardcoded hex colors

**Unified Components (consolidating scattered implementations)**

- Added `InfoBox`: info/warning/danger variants, migrated TransferTeamModal / DissolveTeamModal / TemporaryTeamDrawer / ScheduleImporter etc.
- Added `TabBar`: supports `stretch` for equal-width buttons, **sliding indicator capsule** with smooth switching (based on AinOfficialWiki Tabs pattern), migrated SystemSettings / TeamEditorModal / ScheduleAdjuster
- `PickerPopover` panel and `CodeEditor` dark overrides (scoped `:global(html.dark)` fails in Vue SFC → moved to non-scoped `<style>`)

**Tab System Conventions**

- Two tab types: page option switching (profile / system settings / team management, active `dark:bg-neutral-700` + sliding indicator, no focus ring); selector switching (select all / clear, smart scheduling, container `dark:bg-neutral-900` recessed track + active `dark:bg-neutral-700` + light text)

**Full dark-mode coverage for all components**

- Schedules (week/day/calendar/import/export/share/empty classroom/adjustment), teams (view/edit/heatmap/temporary/batch add/smart scheduling), admin (user/team/system settings), auth/landing/navigation/showcase - all supplemented with `dark:` variants

**Interaction & Backend Fixes**

- Fixed nested modal (dissolve team) closing immediately on click: child modal toggle uses parent Dialog `:static` + `handleClose` guard
- Fixed main button `hover:bg-primary-50` white text invisibility and illegal opacity `/300`
- Fixed preset avatar upload 400: rasterize SVG to PNG before upload (backend rejects SVG + avoids XSS)
- Fixed availability 422: team/temporary availability route week limit `30→53` (frontend sends calendar weeks)
- Fixed theme icon hydration mismatch: dual-render sun/moon with `dark:block/hidden` toggle

**Avatars & Docs**

- 17 DiceBear preset accent variants consolidated to primary/neutral single-anchor tone
- Added [Frontend Design Guide](docs/DESIGN.md) (700+ lines): tokens, palette, unified components, two-tab conventions, component inventory, lessons learned, verification methodology, commit conventions; established cross-references in AGENTS.md / README

**Verification**

- Frontend lint, type-check, and production build pass (14 pages)
- Headless browser per-page dark audit: my-teams / team-view / user-management / team-management / system-settings etc. - all dark, 0 residual light
- Real-device tests: TabBar sliding indicator aligns with active tab; dissolving modal inner-click does not close it

 ### v3.6.3 (2026-08-09) - Brand & link migration: docs centralization, Footer revamp, and CelPlume unification
### v3.6.3 (2026-08-09) - Brand & link migration: docs centralization, Footer revamp, and CelPlume unification

**Documentation**

- The project directory structure and API reference are now maintained on the [Architecture & Tech Reference](/zh/chronosync/dev/architecture/) page instead of being inlined in the README. The GitHub link is standardized to [CelPlume/SDNUChronoSync](https://github.com/CelPlume/SDNUChronoSync).

**In-site link migration**

- Tutorial URLs in the README, [full changelog](/zh/chronosync/about/changelog/), and llms.txt/llms-full.txt are moved from `hs.cnies.org` to in-site pages: [保姆级用户教程](/zh/chronosync/tutorials/nanny-user-tutorial/), [使用教程导航](/zh/chronosync/tutorials/chronosync-user-guide/), and [更新日志](/zh/chronosync/about/changelog/). Frontend navigation components (Navigation, MobileDrawer, landing page) and their tutorial entry constants point to the same targets, with section anchors adjusted to match the new site structure ("Part 2 我的课表", "3-导入课表", "5-放假调休", "Part 3 团队协作").
- The external project homepage link (`hevspecu.hxcn.space`) is replaced by the [in-site index page](/zh/chronosync/).
- Landing page navigation is trimmed to **About / Tutorials / Meet课程表**, dropping the Changelog and Project homepage entries. The hero section drops the "Features" and "Tutorials" buttons, leaving only **Sign up / Log in**.

**Footer revamp**

- Brand name updated to **天空之翼 (CelPlume)**, linking to the project homepage.
- Removed the "Powered by Astro and Vue.js" line.
- Added a Meet课程表 entry (`https://meetschedule.top`) with a calendar icon.
- The "About" link now points to the in-site index page; the "Project homepage" entry is gone, replaced with on-site **Terms of Service** and **Privacy Policy** links.

**Terms compliance**

- Login and registration forms now require checking "I have read and agree to the Terms of Service and Privacy Policy" (linking to the in-site legal pages). Submission is blocked until the box is checked.

**Verification**

- Frontend lint, type-check, and production build all pass; every in-site page and section anchor was manually verified accessible.

### v3.6.2 (2026-08-04) - Frontend bootstrap regression and avatar CORS cache fixes

**Post-login page load**

- Fixed a regression introduced in v3.6.1 that left the post-login page stuck on "Loading...". Astro was emitting `<script define:vars>` as an unpacked classic inline script, so its raw `import` statement tripped the browser's *"Cannot use import statement outside a module"* error and `initAuth` never ran. The fix exposes the build-time changelog version via an inline variable script and loads the bootstrap as a proper `type="module"` bundle.
- Avatar cross-origin cache requests now omit credentials (`credentials: 'omit'`). Alist returns `Access-Control-Allow-Origin: *`, which the browser rejects for credentialed requests. This was the source of the persistent CORS errors in the console.

**Changelog modal and "new version" badge**

- The changelog modal was rebuilt to match the project's component conventions: a unified `ModalTitleCard` header (icon + title), a narrower `max-w-3xl` panel with `rounded-xl` corners and a stroke, a bottom action bar with a rounded "Close" button, and removal of the redundant subtitle and extra absolute-positioned close button.
- Fixed the "new version" badge and auto-popup, which never actually fired. The bootstrap script and each Astro island component each created their own Pinia instance (via `src/pages/_app.ts`), so the `hasNewVersion` flag set by the bootstrap script was never visible to the modal. The fix has the bootstrap broadcast a `chronosync:changelog-new` window event that the modal listens for and reacts to.

**Login and load performance**

- Eliminated redundant `/api/auth/users/me` requests: the dashboard islands (navigation, my-schedule, email-bind check, mobile drawer) each had an independent Pinia instance and fired six identical requests on page load. A module-level single-flight wrapper deduplicates them into one shared request. The 401 token-clear path still runs only once.
- `/api/admin/public/site-config` gets the same single-flight treatment (one request per page). Both public endpoints (`/code-injection` and `/site-config`) now return `Cache-Control: private, max-age=300`. Config changes are infrequent, so the browser can reuse cached responses.
- The changelog is now loaded on demand. The build phase renders the last three months into a `changelog.json` static asset, so the page no longer inlines ~32 KB of changelog HTML (dashboard first-payload drops from 99.5 KB to 56.9 KB). The JSON is only fetched when the user opens the changelog or a new version is detected.
- Uvicorn worker count raised from 1 to 2, giving concurrent logins more headroom (the business connection pool caps at 60, below PostgreSQL's default 100).

**Verification**

- Frontend lint, type-check, and production build pass; build artifacts confirm the bootstrap is served as `type="module"` with no classic-script `import` leaks.
- After a redeploy, login, schedule loading, and avatar rendering were verified against a real account.
- Manual browser check of the changelog modal: header and narrow-panel layout render correctly, subtitle is gone, bottom action bar works. Saving an older `last_seen_version` and refreshing triggers the auto-popup with the "new version" badge; identical versions don't pop up. Console is clean.
- Performance numbers confirmed: `/api/auth/users/me` dropped from 6 calls to 1 per page load, `/site-config` stays at 1, the changelog auto-loads once on first visit and zero times on repeat visits, and both public endpoints return the expected `Cache-Control` header.
- Quality gate: frontend lint, type-check, and production build pass; backend `compileall`, startup smoke, and `pytest` 131 passed / 21 skipped (requires a live PostgreSQL instance).

### v3.6.1 (2026-08-03) - Auth concurrency, migration governance, and Docker reliability

**Auth concurrency**

- Login and registration rate-limit counters now use SQLite/PostgreSQL atomic upserts with per-window expiry cleanup. Concurrent duplicate registrations consistently return 400.
- Email verification codes are stored only as HMAC digests derived from the shared `SECRET_KEY`. Send cooldown, failure count, and single-use consumption use conditional updates; upgrades actively invalidate legacy plaintext codes.
- Multi-worker production deployments share auth state through the database and enforce one stable `SECRET_KEY`, so verification-code HMACs and JWTs never go out of sync across workers.

**Runtime and database reliability**

- `/health` now uses a dedicated single-connection PostgreSQL probe pool with a 2-second timeout, returning 503 promptly when the business pool is exhausted.
- The legacy SQLite startup gate and its dedicated upgrader populate auth columns, shared-state tables, and indexes. Alembic revision `a9f8e7d6c5b4` clears any leftover plaintext verification codes and adds rate-limit cleanup indexes.
- PostgreSQL 18 data volume is mounted at `/var/lib/postgresql`. The Docker image bundles offline migration tools, excludes the real database and persistent state, and freezes frontend dependencies through `frontend/bun.lock`.

**Discovery and migration compatibility**

- Added `/llms.txt` and `/llms-full.txt`, giving LLM/agent tooling a standard site index and a full-content dump following the llmstxt.org proposal.
- Bootstrap validation for unversioned PostgreSQL catalogs still uses `c4d5e6f7a8b9` as its baseline (excluding auth tables and `users.token_version` that later revisions introduce), then upgrades to head via Alembic.

**Docs and verification**

- Development conventions, the full version history, and deployment docs are centralized in the [Development Guide](/zh/chronosync/dev/development/), this file, and the [Deployment Guide](/zh/chronosync/dev/deployment/).
- Backend full regression: 152 passed. Frontend lint has zero errors, type-check and production build pass. A production SQLite replica was migrated to PostgreSQL 18 and smoke-tested against the app.
- The changelog modal no longer proxies an external site at runtime. The build phase reads `docs/CHANGELOG.md` from the repo, renders the last three months inline, and the backend proxy endpoint has been removed.

### v3.6.0 (2026-08-02) - Performance, auth hardening, and multi-worker reliability

**Login performance and password hashing**

- Login password verification switched from bcrypt (cost=12, ~166 ms) to argon2id (~41 ms). Legacy bcrypt hashes are transparently rehashed on the next successful login.
- The unmaintained `passlib` dependency was removed; hashing now uses `argon2-cffi` directly, with `bcrypt` retained only for legacy-hash compatibility.

**Concurrency and response speed**

- 66 blocking endpoints were changed from `async def` to synchronous `def` (FastAPI runs them in a thread pool). Login no longer stalls the event loop (`/health` during login dropped from 168 ms to 10 ms) and lightweight endpoints stop serializing behind each other.
- `RequestTimingMiddleware` was added; production logs now emit `TIMING method path status X.Xms` per request.
- Schedule payloads shrank: personal endpoint no longer nests the full schedule/owner object (857 KB → 735 KB), team aggregation dropped from 3.47 MB to 1.52 MB (243 ms → 153 ms), the filter endpoint from 349 KB to 150 KB, and the serialization N+1 was eliminated.
- FastAPI is adequate for the current scale; key performance baselines and re-test procedures live in the development guide.

**Auth security**

- JWTs now carry a `token_version` (`tver` claim). Password changes, email password resets, and admin password resets invalidate all previously issued tokens for that user.
- Minimum password length raised from 6 to 8 (NIST SP 800-63B); the frontend registration, forgot-password, and initial-admin forms were updated accordingly.
- Login rate limiting (default 8 attempts / student-ID + IP / 300 s, lockout 600 s), registration IP limiting (default 10 / 600 s), and email verification codes (invalidated after 5 wrong guesses, constant-time comparison, single-use, 60-second send cooldown) all moved to shared database storage, so `--workers N` deployments correctly share state.
- Added `REGISTER_RATE_LIMIT_MAX_ATTEMPTS` and `REGISTER_RATE_LIMIT_WINDOW_SECONDS`; removed `AUTH_RATE_LIMIT_MAX_KEYS` (database storage removes the key-count concern).

**Database reliability and migration governance**

- SQLite-to-PostgreSQL import is atomic: data load, sequence resets, and row-count verification run in a single transaction. Non-empty targets are rejected and the whole import is rolled back on failure.
- Share tables (`temporary_shares`, `team_heatmap_shares`) are now in the migration list and import order follows foreign-key dependencies, closing a silent data-loss gap.
- Alembic governance: production PostgreSQL has exactly one live revision chain, a restricted bootstrap, and a startup gate that verifies `current == head`. The legacy SQLite upgrader works on a copy and atomically replaces the original.
- Docker Compose now pins a specific PostgreSQL major version instead of tracking `postgres:latest`.
- Share-visit counting uses a database atomic increment, fixing concurrent-count lost updates.
- Same-name team schedules get a database-level unique constraint so concurrent creation produces only one row.
- Smart-scheduling anchors consistently use the target schedule's `start_date`.
- Team create / import / member / admin operations each run in a single route-level transaction; any mid-operation failure rolls back the whole change.
- `/health` now checks both the live database connection and the schema version, returning 503 until both pass.
- Integration tests run against a real PostgreSQL instance in CI, covering migrations, concurrency, transactions, and health checks.
- Backend Docker dependencies are frozen via `uv.lock` and installed with `uv sync --frozen`.
- New Alembic revision `f0a1b2c3d4e5` adds `users.token_version` and three shared-storage tables (`login_rate_limits`, `register_rate_limits`, `verification_codes`). Production PostgreSQL needs `alembic upgrade head`.
- The legacy SQLite upgrader was updated to add the `token_version` column; the PostgreSQL integration test's `HEAD_REVISION` tracks the new head.

**Tests and documentation**

- Regression coverage expanded across JWT invalidation, rate-limit lockout, verification-code invalidation, bcrypt upgrade, the Alembic chain, and health checks. All current full-suite gates pass.
### v3.5.0 (2026-08-01) - WebVPN off-campus access, dual-account auth, and academic connection security

**Off-campus WebVPN academic access**

- Schedule import and empty-classroom lookup now support WebVPN and direct connection modes, defaulting to the school's WebVPN.
- Importer and empty-classroom lookup share the `JwxtAuthSession` to avoid protocol drift between the two auth implementations.
- Sessions are explicitly bound to a connection mode and display unified-identity or academic-system captchas per upstream requirements.
- Added deployment parameters for WebVPN, direct addresses, and session stability.

**Direct-connection protection for off-campus deployments**

- When the server cannot reach on-campus academic addresses, the frontend keeps but disables the "direct connection" option.
- Clearly states direct mode is only for on-campus deployments while retaining backend direct capability for future recovery.

**WebVPN + academic-system dual-account authentication**

- WebVPN mode now uses two-stage authentication: first log in to unified identity, then enter a separate academic-system account/password in the same session.
- Schedule import and empty-classroom lookup add an `auth_stage` state and a dedicated WebVPN login endpoint; academic login is blocked until stage one completes.
- Each stage handles captchas separately; password fields are cleared immediately after submission.
- If the academic password is wrong or upstream temporarily fails, the established WebVPN tunnel is kept. Retries do not require redoing unified identity.

**Tunnel verification and credential security**

- After a successful WebVPN login, the system actually probes the academic login page inside the tunnel instead of relying only on fixed domains or redirect results.
- Captcha responses must be image type, avoiding WebVPN login pages or other HTML responses being mistaken for captchas.
- WebVPN and academic-system credentials are used only for the current auth request; they are not written to the database, environment variables, cache, or logs.
- Added regression tests for protocol, routes, session retries, and frontend stage switching; updated security conventions and usage docs.

 ### v3.4.3 (2026-05-29) - Timezone consistency, team heatmap, and scheduling reliability fixes

**Migration scripts and docs**

- Database migration workflow consolidated under `scripts/migrations/`.
- Historical Alembic migration chain fully archived to `scripts/migrations/legacy_alembic/`.
- Migration list and execution rules in the migration script notes updated.

**Admin diagnostics and upload security hardening**

- Admin diagnostic endpoints add access control and input validation.
- File upload pipeline error boundaries tightened to avoid leaking exception info to clients.

**Team heatmap and share-link recovery**

- Fixed inaccurate team-heatmap aggregation, restoring correct multi-member busy/free views.
- Share-link management restored: validity periods, permission configuration, and QR code display.

**Default-schedule parsing consistency**

- Current-schedule resolution now always follows the default-schedule source of truth, with no more frontend/backend mismatches.

**Timezone unification: calendar and exports follow Shanghai wall-clock time**

- Calendar view and ICS export/import flows now generate and parse events in `Asia/Shanghai`.
- Fixed event time offsets across timezones that caused schedule display and export inconsistencies.

**Scheduling regression scenarios preserved**

- Added a Team1 scheduling regression-test scenario document, making batch and smart scheduling repeatably verifiable.

**Team scheduling preview creation-delay fix**

- Team scheduling preview no longer shows events that have not yet been created; preview matches the final result.

**Team insertion drift fix**

- Batch and smart scheduling inserting into a reusable schedule no longer shifts events across weeks or dates.
- Fixed the root cause of event misplacement when reusing an existing schedule write target.

### v3.4.2 (2026-05-28) - Default schedule, share links, and scheduling stability release

**Backend data layer and migrations**

- `Schedule` model adds the `is_default` field, supporting the default-schedule mechanism.
- `Schedule` lifecycle begins deriving from `start_date + total_weeks`; hidden and default states are modeled separately.
- New share and collaboration data structures added, with CRUD / schema mappings completed.
- Historical Alembic chain archived to `scripts/migrations/legacy_alembic/`; default/hidden-schedule data corrections are handled by `scripts/migrations/add_schedule_visibility_and_default_truth.py`.

**Default-schedule selection and write strategy**

- Backend `admin`, `import_route`, `schedule`, and `schedules` routes unify the default-schedule rule.
- "Current schedule" reuses the default-schedule resolution instead of a separate judgment path.
- Frontend `ScheduleEditor` adds a "set as default schedule" interaction.
- Frontend schedule store loads the default schedule first on "My Schedule".
- `frontend/src/types/index.ts` adds default-schedule related type definitions.

**Batch and smart scheduling stability fixes**

- `batch_operations.py` and `smart_schedule.py` support a consistent schedule-insert-target logic (new/default/specific).
- Fixed smart-scheduling stability across conflicts, capacity, and week assignment.
- Fixed batch-add and smart-scheduling modals whose inputs could not receive focus directly on first open.

**Temporary availability and team-heatmap sharing**

- Backend adds temporary-availability and team-heatmap share routes, a public-access endpoint, and a reusable availability service.
- Frontend adds `TeamAvailabilityShareModal` with image/link sharing, permissions, validity period, and QR code display.
- `AllTeamsViewPage`, `TeamViewPage`, `TemporaryTeamDrawer`, `TeamAvailabilityGrid`, and `TeamHeatmapDrawer` are wired into the share flow.
- New share-page entry `frontend/src/pages/share.astro`; the public view is hosted by `PublicScheduleView`.

**Frontend performance and layering fixes**

- `UserAvatar` unified to a local-cache strategy with update-time-based invalidation, reducing duplicate avatar requests.
- New `frontend/src/utils/avatarCache.ts` lowers bandwidth on member-heavy views.
- `TeamSlotDetailDrawer` layering fixed so it is no longer hidden under upper drawers.

### v3.4.1 (2026-05-28) - UI polish, temporary-availability search rework, and shared-free-time enhancements

**UI de-AI-ification and layout fixes**

- `ScheduleGanttWeekView` card height 68 px → 82 px, row spacing 78 px → 90 px, min row height 112 px → 130 px; fixes the "week x" truncation.
- Gantt, week-list, and schedule-list views unified on the slate palette, rounded-2xl corners, soft shadows, removing the default AI-template feel.
- `TeamMemberStrip` switches from circular initial-letter avatars to the `UserAvatar` component showing real avatars.

**Temporary-availability search experience rework**

- `TemporaryTeamDrawer` drops watch-based auto-search in favor of a button trigger + Enter shortcut.
- Search results show avatar (`UserAvatar`), name, student ID, class, and college.
- Backend `team.py` search and `temporary.py` availability endpoints return `avatar_url` and `college`.
- Types `UserSearchResult` and `AvailabilitySlot` member arrays add `avatar_url` and `college`.

**Shared free-time enhancements**

- `TeamAvailabilityGrid` adds PNG export: centered "week x shared free time" title, bottom-right logo watermark (`/logo.png`, 140 px, opacity 0.6).
- Clicking a busy/free cell opens the `TeamHeatmapDrawer` detail drawer, showing free/busy member lists (avatar + name + course info) for that slot.
- `TeamAvailabilityGrid` adds a `#header-left` slot; the week input and export button align vertically inside the temporary-availability drawer.

**Team view busy/free & heatmap integration**

- `TeamViewPage` merges "busy/free view" and "heatmap" into a single "Free" view mode (week/month/free), removing the standalone `teamViewMode` tab.
- `AllTeamsViewPage` desktop view-switcher adds a "Free" button; the mobile dropdown adds a "busy/free view" option.
- Busy/free view adds a multi-select avatar picker (select all / clear / toggle single); shows a "select members to view" prompt when none are selected.
- Clicking "Apply filters" immediately syncs the selected members and refreshes busy/free data, showing only filtered members.
- `getWeekNumber` moved from a `TeamViewPage` local function to the shared `@/utils/date` utility.

**Export and clipboard fixes**

- `TeamSlotDetailDrawer` export area reworked into an expandable panel: multi-select export fields (name / student ID / class / college / free time) + format selection (TXT/CSV/EXCEL) + separate copy zones (name / student ID / name+student ID).
- Excel export switched from dynamic `import('xlsx')` to static `import * as XLSX from 'xlsx'`; `astro.config.mjs` adds `optimizeDeps.include: ['xlsx']`, fixing the Vite 504 Outdated Optimize Dep error.
- Clipboard copy adds a `navigator.clipboard` availability detection with a `document.execCommand('copy')` fallback off HTTPS, fixing `Cannot read properties of undefined (reading 'writeText')`.
- Busy members are simplified to orange name tags; course/room details removed.

**Layering fixes**

- `TeamSlotDetailDrawer` z-index `z-50` → `z-[110]` → `z-[200]`, reliably covering `TemporaryTeamDrawer` (Headless UI Dialog z-[100]).

### v3.4.0 (2026-05-27) - Team collaboration enhancements, batch scheduling, and smart scheduling

**Team collaboration data layer**

- `models.py` adds Team settings fields: `visibility_model`, `allow_member_invite`, `max_members`, `join_policy`, `shift_definitions`, `schedule_config`.
- 7 new data models: `TeamScheduleTask` (scheduling task), `TeamShiftDefinition` (shift definition), `TeamScheduledEvent` (scheduled-event link), `TeamBatchOperation` (batch-op record), `TeamBatchOperationItem` (batch-op detail), `TeamRecurringEventRule` (recurring scheduling rule), `TemporaryTeam` (temporary team).
- `schemas.py` adds 16 Pydantic schemas covering scheduling tasks, batch ops, and temporary teams.
- `crud.py` adds `get_events_by_schedule_id()`, `create_batch_operation()`, `complete_batch_operation()`.
- New Alembic migration `b3c4d5e6f7a8`: new `teams` columns + 7 new tables.

**Batch scheduling**

- `POST /api/teams/{id}/batch-events/preview`: conflict preview returning per-user conflict details (day_of_week + time-overlap detection).
- `POST /api/teams/{id}/batch-events/execute`: batch-creates course events, supporting `skip` and `force` conflict strategies.
- Conflict dedup by `(user_id, week, day_of_week)` to avoid duplicate conflicts from multiple `Event` rows of the same course.
- Auto-creates a "{team name} team schedule" `Schedule` for members without one, Monday-aligned with `semester_start`.
- `GET /api/teams/{id}/batch-operations/{id}`: details merged per user (weeks/days/title), one row per user.
- Supports the `schedule_target` parameter: `default` (active schedule) or `new` (new team schedule).

**Smart scheduling**

- `POST /api/teams/{id}/schedule-tasks/preview`: runs the greedy algorithm on preview, returning member-assignment stats, failed slots, and a user-name map.
- `POST /api/teams/{id}/schedule-tasks`: creates the scheduling task, auto-writing to the batch-op log.
- Two modes: week mode (`selected_weeks` + `shifts`) and date mode (`specific_dates`, per-date `required_count`).
- Stable greedy algorithm: groups by `(name, day_of_week)`, takes the intersection of members available across all weeks (stable set), picks exactly `needed` as primary, assigns the same primary every week, and replaces only on conflicts.
- Replacement candidates exclude already-assigned members; `max_per_member` applies globally.
- Auto-infers `semester_start` (from `selected_weeks` or `specific_dates`).
- FK safety: failed records use `member_ids[0]` instead of `user_id=0`.

**Temporary team lookup**

- `POST /api/temporary/availability`: availability for any member combination without joining a team.
- Supports date-range filtering and three visibility levels (`busy_only` / `course_title` / `full_detail`).
- Frontend `TemporaryTeamDrawer`: quick member search, multi-member shared-free-slots view.

**Team settings extensions**

- Team editor modal reworked into 3 tabs: team info, member management, team operations.
- Configurable: visibility model, join policy (free / approval / invite), max members, member-invite toggle.
- The team-operations tab hosts the batch- and smart-scheduling entries.

**PostgreSQL migration fixes**

- Fixed Alembic initial schema missing the new `teams` columns and 7 tables (`create_all()` does not `ALTER` existing tables).
- New `repair_team_tables.py`: an idempotent PG-repair script covering new columns, team-collaboration tables, and `temporary_shares` / `team_heatmap_shares` full DDL and required indexes.
- `sqlite_to_postgres.py` updates `TABLES_IN_ORDER` to 18 tables, fully covering `temporary_shares` and `team_heatmap_shares`.

**New frontend components**

- `BatchTeamEventModal`: batch-scheduling modal, HeadlessUI Dialog, conflict-preview panel, blue missing-schedule notice bar, schedule write-target selection.
- `TeamScheduleTaskModal`: smart-scheduling modal, pill-style weekday selector, week/date dual-mode switch, result display (member counts + list/calendar views).
- `BatchOperationsLog`: batch-op log panel with inline detail expansion (not a bottom overlay), per-user merged view.
- `TemporaryTeamDrawer`: temporary-team lookup drawer, quick member search, shared-free-time view.
- `TeamAvailabilityGrid`: color-coded availability grid.
- `TeamMemberSchedulePanel`: member personal schedule panel.
- `TeamMemberStrip`: member avatar strip (add / remove / role select).
- `TeamSlotDetailDrawer`: slot detail drawer.

**UI fixes and unification**

- Deleted `CreatorTeamManagement.vue`; functionality merged into `TeamEditorModal` tabs.
- All modals unified to the HeadlessUI Dialog pattern (`ModalTitleCard`, `bg-slate-950/40 backdrop-blur-sm` backdrop, `ring-1 ring-slate-200/80`, `rounded-xl`, `input-base` inputs).
- Nested-modal layering: parent Dialog uses `:static` to disable FocusTrap, child Dialog uses `z-[200]`.
- `ScheduleEditor` fix: parent Dialog gets `:static` when the delete-confirm modal opens to prevent focus stealing.
- `StackedEventsModal` uses the `UserAvatar` component for real avatars.
- `Navigation` admin section font `font-medium` → `font-semibold`.

### v3.3.1 (2026-05-27) - In-app browser guidance, CI/CD auto-build, and sequence fixes

**In-app browser guidance**

- New `frontend/src/utils/inAppBrowser.ts`: detects WeChat, QQ, WeCom, DingTalk, and Alipay in-app browsers.
- New `frontend/src/components/InAppBrowserPrompt.vue`: dual-mode guidance component (dialog + toast).
- Dialog mode: first in-app open shows step guidance with a globe icon before the title and a horizontal three-dot-menu icon in the steps.
- Toast mode: re-opening within the same day after the dialog was shown produces a light toast notice.
- localStorage records the dialog timestamp; the dialog is not shown again within 24h; sessionStorage prevents re-triggering on in-app navigation.
- Integrated pages: home, login, register, forgot password, shared schedule, my schedule, team view (7 pages).
- Toast-system extension: `Toast` interface adds `iconSvg` and `inlineSvg`; `ToastItem` supports custom icons and inline-SVG descriptions.

**CI/CD auto-build**

- New `.github/workflows/docker-publish.yml`: auto-builds a Docker image on push to `main`, tagging `latest` + `x.y.z`.
- Pushing a `v*` git tag also uses that tag as the image tag.
- AGENTS.md adds a version-management section listing the 4 version locations that must change together and the manual release flow.

**PostgreSQL sequence fix**

- `scripts/migrations/sqlite_to_postgres.py` adds a sequence-reset step: after import, sets the sequences of all tables with an `id` column to `MAX(id)`.
- Fixes `UniqueViolation` on new inserts after an SQLite migration caused by unreset sequences.

### v3.3.0 (2026-05-26) - PostgreSQL support, Alembic migrations, and data-migration tooling

**PostgreSQL database support**

- New `psycopg[binary]` driver dependency; backend can connect to PostgreSQL.
- `database.py` adds the `pool_recycle` parameter (default 1800 s) to prevent long-idle connections from being dropped by the server.
- Engine creation logs the database type (SQLite / PostgreSQL) without leaking the connection string or password.
- `models.py` association tables `user_teams` and `team_admins` add `ondelete=CASCADE`; PG cleans up related rows on user/team deletion.
- `models.py` index fields are given explicit `String(N)` lengths (`student_id=50`, `full_name=100`, etc.), improving PG index efficiency.

**Alembic migration system**

- Alembic initialized, reading the connection string dynamically from the `DATABASE_URL` env var.
- New `initial_schema` migration: creates all tables on PostgreSQL; skipped on SQLite (handled by `create_all`).
- New `add_performance_indexes` migration: composite indexes for `schedules(owner_id, status)`, `events(schedule_id, day_of_week)`, and `login_records(user_id, login_time)`.
- Future model changes go exclusively through Alembic migrations, with no more manual SQL scripts.

**SQLite-to-PostgreSQL data-migration tool**

- New `scripts/migrations/sqlite_to_postgres.py`: validates SQLite integrity and the PostgreSQL target schema, then migrates all 18 tracked tables in FK-dependency order (including `temporary_shares` and `team_heatmap_shares`).
- Auto-converts boolean fields (SQLite `0`/`1` → PG `true`/`false`).
- PostgreSQL FK checks stay on during import; `schedule_adjustments` before `events`; `session_replication_role` is not used.
- The tool only accepts empty target tables for all tracked tables; there is no `--force` or table-truncation mode; all inserts, sequence fixes, and count checks run in a single transaction, rolling back on any failure with a non-zero exit code.
- New migration Runbook: full migration steps, verification, and rollback procedure.

**Docker Compose rework**

- `docker-compose.yml` adds a `db` service (`postgres:latest`) with a healthcheck and a `postgres_data` persistent volume.
- App `DATABASE_URL` switches to a PostgreSQL connection string; `depends_on` adds the db healthcheck.
- Removed the deprecated `version` attribute and undefined network references.
- New `.env.example` and `backend/.env.example` providing `POSTGRES_PASSWORD`, `SECRET_KEY`, connection-pool, and other config templates.

**Docs updated**

- Deployment guide adds a "Database configuration" section: PG pool params, `pg_dump` / `pg_restore` backup/restore, SQLite-migration steps.
- Project-intro tech stack updated: SQLite → SQLite / PostgreSQL (PostgreSQL recommended for production).

### v3.2.0 (2026-05-18) - UI visual convergence, unified auth forms, and mobile navigation optimization

**UI visual convergence and typography**

- Removed default shadows from base input / button / dropdown components; only overlays and modals keep shadows, producing a cleaner, flatter UI.
- Radius system unified: inputs `rounded-lg` (8 px), list cards `rounded-xl` (12 px); removed 22 px / 28 px / 32 px oversized radii.
- Removed BaseLayout's global forced `border-radius: 1rem`; components now control their own radii.
- Heading weights unified from `font-black` / `font-bold` down to `font-semibold`; body contrast improved from `gray-500` to `slate-600` for readability.
- Removed all-caps labels and high tracking (e.g. "Day Agenda" → "Day Schedule"), restoring normal Chinese wording.
- `PageHeaderCard` removes gradient background / shadow / ring, switching to a pure-stroke container for a lighter look.
- `Navigation` sidebar switches from `shadow-sm ring` to a `border-r` divider; admin-section `red` lowered to a less saturated `rose`.
- `MyTeamsPage` metrics area and team-code area flatten (no nested cards).
- Danger color unified from `red` to a lower-saturation `rose`, reducing visual aggression.

**Auth-form UI unification**

- Login / register / forgot-password forms unified to the `input-base` CSS class, replacing inline styles.
- Standard radius unified from `rounded-xl` to `rounded-lg` for visual consistency.
- Button styles simplified: gradient backgrounds and shadows removed.
- `AuthShell` decorative background elements and ribbon animation removed, returning to a minimal design.
- Color variables unified from `gray` to `slate` for palette consistency.
- Card styles simplified: `backdrop-blur` and frosted-glass effects removed.

**Mobile bottom tab bar**

- New `MobileBottomTabBar`: a fixed bottom quick-navigation bar for mobile with four high-frequency entries: schedule, team, empty classroom, profile.
- The tab bar is fixed to the viewport bottom and shows only below the `lg` breakpoint (`lg:hidden`).
- Supports iPhone safe-area inset (`env(safe-area-inset-bottom)`) to avoid obscuring the Home indicator.
- Main content area auto-adds `pb-20` bottom padding so the tab bar does not cover content.
- The existing mobile top bar, drawer, sidebar, and desktop layout are unchanged.
