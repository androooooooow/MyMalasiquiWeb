# RESCUE APP

RESCUE APP is a full-stack emergency coordination system for Malasiqui. Citizens can report emergencies with their live location, while authorized response units can receive, accept, track, and resolve requests assigned to their service.

## Main users

- **Citizen** — creates and tracks an emergency request.
- **Responder** — receives requests routed to a specific response unit.
- **Administrator** — monitors incidents and analytics, manages account access, and reviews audit records.

Responder units supported by the system:

- Health / Ambulance
- PNP / Police
- BFP / Fire Truck
- MDRRMO

## Main features

### Account and security

- Local email and password registration
- Six-digit email verification before dashboard access
- Google sign-in using Google Identity Services
- Role-based authorization for citizens, responders, and administrators
- Required response-unit assignment for responder accounts
- HTTP-only JWT session cookies
- bcrypt password hashing
- Zod input validation and request rate limiting
- Editable citizen and responder profiles

### Emergency workflow

- Ambulance, Fire, Police, Search and Rescue, Disaster, and Other request types
- Citizen incident description, affected-person count, callback number, and landmark
- Browser GPS permission and coordinate capture
- Only one active emergency request per citizen
- Unit-based request routing
- Atomic responder acceptance to prevent two responders from accepting the same request
- `PENDING`, `ACCEPTED`, `EN_ROUTE`, and `RESOLVED` workflow
- Citizen tracking of request status and assigned responder
- Responder GPS updates while travelling
- Google Maps citizen-location and navigation links

### Administration

- Command center with real user and incident totals, recent incidents, and recent admin actions
- Searchable, filtered, paginated user management
- Immediate account blocking and unblocking, including existing sessions
- Incident counts grouped by day, week, month, or year (UTC)
- Audit log recording who changed account access, the target user, time, and block reason

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Axios |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Validation | Zod |
| Authentication | JWT, bcrypt, Google Identity Services |
| Email | Nodemailer with Gmail SMTP |
| Location | Browser Geolocation and Google Maps |

## Requirements

Install or prepare the following before running the project:

- Node.js 20 or newer
- npm
- PostgreSQL
- A PostgreSQL database for the application
- A Google Cloud Web OAuth client for Google sign-in
- A Gmail or Google Workspace sender account with 2-Step Verification and an App Password
- A browser with location permission enabled for GPS features

## Project structure

```text
My-MalasiquiApp/
├── Backend/
│   ├── config/                 Database and certificate configuration
│   ├── middleware/             Authentication, roles, and validation
│   ├── prisma/                 Prisma schema and migrations
│   ├── routes/
│   │   ├── auth.js             Registration, verification, login, and profiles
│   │   ├── citizenReq.js       Citizen-only emergency endpoints
│   │   ├── respondentAction.js Responder-only emergency operations
│   │   ├── chats.js            Unit-specific live conversations
│   │   └── admin.js            Admin dashboard, users, analytics, audit
│   ├── scripts/                Backend and Prisma startup wrappers
│   ├── services/               Email delivery
│   └── server.js               Express server
├── Frontend/
│   └── src/
│       ├── api/                Backend API clients
│       ├── auth/               Login, registration, and email verification
│       ├── components/         Shared application components
│       ├── pages/
│       │   ├── citizen/        Citizen pages
│       │   ├── respondent/     Responder pages and components
│       │   └── admin/          Administration pages
│       └── styles/             Dashboard styles
├── PROJECT_CHANGE_SUMMARY.txt  Implementation and fix history
└── README.md                   Project setup and usage
```

## Environment configuration

Create `Backend/.env`:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MOBILE_URL=

DATABASE_URL=postgresql://postgres:password@localhost:5432/malasiqui
DB_HOST=localhost
DB_PORT=5432
DB_NAME=malasiqui
DB_USER=postgres
DB_PASSWORD=your-database-password

JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sender-account@gmail.com
SMTP_PASS=your-16-character-google-app-password
EMAIL_FROM="RESCUE APP <your-sender-account@gmail.com>"
```

Use a Google App Password for `SMTP_PASS`, not the sender account's normal password. Never commit `.env` files.

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

The frontend and backend Google client IDs must be identical. Configure these Authorized JavaScript origins in the Google Cloud Web OAuth client:

```text
http://localhost
http://localhost:5173
```

## Installation

### 1. Backend dependencies and database

```powershell
cd C:\Users\Andrew\My-MalasiquiApp\Backend
npm install
npm run db:generate
npm run db:migrate
```

To create the first administrator, run this once in the backend folder from an interactive terminal:

```powershell
npm run admin:bootstrap
```

Enter the administrator's name, email, and password when prompted. The password is masked. The command refuses to create another administrator once one exists; public registration cannot assign the admin role.

### 2. Frontend dependencies

```powershell
cd C:\Users\Andrew\My-MalasiquiApp\Frontend
npm install
```

## Running the application

Start the backend:

```powershell
cd C:\Users\Andrew\My-MalasiquiApp\Backend
npm start
```

Start the frontend in another terminal:

```powershell
cd C:\Users\Andrew\My-MalasiquiApp\Frontend
npm run dev
```

Open `http://localhost:5173`.

## API overview

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register or recover a pending unverified account |
| POST | `/api/auth/verify-email` | Verify a six-digit email code |
| POST | `/api/auth/resend-verification` | Send a new verification code |
| POST | `/api/auth/login` | Local account login |
| POST | `/api/auth/google` | Google sign-in |
| GET | `/api/auth/session` | Read the current browser session |
| GET | `/api/auth/me` | Read the authenticated user |
| PATCH | `/api/auth/profile` | Update profile information |
| POST | `/api/auth/logout` | End the session |

### Citizen emergency requests

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/emergencies` | Create an emergency request |
| GET | `/api/emergencies/active` | Get the citizen's active request |
| GET | `/api/emergencies/mine` | Get the citizen's request history |

### Responder actions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/respondent-actions/queue` | Get the unit-specific responder queue |
| PATCH | `/api/respondent-actions/:id/accept` | Accept an available request |
| PATCH | `/api/respondent-actions/:id/status` | Mark a request en route or resolved |
| PATCH | `/api/respondent-actions/:id/responder-location` | Update responder GPS coordinates |

### Admin (admin account only)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/admin/overview` | Real account totals, incident totals, recent activity |
| GET | `/api/admin/users` | Search and filter paginated accounts |
| PATCH | `/api/admin/users/:id/block` | Block or unblock a citizen or responder |
| GET | `/api/admin/analytics?period=day` | Incident totals by day, week, month, or year |
| GET | `/api/admin/audit-log` | Read paginated admin access changes |

## Database rules

- Prisma is the application data-access layer.
- Email addresses and Google subject identifiers are unique.
- Only the HMAC digest of an email-verification code is stored.
- Each citizen can have only one active request.
- Requests are filtered according to the responder's assigned unit.
- A database transaction prevents duplicate request acceptance.
- Blocked accounts cannot log in or use existing authenticated sessions.
- Admin account-access changes and their reasons are stored in an audit log.

## Verification checks

Frontend:

```powershell
cd Frontend
npm run lint
npm run build
```

Backend:

```powershell
cd Backend
npm run db:generate
npm run db:migrate
node --check server.js
node --check routes\auth.js
node --check routes\citizenReq.js
node --check routes\respondentAction.js
node --check routes\admin.js
npm run test:admin
```

The admin integration test temporarily creates two test accounts, checks analytics and block/unblock behavior, then deletes its own test records.

## Security reminders

- Never commit `Backend/.env` or `Frontend/.env`.
- Never share the Gmail App Password or `JWT_SECRET`.
- Use HTTPS in production.
- Configure explicit production CORS origins.
- Treat citizen and responder GPS coordinates as sensitive information.
- Development preview pages are visual demonstrations and cannot replace authenticated access.

## Additional documentation

See `PROJECT_CHANGE_SUMMARY.txt` for the detailed summary and explanation of implemented code changes and resolved issues.
