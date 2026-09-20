# Code Conventions & Style Guide

**Project:** PodStudio  
**Scope:** Frontend and Backend conventions, coding standards, error handling, styling, and testing  
**Generated Date:** 2026-09-20 (Refreshed)  

---

## 1. Language & Code Formatting Standards

### TypeScript & Typing
- **Client TypeScript:** Configured via `client/tsconfig.json` with strict typing (`strict: true`, React JSX transform).
- **Backend TypeScript:** Configured in `server/tsconfig.json` targeting Node.js CommonJS/ESM compatibility.
- **Explicit Types:** Custom types and interfaces are declared at the top of files or in dedicated type definitions (e.g. `RoomData`, `Recording`, `LayoutMode`, `Toast` in `client/src/pages/Room.tsx`).
- **Avoid `any`:** Where dynamic WebRTC payloads or error catches occur, narrow types or cast specifically (e.g. `error: any` in controllers should be normalized via typed custom error classes).

### Naming Conventions
- **React Components:** PascalCase filenames and function components (e.g. `VideoPlayer.tsx`, `RecordingCard.tsx`, `GuestJoinModal.tsx`).
- **Custom Hooks:** CamelCase prefixed with `use` (e.g. `useWebRTC.ts`, `useRecording.ts`, `useSocket.ts`).
- **Controllers & Routes:** CamelCase with dot suffix (e.g. `room.controller.ts`, `room.routes.ts`, `auth.service.ts`).
- **Database Fields:** Snake_case in legacy DB fields (`created_at`, `clerk_id`), CamelCase in newer Prisma relations (`videoUrl`, `fileSize`, `roomCode`).
- **Environment Variables:** UPPER_SNAKE_CASE (e.g. `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`).

---

## 2. Component & Hook Design Patterns

### React Functional Components & Hooks
- Hooks handle state and side-effects; UI components remain largely declarative.
- Ref cleanups are strictly enforced in WebRTC and media hooks (e.g. stopping tracks on unmount, closing `RTCPeerConnection` instances, terminating `requestAnimationFrame` and `setInterval`).
- Event listeners on sockets and windows use cleanup return functions in `useEffect`.

### Error Handling & User Feedback
- **Frontend Errors:** Displayed via non-blocking toast notifications or alert badges with auto-dismiss timers.
- **Backend Errors:** Handled in controller `try/catch` blocks returning structured JSON responses:
  ```json
  {
    "success": false,
    "message": "Human readable error description"
  }
  ```
- **HTTP Status Codes:** Standard REST conventions: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

---

## 3. Styling & Design Tokens

- **CSS Architecture:** Hybrid approach combining Tailwind CSS v4 utilities and custom CSS design tokens declared in `client/src/App.css`.
- **Theme & Dark Mode:** Dark studio aesthetic with deep charcoal backgrounds (`#0B0F17`, `#111827`), glassmorphic panels (`backdrop-blur-md`), and vibrant studio red/purple/blue accents.
- **Transitions & Animations:** Driven by `framer-motion` for spring modal animations and smooth grid rearrangements.

---

## 4. Automated Testing Conventions

- **File Naming & Colocation:** Unit and component tests are colocated alongside source files with `.test.ts` / `.test.tsx` extensions (e.g. `src/hooks/useMedia.test.ts`, `src/routes/auth.routes.test.ts`). Multi-entity integration suites live in `src/test/` (e.g. `server/src/test/socket.test.ts`).
- **Mock Isolation:** External dependencies (Prisma ORM, Nodemailer, Cloudinary, Axios, WebRTC hardware) must be mocked using `vi.mock()` to ensure fast, deterministic offline execution.
- **Test Isolation:** Always call `vi.clearAllMocks()` or `cleanup()` in `beforeEach()` / `afterEach()` hooks.
- **Form & DOM Testing:** Test user actions using `@testing-library/user-event` and form submit events on `<form>` elements rather than relying on unbound click triggers.
