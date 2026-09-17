# RESCUE APP — Malasiqui Emergency Response

RESCUE APP is a full-stack emergency coordination application for Malasiqui. Citizens can create verified accounts, send structured emergency requests with their device location, and responders can review, accept, and update those incidents.

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 + Vite | Responsive citizen, responder, and admin interfaces |
| HTTP client | Axios | Cookie-based requests to the Express API |
| Backend | Node.js + Express 5 | Authentication, validation, authorization, and emergency APIs |
| Database | PostgreSQL | Durable users, verification state, and emergency incidents |
| ORM | Prisma 6 | Typed and parameterized database access with migrations |
| Validation | Zod | Strict request-body validation before database operations |
| Authentication | JWT, bcrypt, Google Identity Services | Secure application sessions and Google sign-in |
| Email | Nodemailer/SMTP | Account-verification email delivery |
| Maps/location | Browser Geolocation + Google Maps | Citizen coordinates, navigation, and responder tracking |

## System overview

```text
React frontend (localhost:5173)
        │ secure cookie + validated JSON
        ▼
Express API (localhost:3000)
        │ Prisma ORM
        ▼
PostgreSQL

Google sign-in ──► Google credential ──► backend verification ──► JWT session
Citizen GPS ──► emergency record ──► responder queue
Responder GPS ──► active emergency ──► citizen tracking map
```

## What has been completed

### Secure authentication

- Local registration and sign-in use an HTTP-only session cookie for the web application.
- Passwords are hashed with bcrypt using 12 rounds.
- Passwords require uppercase, lowercase, and numeric characters and are limited to bcrypt-safe lengths.
- Authentication endpoints use rate limiting to reduce automated login and registration abuse.
- Helmet security headers, restricted CORS origins, small JSON request limits, and hidden Express identification are enabled.
- Protected routes verify the JWT and load the current verified user from the database.
- Role checks separate citizen, respondent, and administrator operations. Respondent accounts also have a required response unit.
- Input is validated with Zod before it reaches Prisma.

Authentication endpoints:

- `POST /api/auth/register` — create an unverified local account
- `POST /api/auth/verify-email` — verify an email address using its expiring 6-digit code
- `POST /api/auth/resend-verification` — issue a replacement code without exposing account existence
- `POST /api/auth/login` — password authentication for verified users
- `POST /api/auth/google` — verified Google sign-in and account linking
- `GET /api/auth/session` — safely check whether a browser session exists
- `GET /api/auth/me` — return the authenticated user from a protected route
- `PATCH /api/auth/profile` — securely update the authenticated user's name, address, and phone number
- `POST /api/auth/logout` — clear the HTTP-only session cookie

### Google OAuth

- The login screen uses Google Identity Services.
- The backend verifies the Google ID token against `GOOGLE_CLIENT_ID`; it does not trust profile details sent directly by the browser.
- Google accounts must have a Google-verified email.
- Existing accounts can be linked safely by verified email, while new Google users are created as citizen accounts.
- Successful Google authentication creates the same secure application session as password login.
- The server uses `Cross-Origin-Opener-Policy: same-origin-allow-popups` so the Google popup can communicate with the application.
- The frontend and backend Client IDs are checked against the same Google Web OAuth application.
- The backend loads trusted certificates from both Node and the Windows certificate store so Google's certificate chain can be validated even when the server is started directly.
- Google verification certificates are fetched with an explicit Windows-aware certificate authority list, cached according to Google's response, and used by the Google authentication library to validate the token signature, issuer, audience, and expiry locally.
- Invalid credentials return `401`, account-link conflicts return `409`, and Google connectivity failures return `503` instead of an unexplained `500`.

Google Cloud Console should include both local JavaScript origins:

```text
http://localhost
http://localhost:5173
```

Add it under **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs → your Web application → Authorized JavaScript origins**. Enter only the origin shown above: no path and no trailing slash. Restart both development servers after changing environment variables. The backend also loads the Windows certificate store automatically so Google token verification remains encrypted and works with locally installed certificate authorities.

Set the same Web OAuth client ID in:

```env
# Backend/.env
GOOGLE_CLIENT_ID=your-google-web-client-id

# Frontend/.env
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id
```

### Email verification

- Local registration does not allow immediate dashboard access.
- A cryptographically random 6-digit verification code is generated after registration.
- Only an HMAC digest of the email and code is stored in the database, so the original code is never stored.
- Verification codes expire after 10 minutes.
- Login is blocked until `emailVerifiedAt` is set.
- Successful code verification creates the user's first authenticated session and opens the correct dashboard.
- Users can request a replacement verification email.
- Resend responses do not reveal whether an email account exists.
- SMTP delivery is handled with Nodemailer. Registration now fails clearly when Gmail delivery is not configured instead of pretending that an email was sent.

Required SMTP settings are listed below.

### Prisma ORM and PostgreSQL

Prisma is the only application layer used to read and write PostgreSQL data. This provides parameterized queries, typed models, migrations, unique constraints, indexes, and explicit relations.

The `User` model stores:

- Account identity and role
- Responder unit: Health/Ambulance, PNP/Police, BFP/Fire Truck, or MDRRMO
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
- A unique active-citizen lock that prevents simultaneous requests
- Responder latitude, longitude, accuracy, and last GPS update
- Workflow status and timestamps

Database configuration supports either a complete `DATABASE_URL` or the individual `DB_*` values. The project wrapper constructs `DATABASE_URL` before Prisma starts.

### Emergency request backend

Citizen endpoints:

- `POST /api/emergencies` — create an emergency request
- `GET /api/emergencies/active` — retrieve the citizen's current active incident for tracking
- `GET /api/emergencies/mine` — list the signed-in citizen's requests

Responder endpoints:

- `GET /api/emergencies/queue` — list only unassigned requests routed to the responder's unit, plus that responder's active assignments
- `PATCH /api/emergencies/:id/accept` — atomically accept an unassigned request only when it belongs to the responder's unit
- `PATCH /api/emergencies/:id/status` — change an assigned request to `EN_ROUTE` or `RESOLVED`
- `PATCH /api/emergencies/:id/responder-location` — update the assigned responder's GPS position

The accept operation uses a database transaction and conditional update. If two responders act at the same time, only one can receive the request.

Emergency requests are routed by the service selected by the citizen:

| Citizen request | Respondent unit that can view and accept it |
| --- | --- |
| Ambulance | Health / Ambulance |
| Police | PNP / Police |
| Fire | BFP / Fire Truck |
| Search & Rescue, Disaster Response, or Other | MDRRMO |

The unit filter is enforced by the backend, not only hidden in the interface. A responder cannot accept a request assigned to another unit by manually calling the API. Existing respondent records are assigned to MDRRMO by the migration so they continue to have a usable queue.

Each citizen can have only one active request in `PENDING`, `ACCEPTED`, or `EN_ROUTE` status. This rule is enforced both by the API and a unique database lock. The citizen can create another request only after the active incident becomes `RESOLVED` or `CANCELLED`.

While a response is `EN_ROUTE`, the responder dashboard shares updated responder coordinates. The citizen tracker polls the request status and displays the responder's latest GPS position. Responders can open the citizen's coordinates directly in Google Maps from the queue or dispatch map.

The location workflow deliberately requires user interaction:

1. The citizen presses **Use my current location** before submitting.
2. The respondent accepts the request.
3. Pressing **Mark en route** requests respondent location permission.
4. The API refuses the `EN_ROUTE` transition until an initial responder location exists.
5. While the responder page remains open, the browser watches the GPS position and uploads updates.
6. The citizen page polls every five seconds and redraws the responder map.
7. Resolving the incident clears the active-citizen lock and permits another request.

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
- Editable name, phone number, and address with immediate dashboard updates

Responder features:

- Required response-unit selection during respondent registration
- Unit-specific live emergency queue from the database
- Citizen name, emergency details, landmark, GPS coordinates, and accuracy
- Atomic request acceptance
- Accepted, en-route, and resolved status actions
- Live responder-location sharing while travelling
- Embedded Google Maps citizen location and turn-by-turn navigation link
- Live operational totals and incident-location preview
- Responsive desktop and phone layouts
- Dedicated profile page with editable contact details and a protected response-unit display

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
        ├── pages/
        │   ├── citizen/   Separate citizen feature pages
        │   ├── respondent/ Separate responder pages, components, and operations hook
        │   └── admin/     Administrator interface
        └── styles/        Responsive dashboard design
```

## Important source files

| File | Responsibility |
| --- | --- |
| `Backend/server.js` | Express setup, security headers, CORS, request limits, route mounting, and error handling |
| `Backend/routes/auth.js` | Registration, email verification, password login, Google verification, sessions, and logout |
| `Backend/routes/citizenReq.js` | Emergency creation, active-request rules, responder queue, acceptance, status, and GPS updates |
| `Backend/middleware/auth.js` | JWT authentication and role authorization |
| `Backend/middleware/validate.js` | Shared Zod validation middleware |
| `Backend/config/db.js` | Prisma client and safe database URL construction |
| `Backend/services/email.js` | SMTP verification-email delivery |
| `Backend/prisma/schema.prisma` | User and emergency database models |
| `Frontend/src/api/auth.js` | Authentication API functions |
| `Frontend/src/api/emergencies.js` | Citizen and responder emergency API functions |
| `Frontend/src/auth/` | Login, registration, and verification interfaces |
| `Frontend/src/components/ProfileEditor.jsx` | Shared validated profile editor for citizens and responders |
| `Frontend/src/pages/citizen/EmergencyPage.jsx` | Citizen request form, one-active-request lock, status timeline, and responder tracking |
| `Frontend/src/pages/respondent/RespondentDashboard.jsx` | Responder navigation shell and active-page selection |
| `Frontend/src/pages/respondent/useResponderOperations.js` | Queue polling, acceptance, status transitions, and responder GPS sharing |
| `Frontend/src/pages/respondent/` | Separate overview, incidents, dispatch, teams, and communications pages |
| `Frontend/src/pages/respondent/components/` | Reusable incident list, map, and page-header components |
| `Frontend/src/components/DashboardShell.jsx` | Shared responsive navigation and application layout |
| `Frontend/src/styles/dashboard.css` | RESCUE APP responsive visual system |

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

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-google-app-password
EMAIL_FROM="RESCUE APP <your-gmail-address@gmail.com>"
```

For Gmail, turn on 2-Step Verification for the sender account, create a Google App Password, and place that 16-character password in `SMTP_PASS`. Do not use the normal Gmail password and do not commit `Backend/.env`.

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

Use `npm run dev` during development or `npm start` for a normal start. Both commands launch the server through `scripts/start-server.js`, enable the Windows certificate store, and prevent an inaccessible inherited Avast SSL key-log pipe from blocking Google HTTPS requests with `EACCES`.

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

Emergency requests, unit-based routing, assignment, status transitions, Google Maps, and responder GPS positions are persisted and available to authenticated users. Status and position updates currently use five-second polling rather than WebSockets. The next backend phase can add push notifications, WebSocket/SSE updates, responder availability, incident chat, route ETA calculation, administrator assignment controls, and historical reports.

## Security notes

- Never commit `Backend/.env` or `Frontend/.env`.
- Use a long random `JWT_SECRET` in every environment.
- Use HTTPS in production so secure cookies and location permissions work correctly.
- Configure production origins explicitly; never use wildcard CORS with credentials.
- Browser location is sensitive data. It is transmitted only during an active emergency and must be protected by role authorization and HTTPS.
- Development preview roles are visual demonstrations only and cannot access protected API data.
