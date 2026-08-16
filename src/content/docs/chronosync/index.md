---
title: ChronoSync
description: ChronoSync (时序同笺) is a multi-user schedule and timetable management web application for Shandong Normal University. It covers personal multi-schedule management, advanced schedule adjustments, team collaboration, and admin controls.
sidebar:
  order: 1
---
[![GitHub](https://img.shields.io/badge/GitHub-SDNUChronoSync-blue?logo=github)](https://github.com/CelPlume/SDNUChronoSync)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)

## Online Access

**Live app: [https://sxtj.hxcn.space](https://sxtj.hxcn.space)**

**Tutorial: [ChronoSync Nanny User Tutorial](https://celplume.hxcn.space/chronosync/tutorials/nanny-user-tutorial/)**

Visit the live version to experience the full schedule and timetable management features.

## Project Overview

ChronoSync (时序同笺) is a multi-user schedule and timetable management web application for Shandong Normal University, covering personal multi-schedule management, advanced schedule adjustments, team collaboration, and admin controls.

## Features

### Personal Schedule Management

- **Multi-schedule management**: create multiple schedules (e.g. "Semester 2, Year 2")
- **Default-schedule mechanism**: the system auto-designates the earliest-created in-progress schedule as default; users can also set it manually in the schedule editor; "My Schedule" shows the default schedule first
- **Flexible import methods**:
  - One-click import from the academic affairs system
  - Import from ICS files (files exported from other calendar apps)
  - Manual event creation
- **Flexible event editing**: create, edit, and delete events manually
- **Multiple view modes**: week / day / Gantt / list
- **Month-view split linkage**: month view with left month-calendar + right day-schedule; click a date to see grouped day courses
- **Personalized card colors**: single-color / multi-color card modes; customizable background, text, current-time indicator, and upcoming-course highlight styles
- **Custom date/time pickers**: unified popup calendar/time panels, self-positioning in drawers, modals, and mobile viewports
- **Multiple export formats**:
  - Export as PNG image for easy sharing
  - Export as ICS file compatible with major calendar apps (Apple Calendar, Google Calendar, etc.); calendar view and ICS export/import use `Asia/Shanghai` uniformly

### Smart Schedule Adjustment

- **Holiday (HOLIDAY)**: logically hides all courses on the specified date
- **Smart swap (SWAP)**: moves courses from a source date to a target date
- **Server-side logic**: adjustment calculations happen on the backend, ensuring data consistency and integrity
- **Adjustment history tracking**: full history of all adjustments and affected events
- **Real-time生效**: adjustments take effect in schedule views instantly, no refresh needed

### Team Collaboration

- **Smart invitation**: 8-character random code (uppercase letters + digits, excluding ambiguous 0/O/1/I)
- **Flexible team management**: creator becomes admin automatically; add/remove members, edit team bio and icon
- **Team admin role**: designate admins to share management duties
  - Creator can promote members to admin
  - Admins manage members and schedules
  - Admin permissions can be granted or revoked anytime
- **Team ownership transfer**: creator can transfer ownership to another member
- **Layered permissions**: system admin > team creator > team admin > regular member
- **Team schedule aggregation**: view all members' active schedules and time conflicts in real time
- **Advanced filtering**: by member name, student ID, class, grade, etc.
- **Team profile enrichment**: team cards show bio, icon, invite code, and member preview; upload or choose preset icons when creating/editing
- **Convenient member ops**: add members by student ID; self-exit or admin removal
- **Team lifecycle management**: create → manage → transfer → disband
- **Batch scheduling**: batch-create course events for team members; conflict preview (skip / force), week/weekday filters; auto-create team schedules for members without one
- **Smart scheduling**: stable-greedy auto-assignment to shifts; week mode and date mode; preview shows member-assignment stats + list/calendar views; results auto-write to batch-op log
- **Schedule write strategies**: batch and smart scheduling support three write targets (new / default / specific)
- **Temporary team lookup**: search any members and view shared free slots without joining a team; date-range + 3-level visibility (busy/title/detail) filters
- **Team settings extensions**: visibility model (busy_only/course_title/full_detail), join policy (free/approval/invite), max members, member-invite toggle

### Admin Features

- **User management**: create, edit, delete user accounts
- **User status management**: multiple ban types (account/IP/email) and account recovery
- **Advanced filtering**: by role, ban status, etc.
- **Login-history monitoring**: view all users' login history and activity tracking
- **Batch operations**: batch delete / ban / recover users with batch-toolbar efficiency
- **Team monitoring**: oversee all teams' operational status
- **System settings**: configure avatar upload, storage, email notifications
- **Site configuration**: customize site name, description, logo, favicon
- **Email configuration**: configure SMTP server, test email connection

### Advanced Features

- **Schedule sharing**:
  - Generate public share links (with validity period and permission settings)
  - Visitors can view or import the shared schedule
  - Full share management panel (visit count, QR code, revoke)
- **Temporary availability & team heatmap sharing**:
  - Temporary availability supports image export and link sharing with validity period and access permissions
  - Team heatmap supports link sharing, QR code display, and member schedule visibility control
  - Public access page shows free/busy results and member info per share permission
- **Empty-classroom lookup**:
  - Real-time lookup of empty classrooms across SDNU campuses
  - Filter by time period, building, classroom type
  - Independent session management, does not affect platform login status
  - Intuitive results display
- **Home landing & demo system**:
  - Home upgraded to a full landing page (navbar, hero, feature area, CTA)
  - Hero title "井然有序" with bold continuous wavy underline; tutorial button sits next to Sign up, Log in, and Features
  - Interactive demo cards for team scheduling, empty-classroom lookup, schedule sharing (image/link/ICS), academic import, team management
  - `PerspectiveSchedule` uses real demo course data for three schedule views, with auto-playing course-detail modal animation and current-time tag
  - In-flow tutorial entries (import, adjustment, team collaboration, etc.)
- **Site configuration system**:
  - Dynamically modify site title, description, and keywords
  - Upload or use external URLs for logo and favicon
  - Controlled code injection (analytics scripts / stylesheets / meta tags)

## Controlled Code Injection (Analytics / Styles / Meta)

This project supports injecting third-party analytics or style resources into `head` / `body`, but to avoid XSS risks the feature is scoped to a **controlled whitelist**: the backend parses and validates, and the frontend only creates DOM elements from structured data (no arbitrary HTML injection).

### Behavior on validation failure

- **System settings page save**: validation failure rejects the save (HTTP 400) with a specific reason.
- **Pre-provisioned config (config.toml)**: the config is still loaded normally, but the system settings page shows a validation warning with red highlights on affected editor areas; public endpoints fail-closed (return an empty list, inject nothing).

### Allowed tags and restrictions

- **Allowed tags**
  - `script`: must use `src` (inline scripts forbidden)
  - `link`: only `rel="stylesheet"` with `href` allowed
  - `meta`: only `name/property + content` (`http-equiv` / `charset` forbidden)
- **Allowed attributes**
  - `script`: `src`, `async`, `defer`, `type`, `integrity`, `crossorigin`, `referrerpolicy`, and `data-*`
  - `link`: `rel`, `href`, `media`, `integrity`, `crossorigin`, `referrerpolicy`
  - `meta`: `name`, `property`, `content`
- **URL rules**
  - Same-origin scripts: only `/assets/*.js`
  - Same-origin styles: only `/assets/*.css`
  - External resources: `https://` only, domain must be in `CODE_INJECTION_ALLOWED_HOSTS`
- **Security limits**
  - No event attributes (e.g. `onclick`)
  - Max length: `20_000` chars; max entries: `50`
  - Validation failure rejects save / or public endpoints return empty (fail-closed)

### Adding Umami (example)

In Admin → System Settings → Code Injection (Header), paste:

```html
<script defer src="https://analytics.hxcn.dev/script.js" data-website-id="<your-id>"></script>
```

`data-website-id` is a `data-*` attribute and is preserved as-is.

### External-host whitelist & CSP

External-resource domains are configured via `CODE_INJECTION_ALLOWED_HOSTS`; the reverse proxy must also allow the CSP `script-src`, `script-src-elem`, and `connect-src` directives for those hosts. Env-var config and restart commands for each deployment method are documented in the [Deployment Guide](/chronosync/dev/deployment/).

### UI/UX Features

- **Responsive design**: desktop, tablet, and mobile
- **Mobile bottom tab bar**: fixed bottom quick-nav with schedule / team / empty classroom / profile entries; iPhone safe-area support
- **Collapsible sidebar**: expand/collapse with persistent state; hover tooltip when collapsed
- **Unified auth shell**: login / register / forgot-password share the AuthShell layout
- **OTP verification inputs**: multi-cell OTP input for register, recovery, email binding, password change
- **Consistent form feedback**: auth and empty-classroom login forms use Toast instead of browser-native prompts
- **Unified modal system**: Headless UI-based accessible modals
- **Unified page header cards**: PageHeaderCard top info cards for profile, my-teams, my-schedule, etc.
- **Toast notification system**: HeroUI-style 3D-stacked toasts, multiple types, auto-dismiss
- **Smart loading indicator**: unified loading-state visual feedback
- **Real-time status feedback**: operation results reflected immediately
- **Intuitive visual design**: clear information hierarchy and interaction guidance
- **Batch operations**: efficient batch management with batch toolbar
- **Custom scrollbars**: thin scrollbar styling
- **Sticky headers**: large data tables keep headers visible while scrolling
- **Layering & menu self-adaptation**: unified z-index for dropdowns/modals; admin action menus auto-flip; date/time pickers auto-avoid edges in drawers and mobile; searchable dropdowns keep a solid search area and close on outside click
- **Changelog integration**: view system version updates in real time

### High-Performance Architecture

- **Frontend-backend separation**: Astro + Vue.js frontend, FastAPI backend
- **Smart state management**: Pinia-driven reactive state
- **Database optimization**: SQLAlchemy ORM; SQLite (dev) and PostgreSQL (production recommended)
- **Avatar cache optimization**: unified avatar component with update-time-based local-cache invalidation, reducing repeated requests in team-aggregation / temporary-availability / heatmap scenarios
- **Connection pool management**: configurable `pool_size`, `max_overflow`, `pool_recycle` in PostgreSQL mode
- **Database migrations**: production PostgreSQL uses only the `scripts/migrations/alembic/` single live Alembic chain; `backend/alembic.ini` points to that live path; `legacy_alembic/` is for historical reference only, and must never be used to generate new revisions
- **Startup gate**: container startup runs `alembic upgrade head`, then the app verifies `current == head`; missing or incompatible `alembic_version` refuses to start; PostgreSQL no longer uses `Base.metadata.create_all()` for upgrades
- **Legacy-DB switch**: a deployed SQLite must first run `upgrade_legacy_sqlite.py` in a maintenance window (one-time backup, integrity/FK/catalog verification), then migrate into a fresh PostgreSQL created by `alembic upgrade head`; full steps and rollback in the [Migration Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md)
- **API design**: RESTful, concurrent-safe
- **Dev stability**: Vite pre-build excludes `@headlessui/vue`; use `astro dev --force` to reduce hydration errors from stale dep cache

### LLM Support (llms.txt)

This site follows the [llmstxt.org](https://llmstxt.org) proposal, giving LLM/agent tooling a parse-able content index:

- `/llms.txt`: LLM-readable site index (H1 headings + summary + key links), following the llmstxt.org format
- `/llms-full.txt`: single-file full site content (overview, features, usage guide, architecture, API overview)

Source files live in `frontend/public/` and are auto-published to the site root after build (e.g. `https://sxtj.hxcn.space/llms.txt`); please keep these in sync with this doc when site features change.

## Usage Guide

### Home & Getting Started

1. **Visit home**:
   - Unsigned-in users go to Sign up / Log in directly from home
   - Signed-in users open the workspace or profile from the top-right menu
   - After signing out, returns to home (no forced redirect to login)
   - Re-signing-in from a signed-out state defaults back to `/dashboard/my-schedule`

2. **View interactive demos**:
   - Home offers three visual demos: schedule views, team collaboration, empty-classroom lookup
   - Quick way to learn core features before diving into the workspace

3. **Tutorial entries**:
   - Home feature area, import modal, adjustment page, and team page all link to tutorials
   - Jump straight to "My Schedule / Import Schedule / Schedule Adjustment / Team Collaboration"

### My Schedule

1. **Create a schedule**:
   - Open "My Schedule"
   - Click "New Schedule" in the schedule dropdown
   - Set name, semester start date, and total weeks
   - If no schedule exists, the empty state directly offers "New Schedule", "Import Schedule", and a tutorial entry

2. **Use the "More" menu**:
   - Click the top-right "More" button to access:
     - **Add Event**: manual event creation
     - **Import Schedule**: import from ICS file or academic system
     - **Share Schedule**: generate share link, export image or ICS
     - **Holiday Adjustment**: holidays and course swaps
     - **Schedule Settings**: edit schedule name, dates, etc.

3. **Switch views & jump to date**:
   - Top of the schedule page: switch schedule, view, and actions
   - Supports week / day / Gantt / list views
   - Top "Jump" and all date/time inputs use the unified popup picker

4. **Import courses**:
   - Click "More" → "Import Schedule" → "Import from Academic System"
   - This interface uses `WebVPN`; `Direct` is campus-network-only and disabled for now (server is off-campus)
   - Step 1: enter WebVPN / unified-identity credentials; captcha only if CAS explicitly requires it
   - After the WebVPN tunnel is established, Step 2: enter the separate academic-system credentials in the same session; captcha only if the academic system requires it
   - Both sets of credentials are used for the current auth request only, not written to the database, env vars, or logs; after academic auth succeeds, the system auto-fetches and imports the schedule
   - **Import from ICS file**:
     - Click "More" → "Import Schedule" → "Import from ICS File"
     - Select a .ics file exported from another calendar app
     - System auto-parses and imports events
   - **Manual add**:
     - Click "More" → "Add Event"
     - Or click a date on the calendar

5. **Share & export**:
   - Click "More" → "Share Schedule" to open the share panel:
   - **Generate share link** (recommended):
     - Create a public link with validity period and import permission
     - View QR code, visit count, and permission details
     - Easy to share with friends or on social media
   - **Export as image**:
     - Download a PNG screenshot of the current schedule for printing or saving
   - **Export as ICS**:
     - Download a .ics file importable into Apple Calendar, Google Calendar, etc.

6. **Multi-schedule management**:
   - Manage multiple schedules (e.g. different semesters) side by side
   - Quick-switch the active schedule via dropdown
   - Each schedule manages courses and adjustments independently

### Schedule Adjustment

1. **Holiday (HOLIDAY)**:
   - On "My Schedule", click "More" → "Holiday Adjustment"
   - Choose "Set Holiday" mode
   - Pick the date(s) to take off
   - Click "Confirm Holiday". The system logically hides all courses on that date

2. **Smart swap (SWAP)**:
   - Click "More" → "Holiday Adjustment"
   - Choose "Swap Workdays" mode
   - Set the source date (courses to move) and target date (where to move them)
   - System auto-creates override events, preserving original course info

3. **Adjustment history**:
   - All adjustments are recorded in `ScheduleAdjustment`
   - View adjustment history and the number of affected events
   - Adjustments take effect in schedule views immediately

### Schedule Sharing

1. **Create a share**:
   - On "My Schedule", click "More" → "Share Schedule"
   - Set validity period (1 day / 7 days / 30 days / permanent)
   - Set access permission:
     - **View only**: visitor can only view the schedule
     - **Login required**: visitor must sign in to view
     - **Allow import**: visitor can save the schedule to their own account
   - Click "Generate Link"
   - On mobile, the share panel auto-switches to a more compact vertical layout (QR code, permission info, action buttons)

2. **Manage shares**:
   - Below the "Share Schedule" panel, view all share history
   - Monitor visit counts per link in real time
   - Revoke (delete) a share anytime; revoked links are no longer accessible

3. **Visit a share**:
   - Open the share link to enter a read-only schedule view
   - Switch week / month views
   - If permissions allow, click "Import Schedule" to copy courses to your own account

### Team Collaboration

#### 1. Create a team

- Open "My Teams" (nav "Teams" menu)
- Click "Create Team" in the top-right
- Enter team name, bio, and optionally upload or pick a preset icon
- Click "Create Team"
- System auto-generates a secure 8-character invite code (excluding ambiguous 0/O/1/I)
- Creator is auto-admin and added to the member list
- The page shows the team code; copy and share it with members

#### 2. Join a team

- Get the 8-character team invite code from the team creator
- Click "Join Team" and enter the invite code (auto-uppercased)
- Click "Join Team"
- System validates the code and adds you automatically
- After joining, view the team schedule immediately

#### 3. Team management (creator and team admins)

  **Basic management:**

- Click "Manage Team" on a team card
- Opens the advanced team management panel
- Edit team name, bio, and icon
- Preset-icon drawer lets you generate and upload a team icon directly
- View all teams you created with member counts

  **Member management:**

- **Add members**: enter a student ID in the team editor; the system looks up and adds the user
- **Remove members**: click "Remove" on a member
  - Team admins can remove regular members
  - Cannot remove the team creator or system admins
- **View members**: see all members' names, student IDs, classes, etc.

  **Team-admin management (creator only):**

- **Promote admin**:
  - Select a regular member in the member list
  - Click "Set as Admin"
  - The member gains team management permissions (manage members, edit team info)
- **Remove admin**:
  - Select an admin to demote
  - Click "Remove Admin"
  - The user becomes a regular member

  **Team transfer (creator only):**

- Click "Transfer Team"
- Choose the new team creator from the current member list
- After confirmation, team ownership and management permissions transfer to the new creator
- The original creator becomes a regular member

  **Disband team (creator only):**

- Click "Disband Team"
- Enter the team name to confirm
- After confirmation, the team and all member relations are permanently deleted
- This action is irreversible

#### 4. Leave a team (regular members)

- On "My Teams", find the team to leave
- Click "Leave Team" on the team card
- Confirm in the modal
- After leaving, you can no longer access that team's schedule

#### 5. Team schedule aggregation view

  **View team schedule:**

- Click "View Schedule" on a team card
- Enters the team schedule aggregation page
- Shows all members' active schedules (`status="in_progress"`)
- Different members' courses are color-coded

  **Advanced filtering:**

- **By member**: tick specific members to show only their courses
- **By member search**: multi-select member dropdown with instant search
- **By class**: pick a class to show all members' courses in it
- **By grade**: pick a grade to show all members' courses in it
- **Keyword search**: search by member name or course name
- **Mobile**: side filter drawer on mobile

  **View modes:**

- **Week view**: a week's schedule for detailed timing
- **Month view**: a whole month's distribution for macro planning
- **Date nav**: prev/next page or jump to today

  **Course conflict detection:**

- When multiple members are busy at the same time, click to see details
- Shows all conflicting courses with teacher and room info
- Useful for coordinating team meetings

#### 6. Batch scheduling

  **Batch-create course events:**

- On the team schedule page, click "Batch Scheduling"
- Pick target members (select-all / invert)
- Set week range and weekday
- System previews conflicts:
  - **Skip mode**: skip conflicts, create only non-conflicting events
  - **Force mode**: ignore conflicts and create all events
- Pick a schedule write target: use members' active schedule or create a new team schedule
- Confirm to batch-create; results are logged in the batch-op log

  **Batch-op log:**

- View all batch-scheduling history
- Each record shows status, creation time, and operator
- Expand to see per-user merged details (user, course, week, weekday, time, count, status)

#### 7. Smart scheduling

  **Create a scheduling task:**

- On the team schedule page, click "Smart Scheduling"
- Define shifts: shift name, start/end time, weekday
- Pick scheduling mode:
  - **Week mode**: pick weeks to schedule, set required people per shift
  - **Date mode**: pick specific dates, each with its own required count
- Set max shifts per member (optional)
- System runs the greedy algorithm to preview the assignment:
  - Shows each member's assignment-count stats
  - List view: grouped by shift, showing assigned members and weeks
  - Calendar view: time × weekday grid showing all shift assignments
- Confirm to create the task; results auto-write to the batch-op log

  **Algorithm properties:**

- Stable assignment: prefer members free across all scheduling weeks (stable set)
- Assigns the same primary person each week; substitutes only when a week has a conflict
- Substitutes never overlap with already-assigned members
- `max_per_member` is global for fairness

#### 8. Temporary team lookup

- Click "Temporary Lookup" in the nav or "Quick Lookup" on the team page
- Search and add members to view (no need to join the same team)
- Pick a date range
- System shows all members' busy/free view:
  - Busy/free status only (`busy_only`)
  - Course name (`course_title`)
  - Full detail (`full_detail`, with teacher and room)
- For coordinating cross-team meetings on the fly

#### 6. Admin team monitoring

- Open the admin "Team Management" page
- View stats for all teams in the system
- Search and filter specific teams
- View any team's member list
- Delete inactive or violating teams when necessary

### Profile Management

1. **Basic info**:
   - View and edit personal info (name, student ID, class, grade, college, bio)
   - Upload / change avatar (local storage / AList)
   - Pick a preset avatar, generated locally and uploaded to current storage
   - View account stats: schedule count, course count, signup time

2. **Email management** (v2.7.3+):
   - **Bind email**: bind an email on the profile page for password recovery
   - **Change email**: enter a new email, confirm with a verification code
   - **Send cooldown**: 60-second interval to prevent abuse
   - **Clear**: clear input to retype

3. **Password security** (v2.7.3+):
   - **Change password**: enter current and new password
   - **Email verification**: bound-email users must enter the email verification code
   - **Extra safety**: dual verification for account security

4. **Login history**:
   - View recent login devices, IP addresses, browser info
   - View full login-history records
   - Monitor account security status

### Personalization

1. **Sidebar collapse** (v2.7.3+):
   - **Expand / collapse**: click the collapse button at the sidebar top
   - **Persistent state**: collapse state auto-saves and survives refresh
   - **Space saving**: collapsed shows only icons, suited to small screens
   - **Smooth transition**: main content and footer auto-adapt to sidebar width

2. **Theme settings**:
   - Light / dark theme toggle
   - Theme preference auto-saves

3. **Schedule personalization**:
   - Single-color / multi-color event card modes
   - Customize current-time indicator color and width
   - Customize upcoming-course highlight border / marquee color

### Empty-Classroom Lookup

- Open "Empty Classroom Lookup" (nav menu)
- This interface uses `WebVPN`; `Direct` is campus-network-only and disabled for now (server is off-campus)
- Step 1: enter WebVPN / unified-identity credentials to establish the tunnel
- Step 2: in the same session, enter the separate academic-system credentials; each stage shows captchas per upstream requirements
- After login, pick time period and campus; filter by building, classroom type, etc.
- Both credential sets are ephemeral; the academic session is managed independently and does not affect platform login status

### Admin Features

1. **User management**:
   - Create, edit, delete user accounts
   - Directly maintain user emails; backend auto-dedupes, normalizes, and persists
   - Reset user passwords and roles
   - View user schedule and activity stats
   - Ban / recover user accounts
   - Batch ops: batch delete / ban / recover users
   - Batch import/export: CSV / Excel / PDF
   - Advanced filtering: by role, ban status, etc.
   - View user login history and recent logins

2. **System settings**:
   - Configure avatar upload method (local storage / AList)
   - Set file-upload limits and storage paths
   - Manage global system configuration

3. **Team monitoring**:
   - View all team info
   - Batch import/export: CSV / Excel / PDF
   - Delete teams when necessary
   - Monitor team activity and member status

## Tech Stack

### Frontend

- **Astro** - static site generation and routing
- **Vue 3** - interactive UI components
- **Tailwind CSS** - responsive styling
- **Headless UI** - unstyled accessible UI components
- **Pinia** - state management
- **Axios** - HTTP client

### Backend

- **Python 3.10+** - language
- **FastAPI** - web framework
- **SQLAlchemy** - ORM
- **SQLite / PostgreSQL** - database (PostgreSQL recommended for production)
- **JWT** - authentication
- **ICS** - calendar export

## Project Structure

Project directory structure, module responsibilities, and the REST API reference have moved to the [Architecture & Tech Reference](/chronosync/dev/architecture/); this document no longer inlines them.

## Project Docs

- [Deployment Guide](/chronosync/dev/deployment/): Docker Compose, single-container, env vars, HTTPS/CORS, persistence, backup/restore, troubleshooting.
- [Development Guide](/chronosync/dev/development/): local development, code style, quality gates, performance & security baselines, release and migration governance.
- [SQLite → PostgreSQL Migration Runbook](https://github.com/CelPlume/SDNUChronoSync/blob/main/scripts/migrations/README_PG.md): full downtime migration, verification, and rollback.
- [Full Changelog](/chronosync/about/changelog/): all project versions; this page shows only the last three months.
- [Frontend Design Guide](/chronosync/dev/design/): frontend visual, theme, and dark-mode design system covering semantic tokens, palette, unified components (`InfoBox`, `TabBar`, `PickerPopover`, `CodeEditor`), two-tab conventions, component inventory, and lessons learned.

## API Endpoints

The full REST API reference (auth, schedules, adjustments, sharing, teams, profile, admin, academic connection, and empty classroom) is in the [Architecture & Tech Reference](/chronosync/dev/architecture/) under "API Endpoints".

## Schedule Import Features

The system supports two import methods: from the academic system and from ICS files.

### Academic System Import

The system imports timetables from the SDNU Zhengfang academic system. Each import session is bound to one connection mode: `webvpn` (default) or `direct`.

1. **Get user schedule list**
   - `GET /api/import/schedules`
   - **Description**: returns all schedules for the current user, used to pick an import target.
   - **Response**: an array of schedule objects.

2. **Create academic session**
   - `GET /api/import/zfw/session?connection_mode=webvpn|direct`
   - **Description**: creates a standalone `requests.Session`. WebVPN mode first hits the SSO entry, resolves the CAS URL from `ssoConf.url`, and decides whether a captcha is needed; direct mode fetches the Zhengfang captcha directly.
   - **Response**:
     ```json
     {
       "session_id": "string",
       "connection_mode": "webvpn",
       "captcha_required": false,
       "captcha_image": null,
       "message": "Current connection mode does not require a captcha up front",
       "source": "real"
     }
     ```

3. **Submit login & import**
   - `POST /api/import/zfw`
   - **Description**: server-side login within the session's bound connection mode, then reads the Zhengfang timetable into the target schedule. `connection_mode` in the request must match the session's to prevent cross-tunnel reuse.
   - **Body**:
     ```json
     {
       "session_id": "string",
       "connection_mode": "webvpn",
       "username": "string (student ID)",
       "password": "string",
       "captcha": "string | null",
       "action": "string ('create_new' or 'use_existing')",
       "schedule_id": "integer (required when action=use_existing)",
       "schedule_name": "string (schedule name when action=create_new)"
     }
     ```
   - **Response**: on success returns the import count; if CAS mid-login requires a captcha, keeps the session and returns `captcha_required=true` with `captcha_image` and an error so the frontend can retry immediately.

4. **Refresh captcha (optional)**
   - `GET /api/import/zfw/refresh/{session_id}?connection_mode=webvpn|direct`
   - **Description**: refreshes the captcha for the current session only. Connection mode must match the session.
   - **Response**: same shape as the create-session endpoint, updating `captcha_required` and `captcha_image`.

WebVPN login flow: WebVPN SSO entry, resolve CAS login URL, `/authserver/checkNeedCaptcha.htl`, AES-CBC encrypt CAS password, CAS login, access the WebVPN-rewritten Zhengfang URL. Direct mode keeps the original Zhengfang RSA password encryption and captcha flow. Username, password, and captcha are for the current request only, not written to the database or logs; sessions are evicted from memory cache on expiry.

### ICS File Import

The system imports schedule events from standard ICS files, compatible with exports from Apple Calendar, Google Calendar, Outlook, and others.

#### API endpoint

- **Endpoint**: `POST /api/schedules/import-ics`
- **Description**: parses an ICS file and imports events into the target schedule
- **Format**: `multipart/form-data`
- **Parameters**:
  - `file`: ICS file (required; .ics only)
  - `schedule_id`: target schedule ID (required)

#### Import logic

1. **Time calculation**: auto-calculates week number and weekday from the schedule's start date
2. **Date validation**: auto-skips events earlier than the schedule start date
3. **Event creation**: extracts title, description, location, start/end time, etc.
4. **Error handling**: logs failed events and reasons

#### Response example

```json
{
  "success": true,
  "message": "Imported 15 events, 3 failed",
  "count": 15,
  "errors": [
    "Event 'Early Course' is earlier than the schedule start date",
    "Event 'Invalid Event' is missing time information"
  ]
}
```

#### Usage

1. Export an ICS file from another calendar app (Apple Calendar, Google Calendar, etc.)
2. On "My Schedule", click "More" → "Import Schedule" → "Import from ICS File"
3. Select the ICS file to upload
4. System auto-parses and imports events into the active schedule
5. Shows import count and error info

## References

The following open-source projects and resources were referenced during development:

### Academic-system-related projects

- [openschoolcn/zfn_api](https://github.com/openschoolcn/zfn_api)
- [whliao5am/zfnew](https://github.com/whliao5am/zfnew)
- [whx1024/zfn_api12](https://github.com/whx1024/zfn_api12)
- [zaigie/zfnew_webApi](https://github.com/zaigie/zfnew_webApi)
- [dairoot/school-api](https://github.com/dairoot/school-api)
- [DuskU/zhengfang](https://gitee.com/DuskU/zhengfang)
- [FarmerChillax/new-school-sdk](https://github.com/FarmerChillax/new-school-sdk)
- [Srpihot/zfapi](https://github.com/Srpihot/zfapi)

### Schedule-management-related projects

- [xxyangyoulin/ClassSchedule](https://github.com/xxyangyoulin/ClassSchedule)
- [YZune/WakeupSchedule_Kotlin](https://github.com/YZune/WakeupSchedule_Kotlin)
- [qwqVictor/CQUPT-ics](https://github.com/qwqVictor/CQUPT-ics)
- [XiaoNaoWeiSuo/Grade2](https://github.com/XiaoNaoWeiSuo/Grade2)

### Technical docs

- [WakeUp Schedule rewrite notes](https://yzune.github.io/2018/08/15/WakeUp%E8%AF%BE%E7%A8%8B%E8%A1%A8%E9%87%8D%E6%9E%84%E8%AF%B4%E6%98%8E/)
- [CSDN blog - Zhengfang academic system](https://blog.csdn.net/gitblog_00713/article/details/147225292)

### UI components

- [satyamchaudharydev/horrible-snake-35](https://uiverse.io/satyamchaudharydev/horrible-snake-35) - loading animation (HTML/CSS)
- [Siyu1017/old-goat-8](https://uiverse.io/Siyu1017/old-goat-8) - Windows 11-style loading animation

## License

This project is licensed under the MIT License.

## Contact

- **Project home**: [https://github.com/CelPlume/SDNUChronoSync](https://github.com/CelPlume/SDNUChronoSync)
- **User guide**: [https://celplume.hxcn.space/chronosync/tutorials/chronosync-user-guide/](https://celplume.hxcn.space/chronosync/tutorials/chronosync-user-guide/)
- **About this project**: [https://celplume.hxcn.space/chronosync/](https://celplume.hxcn.space/chronosync/)
- **Bug reports**: via project [Issues](https://github.com/CelPlume/SDNUChronoSync/issues)
- **Email**: [hxcn@cnies.org](mailto:hxcn@cnies.org)

## Changelog (Last Three Months)

Full version history in the [Full Changelog](/chronosync/about/changelog/).

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

### v3.4.3 (2026-05-29) - Timezone consistency, team heatmaps, and scheduling reliability fixes

**Migration scripts and docs cleanup**

- Database migration workflow consolidated under `scripts/migrations/`
- Historical Alembic migration chain archived to `scripts/migrations/legacy_alembic/`
- Synced the migration list and execution rules in the [migration script docs](https://celplume.hxcn.space/zh/chronosync/dev/development/#数据库迁移脚本规范)

**Admin diagnostics and upload security hardening**

- Admin diagnostic endpoints gained access control and input validation
- Tightened error boundaries in the file-upload pipeline to avoid leaking exception details to clients

**Team heatmap and share-link restoration**

- Fixed inaccurate team heatmap aggregation, restoring correct multi-person busy/free views
- Share-link management restored: validity period, permission config, and QR display

**Default-schedule resolution consistency**

- Current-schedule resolution now uniformly follows the default-schedule source of truth, eliminating frontend/backend mismatches

**Timezone unification: calendar and exports follow Shanghai wall-clock**

- Calendar view and ICS export/import flows now generate and parse events in the `Asia/Shanghai` timezone
- Fixed cross-timezone event time drift causing schedule display and export mismatches

**Scheduling regression scenarios retained**

- Added Team1 scheduling regression test scenario docs so batch and smart scheduling remain repeatably verifiable

**Team scheduling preview delayed-creation fix**

- Team scheduling preview no longer shows events that have not actually been created yet, keeping preview consistent with the final result

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

