# Technical Concerns & Debt

**Project:** PodStudio  
**Scope:** Architectural bottlenecks, security gaps, resilience risks, and debt  
**Generated Date:** 2026-09-20  

---

## 1. WebRTC Scalability & Mesh Limitations

- **Peer-to-Peer Mesh Scaling ($O(N^2)$ Bandwidth):**
  - Current architecture connects all participants directly via WebRTC mesh (`N * (N - 1)` connections).
  - While optimal for 2 to 4 participants (zero media server cost, low latency), CPU and upstream bandwidth degrade rapidly beyond 4-6 peers.
  - *Recommendation:* If supporting larger rooms (>6 peers), transition to an SFU (Selective Forwarding Unit) like LiveKit, Mediasoup, or Janus.

- **Canvas Compositing CPU Overhead:**
  - In `useRecording.ts`, the canvas draws video frames continuously using `requestAnimationFrame` at 60fps.
  - On low-power laptops or devices without hardware canvas acceleration, this can cause frame drops in the recorded output.
  - *Recommendation:* Add framerate throttling (e.g. 30fps lock) and configurable recording resolutions (720p / 1080p).

---

## 2. Audio & Media Synchronization

- **Audio Track Drift in Browser MediaRecorder:**
  - Recording a composite canvas stream combined with Web Audio tracks can occasionally drift out of sync on extended recording sessions (>45 minutes) depending on browser garbage collection and tab throttling.
  - *Recommendation:* Riverside-style separate track uploads (local audio/video ISO tracks recorded directly on each peer's machine and uploaded separately to be synced server-side).

---

## 3. Resilience & State In-Memory Coupling

- **Socket State Stored in Server Memory:**
  - `server/src/server.ts` maintains `roomUsers`, `roomHosts`, and `roomTerminationTimers` in local JavaScript `Map` instances.
  - If the server restarts or scales horizontally to multiple instances, active room states and grace timers will be desynchronized.
  - *Recommendation:* Back realtime room states and grace timers with Redis / Redis PubSub or database status flags.

- **Missing Automated Test Coverage:**
  - Zero automated unit or integration tests exist in the repository today. Any refactoring carries regression risk that requires manual multi-browser verification.

---

## 4. Security & Error Handling

- **Rate Limiting Granularity:**
  - Ensure rate limiters cover all public routes (`/api/rooms/:id/request-otp`, `/api/rooms/:id/verify-otp`, `/api/auth/login`) to mitigate brute-force and email bombing.
- **Large File Uploads in Memory:**
  - Long recordings can produce 500MB+ WebM files. Currently handled via Multer disk storage, but direct signed client-to-Cloudinary upload could bypass proxying heavy video binaries through the Node.js API server.
