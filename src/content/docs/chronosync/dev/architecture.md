---
title: System Architecture and Technical Reference
description: Project directory structure, module responsibilities, and REST API endpoint list.
sidebar:
  order: 4
---
> This document maintains the project directory structure and REST API endpoint list (migrated from README, 2026-08-05).
> Architecture overview: frontend Astro + Vue 3 + TypeScript + Tailwind CSS; backend FastAPI (Python 3.10+);
> frontend and backend are separated, deployed as a single container in production (Nginx reverse proxy + Supervisor process management), database PostgreSQL (SQLite available for development).

## 📁 Project Structure

```
SDNUChronoSync/
├── backend/                 # Backend code
│   ├── main.py             # Application entry point
│   ├── models.py           # Data models (User, Schedule, Event, ScheduleAdjustment, Team, LoginRecord, ScheduleShare, TeamScheduleTask, TeamBatchOperation, etc.)
│   ├── schemas.py          # Pydantic schemas (includes team, schedule adjustment, login record, batch operation, smart scheduling schemas)
│   ├── crud.py             # Database operations (team CRUD + schedule adjustment records + login records + batch operation management)
│   ├── auth.py             # Authentication logic
│   ├── database.py         # Database configuration (includes user_teams_table, team_admins_table association tables)
│   ├── config.py           # System configuration
│   ├── compat.py           # Python 3.12 / legacy dependency compatibility patches
│   ├── utils.py            # Utility functions
│   ├── importer.py         # Academic affairs system import
│   ├── pyproject.toml      # Python project definition (uv)
│   ├── uv.lock             # Python dependency lock file (uv)
│   ├── requirements.txt    # Compatibility dependency list
│   ├── uvicorn_log_config.json  # Uvicorn log configuration
│   ├── alembic.ini         # Legacy Alembic configuration (kept for compatibility, no longer used as migration entry point)
│   ├── scripts/
│   │   └── smoke_httpx_lifespan.py # Backend API smoke script (ASGITransport + Lifespan)
│   ├── services/           # Service layer
│   │   ├── email.py        # Email sending and verification code management service
│   │   ├── uploader_service.py  # File upload service (avatar/team icon universal upload pipeline)
│   │   └── availability.py # Team availability and busy/free computation service
│   ├── tests/
│   │   ├── test_profile_team_metadata.py      # Profile and team metadata schema tests
│   │   ├── test_admin_user_update_email.py    # Admin user email update regression tests
│   │   ├── test_importer.py                   # Academic affairs system import tests
│   │   ├── test_schedule_adjustment_request.py # Schedule adjustment request validation tests
│   │   ├── test_schedule_ics.py               # ICS import/export tests
│   │   └── test_team_schedule_insert_logic.py # Team scheduling insertion logic tests
│   └── routers/            # API routes
│       ├── auth.py         # Authentication routes (includes login records, email verification, password recovery)
│       ├── schedule.py     # Personal schedule routes
│       ├── schedules.py    # Multiple schedule + schedule adjustment management + ICS import/export routes
│       ├── team.py         # Complete team management routes (includes team settings, member schedule queries)
│       ├── admin.py        # Admin routes (includes user banning, login record queries)
│       ├── admin_settings.py # System settings routes (includes site configuration, code injection, email configuration)
│       ├── import_route.py # Academic affairs system import routes
│       ├── profile.py      # Personal profile routes (includes login history)
│       ├── share.py        # Schedule sharing routes
│       ├── temporary.py    # Temporary team availability query routes
│       ├── classroom.py    # Empty classroom query routes
│       ├── batch_operations.py # Batch scheduling operation routes (conflict detection, skip/force strategies)
│       └── smart_schedule.py   # Smart scheduling routes (greedy algorithm, week/date dual mode)
├── frontend/               # Frontend code
│   ├── src/
│   │   ├── components/     # Vue components
│   │   │   ├── ScheduleAdjuster.vue      # Schedule adjustment management component (holiday + swap)
│   │   │   ├── ScheduleCalendar.vue      # Calendar view component (supports schedule adjustment, stacked events)
│   │   │   ├── calendar/MonthSplitView.vue # Month view split layout (calendar + daily schedule)
│   │   │   ├── ScheduleEditor.vue        # Schedule editor
│   │   │   ├── ScheduleGanttWeekView.vue # Gantt chart week view
│   │   │   ├── ScheduleDayListView.vue   # Week list view
│   │   │   ├── ScheduleImporter.vue      # Academic affairs system import
│   │   │   ├── ImportOptionsModal.vue    # Import options modal (ICS/academic affairs system)
│   │   │   ├── ExportOptionsModal.vue    # Export options modal (PNG/ICS)
│   │   │   ├── ShareOptionsModal.vue     # Share/export options modal
│   │   │   ├── ShareScheduleView.vue     # Share management panel
│   │   │   ├── PublicScheduleView.vue    # Public schedule read-only view
│   │   │   ├── ImportScheduleModal.vue   # Import shared schedule modal
│   │   │   ├── EmptyClassroomQuery.vue   # Empty classroom query component
│   │   │   ├── MySchedulePage.vue        # Personal schedule page (includes schedule adjustment, sharing features)
│   │   │   ├── MyTeamsPage.vue           # My team management page (create/join/list)
│   │   │   ├── TeamViewPage.vue          # Team schedule aggregate view (filtering + conflict detection + batch scheduling + smart scheduling entry)
│   │   │   ├── AllTeamsViewPage.vue      # All teams view page
│   │   │   ├── TeamEditorModal.vue       # Team editor modal (3 tabs: team info + member management + team operations)
│   │   │   ├── AvatarPresetDrawer.vue    # Avatar/team icon preset drawer
│   │   │   ├── BatchTeamEventModal.vue   # Batch scheduling modal (conflict preview + skip/force strategies + schedule write target selection)
│   │   │   ├── TeamScheduleTaskModal.vue # Smart scheduling modal (week/date mode + member assignment preview + list/calendar views)
│   │   │   ├── BatchOperationsLog.vue    # Batch operation log panel (merged by user view + status filtering)
│   │   │   ├── TemporaryTeamDrawer.vue   # Temporary team query drawer (quick multi-person availability query)
│   │   │   ├── TeamAvailabilityGrid.vue  # Team member availability grid (color-coded + click selection)
│   │   │   ├── TeamAvailabilityShareModal.vue # Team availability sharing modal (image/link/QR code)
│   │   │   ├── TeamMemberSchedulePanel.vue # Team member personal schedule panel
│   │   │   ├── TeamMemberStrip.vue       # Team member avatar bar (add/remove + role selection)
│   │   │   ├── TeamSlotDetailDrawer.vue  # Team slot detail drawer (member list + conflict information)
│   │   │   ├── TeamHeatmapDrawer.vue     # Team heatmap detail drawer (free/busy member lists)
│   │   │   ├── TransferTeamModal.vue     # Team ownership transfer modal
│   │   │   ├── DissolveTeamModal.vue     # Dissolve team confirmation modal
│   │   │   ├── LeaveTeamModal.vue        # Leave team confirmation modal
│   │   │   ├── TeamEventDetailModal.vue  # Team event detail and conflict display
│   │   │   ├── EventDetailModal.vue      # Event detail modal
│   │   │   ├── StackedEventsModal.vue    # Stacked events detail display
│   │   │   ├── FilterSidebar.vue         # Team schedule advanced filtering sidebar
│   │   │   ├── ChangelogModal.vue        # Changelog display modal
│   │   │   ├── BatchActionBar.vue        # Batch operation toolbar
│   │   │   ├── ButtonLoadingSpinner.vue  # Button loading indicator
│   │   │   ├── PageHeaderCard.vue        # Page header info card
│   │   │   ├── PageLoadingSpinner.vue    # Page loading indicator
│   │   │   ├── Navigation.vue            # Navigation bar (includes team, empty classroom query, changelog entry)
│   │   │   ├── MobileDrawer.vue          # Mobile menu
│   │   │   ├── MobileBottomTabBar.vue    # Mobile bottom tab bar (schedule/team/empty classroom/profile)
│   │   │   ├── EventModal.vue            # Event edit modal
│   │   │   ├── PickerPopover.vue         # Universal popup date/time picker
│   │   │   ├── CodeEditor.vue            # Code editor (supports code injection configuration)
│   │   │   ├── EmailBindingChecker.vue   # Mandatory email binding checker
│   │   │   ├── ForceBindEmailModal.vue   # Force bind email modal
│   │   │   ├── ForgetPasswordForm.vue    # Password recovery form
│   │   │   ├── RegisterForm.vue          # Registration form (includes email verification)
│   │   │   ├── LoginForm.vue             # Login form
│   │   │   ├── PasswordInput.vue         # Unified password input component (supports show/hide)
│   │   │   ├── OtpInput.vue              # Multi-cell verification code input component
│   │   │   ├── SendCodeLabel.vue         # Verification code button status label
│   │   │   ├── TutorialEntry.vue         # Tutorial quick entry component
│   │   │   ├── LandingNavbar.vue         # Landing page navigation bar (supports authenticated menu)
│   │   │   ├── HeroTypewriter.vue        # Landing page typewriter title component
│   │   │   ├── PerspectiveSchedule.vue   # Landing page 3D schedule demo component (includes auto course detail animation)
│   │   │   ├── TeamViewShowcase.vue      # Landing page team collaboration demo component
│   │   │   ├── ClassroomShowcase.vue     # Landing page empty classroom demo component
│   │   │   ├── ShareShowcase.vue         # Landing page schedule sharing demo component (image/link/ICS three tabs)
│   │   │   ├── ImportShowcase.vue        # Landing page academic affairs system import demo component
│   │   │   ├── TeamManageShowcase.vue    # Landing page team management demo component
│   │   │   ├── NavTooltip.vue            # Universal hover tooltip component (supports top/bottom/right directions)
│   │   │   ├── FeatureSection.vue        # Landing page feature showcase section
│   │   │   ├── CTASection.vue            # Landing page call-to-action section
│   │   │   ├── InAppBrowserPrompt.vue    # In-app browser prompt component (dialog + toast dual mode)
│   │   │   ├── Footer.vue                # Footer component
│   │   │   ├── Toast/                   # Toast notification subsystem
│   │   │   │   ├── index.ts             # Toast type definitions and exports
│   │   │   │   ├── ToastContainer.vue   # Toast notification container
│   │   │   │   └── ToastItem.vue        # Toast notification item
│   │   │   ├── SEO/                     # SEO subsystem
│   │   │   │   └── StructuredData.astro # Structured data (JSON-LD)
│   │   │   ├── auth/AuthShell.astro     # Authentication page universal shell
│   │   │   └── admin/                   # Admin components
│   │   │       ├── AdminTeamManagement.vue   # Admin team management component
│   │   │       ├── UserManagementPage.vue    # User management page (includes login records, batch operations)
│   │   │       ├── ConfirmDeleteModal.vue    # Batch delete confirmation modal
│   │   │       ├── UserEditModal.vue         # User edit modal
│   │   │       ├── UserScheduleModal.vue     # User schedule display modal
│   │   │       ├── BanUserModal.vue          # Ban user confirmation modal
│   │   │       ├── BatchRestoreConfirmToast.vue  # Batch restore confirmation modal
│   │   │       ├── CsvImportModal.vue        # CSV import modal
│   │   │       └── SystemSettings.vue        # System settings component (includes email configuration)
│   │   ├── layouts/        # Astro layouts
│   │   │   ├── BaseLayout.astro          # Base layout
│   │   │   └── DashboardLayout.astro     # Dashboard layout
│   │   ├── pages/          # Page routes
│   │   │   ├── index.astro               # Landing page
│   │   │   ├── login.astro               # Login page
│   │   │   ├── register.astro            # Registration page (includes email verification)
│   │   │   ├── forget.astro              # Password recovery page
│   │   │   ├── share.astro               # Public schedule sharing page
│   │   │   ├── 503.astro                 # Account banned error page
│   │   │   └── dashboard/                # Dashboard pages
│   │   │       ├── my-schedule.astro     # Personal schedule (includes schedule adjustment management)
│   │   │       ├── my-teams.astro        # My team management
│   │   │       ├── classroom.astro       # Empty classroom query
│   │   │       ├── team-view.astro       # Team view (dynamic team ID passed via query parameter)
│   │   │       ├── profile.astro         # Personal profile (includes login history)
│   │   │       └── admin/                # Admin pages
│   │   │           ├── user-management.astro  # User management page
│   │   │           ├── team-management.astro  # Team management page
│   │   │           └── system-settings.astro  # System settings page
│   │   ├── stores/         # Pinia state management
│   │   │   ├── auth.ts                   # Authentication state
│   │   │   ├── schedule.ts               # Schedule state (includes schedule adjustment logic)
│   │   │   ├── team.ts                   # Team state management
│   │   │   ├── ui.ts                     # UI state management (includes changelog notifications)
│   │   │   ├── siteConfig.ts             # Site configuration state (title, logo, code injection, etc.)
│   │   │   ├── theme.ts                  # Theme state management
│   │   │   └── toast.ts                  # Toast notification global singleton state
│   │   ├── types/          # TypeScript type definitions
│   │   │   └── index.ts                  # Includes Team, ScheduleAdjustment, LoginRecord, ShiftDefinition, BatchOperation, ScheduleTask, etc.
│   │   ├── constants/      # Frontend constants
│   │   │   ├── scheduleDisplay.ts         # Schedule display personalization configuration constants
│   │   │   └── tutorialLinks.ts           # Tutorial entry link constants
│   │   └── utils/          # Utility functions
│   │       ├── inAppBrowser.ts           # In-app browser detection and prompt utility
│   │       ├── api.ts                    # API client
│   │       ├── avatarCache.ts            # Avatar local cache invalidation control
│   │       ├── avatarPresets.ts          # Avatar/team icon preset data and generation logic
│   │       ├── calendar-grouping.ts      # Calendar day/course grouping utility
│   │       ├── clipboard.ts              # Clipboard copy compatibility utility
│   │       ├── colors.ts                 # Color utility
│   │       ├── colleges.ts               # College list constants
│   │       ├── date.ts                   # Date utility
│   │       ├── export.ts                 # Export utility (CSV/Excel/PDF)
│   │       ├── grades.ts                 # Grade list constants
│   │       ├── changelogService.ts       # Changelog service
│   │       ├── dropdownBehavior.ts       # Dropdown menu click-outside close and height utility
│   │       ├── pickerPopoverLayout.ts    # Date/time picker layout calculation utility
│   │       ├── scheduleView.ts           # Multi-view statistics and event filtering utility
│   │       ├── schedule-segments.ts      # Schedule time slot utility
│   │       └── url.ts                    # URL safety validation and path utility
│   ├── tests/               # Bun frontend unit tests
│   │   ├── avatar-presets.test.ts       # Preset avatar/icon resource tests
│   │   ├── clipboard.test.ts            # Clipboard fallback logic tests
│   │   ├── dropdown-behavior.test.ts    # Dropdown menu behavior tests
│   │   ├── dropdown-component-guards.test.ts # Dropdown component regression guard tests
│   │   ├── login-redirect.test.ts       # Login redirect logic tests
│   │   ├── picker-popover-layout.test.ts # Date/time picker layout tests
│   │   ├── schedule-adjuster.test.ts    # Schedule adjustment component tests
│   │   ├── schedule-editor-modal.test.ts # Schedule editor modal action tests
│   │   ├── schedule-gantt-alignment.test.ts # Gantt chart alignment tests
│   │   ├── schedule-views.test.ts       # Multi-view statistics and filtering tests
│   │   └── team-modal-actions.test.ts   # Team modal action tests
│   ├── astro.config.mjs    # Astro configuration
│   ├── tailwind.config.mjs # Tailwind configuration
│   └── package.json        # Dependency management
├── scripts/                # Script directory
│   ├── migrations/         # Database migration scripts
│   │   ├── README.md       # Unified migration script list, version notes, and execution rules
│   │   ├── README_PG.md    # SQLite to PostgreSQL migration guide
│   │   ├── sqlite_to_postgres.py  # SQLite to PostgreSQL data migration tool (includes team collaboration tables)
│   │   ├── repair_team_tables.py  # Legacy patch: pre-governance team collaboration table repair (new structural changes go through Alembic)
│   │   ├── add_email_and_status_fields.py  # Add email and status fields
│   │   ├── add_college_field.py            # Add college field
│   │   ├── add_password_changed_field.py   # Add password changed field
│   │   ├── add_profile_bio_and_team_metadata.py # Add profile bio and team metadata fields
│   │   ├── add_schedule_visibility_and_default_truth.py # Legacy patch: default schedule/hidden schedule truth source migration (merged into Alembic chain)
│   │   ├── add_schedule_share.sh           # Add schedule sharing feature
│   │   └── legacy_alembic/  # Legacy Alembic migration archive (kept for reference, no new additions)
│   ├── testing/            # Testing-related scripts and data
│   └── start_dev.sh        # Development environment startup script
├── Dockerfile              # Docker image build file
├── docker/                 # Docker deployment configuration
│   ├── nginx.conf          # Nginx reverse proxy configuration
│   ├── supervisord.conf    # Supervisor process management configuration
│   └── entrypoint.sh       # Container entrypoint script
├── docker-compose.yml      # Docker Compose deployment (includes PostgreSQL service)
├── .env.example            # Environment variable template
├── docs/                    # Deployment, development, and complete changelog
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── DEVELOPMENT.md       # Development and quality gates
│   └── CHANGELOG.md         # Complete version history
├── .gitignore              # Git ignore file
└── README.md               # Project description and last three months of updates
```


## 🔌 API Endpoints

### Authentication Endpoints

- `POST /api/auth/token` - User login
- `POST /api/auth/register` - User registration (supports email verification)
- `GET /api/auth/users/me` - Get current user info
- `POST /api/auth/send-verification-code` - Send email verification code (60-second cooldown)
- `POST /api/auth/bind-email` - Bind email to user account
- `GET /api/auth/email-required` - Check whether email verification is mandatory
- `POST /api/auth/reset-password` - Reset password (requires verification code)

### Schedule Management Endpoints

- `GET /api/schedules/` - Get all schedules for the user
- `POST /api/schedules/` - Create a new schedule
- `GET /api/schedules/{id}` - Get specified schedule details
- `PUT /api/schedules/{id}` - Update schedule information
- `DELETE /api/schedules/{id}` - Delete schedule
- `GET /api/schedules/{id}/events` - Get schedule events (includes schedule adjustment logic)
- `POST /api/schedules/{id}/events` - Create event in schedule
- `PUT /api/schedules/{id}/events/{event_id}` - Update schedule event
- `DELETE /api/schedules/{id}/events/{event_id}` - Delete schedule event
- `POST /api/schedules/import-ics` - Import events from ICS file to specified schedule
- `GET /api/schedules/{id}/export.ics` - Export schedule as ICS file

### Schedule Adjustment Endpoints

- `GET /api/schedules/{id}/adjustments` - Get all schedule adjustment history for a schedule
- `POST /api/schedules/{id}/adjustments` - Create schedule adjustment (HOLIDAY/SWAP type)
  - **HOLIDAY type**: `{ "adjustment_type": "HOLIDAY", "holiday_date": "2024-10-01" }`
  - **SWAP type**: `{ "adjustment_type": "SWAP", "source_date": "2024-10-01", "target_date": "2024-10-02" }`

### Schedule Sharing Endpoints

- `POST /api/schedules/{id}/share` - Create schedule share link
- `GET /api/schedules/{id}/shares` - Get all share records for a schedule
- `DELETE /api/shares/{share_id}` - Revoke (delete) a share
- `GET /api/public/shares/{token}` - View shared schedule (public endpoint)
- `POST /api/public/shares/{token}/import` - Import shared schedule into current account

### Team Management Endpoints

**User team operations:**

- `POST /api/teams` - Create new team (auto-generates 8-digit invitation code, creator auto-joins)
- `POST /api/me/teams/join` - Join team via invitation code
- `GET /api/me/teams` - Get all teams the user participates in
- `POST /api/me/teams/{id}/leave` - Leave team (regular member)

**Team information queries:**

- `GET /api/teams/{id}` - Get team details (includes member list, creator info)
- `GET /api/teams/{id}/schedules` - Get team aggregate schedule view (active schedules of all members)

**Team management operations (requires creator or team admin permissions):**

- `PUT /api/teams/{id}` - Update team name
- `POST /api/teams/{id}/members` - Add team member (exact lookup by student ID)
- `DELETE /api/teams/{id}/members/{user_id}` - Remove team member (cannot remove creator or system admin)

**Team settings endpoints:**

- `GET /api/teams/{id}/settings` - Get team settings (visibility model, join policy, etc.)
- `PUT /api/teams/{id}/settings` - Update team settings
- `GET /api/teams/{id}/member-schedule/{user_id}` - Get schedule data for a specified member

**Batch scheduling endpoints:**

- `POST /api/teams/{id}/batch-events/preview` - Preview batch scheduling (returns conflict detection results)
- `POST /api/teams/{id}/batch-events/execute` - Execute batch scheduling (supports skip/force strategies)
- `GET /api/teams/{id}/batch-operations` - Get batch operation list
- `GET /api/teams/{id}/batch-operations/{op_id}` - Get batch operation details (merged by user view)

**Smart scheduling endpoints:**

- `POST /api/teams/{id}/schedule-tasks/preview` - Preview smart scheduling (returns member assignment statistics)
- `POST /api/teams/{id}/schedule-tasks` - Create smart scheduling task
- `GET /api/teams/{id}/schedule-tasks` - Get scheduling task list

**Temporary team query endpoints:**

- `POST /api/temporary/availability` - Query multi-person availability (no need to join a team)

**Team admin management (creator and system admin only):**

- `POST /api/teams/{id}/admins/{user_id}` - Promote member to team admin
  - Requirement: target user must be a team member
  - Restriction: cannot promote the creator (already has implicit permissions) or system admin
- `DELETE /api/teams/{id}/admins/{user_id}` - Remove team admin permissions
  - Demotes team admin to regular member
  - Restriction: cannot demote the creator

**Team ownership management (creator permissions only):**

- `POST /api/teams/{id}/transfer` - Transfer team ownership to another member
- `DELETE /api/teams/{id}` - Dissolve team (delete team and all member relationships)

**Admin-only endpoints:**

- `GET /api/admin/teams` - Get all teams in the system (includes statistics)

### Route Notes

Team management endpoints use a unified route prefix and follow RESTful design principles:

- `/api/teams/*` - Team CRUD operations
- `/api/me/teams/*` - Current user's team operations
- `/api/admin/teams` - Admin team monitoring

All endpoints require JWT authentication, passed via the `Authorization: Bearer <token>` request header.

### Profile Endpoints

- `GET /api/profile/` - Get personal profile
- `PUT /api/profile/` - Update personal profile
- `POST /api/profile/change-password` - Change password
- `POST /api/profile/avatar` - Update avatar URL
- `POST /api/profile/upload-avatar` - Upload avatar file
- `GET /api/profile/statistics` - Get personal statistics
- `GET /api/profile/recent-login` - Get most recent login record
- `GET /api/profile/login-history` - Get login history (supports pagination)

### Admin Endpoints

**User management:**

- `GET /api/admin/users` - Get all users (admin)
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/{id}/ban` - Ban user account (supports ban_type: ban/ipban/emailban)
- `POST /api/admin/users/{id}/restore` - Restore user account (resets status to normal)

**Batch import/export:**

- `GET /api/admin/users/import-template.csv` - Download user CSV import template
- `POST /api/admin/users/import-csv` - Batch import users (multipart/form-data, file parameter)
- `GET /api/admin/teams/import-template.csv` - Download team CSV import template
- `POST /api/admin/teams/import-csv` - Batch import/update teams (multipart/form-data, file parameter)

**User schedule management:**

- `GET /api/admin/users/{id}/schedules-list` - Get all schedule list for a user
- `GET /api/admin/users/{id}/schedules` - Get all schedule events for a user
- `POST /api/admin/schedule/{user_id}` - Create schedule for specified user
- `PUT /api/admin/schedule/{event_id}` - Update any schedule event
- `DELETE /api/admin/schedule/{event_id}` - Delete any schedule event

**Login record queries:**

- `GET /api/admin/users/{id}/recent-login` - Get recent login record for specified user
- `GET /api/admin/users/{id}/login-history` - Get login history for specified user

**System settings:**

- `GET /api/admin/settings` - Get system settings (includes email configuration)
- `POST /api/admin/settings` - Update system settings (includes email configuration)
- `POST /api/admin/settings/test-alist` - Test AList storage connection
- `POST /api/admin/settings/test-email` - Test email connection (sends test email)

**Site configuration endpoints:**

- `GET /api/admin/public/site-config` - Get public site configuration (no authentication required)
- `GET /api/admin/public-files` - Get icon files in the Public directory
- `GET /api/admin/settings` - Get complete system settings (includes site configuration)
- `POST /api/admin/settings` - Update system settings (includes `[site]` section of site configuration)

### Academic Affairs Connection and Empty Classroom Endpoints

- `GET /api/import/zfw/session?connection_mode=webvpn|direct` - Create schedule import academic affairs session
- `GET /api/import/zfw/refresh/{session_id}?connection_mode=webvpn|direct` - Refresh verification code for current import session
- `POST /api/import/zfw` - Log in and import schedule using session-bound connection mode
- `GET /api/classroom/session?connection_mode=webvpn|direct` - Create empty classroom query academic affairs session
- `GET /api/classroom/refresh-captcha/{session_id}?connection_mode=webvpn|direct` - Refresh verification code for current empty classroom session
- `POST /api/classroom/login` - Log in to academic affairs system using session-bound connection mode
- `POST /api/classroom/query` - Query empty classrooms using an authenticated session

`connection_mode` defaults to `webvpn`; the mode cannot be switched after session creation, and a mode mismatch returns HTTP 400. The backend currently retains the `direct` protocol implementation for campus network deployments, but the frontend displays the direct connection option as disabled.

### Changelog

The changelog no longer requests an external site: during the frontend build phase, the repository's `docs/CHANGELOG.md` is read directly, rendered as HTML, and inlined into the page (changelog modal). Version change prompts are derived by comparing the content hash in the build artifact with local storage, with no runtime API calls.
