# Phase 1: Automated Test Suites & Quality Gates — Context & Decisions

**Phase:** 1  
**Milestone:** 1 — Production Hardening & Scalability  
**Generated Date:** 2026-09-20  
**Status:** Locked Decisions Ready for Planning  

---

## 1. Executive Summary

Phase 1 establishes a comprehensive, automated quality assurance foundation for PodStudio to prevent regressions across authentication, passwordless guest OTP verification, WebRTC signaling, and frontend media controls.

Downstream planner and researcher agents should execute within the boundaries locked in this document.

---

## 2. Locked Decisions

### Decision 1: Test Runner & Framework
- **Decision:** **Vitest across both server and client.**
- **Rationale:** Native TypeScript and ESM support, instant startup, seamless compatibility with Vite in `client`, and shared syntax across the entire full-stack monorepo.
- **Packages:**
  - `server`: `vitest`, `supertest`, `@types/supertest`.
  - `client`: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.

### Decision 2: Database Strategy
- **Decision:** **Mocked Prisma Client (`vitest-mock-extended` / mock factory).**
- **Rationale:** Eliminates external database dependencies during testing. Tests run hermetically in milliseconds on any machine or CI pipeline without requiring a live PostgreSQL instance.
- **Pattern:** Mock Prisma client methods (`prisma.user.findUnique`, `prisma.roomOtp.findFirst`, `prisma.room.create`) using Vitest spies (`vi.fn()`) or `mockDeep<PrismaClient>()`.

### Decision 3: Phase Scope & Coverage
- **Decision:** **Full-Stack Scope (Backend Services + Realtime Signaling + Frontend Hooks & Modals).**
- **Backend Test Targets:**
  - `server/src/services/room.service.ts`: Nanoid room code generation, OTP creation, 5-minute expiration enforcement, maximum 5 attempts lockout.
  - `server/src/services/auth.service.ts`: User password hashing, authentication verification, and user lookup.
  - `server/src/utils/jwt.ts` & `guestToken.ts`: Scoped payload signing and validation.
  - `server/src/middleware/auth.middleware.ts`: Bearer token extraction and authentication rejection handling.
  - `server/src/controllers/auth.controller.ts` & `room.controller.ts`: REST endpoint status codes and error payloads via Supertest.
- **Realtime Signaling Test Targets:**
  - `server/src/server.ts`: In-memory Socket.IO integration test verifying `join-room`, targeted `offer`/`answer`/`ice-candidate` relay, and host disconnect grace period trigger.
- **Frontend Test Targets:**
  - `client/src/components/GuestJoinModal.tsx`: 6-digit OTP input parsing, auto-focus, submission trigger, and error alerts.
  - `client/src/hooks/useMedia.ts`: Mocked `navigator.mediaDevices.getUserMedia` stream acquisition, toggle mute, and track stopping.
  - `client/src/hooks/useSocket.ts`: Socket connection lifecycle, token authentication header transmission.

### Decision 4: Realtime Socket.IO Testing Strategy
- **Decision:** **Integration testing with actual in-memory Socket.IO client/server connections.**
- **Rationale:** Purely mocking socket emits misses handshake bugs and room routing errors. Testing against a temporary in-memory HTTP server ensures real Socket.IO events and room broadcasts behave as intended.

---

## 3. Deferred Ideas (Out of Scope for Phase 1)

The following items were discussed and intentionally deferred to subsequent phases:
- **E2E Browser Automation:** Full headless Chrome/WebRTC streaming automation via Playwright is deferred to post-Phase 2.
- **Live PostgreSQL Docker Integration:** Dedicated test DB containers in CI are deferred; unit mocks provide sufficient coverage for service logic.
- **Cloudinary Network Mocking:** Cloudinary file deletion/upload endpoints will be mocked via Vitest; live uploads will not hit Cloudinary in CI.

---

## 4. Verification & Success Criteria

- [ ] `npm test` script configured and passing in `server`.
- [ ] `npm test` script configured and passing in `client`.
- [ ] Coverage reports show:
  - >80% coverage on backend `room.service` and `auth.service`.
  - Passing integration tests for Socket.IO WebRTC signaling handshake.
  - Passing component test for `GuestJoinModal` OTP verification.
- [ ] TypeScript compilation (`npm run build`) passes cleanly with test files.

---

## 5. Next Command

Run `/gsd-plan-phase 1` to generate wave-based implementation plans adhering to these decisions.
