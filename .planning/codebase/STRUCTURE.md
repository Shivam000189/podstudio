# Codebase Structure

**Project:** PodStudio  
**Scope:** Directory layout, core module responsibilities, and file map  
**Generated Date:** 2026-09-20  

---

## 1. Directory Tree Overview

```text
Riverside/
├── .planning/                     # GSD planning directory & documentation
│   ├── codebase/                  # Architectural & technical maps
│   ├── config.json                # GSD workflow configuration
│   ├── PROJECT.md                 # Project baseline & goals
│   ├── REQUIREMENTS.md            # System requirements matrix
│   ├── ROADMAP.md                 # Project phases & roadmap
│   ├── STATE.md                   # Current execution state
│   └── onboarding/                # Onboarding summaries
│
├── client/                        # React 19 SPA Frontend
│   ├── public/                    # Static assets & icons
│   ├── src/
│   │   ├── api/                   # REST API client & Axios instance
│   │   │   ├── axios.ts           # Central Axios client with token interceptor
│   │   │   └── recording.ts       # Recording fetch, delete, upload endpoints
│   │   ├── assets/                # Images, illustrations, logos
│   │   ├── components/            # Reusable UI components
│   │   │   ├── GuestJoinModal.tsx # Guest OTP email verification modal
│   │   │   ├── ProtectedRoute.tsx # Route guard redirecting unauthenticated users
│   │   │   ├── RecordingCard.tsx  # Video card with download/delete/rename UI
│   │   │   └── VideoPlayer.tsx    # Modal video preview player
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useAuth.ts         # Dual Clerk + JWT authentication state
│   │   │   ├── useMedia.ts        # getUserMedia webcam & microphone streams
│   │   │   ├── useRecording.ts    # Canvas compositing & MediaRecorder logic
│   │   │   ├── useSocket.ts       # Socket.IO connection & event management
│   │   │   └── useWebRTC.ts       # Multi-peer WebRTC connection management
│   │   ├── pages/                 # Route page components
│   │   │   ├── Dashboard.tsx      # Recordings library & usage stats
│   │   │   ├── GuestRoom.tsx      # Guest join entry page
│   │   │   ├── Home.tsx           # Host studio launcher dashboard
│   │   │   ├── Login.tsx          # Native email/password + Clerk login
│   │   │   ├── Room.tsx           # Full recording studio stage & dock
│   │   │   ├── Signup.tsx         # User registration page
│   │   │   └── landing.tsx        # Public landing page with room code input
│   │   ├── services/
│   │   │   └── socket.ts          # Socket client factory helper
│   │   ├── App.css                # Primary styles, themes, and CSS variables
│   │   ├── App.tsx                # App root & React Router 7 configuration
│   │   ├── index.css              # Tailwind & font imports
│   │   └── main.tsx               # Client entry point (ClerkProvider wrap)
│   ├── index.html                 # HTML shell
│   ├── package.json               # Client dependencies and npm scripts
│   ├── tsconfig.json              # TypeScript configuration for client
│   └── vite.config.ts             # Vite configuration with React & Tailwind
│
├── server/                        # Node.js + Express Backend
│   ├── prisma/                    # Database schema & migrations
│   │   ├── schema.prisma          # PostgreSQL models (User, Recording, Room, RoomOtp)
│   │   ├── migrations/            # SQL migration history
│   │   └── fix_database.sql       # Database maintenance & patch scripts
│   ├── src/
│   │   ├── config/                # Environment & ORM config
│   │   │   ├── env.ts             # Typed env variable loader & validation
│   │   │   └── prisma.ts          # PrismaClient singleton instance
│   │   ├── controllers/           # HTTP route controllers
│   │   │   ├── auth.controller.ts # Login, register, me, syncClerkUser
│   │   │   ├── recording.controller.ts # Upload, get, rename, delete recordings
│   │   │   └── room.controller.ts # Create, join, end room, request/verify OTP
│   │   ├── middleware/            # Express middlewares
│   │   │   ├── auth.middleware.ts # JWT and Clerk authentication guard
│   │   │   └── rateLimit.middleware.ts # Rate limiting policies
│   │   ├── routes/                # Express route definitions
│   │   │   ├── auth.routes.ts     # Auth endpoints
│   │   │   ├── recording.routes.ts# Recording upload & management endpoints
│   │   │   └── room.routes.ts     # Room lifecycle & OTP endpoints
│   │   ├── services/              # Business logic services
│   │   │   ├── auth.service.ts    # User credential verification
│   │   │   ├── cloudinary.service.ts # Cloudinary upload/delete calls
│   │   │   ├── email.service.ts   # Nodemailer OTP email dispatch
│   │   │   └── room.service.ts    # Room database queries & OTP hashing
│   │   ├── utils/                 # Utility helpers
│   │   │   ├── guestToken.ts      # Scoped guest JWT signing and verification
│   │   │   └── jwt.ts             # Standard user JWT generation and verification
│   │   └── server.ts              # Express initialization, Socket.IO signaling, health check
│   ├── package.json               # Server dependencies and npm scripts
│   └── tsconfig.json              # TypeScript configuration for server
│
├── docs/                          # Documentation assets
│   └── screenshots/               # UI preview screenshots
├── DEPLOYMENT.md                  # Production deployment guide
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Local multi-service Docker configuration
├── render.yaml                    # Render blueprint specification
└── README.md                      # Comprehensive project documentation
```

---

## 2. Key File Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `client/src/App.tsx` | Route definitions, TanStack QueryClientProvider, protected route routing |
| `client/src/pages/Room.tsx` | Main studio workspace: layout switcher, device selection dock, WebRTC stage, recording HUD |
| `client/src/hooks/useWebRTC.ts` | Multi-peer connection pooling, ICE candidate buffering, stream detachment/cleanup |
| `client/src/hooks/useRecording.ts` | Canvas compositing loop (`requestAnimationFrame`), Web Audio mixing, MediaRecorder WebM generation |
| `server/src/server.ts` | Server entry point, HTTP server setup, Socket.IO WebRTC signaling router, host grace timer |
| `server/src/services/room.service.ts` | Room participant tracking, OTP generation, 5-minute expiry validation, attempt throttling |
| `server/src/services/cloudinary.service.ts` | Video buffer uploading to Cloudinary CDN, public ID deletion |
| `server/prisma/schema.prisma` | PostgreSQL schema models with indices on `code`, `userId`, and `expiresAt` |
