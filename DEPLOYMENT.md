# PodStudio - Production Deployment Guide 🚀

This guide provides step-by-step instructions to deploy PodStudio to production.

---

## 🏗️ Architecture Overview

- **Frontend (`/client`)**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, WebRTC, Socket.IO Client.
- **Backend (`/server`)**: Node.js, Express, Socket.IO (WebRTC Signaling), Prisma ORM, PostgreSQL, Cloudinary SDK.
- **Database**: PostgreSQL (Supabase, Neon, Railway, or Render Postgres).
- **Media Storage**: Cloudinary (for lossless audio & 4K master recordings).
- **Authentication**: Native JWT Auth + optional Clerk SSO.

---

## 🔑 Required Cloud Services (All Free Tiers Available)

| Service | Purpose | Recommended Provider | Free Tier |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Persistent data for users & recordings | [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) | ✅ Free |
| **Video & Audio Cloud** | Storing recorded master files | [Cloudinary](https://cloudinary.com) | ✅ 25 GB free |
| **Backend Hosting** | Node.js + Socket.IO Server | [Render](https://render.com) or [Railway](https://railway.app) | ✅ Free / $5 credit |
| **Frontend Hosting** | React SPA static hosting | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | ✅ Free |

---

## 🚀 Strategy 1: Recommended Deployment (Vercel + Render / Railway)

### Step 1: Set Up Free PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) and create a free project.
2. Copy your PostgreSQL connection string (`DATABASE_URL`). Example:
   ```
   postgresql://username:password@ep-cool-db-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

### Step 2: Deploy Backend to Render (or Railway)

#### Option A: Using Render
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Under **Environment Variables**, add:
   ```env
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://username:password@your-db-host/dbname?sslmode=require
   JWT_SECRET=generate_a_secure_32_character_random_string
   GUEST_JWT_SECRET=generate_another_secure_32_character_random_string
   CLIENT_URL=https://your-frontend-domain.vercel.app
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CLERK_PUBLISHABLE_KEY=pk_test_... (optional)
   CLERK_SECRET_KEY=sk_test_... (optional)
   SMTP_HOST=smtp.sendgrid.net (optional, for guest OTP email delivery)
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_smtp_password
   SMTP_FROM=PodStudio <noreply@yourdomain.com>
   ```
6. Click **Deploy Web Service**.
7. Once deployed, run the Prisma migration on Render (via Render Shell or locally pointing `DATABASE_URL`):
   ```bash
   npx prisma migrate deploy
   ```
8. Copy your backend URL (e.g. `https://podstudio-api.onrender.com`).

---

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your GitHub repository.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
4. Under **Environment Variables**, add:
   ```env
   VITE_API_URL=https://podstudio-api.onrender.com/api
   VITE_SOCKET_URL=https://podstudio-api.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (if using Clerk)
   ```
5. Click **Deploy**.
6. Once deployed, copy your frontend domain (e.g., `https://podstudio.vercel.app`) and update the `CLIENT_URL` environment variable on your backend!

---

## 🐳 Strategy 2: 1-Command Docker Deployment (VPS / DigitalOcean / AWS EC2)

If deploying to your own Linux server / VPS:

1. Clone your repo onto the server:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```
2. Create `.env` file with your Cloudinary and database secrets.
3. Start the entire stack with Docker Compose:
   ```bash
   docker-compose up -d --build
   ```
4. Run migrations inside the container:
   ```bash
   docker exec -it podstudio-api npx prisma migrate deploy
   ```

---

## 🔒 Important Production Considerations

### 1. HTTPS Requirement for WebRTC
Browsers strictly enforce that camera and microphone access (`navigator.mediaDevices.getUserMedia`) only works on **`https://`** or `localhost`. When deploying to production:
- Vercel and Render automatically provide free SSL certificates (`https://`).
- If using a custom domain or VPS, ensure SSL is configured via Let's Encrypt / Certbot / Cloudflare.

### 2. CORS & Cookie Security
- `CLIENT_URL` in the backend must exactly match your frontend domain (e.g., `https://podstudio.vercel.app` without trailing slashes).
- Multiple frontend domains can be comma-separated: `https://podstudio.vercel.app,https://studio.yourdomain.com`.

### 3. Health Check
You can test if your backend API is alive anytime by visiting:
```
https://your-api-url.onrender.com/health
```
It returns:
```json
{
  "status": "ok",
  "service": "PodStudio Recording API",
  "uptime": 120.5,
  "timestamp": "2026-08-31T10:00:00.000Z"
}
```
