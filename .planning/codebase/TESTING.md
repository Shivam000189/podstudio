# Testing Strategy & State

**Project:** PodStudio  
**Scope:** Automated testing, coverage, mock patterns, and test gaps  
**Generated Date:** 2026-09-20  

---

## 1. Current Testing Status

- **Automated Test Suites:** Currently **not implemented** in either `client` or `server`.
- **Linting & Type Checking:**
  - Client: `npm run lint` (`eslint .`) and `npm run build` (`tsc -b && vite build`) act as the primary compile-time quality gates.
  - Server: `npm run build` (`prisma generate && tsc`) validates TypeScript compilation and Prisma client types.
- **Manual Verification:** Currently relies on browser-to-browser testing across multiple tabs/windows to verify WebRTC mesh signaling, OTP email verification, and Cloudinary upload.

---

## 2. Recommended Testing Stack & Architecture

To achieve production resilience and enable GSD test automation (`/gsd-add-tests`), the following testing architecture should be adopted:

### Frontend Unit & Component Tests (`client`)
- **Recommended Runner:** `vitest` + `@testing-library/react` + `@testing-library/user-event`.
- **Key Test Targets:**
  - `useMedia`: Mock `navigator.mediaDevices.getUserMedia` to test stream acquisition and error fallbacks.
  - `useSocket`: Mock `socket.io-client` to verify event registration and token handshake.
  - `GuestJoinModal`: Test 6-digit OTP input parsing, paste handling, and submit triggers.
  - `Dashboard`: Test search, filter, and sort logic over recording items.

### Backend Unit & Integration Tests (`server`)
- **Recommended Runner:** `vitest` or `jest` + `supertest`.
- **Database Strategy:** In-memory SQLite / test PostgreSQL container with `dotenv -e .env.test`.
- **Key Test Targets:**
  - `auth.controller.ts`: Test user registration, password hashing verification, and JWT generation.
  - `room.service.ts`: Test room creation nanoid format, OTP hashing, OTP expiration enforcement, and maximum attempt lockout.
  - `recording.controller.ts`: Mock `cloudinary` service and verify multipart file upload and metadata insertion.

### End-to-End (E2E) Multi-Peer Tests
- **Recommended Tool:** `Playwright` with Chromium flags `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream`.
- **Scenario:** Two headless browser contexts join the same room; verify WebRTC connection state transitions to `"connected"`.
