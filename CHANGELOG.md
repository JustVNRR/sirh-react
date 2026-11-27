# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-11-27

### Added

- **Medical Visits Scheduling & Documents (`e9c99fe`)**: Added `/health/medical-visits` supporting all 6 visit types (`hiring`, `followUp`, `preReturnToWork`, `returnToWork`, `employerRequested`, `employeeRequested`), mandatory `convocationFile` validation on creation, optional `reportFile` upload/replacement, inline `PdfPreviewModal` & download for convocations and reports, `409 Conflict` reload, and self-service view (`Mes visites médicales`).
- **Notification Center (`2fe3e75`)**: Added `/notifications` with `isRead` & `category` filters (`medicalVisitReminder`, `documentExpiryAlert`, `rseUpdate`, `system`), contextual module links, single `markAsRead`, `POST /api/v1/notifications/read-all`, delete confirmation, and live synchronization of header & sidebar unread badges via `AuthContext`.
- **Role-Adaptive Dashboard Widgets (`2fe3e75`)**: Enriched `/dashboard` with permission-gated KPI cards (unread notifications, upcoming medical visits, active headcount, pending RSE ideas) and actionable recent lists without emitting unauthorized API requests.

## [0.4.0] - 2026-11-27

### Added

- **Contract Models Scriban Studio & QuestPDF Preview (`03855a1`)**: Added `/contracts/models`, `/contracts/models/new`, and `/contracts/models/:id` with clickable variable palette (`GET /api/v1/contract-models/variables`), custom variables tag management, Scriban syntax error feedback, `409 Conflict` reload banner, native PDF preview (`POST /api/v1/contract-models/{id}/preview`), and direct contract generation (`POST /api/v1/contracts/generate`).
- **Contracts Management & Position Job Sheets (`94528df`)**: Added `/contracts` (server-paginated list, PDF import/generation/editing/deletion, status lifecycle `draft` / `pendingSignature` / `signed` / `archived`, inline `PdfPreviewModal` & download) and `PositionJobSheetBar` integrated into employee position cards.
- **6-Category Employee Documents Vault & RQTH / Resident Permit Tracking (`b46d23a`)**: Added `/documents` and the employee profile `Dossier administratif` tab with 44 document types across 6 categories, ABAC hiding of `disciplinary` and `departure` without `employee-docs:read:sensitive`, self-service category restriction, conditional RQTH (`expiryDate`, `workplaceAccommodation`) and Resident Permit (`permitNumber`, `expiryDate`) forms, and expiry alert badges.
- **Shared Controls (`03855a1`)**: Added `Textarea` primitive in `src/shared/ui/`.

## [0.3.0] - 2026-11-27

### Added

- **Employees Directory & Lifecycle (`96a2cdb`)**: Added `/employees` directory with URL-synced multi-criteria server pagination, `/employees/new` and `/employees/:id/edit` forms (with `password` field, role anti-escalation for HR, and `409 Conflict` reload banner), `/employees/:id` 360° profile and `/me` My Space (with ABAC PII masking), and logical activate/deactivate flows.
- **Emergency Contacts & Positions History (`00e5187`)**: Added `EmergencyContactsTab` (max 2 contacts enforced, at least 1 phone number, ABAC `Self`/`All` visibility) and `PositionsTab` (`Poste actuel` badge, client validation for `endAt >= startAt` and `managerId !== employeeId`, and `409 Conflict` handling on linked position deletion).
- **Shared Tabs (`96a2cdb`)**: Added accessible Radix `Tabs` primitives in `src/shared/ui/`.

## [0.2.0] - 2026-11-27

### Added

- **Organization Referentials (`9e399a8`)**: Added Companies CRUD (`/organization/companies` with 14-digit SIRET Luhn + La Poste validation, `"Syntec"` default, status toggle, and `409 Conflict` reload), Locations CRUD (`/organization/locations` with `#RRGGBB` color picker, publication filter, and `409` reference protection), Contract Types CRUD (`/organization/contract-types` protecting `isSystem` codes/deletion), and live French departments referential (`/api/v1/referentials/departments`).
- **RBAC Roles & Permissions Matrix (`fcd0972`)**: Added `/admin/roles` administration matrix grouping all 56 permissions by module with bulk module toggles, automatic `SUPER_ADMIN` lock for non-`SUPER_ADMIN` admins, and live `/auth/me` profile refresh when the current user's role is updated.
- **Shared Controls (`9e399a8`)**: Added `Select`, `Checkbox`, `ConcurrencyConflictBanner`, `useDebounce`, and `isValidSiret` / `isValidHttpUrl` helpers.

## [0.1.0] - 2026-11-27

### Added

- **Project Foundation & CI/CD (`73ac632`)**: Initialized React 19 + TypeScript + Vite project with strict `tsconfig`, ESLint 9 (`typescript-eslint`, `jsx-a11y`, `sonarjs`, `--max-warnings=0`), Prettier, `.editorconfig`, automated Feature-Sliced architecture tests, GitHub Actions CI, CodeQL SAST, Dependabot, PR template, `README.md`, and MIT `LICENSE`.
- **Design System & AppShell (`ca2c14c`)**: Added Tailwind CSS v4 semantic tokens (light/dark themes), accessible Radix UI primitives, `DataTable` with server pagination, `FileDropzone`, `PdfPreviewModal` with safe `ObjectURL` revocation, and responsive `AppShell`.
- **HTTP Client & RBAC Routing (`41993f7`)**: Added `fetch` client with Single-Flight refresh token mutex, RFC 9457 `ProblemDetails` parser, in-memory `accessToken` + `BroadcastChannel` multi-tab logout sync, and permission-driven route guards.
- **Authentication & Initial Dashboard (`44e7ba3`)**: Added `/login` (`401`/`423`/`429` handling), `/forgot-password`, `/reset-password` (6-digit OTP + complexity checklist), `/account/security` (password change & `logout-all`), and permission-adaptive `/dashboard`.
