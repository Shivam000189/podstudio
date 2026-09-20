# Technology Stack

**Project:** PodStudio (Riverside alternative)  
**Repository:** `Shivam000189/podstudio`  
**Generated Date:** 2026-09-20 (Refreshed)  

---

## 1. Core Languages & Runtime

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Client Language** | TypeScript | ~6.0.2 | Strict typing for frontend state, hooks, and WebRTC events |
| **Client Runtime** | Modern Browser / ECMAScript Module (ESM) | ES2022+ | In-browser media recording, WebRTC, Canvas compositing |
| **Server Language** | TypeScript / JavaScript | Node 20+, TS ^7.0.2 | Backend API server, WebRTC signaling gateway, ORM runner |
| **Server Runtime** | Node.js | >= 20.x | HTTP/Socket.IO runtime with tsx/nodemon dev runner |

---

## 2. Frontend Framework & Libraries (`/client`)

| Category | Package | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **UI Framework** | `react`, `react-dom` | ^19.2.7 | Core component hierarchy & concurrent mode rendering |
| **Bundler & Dev Server** | `vite` | ^8.1.1 | Rapid HMR, asset bundling, and TypeScript compilation |
| **Vite Plugin** | `@vitejs/plugin-react` | ^6.0.3 | Fast React transform & refresh |
| **Routing** | `react-router-dom` | ^7.11.0 | SPA client-side routing, protected routes, URL parameters |
| **Data Fetching** | `@tanstack/react-query` | ^5.101.4 | Asynchronous server cache, mutation handling, polling |
| **HTTP Client** | `axios` | ^1.18.1 | REST API communication with interceptors and progress tracking |
| **Realtime Client** | `socket.io-client` | ^4.8.3 | Signaling transport for WebRTC and room presence |
| **Styling & CSS** | `tailwindcss`, `@tailwindcss/vite` | ^4.3.3 | Utility CSS framework integrated via Vite plugin |
| **Custom Styling** | Vanilla CSS (`App.css`) | Custom | Custom design system tokens, themes, layout utilities |
| **Animation** | `framer-motion` | ^13.1.1 | Micro-animations, page transitions, modal spring physics |
| **Icons** | `lucide-react` | ^1.37.0 | Vector icons for controls, studio actions, navigation |
| **Auth Client** | `@clerk/clerk-react`, `@clerk/themes` | ^5.61.9, ^2.4.57 | Managed creator identity, OAuth callbacks, avatar badges |
| **Identifier Utility** | `nanoid` | ^6.0.0 | Client-side unique ID generation for toasts and sessions |

---

## 3. Backend Framework & Libraries (`/server`)

| Category | Package | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Web Framework** | `express` | ^5.2.1 | HTTP routing, middleware pipeline, REST API endpoints |
| **HTTP Server** | Node.js `http.createServer` | Built-in | Mounts Express and Socket.IO on unified port |
| **Realtime Engine** | `socket.io` | ^4.8.3 | WebRTC SDP offer/answer/ICE candidate relay and room lifecycle |
| **Database ORM** | `prisma`, `@prisma/client` | ^7.9.0 | Schema modeling, PostgreSQL migrations, type-safe queries |
| **PostgreSQL Driver** | `pg`, `@prisma/adapter-pg` | ^8.22.0, ^7.9.1 | Connection pooling and native PostgreSQL wire protocol |
| **Authentication** | `jsonwebtoken`, `bcrypt` | ^9.0.3, ^6.0.0 | Signed JWT tokens, password hashing, Guest OTP validation |
| **External Auth** | `@clerk/express` | ^2.1.64 | Verification of Clerk session tokens on backend routes |
| **File Uploads** | `multer` | ^2.2.0 | Multipart form-data handling for recording WebM uploads |
| **Cloud Storage** | `cloudinary` | ^2.10.0 | Multi-track video and audio cloud asset hosting & streaming |
| **Email Delivery** | `nodemailer` | ^10.0.10 | SMTP transport for guest 6-digit OTP verification codes |
| **Security & Limits** | `cors`, `express-rate-limit` | ^2.8.6, ^8.7.0 | Origin whitelisting and API rate limiting on OTP/auth routes |
| **Environment** | `dotenv` | ^17.4.2 | Parses `.env` configuration files |
| **Development** | `tsx`, `nodemon` | ^4.23.1, ^3.1.14 | Auto-reloading TypeScript execution in development |

---

## 4. Automated Testing Stack

| Layer | Package | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Client Test Runner** | `vitest` | ^5.0.1 | High-performance ESM test runner for hooks and components |
| **Client DOM Simulator** | `jsdom` | ^29.1.1 | Browser DOM simulation environment for React testing |
| **React Component Testing** | `@testing-library/react` | ^16.3.3 | User-centric React component mounting and queries |
| **User Event Simulation** | `@testing-library/user-event` | ^14.6.7 | Real browser keyboard, click, and input interactions |
| **Jest DOM Matchers** | `@testing-library/jest-dom` | ^7.0.1 | Custom assertions for DOM nodes (`toBeInTheDocument`, etc.) |
| **Server Test Runner** | `vitest` | ^5.0.1 | Fast TypeScript test runner for backend services and routes |
| **Server HTTP Assertion** | `supertest` | ^7.2.2 | High-level HTTP abstractions for testing Express endpoints |
| **Realtime Client Mock/Test**| `socket.io-client` | ^4.8.3 | Programmatic Socket.IO client connections in server tests |

---

## 5. Database & Infrastructure

- **Primary Database:** PostgreSQL 16+ (Supported: Neon, Supabase, Railway, Render Postgres, Docker local).
- **ORM Schema:** Single file `server/prisma/schema.prisma` with models: `User`, `Recording`, `Room`, `RoomOtp`.
- **Containerization:** Multi-stage `Dockerfile` + `docker-compose.yml` orchestrating PostgreSQL and Node.js server.
- **PaaS Deployment:** Render Web Service (`render.yaml`) / Railway for backend; Vercel / Netlify for Vite SPA client.
