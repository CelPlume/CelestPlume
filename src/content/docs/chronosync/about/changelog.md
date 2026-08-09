---
title: Changelog
description: Full version history of SDNUChronoSync.
sidebar:
  order: 7
---
All versions are archived here; the homepage only displays the last three months.

## Changelog

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
- Avatar cross-origin cache requests now omit credentials (`credentials: 'omit'`). Alist returns `Access-Control-Allow-Origin: *`, which the browser rejects for credentialed requests — this was the source of the persistent CORS errors in the console.

**Changelog modal and "new version" badge**

- The changelog modal was rebuilt to match the project's component conventions: a unified `ModalTitleCard` header (icon + title), a narrower `max-w-3xl` panel with `rounded-xl` corners and a stroke, a bottom action bar with a rounded "Close" button, and removal of the redundant subtitle and extra absolute-positioned close button.
- Fixed the "new version" badge and auto-popup, which never actually fired. The bootstrap script and each Astro island component each created their own Pinia instance (via `src/pages/_app.ts`), so the `hasNewVersion` flag set by the bootstrap script was never visible to the modal. The fix has the bootstrap broadcast a `chronosync:changelog-new` window event that the modal listens for and reacts to.

**Login and load performance**

- Eliminated redundant `/api/auth/users/me` requests: the dashboard islands (navigation, my-schedule, email-bind check, mobile drawer) each had an independent Pinia instance and fired six identical requests on page load. A module-level single-flight wrapper deduplicates them into one shared request. The 401 token-clear path still runs only once.
- `/api/admin/public/site-config` gets the same single-flight treatment (one request per page). Both public endpoints (`/code-injection` and `/site-config`) now return `Cache-Control: private, max-age=300` — config changes are infrequent, so the browser can reuse cached responses.
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

- 66 blocking endpoints were changed from `async def` to synchronous `def` (FastAPI runs them in a thread pool). Login no longer stalls the event loop — `/health` during login dropped from 168 ms to 10 ms — and lightweight endpoints stop serializing behind each other.
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
- Team create / import / member / admin operations each run in a single route-level transaction — any mid-operation failure rolls back the whole change.
- `/health` now checks both the live database connection and the schema version, returning 503 until both pass.
- Integration tests run against a real PostgreSQL instance in CI, covering migrations, concurrency, transactions, and health checks.
- Backend Docker dependencies are frozen via `uv.lock` and installed with `uv sync --frozen`.
- New Alembic revision `f0a1b2c3d4e5` adds `users.token_version` and three shared-storage tables (`login_rate_limits`, `register_rate_limits`, `verification_codes`). Production PostgreSQL needs `alembic upgrade head`.
- The legacy SQLite upgrader was updated to add the `token_version` column; the PostgreSQL integration test's `HEAD_REVISION` tracks the new head.

**Tests and documentation**

- Regression coverage expanded across JWT invalidation, rate-limit lockout, verification-code invalidation, bcrypt upgrade, the Alembic chain, and health checks. All current full-suite gates pass.
