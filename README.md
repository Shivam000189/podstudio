<div align="center">

# 🎙️ PodStudio

**Professional Remote Video & Podcast Recording Studio in the Browser**

*Lossless multi-peer WebRTC recording, passwordless guest verification, dynamic canvas compositing, and automated cloud publishing.*

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Mesh-333333?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-HD%20Media-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

</div>

---

## 🌟 Overview

**PodStudio** is a full-stack, browser-native recording studio inspired by Riverside.fm. It empowers creators to host high-fidelity remote recording sessions with guests across the globe without quality degradation or complex software setups.

With native **Multi-Peer WebRTC Mesh signaling**, **lossless multi-track canvas compositing**, **passwordless Email OTP guest access**, and **automatic cloud archiving**, PodStudio streamlines the entire lifecycle from live conversation to ready-to-publish media.

---

## 📸 Product Preview & Screenshots

### 1. 🚀 Landing Page & Guest Verification
Modern landing portal introducing PodStudio capabilities alongside a frictionless direct room-join interface.

<div align="center">
  <img src="docs/screenshots/landingpage.png" alt="PodStudio Landing Page & Guest Portal" width="100%" />
</div>

<br/>

### 2. 🔐 Authentication Experience
Secure authentication powered by Clerk and native JWT sessions with isolated security boundaries.

<div align="center">
  <img src="docs/screenshots/login.png" alt="PodStudio Login & Authentication Portal" width="100%" />
</div>

<br/>

### 3. 📊 Studio Dashboard & Recording Library
Creator workspace to create instant studio rooms, manage invite links, and review uploaded sessions with duration and metadata.

<div align="center">
  <img src="docs/screenshots/home.png" alt="PodStudio Creator Dashboard" width="100%" />
</div>

<br/>

### 4. 🎬 Live Studio Recording Room
High-definition live stage with targeted multi-peer video feeds, dynamic grid layouts (Solo, Split, PiP, Group), Web Audio mixing, and Post-Take Cloud Hub.

<div align="center">
  <img src="docs/screenshots/recodingscreen.png" alt="PodStudio Live Studio Recording Stage" width="100%" />
</div>

---

## ✨ Key Features

### 📡 Multi-Peer WebRTC Mesh
- **Targeted Signaling**: Room-wide broadcast cross-talk eliminated via targeted `to`/`from` socket routing.
- **ICE Candidate Queuing**: Early candidate arrivals before `setRemoteDescription` are buffered and automatically flushed, avoiding dropped connections.
- **Dynamic Peer Maps**: Tracks `RTCPeerConnection` instances per participant with isolated state updates.

### 💬 In-Call Live Chat
- **Ephemeral Room Chat**: Hosts and guests chat in real time over the existing Socket.IO connection — no extra auth path, no database persistence.
- **Server-Side Rate Limiting**: Per-socket 300ms throttle with 2000-character message cap prevents spam and payload abuse.
- **Client-Side Send Cooldown**: Input disables for 320ms after each send, matching the server window so messages never silently drop.

### ✉️ Passwordless Guest Join (Email OTP)
- **Zero-Account Access**: Guests enter the room code, receive a time-limited 6-digit cryptographic OTP via email, and join the session directly without registration.
- **Scoped Permissions**: Guests enjoy full video/audio interaction while studio recording controls and cloud uploads remain securely host-gated.

### 🎥 Lossless Multi-Stream Compositing
- **Real-Time Canvas Compositing**: Composites local and all remote video tracks into an adaptive HD canvas grid (1-peer, 2-peer side-by-side, 4-peer 2x2 grid, 6-peer 3x2 grid).
- **Web Audio Multi-Track Mixing**: Automatically mixes Opus audio tracks from all connected peers into a single lossless output.
- **Dual Export**: Download local high-bitrate WebM or upload directly to your Cloudinary media library.

### 🛡️ Host Disconnect Grace & Auto-Save
- **15-Second Grace Timer**: Protects studio sessions from accidental tab reloads, browser crashes, or transient network blips.
- **Auto-Save on Termination**: If a host leaves with an active recording take, the system finalizes and automatically uploads the session to cloud storage.

### 🌐 STUN & TURN Traversal
- Integrated Google & Twilio STUN fallback servers with configurable TURN relay support (`VITE_TURN_URL`) for seamless connections across symmetric corporate NATs and firewalls.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Client ["Client (React + Vite)"]
        UI[Studio Stage & Dock]
        WebRTC[useWebRTC Multi-Peer Hook]
        Rec[useRecording Canvas & Audio Mixer]
        Sock[useSocket Auth & Signaling]
    end

    subgraph Server ["Server (Node.js + Express)"]
        API[Express REST API]
        SIO[Socket.IO Signaling & Room Engine]
        Prisma[Prisma ORM Client]
        Mailer[Nodemailer / SMTP Email Service]
    end

    subgraph Cloud ["External Cloud Services"]
        PG[(PostgreSQL Database)]
        Cloudinary[(Cloudinary Media Storage)]
        STUN[Google / Twilio STUN & TURN]
    end

    UI --> WebRTC
    UI --> Rec
    UI --> Sock
    Sock <-->|Signaling & Room State| SIO
    WebRTC <-->|P2P Audio/Video Streams| WebRTC
    WebRTC -.->|NAT Traversal| STUN
    Rec -->|Upload Recording Blob| API
    API --> Prisma --> PG
    API --> Mailer
    API --> Cloudinary
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Routing & State:** React Router 7, TanStack React Query
- **Styling & Motion:** Vanilla CSS tokens, Framer Motion
- **Media & Realtime:** WebRTC (`RTCPeerConnection`), Web Audio API (`AudioContext`), Canvas API, `socket.io-client`
- **Auth:** Clerk SDK + Guest Session Tokens

### Backend
- **Runtime:** Node.js 20+ & Express
- **Realtime Engine:** Socket.IO with JWT Handshake Auth
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Media Storage:** Cloudinary SDK + Multer
- **Email Service:** Nodemailer (SMTP / Gmail / Resend)
- **Security:** `bcryptjs` for OTP hashing, isolated JWT scopes

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: Local instance or hosted (Supabase, Neon, Railway, Render)
- **Cloudinary Account**: For cloud recording storage

---

### 1. Clone the Repository
```bash
git clone https://github.com/Shivam000189/podstudio.git
cd Riverside
```

---

### 2. Configure Environment Variables

#### Server Configuration (`server/.env`)
Create `server/.env` based on `server/.env.example`:

```env
PORT=4000
NODE_ENV=development

# PostgreSQL Database Connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/podstudio?schema=public"

# JWT Secrets (min 32 chars)
JWT_SECRET="your-secure-random-jwt-secret-min-32-characters"
GUEST_JWT_SECRET="your-guest-jwt-secret-min-32-characters"

# Allowed Frontend Origins (Comma-separated)
CLIENT_URL="http://localhost:5173"

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Optional Clerk Authentication Keys
CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_key"
CLERK_SECRET_KEY="sk_test_your_clerk_secret_key"

# Email SMTP for Guest OTP (Leave empty to log OTPs to console in dev)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="PodStudio <noreply@podstudio.app>"

OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5
```

#### Client Configuration (`client/.env`)
Create `client/.env` based on `client/.env.example`:

```env
# Backend API & Socket URLs
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000

# Clerk Authentication Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key

# Optional WebRTC TURN Server (Metered.ca / Twilio / Xirsys)
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

---

### 3. Install Dependencies & Initialize Database

```bash
# Install Server Dependencies & Generate Prisma Client
cd server
npm install
npx prisma generate
npx prisma db push

# Install Client Dependencies
cd ../client
npm install
```

---

### 4. Run Development Servers

Run backend and frontend in separate terminals:

```bash
# Terminal 1 — Start Backend API & Socket Server (Port 4000)
cd server
npm run dev

# Terminal 2 — Start Frontend Vite App (Port 5173)
cd client
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📦 Production Build & Deployment

### Build for Production
```bash
# Build Client
npm run build --prefix client

# Build Server
npm run build --prefix server
```

### Docker Deployment
Run the full-stack system locally via Docker Compose:

```bash
docker-compose up --build
```

---

## 📂 Project Structure

```text
Riverside/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── api/                # Axios API clients & upload endpoints
│   │   ├── components/         # VideoPlayer, Navigation, Modals
│   │   ├── hooks/              # useWebRTC, useRecording, useSocket, useAuth
│   │   ├── pages/              # Landing, Home Dashboard, Studio Room, Auth
│   │   └── services/           # Socket.IO connection factory
│   └── public/                 # Static assets & illustrations
│
├── server/                     # Backend API & Realtime Server
│   ├── prisma/                 # Prisma database schema & migrations
│   ├── src/
│   │   ├── controllers/        # Room, Recording, OTP, and Auth controllers
│   │   ├── middlewares/        # Auth, Guest, and Error middlewares
│   │   ├── routes/             # REST route declarations
│   │   ├── services/           # Email OTP, Cloudinary, Token services
│   │   └── server.ts           # Express setup, Socket.IO & WebRTC signaling
│
├── docs/
│   └── screenshots/            # UI screenshots & preview assets
├── docker-compose.yml          # Multi-container orchestration
└── DEPLOYMENT.md               # Step-by-step production deployment guide
```

---

## 📜 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <b>Built with ❤️ by Shivam</b>
</div>