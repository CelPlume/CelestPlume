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
