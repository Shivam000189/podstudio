# PodStudio

**Professional Remote Video & Podcast Recording Studio in the Browser**  
*Lossless multi-peer WebRTC recording, passwordless guest verification, dynamic canvas compositing, and automated cloud publishing.*

---

## 1. Overview & Vision

**PodStudio** is a production-ready, full-stack remote recording studio web platform inspired by Riverside.fm and SquadCast. It enables creators, podcasters, and interviewers to record high-fidelity studio conversations with remote guests across the globe without quality degradation or requiring software installations.

### Core Value Proposition
- **Studio-Quality Audio & Video:** Captured directly in the browser with WebRTC P2P mesh and hardware-accelerated Canvas & Web Audio compositing.
- **Frictionless Guest Experience:** Passwordless 6-digit email OTP verification allows guests to join in seconds without creating permanent accounts or entering passwords.
- **Host Control & Fault Tolerance:** Host disconnect grace period prevents accidental hang-ups during network drops or tab refreshes, while auto-save persists media takes to Cloudinary.
- **Unified Media Library:** Creators can organize, preview, download, rename, and manage all cloud-recorded sessions in a responsive dashboard.

---

## 2. Key Capabilities

1. **Multi-Peer WebRTC Mesh Signaling:**
   - Targeted peer routing with ICE candidate buffering.
   - Dynamic peer map tracking per room participant.
   - STUN and TURN fallback support for corporate NATs/firewalls.

2. **Realtime Multi-Track Compositing:**
   - Dynamic canvas grid layouts (Solo, Split, PiP, 2x2, 3x2).
   - Real-time Web Audio API mixing across local and remote Opus streams.
   - Dual export: local high-bitrate WebM download + direct Cloudinary storage.

3. **Hybrid Authentication & Guest Flow:**
   - Native JWT authentication for creators.
   - Optional Clerk SSO integration.
   - Time-limited, single-room scoped guest tokens issued via SMTP email OTP.

4. **Studio Dashboard & Asset Management:**
   - Searchable, sortable recording library.
   - Real-time video player modal preview.
   - Cloudinary asset deletion & title editing.

---

## 3. Technology Architecture

| Component | Stack |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router 7, TanStack Query, Tailwind CSS, Framer Motion, Lucide |
| **Media & Audio** | WebRTC (`RTCPeerConnection`), Web Audio API (`AudioContext`), Canvas API, `MediaRecorder` |
| **Backend** | Node.js 20+, Express 5, Socket.IO 4, Prisma ORM 7, Nodemailer, Multer |
| **Database** | PostgreSQL 16+ |
| **Cloud Storage** | Cloudinary HD Video & Audio CDN |
| **Authentication** | Native JWT + Bcrypt + Clerk SDK + Room OTP Service |

---

## 4. Current Repository State

- **Status:** Functional Brownfield Application (v1.0 Baseline Implemented).
- **Core Features Implemented:** Landing page, auth, room creation, WebRTC peer mesh, guest OTP join, canvas recording, Cloudinary upload, dashboard.
- **Next Evolutionary Horizons:**
  - Automated test suites (unit, integration, E2E).
  - Separate track recording (local ISO track capture per peer).
  - Production Redis adapter for Socket.IO multi-instance scaling.
  - Direct client-to-Cloudinary signed uploads to bypass backend proxying.
