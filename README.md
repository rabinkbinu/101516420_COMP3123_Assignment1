# COMP3123 Assignment 1 – Secure Employee Management REST API

A secure RESTful backend built with **Node.js, Express and MongoDB**. Users sign up, log in to receive a **JWT**, and manage **their own** employees. A user can never see, change or delete employees created by another user.

| | |
|---|---|
| **Course** | COMP3123 – Full Stack Development I |
| **Student** | Rabin Kunnananickal Binu – 101516420 |
| **GitHub** | `https://github.com/<github-username>/101516420_COMP3123_Assignment1` |
   | **Deployed API (Vercel)** | `https://101516420-comp3123-assignment1.vercel.app` |
| **Database** | MongoDB – `comp3123_assignment1` |

---

## 1. Features

- User signup and login (login with **username + password** or **email + password**)
- Passwords hashed with **bcrypt**, never stored or returned in plain text
- **JWT** authentication (`Authorization: Bearer <jwt>`) on every employee endpoint
- Employee CRUD with a **user → employee** relationship (`employee.user` references `users._id`)
- **Per-user data ownership** enforced inside every database query
- Input validation with **express-validator** (types, lengths, email, salary, dates, ObjectIds, unexpected fields)
- **Helmet** security headers
- **Rate limiting** on login, signup and all API traffic (429 Too Many Requests)
- Centralised JSON error handling with correct HTTP status codes
- Local **logging** with Winston (`logs/app.log`, `logs/error.log`), no secrets in logs
- **Health-check** endpoint (`GET /health`) with database status
- Ready for **Vercel** deployment

## 2. Technologies

| Purpose | Package |
|---|---|
| Runtime / framework | Node.js 20+, Express 5 |
| Database / ODM | MongoDB (local or Atlas), Mongoose 9 |
| Authentication | jsonwebtoken (HS256 JWT) |
| Password hashing | bcryptjs |
| Validation | express-validator |
| Security headers | helmet |
| Rate limiting | express-rate-limit |
| Logging | winston |
| Configuration | dotenv |
| Dev tools | Node.js built-in watch mode (node --watch), Postman |

## 3. Project Structure

```
.
├── server.js                    # Entry point: connects to MongoDB and starts the server (exports app for Vercel)
├── src/
│   ├── app.js                   # Express app: middleware order, routers, 404 + error handler
│   ├── config/
│   │   ├── env.js               # Reads & validates environment variables
│   │   └── db.js                # Mongoose connection (cached), DB status helper
│   ├── models/
│   │   ├── User.js              # User schema, bcrypt pre-save hook
│   │   └── Employee.js          # Employee schema with `user` (owner) reference
│   ├── routes/                  # Express Routers (URL -> middleware -> controller)
│   │   ├── user.routes.js
│   │   ├── employee.routes.js
│   │   └── health.routes.js
│   ├── controllers/             # HTTP layer: read request, call service, send response
│   │   ├── user.controller.js
│   │   ├── employee.controller.js
│   │   └── health.controller.js
│   ├── services/                # Business logic + database queries
│   │   ├── auth.service.js      # signup / login
│   │   ├── employee.service.js  # owner-scoped employee queries
│   │   └── token.service.js     # JWT sign / verify
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validate.js          # Turns validation results into 400 responses
│   │   ├── rateLimiters.js      # login / signup / api limiters
│   │   ├── requestLogger.js     # One log line per request + X-Request-Id
│   │   ├── ensureDb.js          # Connects to MongoDB before API routes (serverless-safe)
│   │   └── errorHandler.js      # 404 handler + centralised error handler
│   ├── validators/              # express-validator rule chains
│   │   ├── common.js
│   │   ├── user.validators.js
│   │   └── employee.validators.js
│   └── utils/
│       ├── ApiError.js          # Error class carrying an HTTP status
│       └── logger.js            # Winston logger (console + files)
├── scripts/
│   └── generate-expired-token.js  # Creates an expired JWT for testing
├── postman/
│   └── 101516420_COMP3123_Assignment1.postman_collection.json
├── logs/
│   └── sample-app.log           # Sample log from a full Postman run (real logs are git-ignored)
├── .env.example
├── .gitignore
└── package.json
```

**Request flow:** `route → rate limiter → validation rules → validate → authenticate (employee routes) → controller → service → Mongoose model → MongoDB`. Any error thrown at any step goes to the central `errorHandler`.

## 4. Installation & Running Locally

### Prerequisites
- Node.js 20 or newer (`node -v`)
- MongoDB – either installed locally (MongoDB Community Server) **or** a free MongoDB Atlas cluster
- Postman

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<github-username>/101516420_COMP3123_Assignment1.git
cd 101516420_COMP3123_Assignment1

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env          # Windows: copy .env.example .env
# then edit .env – at minimum set MONGODB_URI and JWT_SECRET
# generate a strong JWT secret with:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Start MongoDB
#    Local:  start the MongoDB service (Windows: it runs as a service; macOS: brew services start mongodb-community)
#    Atlas:  nothing to start – just put the Atlas connection string in MONGODB_URI

# 5. Start the application
npm run dev        # (auto-restarts when files change)
# or
npm start          # plain node

# 6. Test
#    Open http://localhost:3000/health  -> should return {"status":"ok", ...}
#    Import postman/101516420_COMP3123_Assignment1.postman_collection.json into Postman and run it
```

On startup the console (and `logs/app.log`) shows:

```
2026-10-18T06:14:47.633Z [INFO] MongoDB connected (database: comp3123_assignment1)
2026-10-18T06:14:47.640Z [INFO] Server started on http://localhost:3000 (env: development)
```

## 5. Configuration (environment variables)

Real values live in `.env` (git-ignored). `.env.example` is the safe template.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | yes | – | MongoDB connection string. The app always uses the database **`comp3123_assignment1`**. |
| `JWT_SECRET` | yes | – | Secret used to sign JWTs. Use a long random string. |
| `JWT_EXPIRES_IN` | no | `1h` | Token lifetime (e.g. `15m`, `1h`, `1d`). |
| `PORT` | no | `3000` | HTTP port (local only). |
| `NODE_ENV` | no | `development` | Environment name. |
| `BCRYPT_SALT_ROUNDS` | no | `10` | bcrypt cost factor. |
| `RATE_LIMIT_WINDOW_MINUTES` | no | `15` | Rate-limit window length. |
| `LOGIN_RATE_LIMIT_MAX` | no | `5` | Failed login attempts allowed per IP per window. |
| `SIGNUP_RATE_LIMIT_MAX` | no | `10` | Signup requests allowed per IP per window. |
| `API_RATE_LIMIT_MAX` | no | `100` | Requests to `/api/*` allowed per IP per window. |
| `LOG_LEVEL` | no | `info` | Winston log level. |
| `LOG_DIR` | no | `logs` | Folder for log files. |

The app refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing.

## 6. API Reference

Base URL: `http://localhost:3000` (local) or your Vercel URL.

| # | Method | Endpoint | Auth | Success | Purpose |
|---|---|---|---|---|---|
| 1 | POST | `/api/v1/user/signup` | – | **201** | Register a new user |
| 2 | POST | `/api/v1/user/login` | – | **200** | Log in, receive a JWT |
| 3 | GET | `/api/v1/emp/employees` | JWT | **200** | List the logged-in user's employees |
| 4 | POST | `/api/v1/emp/employees` | JWT | **201** | Create an employee owned by the logged-in user |
| 5 | GET | `/api/v1/emp/employees/{eid}` | JWT | **200** | Get one of the user's employees |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | JWT | **200** | Update one of the user's employees |
| 7 | DELETE | `/api/v1/emp/employees?eid={eid}` | JWT | **204** | Delete one of the user's employees |
| – | GET | `/health` | – | **200** | Health check |

### Response format

Success responses contain `"status": true`. Every error has the same shape:

```json
{
  "status": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "location": "body", "message": "Email must be a valid email address." }],
  "request_id": "a8b34b10-820c-4d16-bb89-8c20f0d4efeb"
}
```

`errors` appears only when there are field-level details. `request_id` matches the `X-Request-Id` response header and the log line for that request.

### 1. Signup – `POST /api/v1/user/signup`

```json
{ "username": "alice_test", "email": "alice@example.com", "password": "Password@123" }
```

Rules: username 3–30 chars (letters, numbers, `.`, `_`, `-`; stored lower-case, unique); valid unique email; password 8–64 chars with an uppercase letter, a lowercase letter, a number and a special character. No other fields allowed.

**201 Created**
```json
{
  "status": true,
  "message": "User created successfully.",
  "user_id": "6ad463dd0b0a7247dad85d70",
  "user": {
    "_id": "6ad463dd0b0a7247dad85d70",
    "username": "alice_test",
    "email": "alice@example.com",
    "created_at": "2026-10-18T06:14:53.912Z",
    "updated_at": "2026-10-18T06:14:53.912Z"
  }
}
```
Errors: `400` validation failed · `409` username and/or email already exists · `429` too many signups.

### 2. Login – `POST /api/v1/user/login`

```json
{ "username": "alice_test", "password": "Password@123" }
```
or
```json
{ "email": "alice@example.com", "password": "Password@123" }
```

**200 OK**
```json
{
  "status": true,
  "message": "Login successful.",
  "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "1h",
  "user": { "_id": "6ad463dd0b0a7247dad85d70", "username": "alice_test", "email": "alice@example.com", "created_at": "...", "updated_at": "..." }
}
```
Errors: `400` missing username/email or password · `401` invalid credentials (same message whether the user exists or not) · `429` too many failed attempts.

### 3. List employees – `GET /api/v1/emp/employees`

Header: `Authorization: Bearer <jwt>`

**200 OK**
```json
{
  "status": true,
  "count": 1,
  "employees": [
    {
      "_id": "6ad463de0b0a7247dad85d72",
      "first_name": "Liam",
      "last_name": "Chen",
      "email": "liam.chen@example.com",
      "position": "Software Developer",
      "salary": 75000,
      "date_of_joining": "2024-05-01T00:00:00.000Z",
      "department": "Engineering",
      "user": "6ad463dd0b0a7247dad85d70",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### 4. Create employee – `POST /api/v1/emp/employees`

```json
{
  "first_name": "Liam",
  "last_name": "Chen",
  "email": "liam.chen@example.com",
  "position": "Software Developer",
  "salary": 75000,
  "date_of_joining": "2024-05-01",
  "department": "Engineering"
}
```

All seven fields are required. `salary` must be a positive number ≤ 10,000,000; `date_of_joining` must be a real `YYYY-MM-DD` date between 1950-01-01 and one year from today; names allow letters, spaces, `'`, `.`, `-`. Sending `user`, `_id` or any other field is rejected (400) – the owner is always taken from the JWT.

**201 Created** → `{ "status": true, "message": "Employee created successfully.", "employee_id": "...", "employee": { ... } }`

Errors: `400` validation · `401` missing/invalid/expired JWT · `409` you already have an employee with this email.

### 5. Get employee – `GET /api/v1/emp/employees/{eid}`

**200 OK** → `{ "status": true, "employee": { ... } }`

Errors: `400` invalid ObjectId · `401` JWT problem · `403` employee belongs to another user · `404` employee does not exist.

### 6. Update employee – `PUT /api/v1/emp/employees/{eid}`

Send one or more of the employee fields (same rules as create):

```json
{ "position": "Senior Software Developer", "salary": 85000 }
```

**200 OK** → `{ "status": true, "message": "Employee details updated successfully.", "employee": { ...updated } }`

Errors: `400` validation / empty body / unexpected field (e.g. `user`) · `401` · `403` · `404` · `409` duplicate email.

### 7. Delete employee – `DELETE /api/v1/emp/employees?eid={eid}`

**204 No Content** (empty body).

Errors: `400` missing or invalid `eid` · `401` · `403` · `404`.

### HTTP status codes used

| Code | When | Why this code |
|---|---|---|
| 200 OK | Login, list, get, update, health | Request succeeded and a body is returned |
| 201 Created | Signup, create employee | A new resource was created |
| 204 No Content | Delete employee | Succeeded, nothing to return |
| 400 Bad Request | Validation errors, malformed JSON, invalid ObjectId, unexpected fields | The client sent something invalid |
| 401 Unauthorized | Missing / malformed / invalid / expired JWT, wrong credentials | The client is not authenticated |
| 403 Forbidden | Accessing another user's employee | Authenticated, but not allowed to touch this resource |
| 404 Not Found | Employee does not exist, unsupported route | The resource or route does not exist |
| 409 Conflict | Duplicate username/email, duplicate employee email for the same user | Conflicts with existing data |
| 413 Payload Too Large | Body over 10 KB | Protects the server from huge payloads |
| 429 Too Many Requests | Rate limit exceeded | Client must slow down (see `Retry-After`) |
| 500 Internal Server Error | Unexpected bug | Generic message; details only in `logs/error.log` |
| 503 Service Unavailable | MongoDB unreachable | Server is up but a dependency is down |

## 7. Authentication

1. **Signup** – the user registers; the password is hashed with bcrypt before saving.
2. **Login** – the user sends username/email + password. The server loads the user (including the password hash, which is otherwise never selected), compares with `bcrypt.compare`, and on success signs a JWT.
3. **JWT** – signed with `HS256` and `JWT_SECRET`. Payload: `sub` (user id), `username`, `iat`, `exp` (default 1 hour), `iss` (`comp3123-assignment1-api`). It is stateless: the server does not store sessions.
4. **Authorization header** – the client sends the token on every employee request:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. **Protected endpoints** – `router.use(authenticate)` protects every `/api/v1/emp/*` route. The middleware:
   - rejects a **missing** header → 401
   - rejects a header that is not `Bearer <token>` → 401
   - verifies signature, issuer and expiry, with the algorithm pinned to HS256 → 401 for **invalid** or **expired** tokens
   - checks the user in `sub` still exists → 401 otherwise
   - sets `req.user = { id, username }` for the controllers.

To test an expired token: `npm run token:expired -- <userId>` prints a token that expired an hour ago (signed with your `JWT_SECRET`).

## 8. Authorization – how employee ownership is enforced

- **Relationship:** every employee document has a `user` field (`ObjectId`, `ref: 'User'`, required, indexed, immutable). A schema validator also checks that the referenced user exists.
- **Owner comes from the token only:** on create, the service sets `user: req.user.id`. The validators reject a `user` field in the body, so a client can never choose or change the owner.
- **Ownership is inside every query** (`src/services/employee.service.js`):

  | Operation | Query |
  |---|---|
  | List | `Employee.find({ user: req.user.id })` |
  | Get | `Employee.findOne({ _id: eid, user: req.user.id })` |
  | Update | `Employee.findOneAndUpdate({ _id: eid, user: req.user.id }, ...)` |
  | Delete | `Employee.findOneAndDelete({ _id: eid, user: req.user.id })` |

  Because the filter always contains the owner, changing `eid` in the URL or query string can never match another user's document.
- **403 vs 404:** if the owner-scoped query finds nothing, the service checks whether the id exists at all. If it exists, it belongs to someone else → **403 Forbidden** (and a warning is logged); otherwise → **404 Not Found**. *(Design note: some APIs return 404 in both cases to avoid revealing that an id exists; 403 was chosen here because the assignment asks to demonstrate it.)*
- **Two-user test:** folder `06 - Two-User Ownership Tests` in the Postman collection proves that User A cannot GET/PUT/DELETE User B's employees and vice versa, that each list only contains the caller's employees, and that User B's employee is unchanged after User A's attempts.

## 9. Security

| Measure | Implementation |
|---|---|
| **Password hashing** | bcrypt (`bcryptjs`) with a per-password salt and cost factor 10, applied in a Mongoose `pre('save')` hook. The `password` field has `select: false` and is also removed in `toJSON`, so it is never returned. Login uses a dummy hash comparison when the user does not exist, so response time does not reveal valid usernames. |
| **JWT** | HS256, secret from `JWT_SECRET`, 1 h expiry, issuer check, algorithm pinned on verify. |
| **Helmet** | `app.use(helmet())` sets security headers such as `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy`, and removes `X-Powered-By`. These help prevent clickjacking, MIME-type sniffing, some XSS/injection attacks, protocol downgrade, and hide the server technology. |
| **Rate limiting** | See below. |
| **Input validation** | express-validator on every body, URL param and query value: required fields, types, lengths, email format, positive salary, strict ISO dates, valid ObjectIds, and an allow-list of fields (unexpected fields → 400). Only validated fields (`matchedData`) reach the database (no mass assignment). |
| **NoSQL injection** | Validators reject non-string values such as `{"$ne": null}`, and Mongoose `sanitizeFilter` neutralises `$` operators in query filters. |
| **Body size limit** | `express.json({ limit: '10kb' })` → 413 for oversized bodies. |
| **Environment variables** | Secrets (`MONGODB_URI`, `JWT_SECRET`) only in `.env` (git-ignored) or the Vercel dashboard. `.env.example` contains placeholders only. |
| **Error responses** | No stack traces, database errors or secrets are sent to clients. |

### Rate limiting

**What it is:** rate limiting caps how many requests a client (identified by IP address) can make in a time window. It slows down brute-force password guessing, credential stuffing, account-spam and denial-of-service attempts.

**Which endpoints are protected:**

| Limiter | Applies to | Limit (default) |
|---|---|---|
| `loginLimiter` | `POST /api/v1/user/login` | 5 **failed** attempts per 15 min per IP (successful logins are not counted) |
| `signupLimiter` | `POST /api/v1/user/signup` | 10 requests per 15 min per IP |
| `apiLimiter` | every `/api/*` request | 100 requests per 15 min per IP |

**What happens when the limit is exceeded:** the API answers **429 Too Many Requests** without running the route, with a `Retry-After` header (seconds), standard `RateLimit` / `RateLimit-Policy` headers, a warning in the log, and this body:

```json
{
  "status": false,
  "message": "Too many failed login attempts. Please try again in 15 minutes.",
  "retry_after_seconds": 900,
  "request_id": "82df5ef0-d72e-43ee-818a-de35cebf8ac0"
}
```

**Test result:** sending wrong passwords repeatedly returned `401` five times (`RateLimit: limit=5, remaining=4 … 0`) and then `429` with `Retry-After: 900`; while blocked, even a correct password received `429`. The Postman request *Login Brute Force → 429* reproduces this automatically. Counters are in memory: they reset when the window ends or when the local server restarts.

## 10. Error Handling

`src/middleware/errorHandler.js` is the single place that turns errors into responses:

| Situation | Status |
|---|---|
| `ApiError` thrown by code (validation, auth, ownership, not found, conflict) | its own status |
| Malformed JSON body | 400 |
| Mongoose `CastError` / `ValidationError` | 400 |
| Body over 10 KB | 413 |
| Duplicate key (MongoDB error 11000, e.g. two simultaneous signups) | 409 |
| MongoDB unreachable | 503 |
| Unsupported route | 404 (`notFound` middleware) |
| Anything else | 500 with a generic message; full stack written to `logs/error.log` |

Express 5 forwards errors thrown inside `async` handlers to this middleware automatically.

## 11. Logging

- **Where:** `logs/app.log` (info and above) and `logs/error.log` (errors only), plus the console. Files rotate at 5 MB (5 files kept). On Vercel the filesystem is read-only, so logs go to the console and appear in the Vercel project's **Logs** tab.
- **What is logged:**
  - server startup / shutdown and MongoDB connection
  - every request: timestamp, method, path, status, duration, IP, request id, user id (if authenticated)
  - authentication events: signups, duplicate signups, successful and failed logins, missing/invalid/expired tokens
  - validation failures (field **names** only)
  - authorization failures (user id, employee id, action)
  - successful create/update/delete operations
  - rate-limit hits
  - errors with stack traces (file only)
- **Intentionally excluded:** passwords, request bodies, the `Authorization` header and full JWTs, `JWT_SECRET`, the MongoDB connection string. As a safety net, the logger masks any metadata key that looks like `password`, `token`, `secret`, `authorization`, `cookie` or `mongodb_uri`.
- **Sample:** `logs/sample-app.log` is a real log from a full Postman run. Example lines:

```
2026-10-18T06:14:53.715Z [INFO] User registered {"category":"auth","requestId":"eb430503-...","userId":"6ad463dd0b0a7247dad85d70","username":"alice_test"}
2026-10-18T06:14:54.305Z [WARN] Login failed: invalid credentials {"category":"auth","requestId":"613e0a16-...","identifier":"alice_test","ip":"127.0.0.1"}
2026-10-18T06:14:54.618Z [WARN] Authorization failed: employee belongs to another user {"category":"authorization","action":"read","userId":"6ad463dd0b0a7247dad85d70","employeeId":"6ad463de0b0a7247dad85d74"}
2026-10-18T06:14:55.403Z [WARN] Rate limit exceeded: login {"category":"rate-limit","requestId":"5adaf3b1-...","ip":"127.0.0.1","method":"POST","path":"/api/v1/user/login","limit":5}
```

## 12. Health Check

`GET /health` (no authentication, not rate-limited)

**200 OK** – API running and MongoDB reachable:
```json
{
  "status": "ok",
  "message": "API is running and connected to MongoDB.",
  "service": "COMP3123 Assignment 1 - Employee Management API",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-10-18T06:11:12.783Z",
  "uptime_seconds": 2,
  "database": { "status": "connected", "name": "comp3123_assignment1", "latency_ms": 2 }
}
```

**503 Service Unavailable** – API running but MongoDB unreachable: same shape with `"status": "degraded"` and `"database": { "status": "disconnected", ... }`.

The endpoint pings MongoDB on each call, so a 200 proves both the server and the database are working.

## 13. Testing with Postman

1. Import `postman/101516420_COMP3123_Assignment1.postman_collection.json`.
2. Start with an empty `comp3123_assignment1` database (otherwise the two signups return 409).
3. Run the folders in order (or **Run collection**). Tokens (`tokenA`, `tokenB`), user ids and employee ids are saved automatically in collection variables; every request has test assertions.
4. For **Expired JWT**: run `npm run token:expired -- <userIdA>` and paste the output into the `expiredToken` collection variable.
5. Folder **10 – Rate Limiting** must run last (it blocks login/signup from your IP for 15 minutes; restart the local server to reset).
6. To test the deployed API, change the `baseUrl` collection variable to the Vercel URL.

| Folder | Covers |
|---|---|
| 01 | Health check, Helmet headers, unsupported route |
| 02 | Valid signups, duplicate username, duplicate email, invalid email, invalid password, missing fields |
| 03 | Login by username, login by email, invalid credentials, missing credentials, malformed JSON |
| 04–05 | Full CRUD for User A and User B |
| 06 | Two-user ownership tests (403 for cross-user GET/PUT/DELETE, lists contain only own employees) |
| 07 | Missing, invalid, malformed and expired JWT |
| 08 | Employee validation (missing fields, email, salary, date), missing JWT, duplicate, invalid id, non-existing id |
| 09 | Delete (204), then 404 |
| 10 | Rate limit exceeded (429) for login and signup |

Full run result: **52 requests, 128 assertions, 0 failures.**

## 14. Deployment (Vercel)

1. Use **MongoDB Atlas** (Vercel cannot reach a database on your laptop). In Atlas → *Network Access*, allow `0.0.0.0/0`, because Vercel's IP addresses change.
2. Push the repository to GitHub, then on [vercel.com/new](https://vercel.com/new) import it. Vercel detects Express automatically (the app is exported from `server.js` / `src/app.js`; no `vercel.json` needed).
3. In *Settings → Environment Variables* add `MONGODB_URI`, `JWT_SECRET` (and optionally `JWT_EXPIRES_IN`, `NODE_ENV=production`).
4. Deploy and open `https://<your-project>.vercel.app/health`.

Serverless notes: the MongoDB connection is opened on the first request and reused by warm instances (`src/config/db.js`); `trust proxy` is enabled only on Vercel so rate limiting uses the real client IP; log files are disabled there (console logging only).

## 15. Sample Credentials for Marking

Non-sensitive test accounts (create them with the signup requests in the collection):

| User | Username | Email | Password |
|---|---|---|---|
| User A | `alice_test` | `alice@example.com` | `Password@123` |
| User B | `bob_test` | `bob@example.com` | `Password@123` |
