# SIRH — React TypeScript HR Management Frontend

[![CI](https://github.com/JustVNRR/sirh-react/actions/workflows/ci.yml/badge.svg)](https://github.com/JustVNRR/sirh-react/actions/workflows/ci.yml)
[![CodeQL](https://github.com/JustVNRR/sirh-react/actions/workflows/codeql.yml/badge.svg)](https://github.com/JustVNRR/sirh-react/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](package.json)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6)](tsconfig.app.json)

A modern, accessible **React 19 + TypeScript** frontend for the [.NET 10 Modular Monolith HR API (`sirh-asp`)](https://github.com/JustVNRR/sirh-asp), built with **Feature-Sliced** modularity, **TanStack Query v5**, **Tailwind CSS v4**, and **Radix UI**.

---

## Architecture Overview

The application is structured around strict Feature-Sliced boundaries enforced by ESLint (`no-restricted-imports`) and automated Vitest architecture tests:

```text
src/
├── app/        # Composition root, router, guards, AppShell, providers
├── shared/     # Agnostic HTTP client (Single-Flight refresh mutex), auth primitives, Design System UI, helpers
└── features/   # Autonomous business modules (auth, dashboard, organization, employees, contracts, health, ...)
```

### Key Technical & Security Highlights

- **Single-Flight Refresh Token Mutex**: Prevents concurrent `401` responses from triggering parallel `/api/v1/auth/refresh` calls and causing token-family revocation on `sirh-asp`.
- **In-Memory Access Token**: Access tokens live strictly in memory (never in `localStorage`); `sessionStorage` holds the refresh token for tab survival and `BroadcastChannel` synchronizes logout across tabs.
- **Permission-Driven UI**: Navigation, route guards, and action controls are driven dynamically by the 56 permissions returned by `GET /api/v1/auth/me`.
- **RFC 9457 `ProblemDetails`**: Standardized API error parsing with `traceId` surfacing and optimistic concurrency (`rowVersion` / `409 Conflict`) handling.

---

## Prerequisites

- [Node.js](https://nodejs.org/) `22+` (with `npm`)
- Running [`sirh-asp`](https://github.com/JustVNRR/sirh-asp) backend API (default dev URL: `https://localhost:54235`)

---

## Quick Start

```bash
git clone https://github.com/JustVNRR/sirh-react.git
cd sirh-react
cp .env.example .env.local
npm install
npm run dev
```

The development server starts on `http://localhost:5173` (already allowed in `sirh-asp` `Cors:AllowedOrigins`).

### Environment Variables

| Variable              | Default                     | Description                                              |
| :-------------------- | :-------------------------- | :------------------------------------------------------- |
| `VITE_API_BASE_URL`   | `https://localhost:54235`   | Base URL of the `sirh-asp` backend API                   |
| `VITE_URSSAF_ENABLED` | `true`                      | Enables the embedded URSSAF contributions estimator tool |
| `VITE_EDOCPERSO_URL`  | `https://www.edocperso.fr/` | External payslip portal URL                              |

### Seeded Backend Demo Accounts (`Development`)

| Email                        | Role(s)       | Password       |
| :--------------------------- | :------------ | :------------- |
| `admin.rh@nova-conseil.fr`   | `HR`, `ADMIN` | `SirhDemo123!` |
| `manager.rh@nova-conseil.fr` | `MANAGER`     | `SirhDemo123!` |
| `employe.rh@nova-conseil.fr` | `EMPLOYEE`    | `SirhDemo123!` |

---

## Testing & Code Quality

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and version history.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
