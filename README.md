# Podstudio

Podstudio is a full-stack recording workspace for creating polished video content with remote guests. It combines a React recording experience with authentication, rooms, real-time communication, and cloud-backed recording storage, so a creator can move from a conversation to a publishable piece of content without stitching together several disconnected tools.

## Why I built this

Remote conversations are easy to start but surprisingly hard to turn into reliable content: people jump between video calls, file transfers, editing tools, and publishing dashboards, while important recordings end up scattered across devices. I built Podstudio to explore a more focused workflow where the recording room, participant experience, and resulting media live in one place. The goal is not just to collect features, but to make the path from “let’s record” to “this is ready to share” feel calmer and more intentional.

## Product Preview

The repository includes screenshots of the main public flows:

![Podstudio landing page](docs/screenshots/landing.png)

![Podstudio login page](docs/screenshots/login.png)

![Podstudio signup page](docs/screenshots/signup.png)

The recording interface artwork used in the product is also available here:

![Podstudio recording interface](client/public/piciamge.jfif)

## Main capabilities

- Create an account and sign in with JWT authentication.
- Create and join recording rooms with shareable room IDs.
- Support real-time room events with Socket.IO and WebRTC hooks.
- Upload and manage recordings through the API.
- Store uploaded media with Cloudinary and recording metadata with Prisma/PostgreSQL.
- Use a responsive Podstudio landing, login, and signup experience.

## Tech stack

**Client:** React, TypeScript, Vite, React Router, TanStack Query, Socket.IO client

**Server:** Node.js, Express, TypeScript, Socket.IO, Prisma, PostgreSQL, Cloudinary

## Run Podstudio locally

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database
- A Cloudinary account for recording uploads

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Riverside
```

### 2. Install dependencies

Install the client and server dependencies in separate terminals, or run the commands one after another:

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Configure the server

Create `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"
PORT=4000

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

`DATABASE_URL`, `JWT_SECRET`, and the Cloudinary values are required for the complete backend workflow. `CLIENT_URL` is used for local CORS configuration.

### 4. Prepare the database

From the `server` directory, apply the Prisma migrations:

```bash
npx prisma migrate deploy
```

### 5. Start the application

Start the API in one terminal:

```bash
cd server
npm run dev
```

Start the Vite client in another:

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The API runs at [http://localhost:4000](http://localhost:4000).

## Client configuration

The client uses `/api` by default. If the API is running on a different origin, create `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Useful commands

Run these from `client`:

```bash
npm run dev
npm run build
npm run lint
```

Run this from `server`:

```bash
npm run dev
```

## Project structure

```text
client/   React application, pages, hooks, API client, and UI
server/   Express API, authentication, rooms, uploads, and Prisma
```

## Notes

- Do not commit `.env` files or Cloudinary credentials.
- The server defaults to a development JWT secret only when `NODE_ENV` is not production. Always provide `JWT_SECRET` in production.