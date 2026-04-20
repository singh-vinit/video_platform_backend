# Creator-Consumer Video Platform — Backend

A REST + WebSocket backend for a full-stack video platform where creators can upload and manage videos, and users can subscribe to creators, watch videos, and interact via live comments.

---

## Table of Contents

- [Tech Stack](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#tech-stack)
- [Project Structure](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#project-structure)
- [Setup Instructions](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#setup-instructions)
- [Environment Variables](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#environment-variables)
- [Database Schema](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#database-schema)
- [API Reference](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#api-reference)
- [WebSocket Events](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#websocket-events)
- [Tech Decisions](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#tech-decisions)
- [Known Limitations](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#known-limitations)

---

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Runtime          | Node.js 20                                   |
| Framework        | Express.js (TypeScript)                      |
| ORM              | Prisma                                       |
| Database         | NeonDB (PostgreSQL)                          |
| Real-time        | Socket.IO                                    |
| Auth             | JWT + bcryptjs                               |
| File Storage     | Supabase Storage (frontend uploads directly) |
| Containerization | Docker                                       |

---

## Project Structure

```
src/
├── index.ts                  # Entry point — HTTP server + Socket.IO init
├── app.ts                    # Express app — middleware + route registration
├── socket/
│   └── commentSocket.ts      # Socket.IO auth middleware + room + event handlers
├── routes/
│   ├── auth.routes.ts
│   ├── video.routes.ts
│   ├── creator.routes.ts
│   ├── subscription.routes.ts
│   └── comment.routes.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── video.controller.ts
│   ├── creator.controller.ts
│   ├── subscription.controller.ts
│   └── comment.controller.ts
├── middleware/
│   └── auth.middleware.ts    # JWT verification + role guard
├── lib/
│   └── prisma.ts             # Singleton Prisma client
|__ utils/
└── types/
    └── express.d.ts          # Extends Express Request with user payload
prisma/
└── schema.prisma             # Single source of truth for DB structure
```

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- A [NeonDB](https://neon.tech/) account (free tier works)
- npm or yarn

### 1. Clone and install

```bash
git clone <your-repo-url>
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your values — see [Environment Variables](https://claude.ai/chat/dde6fa19-f792-4887-af6d-94a68c2df82c#environment-variables) below.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the development server

```bash
npm run dev
```

Server runs at `http://localhost:5000`
WebSocket at `ws://localhost:5000/socket.io`

### 5. (Optional) Open Prisma Studio

```bash
npm run db:studio
```

Visual database browser at `http://localhost:5555`

---

### Running with Docker

```bash
# Build image
docker build -t video-platform-backend .

# Run container
docker run -p 5000:5000 --env-file .env video-platform-backend
```

---

### Available Scripts

| Script               | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start dev server with hot reload |
| `npm run build`      | Compile TypeScript to `dist/`    |
| `npm start`          | Run compiled production build    |
| `npm run db:migrate` | Run Prisma migrations            |
| `npm run db:studio`  | Open Prisma Studio               |

---

## Environment Variables

Create a `.env` file in the root:

```env
# Database — get this from NeonDB dashboard → Connection Details
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth — any long random string
JWT_SECRET="your_super_secret_jwt_key_change_this"

# Server
PORT=5000

# Frontend URL — used for CORS
CLIENT_URL=http://localhost:3000
```

> **Never commit `.env` to version control.** Add it to `.gitignore`.

---

## Database Schema

```
User
 ├── id          cuid (PK)
 ├── name        string
 ├── email       string (unique)
 ├── password    string (bcrypt hashed)
 ├── role        CREATOR | USER
 └── createdAt   datetime

Video
 ├── id          cuid (PK)
 ├── title       string
 ├── description string (optional)
 ├── url         string (Supabase Storage public URL)
 ├── creatorId   FK → User
 └── createdAt   datetime

Subscription
 ├── id          cuid (PK)
 ├── userId      FK → User
 ├── creatorId   FK → User
 └── createdAt   datetime
 └── @@unique([userId, creatorId])

Comment
 ├── id          cuid (PK)
 ├── content     string
 ├── userId      FK → User
 ├── videoId     FK → Video
 └── createdAt   datetime
```

---

## API Reference

All protected routes require the header:

```
Authorization: Bearer <jwt_token>
```

---

### Auth

| Method | Endpoint           | Auth | Body                              | Description                 |
| ------ | ------------------ | ---- | --------------------------------- | --------------------------- |
| POST   | `/api/auth/signup` | ❌   | `{ name, email, password, role }` | Register as CREATOR or USER |
| POST   | `/api/auth/login`  | ❌   | `{ email, password }`             | Login, returns JWT          |

**Signup role values:** `"CREATOR"` or `"USER"`

**Response (both):**

```json
{
  "token": "eyJhbG...",
  "user": { "id": "...", "name": "...", "role": "CREATOR" }
}
```

---

### Videos

| Method | Endpoint          | Auth | Role    | Description                               |
| ------ | ----------------- | ---- | ------- | ----------------------------------------- |
| POST   | `/api/videos`     | ✅   | CREATOR | Save video metadata after Supabase upload |
| GET    | `/api/videos/my`  | ✅   | CREATOR | Get all videos by logged-in creator       |
| PATCH  | `/api/videos/:id` | ✅   | CREATOR | Update title or description               |
| DELETE | `/api/videos/:id` | ✅   | CREATOR | Delete a video (ownership verified)       |
| GET    | `/api/videos/:id` | ✅   | Any     | Get video details + creator + comments    |

**POST `/api/videos` body:**

```json
{
  "title": "My Video",
  "description": "Optional description",
  "url": "https://your-project.supabase.co/storage/v1/object/public/videos/..."
}
```

**PATCH `/api/videos/:id` body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

> Note: Video file (Supabase URL) is never modified on update — only `title` and `description`.

---

### Creators

| Method | Endpoint            | Auth | Description                        |
| ------ | ------------------- | ---- | ---------------------------------- |
| GET    | `/api/creators`     | ✅   | List all users with role CREATOR   |
| GET    | `/api/creators/:id` | ✅   | Get creator profile + their videos |

---

### Subscriptions

| Method | Endpoint                        | Auth | Role | Description                             |
| ------ | ------------------------------- | ---- | ---- | --------------------------------------- |
| POST   | `/api/subscriptions/:creatorId` | ✅   | USER | Subscribe to a creator                  |
| DELETE | `/api/subscriptions/:creatorId` | ✅   | USER | Unsubscribe from a creator              |
| GET    | `/api/subscriptions/feed/me`    | ✅   | USER | Get mixed feed (subscribed + discovery) |
| GET    | `/api/subscriptions/mine`       | ✅   | USER | Get list of subscribed creators         |

**GET `/api/subscriptions/feed/me` response:**

```json
{
  "subscribedVideos": [...],
  "otherVideos": [...]
}
```

> `subscribedVideos` returns up to 20 most recent videos from subscribed creators.
> `otherVideos` returns up to 10 most recent videos from all other creators.

---

### Comments (HTTP fallback)

| Method | Endpoint                 | Auth | Description                            |
| ------ | ------------------------ | ---- | -------------------------------------- |
| POST   | `/api/comments/:videoId` | ✅   | Post a comment (non-realtime fallback) |
| GET    | `/api/comments/:videoId` | ✅   | Get all comments for a video           |

> In normal usage, comments are submitted and received via Socket.IO. These HTTP routes serve as a fallback and for initial data load.

---

### Health Check

```
GET /health → { "status": "ok" }
```

---

## WebSocket Events

Connect with JWT in auth:

```js
const socket = io("http://localhost:5000", {
  auth: { token: "your_jwt_token" },
});
```

### Client → Server

| Event          | Payload                | Description                            |
| -------------- | ---------------------- | -------------------------------------- |
| `join_video`   | `videoId: string`      | Join the live comment room for a video |
| `leave_video`  | `videoId: string`      | Leave the room when navigating away    |
| `send_comment` | `{ videoId, content }` | Post a comment to a video room         |

### Server → Client

| Event         | Payload                       | Description                                |
| ------------- | ----------------------------- | ------------------------------------------ |
| `new_comment` | Full comment object with user | Broadcast to all clients in the video room |
| `error`       | `{ message: string }`         | Emitted on invalid input or server error   |

**Comment object shape:**

```json
{
  "id": "...",
  "content": "Nice video!",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "user": { "id": "...", "name": "John" },
  "videoId": "..."
}
```

---

## Tech Decisions

### Why Express over NestJS or Fastify?

The project scope is defined as a demo with a constrained timeline. Express is minimal, well-understood, and avoids the overhead of learning framework-specific patterns like NestJS decorators or modules. The architecture manually enforces separation of concerns (routes → controllers → Prisma) which is sufficient at this scale. Fastify would offer better raw performance but Express has a broader ecosystem and lower onboarding friction for reviewers.

### Why Prisma over raw SQL or Drizzle?

Prisma generates TypeScript types directly from the schema. Every query is type-safe at compile time — if you query a field that doesn't exist or pass the wrong type, TypeScript catches it before the code runs. The schema file acts as a single source of truth: change the schema, run a migration, and types update everywhere automatically. Drizzle is a strong alternative with better performance characteristics, but Prisma's DX and readable query syntax made it the right choice for a demo where clarity matters.

### Why NeonDB?

NeonDB is serverless PostgreSQL with a generous free tier, database branching (like Git branches for your DB), and HTTP-based connections that work well in containerized and serverless environments. It is standard PostgreSQL under the hood — no proprietary syntax. This means if the project needs to migrate to RDS or Cloud SQL later, there is no rewrite required.

### Why Socket.IO over native `ws`?

Socket.IO provides automatic transport fallback (WebSocket → polling) so comments work even in environments where WebSocket connections are blocked by firewalls or proxies. It also provides built-in room management which maps cleanly to the per-video comment rooms needed here — no manual `Map<videoId, Set<WebSocket>>` tracking required. The reconnection logic is also built in, so clients automatically recover from network drops without any code on the frontend.

### Why is the Socket.IO server on the same HTTP server as Express?

Running both on one HTTP server means only one port is exposed, which simplifies Docker configuration, deployment, and firewall rules. Socket.IO's polling transport also goes through Express, so CORS configuration in one place covers both REST and WebSocket traffic.

### Why does the frontend upload directly to Supabase instead of through the backend?

Routing large video files through the backend adds unnecessary load on the Node.js process, increases memory usage, and slows uploads because the file has to travel to the server before going to storage. Direct-to-Supabase upload means the file goes straight from the browser to the CDN-backed storage bucket. The backend only receives a lightweight JSON payload with the final public URL, which it saves to the database. This keeps the backend stateless and the Docker container small.

### Why JWT over sessions?

Sessions require server-side state — either in-memory (breaks with multiple server instances) or in a shared store like Redis (extra infrastructure). JWT is stateless: the server signs a token once on login and never stores it. Every subsequent request is verified by checking the signature with the secret key. No database call is needed per request. The tradeoff is that tokens cannot be individually revoked before expiry — acceptable for a demo project.

### Why PATCH over PUT for video updates?

PUT semantics require sending the complete resource representation. PATCH means partial update — send only the fields that changed. Since the video update feature only modifies `title` and `description` (never the file URL), PATCH is semantically correct and avoids requiring the client to send fields it has no reason to change.

---

## Known Limitations

### Authentication

- **No refresh tokens.** Access tokens expire after 7 days. When they expire the user is redirected to login. A production implementation would use short-lived access tokens (15 minutes) paired with long-lived refresh tokens.
- **No token revocation.** If a token is compromised, it remains valid until expiry. Mitigation would require a token blacklist in Redis or switching to opaque tokens with server-side sessions.
- **Role cannot be changed after signup.** A user who signs up as USER cannot become a CREATOR without a direct database change. There is no role upgrade flow.

### Validation

- **No request body validation library.** Input is checked manually with `if (!field)` guards in controllers. A production backend would use Zod schemas validated in middleware before the controller runs, returning structured 400 errors with per-field messages.

### Error Handling

- **No global error handler.** Each async controller wraps its logic in try/catch individually. A missed catch block on any async controller will cause an unhandled promise rejection and crash the server process. A production backend would use a `catchAsync` higher-order function and a global Express error handling middleware.

### Real-time Scaling

- **Socket.IO rooms are in-memory.** If the backend is scaled to more than one instance (horizontal scaling), a comment broadcast on instance A will not reach clients connected to instance B. The fix is the Socket.IO Redis adapter, which uses Redis pub/sub to relay broadcasts across all instances.

### Feed

- **Basic pagination with hard limits.** The feed returns a fixed maximum of 20 subscribed videos and 10 discovery videos. There is no cursor-based or offset pagination. For a large dataset, this needs proper pagination to avoid performance issues.
- **No feed algorithm.** Videos are ordered by `createdAt` descending. There is no ranking, weighting by engagement, or personalization logic.

### Comments

- **No comment editing or deletion.** Once a comment is posted via Socket.IO it is permanent. There is an HTTP GET endpoint to fetch comments but no HTTP DELETE or PATCH for individual comments.
- **No pagination on comments.** All comments for a video are returned in one query. A video with thousands of comments would cause slow queries and large payloads. Cursor-based pagination on the comments query is needed before production.

### Security

- **No rate limiting.** Any client can hammer the auth endpoints or comment submission without restriction. `express-rate-limit` should be applied especially to `POST /api/auth/login` and `POST /api/auth/signup` to prevent brute force and spam.
- **No security headers.** `helmet.js` is not configured. HTTP responses do not include headers like `X-Content-Type-Options`, `X-Frame-Options`, or `Content-Security-Policy`.
- **CORS is open in development.** `CLIENT_URL` should be set to the exact production frontend URL in production. Wildcard CORS (`*`) must never be used in production.

### Video Management

- **Deleting a video does not delete the file from Supabase.** The database record is removed but the file remains in the Supabase Storage bucket. A production implementation would call the Supabase Storage API to delete the file object when the video is deleted from the database.

### Observability

- **No structured logging.** `console.log` is used throughout. A production backend would use a structured logger like Pino or Winston with log levels, request IDs, and log shipping to a service like Datadog or Logtail.
- **Health check does not verify database connectivity.** `GET /health` returns `{ status: "ok" }` unconditionally. A production health check would run a lightweight Prisma query (e.g. `prisma.$queryRaw\`SELECT 1``) to confirm the database connection is alive.
