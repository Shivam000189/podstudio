# Testing Strategy & State

**Project:** PodStudio  
**Scope:** Automated testing, coverage, mock patterns, and quality gates  
**Generated Date:** 2026-09-20 (Refreshed)  

---

## 1. Current Testing Status

- **Frontend (`client`):**
  - **Runner:** `vitest` (v5.0.1) + `@testing-library/react` + `@testing-library/user-event` + `jsdom`.
  - **Command:** `npm test` (`vitest run`), `npm run test:watch` (`vitest`).
  - **Status:** **Active & Passing** (3 test suites, 13 tests).
  - **Suites:**
    - `src/hooks/useMedia.test.ts`: Tests `getUserMedia`, device enumeration, track stop, audio/video toggle fallbacks.
    - `src/hooks/useSocket.test.ts`: Tests Socket.IO connection lifecycle, room presence, auth error capture, clean teardown.
    - `src/components/GuestJoinModal.test.tsx`: Tests 6-digit OTP input parsing, paste handling, email format validation, submit triggers.
  - **Setup:** `src/test/setup.ts` initializes custom mocks for `navigator.mediaDevices.getUserMedia` and `enumerateDevices`.

- **Backend (`server`):**
  - **Runner:** `vitest` (v5.0.1) + `supertest` (v7.2.2) + `node` environment.
  - **Command:** `npm test` (`vitest run`), `npm run test:watch` (`vitest`).
  - **Status:** **Active & Passing** (8 test suites, 54 tests).
  - **Suites:**
    - `src/utils/jwt.test.ts`: Token signing, payload validation, invalid signature rejection.
    - `src/utils/guestToken.test.ts`: Guest token signing with roomId payload and verification.
    - `src/services/auth.service.test.ts`: User password hashing, credential checks, duplicate email detection.
    - `src/services/room.service.test.ts`: Room nanoid generation, OTP generation, 5-minute expiry enforcement, max attempt lockout (3 attempts).
    - `src/routes/auth.routes.test.ts`: Supertest API tests for `/api/auth/register`, `/api/auth/login`, invalid payloads.
    - `src/routes/room.routes.test.ts`: Supertest API tests for room creation, OTP request, OTP verify, room details.
    - `src/routes/recording.routes.test.ts`: Supertest API tests for recording rename, delete, listing, authorization boundaries.
    - `src/test/socket.test.ts`: Real Socket.IO client-server signaling tests (auth errors, host join, guest join, room-ended broadcasting).
  - **Setup:** `src/test/setup.ts` loads test environment and mocks external email (`nodemailer`) & cloud (`cloudinary`) services.

- **Linting & Type Checking Quality Gates:**
  - Client: `npm run lint` (`eslint .`) and `npm run build` (`tsc -b && vite build`).
  - Server: `npm run build` (`prisma generate && tsc`).

---

## 2. Mocking & Isolation Patterns

### Frontend Mocks
- **MediaDevices Mock:** Configured globally in `client/src/test/setup.ts` using `createMockMediaStream()`, stubbing audio/video tracks with active/stop state.
- **Axios Mock:** In component tests (e.g. `GuestJoinModal.test.tsx`), `API.post` is mocked using `vi.mock('../api/axios')` to simulate OTP requests and verification flows.
- **Socket Mock:** In hook tests (`useSocket.test.ts`), `socket.io-client` factory is mocked to provide deterministic event emission and listening.

### Backend Mocks
- **Prisma ORM Mocking:** Services mock `prisma` methods (`findUnique`, `create`, `update`, `delete`) via `vi.mock('../config/prisma')` to avoid needing a live PostgreSQL database for unit and route tests.
- **Nodemailer Mock:** `nodemailer.createTransport` is mocked to prevent sending actual emails during OTP generation tests.
- **Cloudinary Mock:** `cloudinary.v2.uploader` is mocked to test multipart upload handlers without hitting Cloudinary storage.

---

## 3. Recommended Future Test Additions (E2E & Integration)

1. **Canvas Compositing Pipeline Tests:**
   - Test `useRecording` compositing canvas dimension calculations (1920x1080) and grid layout tile placement.
2. **End-to-End (E2E) Multi-Peer Browser Tests:**
   - **Recommended Tool:** `Playwright` with Chromium flags `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream`.
   - **Scenario:** Two headless browser contexts join the same room; verify WebRTC connection state transitions to `"connected"`.
