# Phase 1: Automated Test Suites & Quality Gates — Context & Decisions

See canonical file: [.planning/phases/01-automated-test-suites/01-CONTEXT.md](file:///d:/shivam/projects/Riverside/.planning/phases/01-automated-test-suites/01-CONTEXT.md)

---

## Quick Reference Summary

- **Test Runner:** Vitest across both `server` and `client`.
- **Database Strategy:** Mocked Prisma client (`mockDeep<PrismaClient>` / factory).
- **Scope:** Full-stack (Backend services, OTP logic, JWT, in-memory Socket.IO integration tests, frontend media hooks and GuestJoinModal).
- **Socket Testing:** In-memory Socket.IO client/server integration test for room joins, grace timers, and signaling.
