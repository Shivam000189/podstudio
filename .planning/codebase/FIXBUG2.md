I need three follow-up fixes on top of the security/correctness fixes already
merged (auth bypass, CORS, stack trace leak, user enumeration, GET-mutation,
WebRTC glare, Cloudinary publicId, password length). Fix each precisely, run
`npm run build` (server) and `npm run lint` + `npm test` on both server and
client afterward, and show me a diff-style summary for each.

1. Clean up the leftover `as any` cast in recording.controller.ts
   File: server/src/controllers/recording.controller.ts, deleteRecording()

   The line `let publicId = (recording as any).publicId;` still casts to
   `any` even though `publicId` is now a real column on the Recording model
   (server/prisma/schema.prisma). Run `npx prisma generate` so the Prisma
   Client picks up the new column, remove the `as any` cast, and use
   `recording.publicId` directly with proper typing. Confirm `npm run build`
   has zero TypeScript errors afterward.

2. Add a regression test for the auth-bypass fix
   Files: server/src/test/socket.test.ts,
          server/src/routes/auth.routes.test.ts (or a new auth.middleware.test.ts)

   We previously removed a vulnerability where a bearer token or Socket.IO
   auth token starting with "user_", or any JWT with an unverified `sub`
   claim, was trusted without a signature check. Add explicit "attack"
   tests that replay the old exploit and assert it's rejected:
     - HTTP: call a protected route (e.g. GET /api/auth/me) with
       `Authorization: Bearer user_someoneElsesId` and assert 401.
     - HTTP: call it with a JWT that has a valid structure but a garbage/
       unsigned signature and payload `{ sub: "user_someoneElsesId" }`,
       assert 401.
     - Socket.IO: connect with `auth: { token: "user_someoneElsesId" }`
       and assert the server emits 'auth-error' and disconnects, same for
       a garbage-signature JWT with that sub claim.
   These should fail against the OLD vulnerable code and pass against the
   current code — that's the point of a regression test.

3. Make socket/WebRTC connections resilient to brief disconnects
   (background tab discarding, short network drops, etc.)
   Files: server/src/server.ts, client/src/hooks/useSocket.ts,
          client/src/hooks/useWebRTC.ts

   Right