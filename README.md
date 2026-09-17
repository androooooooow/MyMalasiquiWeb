# RESCUE APP — Malasiqui Emergency Response

RESCUE APP is a full-stack emergency coordination application for Malasiqui. Citizens can create verified accounts, send structured emergency requests with their device location, and responders can review, accept, and update those incidents.

## What has been completed

### Secure authentication

- Local registration and sign-in use an HTTP-only session cookie for the web application.
- Passwords are hashed with bcrypt using 12 rounds.
- Passwords require uppercase, lowercase, and numeric characters and are limited to bcrypt-safe lengths.
- Authentication endpoints use rate limiting to reduce automated login and registration abuse.
- Helmet security headers, restricted CORS origins, small JSON request limits, and hidden Express identification are enabled.
- Protected routes verify the JWT and load the current verified user from the database.
- Role checks separate citizen, respondent, and administrator operations.
- Input is validated with Zod before it reaches Prisma.

### Google OAuth

- The login screen uses Google Identity Services.
- The backend verifies the Google ID token against `GOOGLE_CLIENT_ID`; it does not trust profile details sent directly by the browser.
- Google accounts must have a Google-verified email.
- Existing accounts can be linked safely by verified email, while new Google users are created as citizen accounts.
- Successful Google authentication creates the same secure application session as password login.
- The server uses `Cross-Origin-Opener-Policy: same-origin-allow-popups` so the Google popup can communicate with the application.

Google Cloud Console must include this local JavaScript origin:

```text
http://localhost:5173
```

Add it under **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → your Web application → Authorized JavaScript origins**. Enter only the origin shown above: no path and no trailing slash. Restart both development servers after changing environment variables. The backend start scripts use Node's Windows system certificate store so Google token verification remains encrypted and works with locally installed certificate authorities.

Set the same Web OAuth client ID in:

```env
# Backend/.env
GOOGLE_CLIENT_ID=your-google-web-client-id

# Frontend/.env
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
```

### Email verification

- Local registration does not allow immediate dashboard access.
- A cryptographically random verification token is generated after registration.
- Only the SHA-256 digest is stored in the database, so the original verification token is not exposed if the database is compromised.
- Verification links expire after 30 minutes.
- Login is blocked until `emailVerifiedAt` is set.
- Users can request a replacement verification email.
- Resend responses do not reveal whether an email account exists.
- SMTP delivery is handled with Nodemailer.

Required SMTP settings are listed below.

### Prisma ORM and PostgreSQL

Prisma is the only application layer used to read and write PostgreSQL data. This provides parameterized queries, typed models, migrations, unique constraints, indexes, and explicit relations.

The `User` model stores:

- Account identity and role
- bcrypt password hash
- Email verification state and hashed token
- Google subject identifier and authentication provider
- Creation and update timestamps

The `EmergencyRequest` model stores:

- Citizen who created the request
- Assigned responder after acceptance
- Requested service
- Incident description and number of people affected
- Optional landmark and callback number
- Latitude, longitude, and location accuracy
- Workflow status and timestamps

Database configuration supports either a complete `DATABASE_URL` or the individual `DB_*` values. The project wrapper constructs `DATABASE_URL` before Prisma starts.

### Emergency request backend

Citizen endpoints:

- `POST /api/emergencies` — create an emergency request
- `GET /api/emergencies/mine` — list the signed-in citizen's requests

Responder endpoints:

- `GET /api/emergencies/queue` — list unassigned requests and the responder's active assignments
- `PATCH /api/emergencies/:id/accept` — atomically accept an unassigned request
- `PATCH /api/emergencies/:id/status` — change an assigned request to `EN_ROUTE` or `RESOLVED`

The accept operation uses a database transaction and conditional update. If two responders act at the same time, only one can receive the request.

Each citizen can have only one active request in `PENDING`, `ACCEPTED`, or `EN_ROUTE` status. This rule is enforced both by the API and a unique database lock. The citizen can create another request only after the active incident becomes `RESOLVED` or `CANCELLED`.

While a response is `EN_ROUTE`, the responder dashboard shares updated responder coordinates. The citizen tracker polls the request status and displays the responder's latest GPS position. Responders can open the citizen's coordinates directly in Google Maps from the queue or dispatch map.

Workflow:

```text
Citizen sends request
        ↓
PENDING responder queue
        ↓ responder accepts
ACCEPTED and linked to that responder
        ↓
EN_ROUTE
        ↓
RESOLVED
```

### Frontend UI

The original dashboard was rebuilt as a responsive RESCUE APP interface.

Citizen features:

- Mobile-friendly navigation and overview
- In-app emergency workflow with no 911 call action
- Rescue type selection: Ambulance, Fire, Police, Search & Rescue, Disaster Response, or Other
- Incident description, affected-person count, callback number, and landmark
- Explicit browser location permission
- Coordinate and accuracy review before submission
- Secure submission to the backend and confirmation with request ID
- One-active-request restriction until the incident is completed
- Automatic status tracking for pending, accepted, and en-route stages
- Assigned responder identity, contact information, and live GPS map
- Safety guides, messages, and profile areas

Responder features:

- Live emergency queue from the database
- Citizen name, emergency details, landmark, GPS coordinates, and accuracy
- Atomic request acceptance
- Accepted, en-route, and resolved status actions
- Live responder-location sharing while travelling
- Embedded Google Maps citizen location and turn-by-turn navigation link
- Live operational totals and incident-location preview
- Responsive desktop and phone layouts

Administrator features:

- RESCUE APP styled administration dashboard and operational overview

Development-only role previews are available with:

```text
http://localhost:5173/citizen?previewRole=citizen
http://localhost:5173/respondent?previewRole=respondent
http://localhost:5173/admin?previewRole=admin
```

Preview accounts are visual-only and cannot call protected backend endpoints.

## Project structure

```text
My-MalasiquiApp/
├── Backend/
│   ├── config/            Prisma client configuration
│   ├── middleware/        Authentication, role, and validation middleware
│   ├── prisma/            Schema and SQL migrations
│   ├── routes/            Authentication and emergency API routes
│   ├── scripts/           Prisma environment wrapper
│   ├── services/          Email delivery
│   └── server.js          Express application
└── Frontend/
    └── src/
        ├── api/           Auth and emergency API clients
        ├── auth/          Login, registration, and verification screens
        ├── components/    Shared RESCUE APP shell and icons
        ├── pages/         Citizen, responder, and admin interfaces
        └── styles/        Responsive dashboard design
```

## Environment configuration

Create `Backend/.env` without committing secrets:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MOBILE_URL=

DB_HOST=localhost
DB_PORT=5432
DB_NAME=malasiqui
DB_USER=postgres
DB_PASSWORD=your-database-password

JWT_SECRET=use-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-web-client-id

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=RESCUE APP <no-reply@example.com>
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
```

## Installation and database setup

Backend:

```powershell
cd Backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Frontend, in another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Available checks

```powershell
cd Frontend
npm run lint
npm run build

cd ..\Backend
npm run db:generate
npm run db:migrate
node --check server.js
node --check routes\auth.js
node --check routes\citizenReq.js
```

## Current backend boundary

Emergency requests are persisted and visible to authenticated respondents. Automatic realtime push notifications, responder specialties, team availability, chat, and live map rendering can be added next. The current responder queue refreshes when the dashboard opens and whenever the responder selects **Refresh queue**.
