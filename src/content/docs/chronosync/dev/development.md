---
title: Development Guide
description: Unified entry point for local development, code conventions, quality gates, performance and security baselines, release, and database migration governance.
sidebar:
  order: 5
---
This document is the unified entry point for project development, verification, performance, security, release, and database migration governance. Both automated agents and human contributors must follow these constraints.

## Project change entry points

### Backend

1. Data models live in `backend/models.py`; structural changes must ship with a corresponding Alembic revision.
2. API routes go in `backend/routers/`, business logic in `backend/services/`, database access reuses `backend/crud.py`.
3. New migration scripts go in `scripts/migrations/`, and the [migration script guide](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README.md) must be updated in tandem. The SQLite-to-PostgreSQL production switch steps are maintained only in the [migration Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md).

### Frontend

1. Vue components go in `frontend/src/components/`, Astro pages go in `frontend/src/pages/`.
2. State management reuses Pinia stores; styling follows the existing Tailwind CSS and theme conventions.
3. Frontend dependencies must be locked by `frontend/bun.lock`; installation and image builds must not use npm.

### Documentation entry points

- [Project overview](/chronosync/)
- [Deployment guide](/chronosync/dev/deployment/)
- [Full changelog](/chronosync/about/changelog/)

## Build / Test / Run Scripts

### Environment (required)

- **Python dependency management**: use **uv** exclusively (`uv sync` / `uv run`); conda is no longer used.
- **Frontend package manager**: **Bun** only; `npm` is forbidden (do not generate or update `package-lock.json`).

Suggested initialization (first time only):

```bash
cd backend
uv sync
```

### Backend (FastAPI)

Install dependencies:

```bash
cd backend
uv sync
```

Start (development):

```bash
cd backend
uv run python main.py
```

Backend quality gates (all must pass):

1) **`-m` check (module execution / basic runnability)**

```bash
cd backend
uv run python -m compileall .
```

2) **Smoke test**: verify the application imports, `app` exists, and key dependencies are present.

```bash
cd backend
uv run python -c "import main; assert hasattr(main, 'app'); print('backend smoke: ok')"
```

3) **Unit / regression tests (pytest, required)**: pytest is not declared in `pyproject`, so use `--with pytest`. Tests that need a real PostgreSQL are skipped by default (gated on `TEST_POSTGRES_URL`).

```bash
cd backend
timeout 900 env PYTHONPATH=. uv run --with pytest pytest -q
```

4) **PostgreSQL integration tests (optional; required when changing migration or data-import logic)**:

```bash
cd backend
TEST_POSTGRES_URL='postgresql+psycopg://chronosync:<password>@localhost:5432/<test-db>' uv run --with pytest pytest tests/test_postgres_integration.py -q
```

### Frontend (Astro + Vue)

Install dependencies (bun only):

```bash
cd frontend
bun install
```

Start development:

```bash
cd frontend
bun run dev
```

Frontend quality gates (all must pass):

```bash
cd frontend
bun run lint
bun run type-check
bun run build
```

Lint (required):

- If the repository already provides a lint config/script (e.g. `eslint` / `prettier`), run and pass it: `bun run lint` / `bunx eslint .` / `bunx prettier -c .`
- If the current branch has not yet introduced a lint tool: **do not install dependencies via npm**. Introduce lint through bun, and update both:
  - the `lint` script in `frontend/package.json`
  - the lint invocation commands in this document

## Code Style

### Frontend

- **TypeScript first**: avoid `any`; place new type definitions in the nearest module (or reuse existing type files).
- **Component / file naming**: Vue components use `PascalCase.vue`; other files follow existing project conventions.
- **Minimal change**: avoid unrelated refactoring; only touch what the task requires.
- **Formatter**: if Prettier / ESLint is adopted, follow its rules and keep output warning-free (do not sacrifice readability just to pass lint).
- **Visual consistency (required)**: frontend component changes must follow the existing primary color palette and brand style, and cover both light and dark themes — do not make components usable in only one theme.

### Backend

- **Clear layering**: routes in `routers/`, business logic in `services/`, database access in `crud.py`.
- **Imports and side effects**: avoid expensive operations at module import time; keep `main.py` safely importable.
- **Error handling**: external APIs return a consistent structure; never expose internal exceptions or stack traces to clients.

## Performance

The following constraints derive from the current performance baseline (see "Performance conclusions and baselines" below). When touching related code, these must be followed:

- **Endpoint definition (required)**: any endpoint that performs blocking I/O, SQLAlchemy queries / commits, password hash verification, upstream HTTP requests, or file I/O must be declared as synchronous `def` (FastAPI automatically places it in the thread pool). Blocking calls inside `async def` are forbidden — they block the event loop (previously, a 166ms bcrypt verification starved `/health` to 168ms). Only purely asynchronous endpoints (e.g. explicit `await` on non-blocking I/O) may use `async def`.
- **Password hashing (required)**: all new hashes must use argon2id with parameters `time_cost=2 / memory_cost=19456 KiB (19 MiB) / parallelism=1` (`_argon2_hasher` in `backend/auth.py`). Generating new bcrypt hashes is forbidden; existing bcrypt hashes are automatically re-hashed to argon2id on successful login (`password_needs_update` + `authenticate_user`).
- **Response bodies and serialization (required)**: schedule / event list aggregation endpoints must not return fully nested `schedule` (including `class_times`) or full `owner`. Personal endpoints use `response_model_exclude={"schedule", "owner"}`; team / filter endpoints use the slim model `EventTeamResponse` (`ScheduleBrief` / `UserBrief` in `schemas.py`). Per-event lazy loading that causes N+1 (one SQL per event during serialization) is forbidden — use `joinedload` eager loading or a response model that does not trigger lazy loading.
- **Response timing observability (required, must be preserved)**: `RequestTimingMiddleware` in `backend/main.py` emits `TIMING method path status X.Xms`; production uvicorn must use `uvicorn_log_config.json` (includes the timing field).
- **Performance regression gates**: argon2id verification <100ms; the first successful login with a legacy bcrypt (cost 12) hash is allowed ~170ms, but must auto-upgrade to argon2id after that login. After changing an endpoint, re-test with the method described below.

### Performance conclusions and baselines

The following facts come from the current code and real measurements. Check them before touching related code to avoid regressions or duplicated investigation:

- **Framework conclusion**: FastAPI is sufficient for the current business scale. Existing performance bottlenecks come from blocking calls, password hashing, and large response bodies — fixes should continue to target these actual hotspots.
- **Historical root cause (pre-fix baseline)**: single uvicorn worker (`docker/supervisord.conf` `--workers 1`) + many `async def` endpoints performing blocking SQLAlchemy / bcrypt calls → 10 concurrent `GET /api/schedule/` wall time **1856ms** (~10× single-request, linear queuing); login bcrypt (cost=12) verification took **166ms** and stalled the event loop (during which `/health` was dragged to 168ms); `GET /api/schedule/` response body **857KB** (590 events × nested schedule + owner). Data scale is tiny (66 users / 8464 events) — the query itself is not the bottleneck.
- **Post-fix baseline (regression reference, same snapshot / endpoint)**: argon2id verification **41ms**; login endpoint **80ms**; `/health` during login **10ms**; 10 concurrent heavy endpoints wall time **1134ms** (remaining time is GIL contention on large-response serialization); 10 concurrent lightweight endpoints wall time **46ms** (thread pool already parallel); team endpoint 3.47MB → **1.52MB** (243 → 153ms); filter endpoint 349KB → **150KB**; personal main path 268.6KB / 14.5ms / 4 SQL (no N+1).
- **Remaining bottlenecks and known optimizations**: heavy endpoints (735KB–1.5MB) still contend on the GIL during pure Python serialization → `--workers 2–4` enables process-level parallelism (watch for linear memory growth and connection pool sizing `pool_size / worker`); the `events` table lacks a `(schedule_id)` index and a `(start_time, end_time)` index (no noticeable impact at the current ~8.5k rows, but prevents degradation after data growth; index additions must go through `scripts/migrations/` and update the PG integration `HEAD_REVISION`); PostgreSQL can enable `auto_explain` (`log_min_duration=100ms`) to log slow queries.
- **Re-test method**: concurrent / serial verification must carry `Authorization` (responses without a token return 401 instantly, which can be misread as parallelism); event-loop starvation verification = send a slow request (e.g. login), then hit `/health` 10ms later — pre-fix it was dragged to ~170ms, post-fix <10ms; measure hash timing directly in the auth layer (argon2id 41ms / bcrypt 166ms).

## Security and Guardrails

- **Sensitive data**: never commit or echo secrets, passwords, tokens, or private URLs; avoid writing real credentials into code or documentation.
- **Default accounts**: the initial admin password appears only in run logs; do not hardcode weak passwords.
- **Forbidden actions**
  - `npm` is forbidden (including `npm install` / `npm run ...`).
  - Introducing or committing `package-lock.json` is forbidden.
  - Emoji in output or commits (including documentation and comments) is forbidden — keep text professional and reviewable.
  - Loosening CORS / CSP or disabling auth for development convenience is forbidden.
- **Logging**: avoid logging user PII (email, student ID, token, verification code, etc.); redact when needed.

### Authentication and password conventions

- **JWT (required)**: HS256, `exp=30min`. The token must include `token_version` (payload `tver`) at issuance. Password change (`/api/profile/change-password`), password reset (`/api/auth/reset-password`), and admin password reset (the password path in `crud.update_user`) must all increment the user's `token_version`, invalidating old tokens immediately (`get_current_user` / `get_optional_current_user` validation). Any new password-change / reset path must increment `token_version` in sync.
- **Password policy (required)**: new passwords must be at least 8 characters (NIST SP 800-63B). Server-side `schemas.py` (`RegisterRequest` / `ResetPasswordRequest` / `ChangePasswordRequest`) and frontend forms (`RegisterForm` / `ForgetPasswordForm` / `FirstStartAdminModal`, etc.) must stay in sync — do not change only one side.
- **Rate limiting and verification-code storage (required)**: login rate limiting (`login_rate_limits`, default 8 / student-ID + IP / 300s, lockout 600s), registration rate limiting (`register_rate_limits`, default 10 / IP / 600s), and email verification codes (`verification_codes`, invalidated after 5 wrong attempts, constant-time comparison, single-use, 60s send cooldown) are all stored in the database and shared across workers. **Reverting to in-process dicts is forbidden**; any new rate-limit or verification-code state must use a DB table. Parameters can be adjusted via `AUTH_RATE_LIMIT_*` / `REGISTER_RATE_LIMIT_*` environment variables.
- **Dependency ban (required)**: reintroducing `passlib` (1.7.4 is unmaintained) is forbidden. Password hashing connects directly to `argon2-cffi.PasswordHasher` + `bcrypt` (legacy compat only); see `backend/auth.py`.
- **Secret key (required)**: in production (`ENV` / `APP_ENV=production`), `SECRET_KEY` must be set — startup is refused without it; placeholder keys are rejected.

### Exclude analytics before local browser testing

When visiting a production or preview site from a local browser, exclude Umami analytics first to avoid counting test traffic against real data.

Open the browser developer tools Console on the target site and run:

```js
localStorage.setItem('umami.disabled', 1)
```

To undo:

```js
localStorage.removeItem('umami.disabled')
```

This setting is per-site — set it once for each domain. Agents must run the exclusion command before any browser verification.

## Contribution Guidelines

- **Branches and PRs**
  - Small, focused commits: each commit centers on one topic (fix / feature / docs).
  - PR description must include: what changed, impact scope, and verification (paste the commands you ran).
  - Changes touching user-facing features, frontend interactions, backend APIs, environment variables, deployment, or dev workflows must update the corresponding Markdown docs in tandem; cross-doc references must use relative links.
  - After completing each feature / module / bug fix, use Conventional Commits with multiple `-m` flags for a detailed commit message; describe the change points, impact scope, and verification results as an unordered list.
  - Commit message example:
    ```bash
    git commit \
      -m "fix(frontend): improve auth form validation and toast feedback" \
      -m "- Replace native form blocking with toast-based validation hints." \
      -m "- Align OTP send-code interactions across login/register/forget flows." \
      -m "- Verify with bun run type-check and bun run build."
    ```

  Standard contribution flow: fork the repository, create a focused feature or fix branch, commit and push following the conventions in this section, then open a Pull Request.

- **Issues**
  - Reproduction steps must be clear; note the environment (OS, Python version, uv version, Bun version).
  - Attach the minimum necessary logs (redacted).
- **Agent collaboration flow (required)**
  - Before writing code, reason through the design and compare approaches; combine `web search`, `context7 mcp`, relevant `skills`, official documentation, and project conventions before implementing changes.
  - Before editing, locate the code and existing conventions — avoid "tear it down and rewrite".
  - After writing code, run tests / verification relevant to the change (unit tests, builds, type-checks, smoke tests, etc.); do not skip verification and commit directly.
  - After changes, the quality gates must be met:
    - Frontend: `type-check` + `lint` + `build`
    - Backend: `uv run python -m compileall` + smoke test + `uv run --with pytest pytest -q`; results are based on a full current test run.

## Notes

### Version management

When releasing a new version, the version numbers or version records in the following locations **must be updated in sync**:

| File | Location | Notes |
|---|---|---|
| `backend/pyproject.toml` | `version = "x.y.z"` | Python project metadata, used by `uv` and packaging |
| `backend/main.py` | `version="x.y.z"` (FastAPI init) | Version shown in API docs and on the `/` endpoint |
| `backend/main.py` | `"version": "x.y.z"` returned by the root endpoint | `GET /` response body |
| [`CHANGELOG.md`](/chronosync/about/changelog/) | New `### vX.Y.Z (...)` full entry | Complete version history |
| [`README.md`](/chronosync/) | Keep the same version entry for the most recent three months | Recent updates on the project landing page |

The frontend "changelog" modal is built from [`CHANGELOG.md`](/chronosync/about/changelog/) at build time (`frontend/src/layouts/DashboardLayout.astro`) and only shows version entries within three months of the build date (the user-visible UI does not display this limit, so no manual version bump is needed). **After changing a version number, verify**: the built modal and the README's "most recent three months" range show the same set of version entries and the same latest version; do not release if they disagree or if the latest version is missing.

**CI/CD automatic behavior**: pushing to `main` triggers GitHub Actions to read the version from `backend/pyproject.toml`, build a Docker image, and push it to Docker Hub with both `latest` and `x.y.z` tags. Pushing a `v*` git tag also appends that git tag as an additional image tag.

**Manual release flow**:

```bash
# 1. Update all 5 locations above (keep version numbers consistent)
# 2. Commit
git commit -m "release: bump version to vX.Y.Z" -m "- ..."
# 3. Tag
git tag vX.Y.Z
# 4. Push (triggers CI to build latest + x.y.z + vX.Y.Z image tags)
git push origin main --tags
```

- This repository allows placing a local [`AGENTS.md`](https://github.com/CelPlume/SDNUChronoSync/blob/main/AGENTS.md) in subdirectories to override scoped rules; when conflicts arise, the `AGENTS.md` in the nearest directory wins.

### Database migration script conventions

- All **new** migration scripts must go in `scripts/migrations/`; they must **not** be placed in `backend/migrations/`.
- `backend/migrations/` no longer exists as a migration directory; legacy Alembic resources are archived under `scripts/migrations/legacy_alembic/` — do not place migration files back in `backend/migrations/`.
- Every time a migration script is added, modified, or deprecated, the following must be maintained in sync:
  - [Migration script guide](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README.md): script list, introduced version, purpose, applicable database, usage, and caveats;
  - The relevant entry and upgrade notes in the [project overview](/chronosync/), [deployment guide](/chronosync/dev/deployment/), or [full changelog](/chronosync/about/changelog/).
- Before running a migration script, confirm the actual database type and connection-string source; this project currently runs on PostgreSQL, so explicitly load `backend/.env` before running commands.
- **Model and migration DDL consistency (required)**: when adding a column or table, `models.py` and the Alembic revision must match exactly — column type, nullable, and `server_default` (the model uses `server_default=text(...)`, the migration uses `server_default=...`; both sides must have it; follow the `is_default` / `is_hidden` / `token_version` precedent). Any gap counts as schema drift.
- **New head sync (required)**: after a new revision becomes the head, update `HEAD_REVISION` in `backend/tests/test_postgres_integration.py`; otherwise the CI fresh-upgrade gate check will fail.
- **Idempotency guards (required)**: table / column creation operations inside a revision must include `if not exists`-style guards (see `d5e6f7a8b9c0`, `f0a1b2c3d4e5`).
- **Runtime state tables are excluded from the import list**: `login_rate_limits` / `register_rate_limits` / `verification_codes` are runtime state and must not be added to `TABLES_IN_ORDER` in `scripts/migrations/sqlite_to_postgres.py`. New tables of the same kind are excluded on the same basis.

### PostgreSQL reliability verification (required after migration / data-import changes)

- Run `alembic upgrade head` against a real PostgreSQL (CI uses `postgres:latest`) and confirm every revision applies in order and `alembic_version` is a single row equal to head.
- Verify **zero drift between model metadata and the actual catalog**: compare columns / nullable / server_default / indexes for all tables (the SQLite side is covered by `_assert_catalog_matches_metadata` in `test_migration_governance.py`; the PG side requires manual comparison or running `TEST_POSTGRES_URL` integration tests).
- Validate against an independent temporary database (do not run migration verification against production), then delete it.
