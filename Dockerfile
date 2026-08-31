# ==============================================================================
# Multi-stage Dockerfile for PodStudio Fullstack Application
# ==============================================================================

# Stage 1: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# Stage 2: Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=""
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
RUN npm run build

# Stage 3: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy server artifacts
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci --only=production && npx prisma generate
COPY --from=server-builder /app/server/dist ./dist

# Create uploads dir
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "dist/server.js"]
