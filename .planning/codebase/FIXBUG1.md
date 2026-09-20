I need you to fix a set of security and correctness bugs in my PodStudio repo
(Express + Prisma + Socket.IO backend, React + Vite frontend). Fix each item
below precisely, then run `npm run build` (server) and `npm run lint` (client)
to confirm nothing breaks. Do not change unrelated code or refactor beyond
what's needed to fix each bug.

1. CRITICAL — Auth bypass via unverified JWT/user-ID trust
   Files: server/src/middleware/auth.middleware.ts, server/src/server.ts
   (the socket 'join-room' handler)

   Both currently have a fallback path that trusts a bearer token or a
   manually base64-decoded JWT payload's `sub` field WITHOUT verifying any
   signature, as long as it starts with "user_". Remove this fallback
   entirely. Authentication must only succeed via:
     - Clerk's own verified session (getAuth / clerkMiddleware), or
     - Our own signed JWT verified with jwt.verify() via utils/jwt.ts, or
     - A Clerk session token verified through Clerk's official verifyToken/
       JWKS-based verification (not manual base64 decoding).
   If none of these succeed, return 401. Apply the same fix to the
   socket.io join-room handler in server.ts, which has the identical
   unverified-decode logic.

2. HIGH — CORS fails open when no origins are configured
   File: server/src/server.ts, isOriginAllowed()

   Currently `return envOrigins.length === 0` allows ANY origin when
   CLIENT_URL/FRONTEND_URL/CORS_ORIGINS/CORS_ORIGIN are all unset. Change
   this to fail closed: in production, if envOrigins is empty, disallow all
   cross-origin requests (return false) instead of allowing everything.
   Only allow-all in non-production if that's genuinely desired, and make
   it explicit/opt-in rather than the silent default.

3. HIGH — Stack trace leaked to API clients
   File: server/src/controllers/auth.controller.ts, the `me` handler

   Remove `stack: err.stack` from the JSON error response. Log the stack
   server-side with console.error instead; only return `success` and a
   generic `message` to the client.

4. MEDIUM — User enumeration on login
   File: server/src/services/auth.service.ts, loginUser()

   Currently returns distinct messages/status codes for "no account found"
   (404) vs "wrong password" (400) vs "Google OAuth account" (400). Change
   all three failure cases to throw the same generic error/status
   (e.g. 401, "Invalid email or password.") so an attacker can't tell
   whether an email is registered. Keep the Google-OAuth-specific message
   only if you're OK with that trade-off — otherwise generalize it too.

5. MEDIUM — State-mutating GET endpoint
   File: server/src/routes/room.routes.ts

   `router.get("/rooms/:id", authMiddleware, joinRoom)` mutates the
   database (adds a participant) on a GET request. Change this route to
   POST (e.g. `POST /rooms/:id/join`), and update the client's API calls
   accordingly (search client/src for calls to this endpoint).

6. MEDIUM — WebRTC signaling glare with two peers
   File: client/src/hooks/useWebRTC.ts

   When two peers join at nearly the same time, both sides can
   independently create and send an 'offer' to each other, causing a
   race where in-flight answers/ICE candidates for the discarded
   connection are silently dropped. Implement a polite/impolite peer
   pattern: deterministically decide, per pair, which peer is "polite"
   (e.g. by comparing socket IDs lexicographically) so only the impolite
   peer initiates an offer on join, and the polite peer waits to receive
   one. Ensure ICE candidates queued against a connection that gets
   replaced are re-applied to the new connection rather than lost.

7. MINOR — Fragile Cloudinary publicId parsing
   File: server/src/controllers/recording.controller.ts (deleteRecording)

   The publicId is derived by splitting the video URL and assuming the
   folder is exactly one path segment before the filename. Instead,
   store the Cloudinary `publicId` returned at upload time
   (server/src/services/cloudinary.service.ts already returns it) as a
   field on the Recording model, and use that stored value for deletes
   instead of re-deriving it from the URL. Add a Prisma migration for
   the new column if needed.

8. MINOR — No password strength/length validation on registration
   File: server/src/services/auth.service.ts, registerUser()

   Add a minimum length check (e.g. 8 characters) before hashing, and
   return a 400 with a clear message if it fails.

For each fix, show me a diff-style summary of what changed and why, and
flag anything (like a required env var or Prisma migration) I need to
apply manually before deploying.