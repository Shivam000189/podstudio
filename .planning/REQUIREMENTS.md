# Project Requirements Matrix

**Project:** PodStudio  
**Status:** Baseline Captured (v1.0 Brownfield)  
**Last Updated:** 2026-09-20  

---

## 1. Authentication & Security

| ID | Requirement | Status | Description / Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Native JWT Authentication | ✅ Implemented | Creators can sign up, log in, and receive signed JWT tokens (24h validity) with bcrypt password hashing. |
| **REQ-AUTH-02** | Clerk SSO Integration | ✅ Implemented | Optional Clerk SSO integration for Google/GitHub/SSO with backend Prisma user synchronization. |
| **REQ-AUTH-03** | Passwordless Guest OTP | ✅ Implemented | Guests enter email on room link, receive 6-digit OTP via SMTP, and receive single-room scoped guest JWT tokens. |
| **REQ-AUTH-04** | Protected Routes | ✅ Implemented | Routes `/home`, `/rooms/:id`, `/room/:id`, and `/dashboard` are protected by `<ProtectedRoute>`. |
| **REQ-AUTH-05** | API Rate Limiting | ✅ Implemented | Public auth and OTP endpoints protected against brute-force attacks via `express-rate-limit`. |

---

## 2. Room & Participant Management

| ID | Requirement | Status | Description / Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-ROOM-01** | Room Creation | ✅ Implemented | Hosts can generate unique instant studio rooms with nanoid room codes. |
| **REQ-ROOM-02** | Room State & Participant Tracking | ✅ Implemented | PostgreSQL tracks room creator, active participant IDs, and `endedAt` timestamp. |
| **REQ-ROOM-03** | Host Disconnect Grace Period | ✅ Implemented | 15-second server-side grace timer preserves room session during transient host disconnects. |
| **REQ-ROOM-04** | Explicit Session Termination | ✅ Implemented | Host can click End Session; server marks room ended and notifies all participants via `room-ended` event. |
| **REQ-ROOM-05** | Guest Role Separation | ✅ Implemented | Guests have audio/video presence but cannot stop host recording or trigger destructive room actions. |

---

## 3. Realtime WebRTC & Media Engine

| ID | Requirement | Status | Description / Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-RTC-01** | Targeted Mesh Signaling | ✅ Implemented | Socket.IO relays `offer`, `answer`, and `ice-candidate` targeted by socket ID (`to`/`from`). |
| **REQ-RTC-02** | ICE Candidate Buffering | ✅ Implemented | Early ICE candidates arriving before `setRemoteDescription` are queued and flushed cleanly. |
| **REQ-RTC-03** | STUN/TURN Traversal | ✅ Implemented | Integrated Google/Twilio STUN servers with configurable `VITE_TURN_URL` for symmetric NAT traversal. |
| **REQ-RTC-04** | Media Device Selection | ✅ Implemented | Users can select video camera, microphone, toggle mute/unmute, and switch video resolution presets. |
| **REQ-RTC-05** | Dynamic Studio Grid Layouts | ✅ Implemented | Canvas renders adaptive grids (Solo 1-peer, Split 2-peer, PiP, 2x2 grid, 3x2 grid). |

---

## 4. Audio Mixing & Recording Pipeline

| ID | Requirement | Status | Description / Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-REC-01** | Web Audio Multi-Track Mixing | ✅ Implemented | Web Audio `AudioContext` mixes local microphone and all remote peer streams into unified stream. |
| **REQ-REC-02** | Hardware Canvas Compositing | ✅ Implemented | Host browser draws video frames at 60fps to offscreen HD canvas stream. |
| **REQ-REC-03** | Local Lossless WebM Export | ✅ Implemented | Host can download recorded session take immediately to local filesystem as high-bitrate WebM. |
| **REQ-REC-04** | Automatic Cloudinary Archiving | ✅ Implemented | Media take is uploaded via Multer to Cloudinary video storage and linked to database. |
| **REQ-REC-05** | Auto-Save on Disconnect | ✅ Implemented | Active recording take is finalized and flushed to cloud if session terminates. |

---

## 5. Creator Dashboard & Media Library

| ID | Requirement | Status | Description / Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-DASH-01** | Recording List & Metadata | ✅ Implemented | Displays recorded sessions with duration, file size, creation date, and status badges. |
| **REQ-DASH-02** | Video Playback Modal | ✅ Implemented | Built-in modal player with playback controls, seeking, and full-screen view. |
| **REQ-DASH-03** | Asset Renaming & Deletion | ✅ Implemented | In-place title renaming and Cloudinary + database asset deletion. |
| **REQ-DASH-04** | Search & Sorting | ✅ Implemented | Filter recordings by title; sort by newest, oldest, duration, or alphabetical. |

---

## 6. Backlog & Evolutionary Requirements (Future Horizons)

| ID | Requirement | Status | Description / Criteria |
| :--- | :--- | :--- | :--- |
| **REQ-BACK-01** | Automated Unit & Integration Tests | 📋 Backlog | Add Vitest test suites for critical services (OTP, room, JWT) and React hooks. |
| **REQ-BACK-02** | Separate Multi-Track Local Recording | 📋 Backlog | Capture uncompressed separate audio/video ISO tracks per participant for post-production editing. |
| **REQ-BACK-03** | Direct Signed Client Uploads | 📋 Backlog | Generate Cloudinary signed upload signatures to bypass proxying heavy video binaries through Express. |
| **REQ-BACK-04** | Redis Socket Adapter for Clustering | 📋 Backlog | Integrate `@socket.io/redis-adapter` for multi-instance horizontal scaling on cloud infrastructure. |
| **REQ-BACK-05** | AI Show Notes & Transcription | 📋 Backlog | Generate automated transcription, chapter marks, and summary notes from recorded audio. |
