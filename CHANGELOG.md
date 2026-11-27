# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-27

### Added

- **Project Foundation & CI/CD**: Initialized React 19 + TypeScript + Vite project with strict `tsconfig`, ESLint 9 (`typescript-eslint`, `jsx-a11y`, `sonarjs`, `--max-warnings=0`), Prettier, `.editorconfig`, automated Feature-Sliced architecture tests, GitHub Actions CI, CodeQL SAST, Dependabot, PR template, `README.md`, and MIT `LICENSE`.
- **Design System & AppShell**: Added Tailwind CSS v4 semantic tokens (light/dark themes), accessible Radix UI primitives, `DataTable` with server pagination, `FileDropzone`, `PdfPreviewModal` with safe `ObjectURL` revocation, and responsive `AppShell`.
- **HTTP Client & RBAC Routing**: Added `fetch` client with Single-Flight refresh token mutex, RFC 9457 `ProblemDetails` parser, in-memory `accessToken` + `BroadcastChannel` multi-tab logout sync, and permission-driven route guards.
- **Authentication & Initial Dashboard**: Added `/login` (`401`/`423`/`429` handling), `/forgot-password`, `/reset-password` (6-digit OTP + complexity checklist), `/account/security` (password change & `logout-all`), and permission-adaptive `/dashboard`.
