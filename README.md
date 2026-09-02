# AI Business Consulting Backend

A Node.js Express backend for a business advisory platform that combines onboarding data with Gemini-powered chat recommendations.

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Create a `.env` file with:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret key for auth tokens
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - optional Gemini model name, default is `gemini-3.6-flash`

Run the SQL scripts in this order:

1. `database.sql` - base schema, location tables, and sample Indian locations
2. `onboarding_migration.sql` - onboarding profile tables
3. `village_cluster_migration.sql` - any additional location aggregation data if required

## Features

### Authentication

- User registration and login with JWT authentication
- Authenticated routes use the `Authorization: Bearer <token>` header

### Onboarding

The onboarding flow stores user profile data such as:

- age group
- preferred language
- village, district, and state information
- land access and land details
- capital range
- skills and interests
- goals and income preferences
- available resources such as electricity, internet, water, storage, transport, and equipment

This profile is saved separately from authentication and supports partial updates. Village and preferred language are required only when the onboarding is marked complete.

### AI Chat and Recommendations

The chat module uses the onboarding profile as context for Gemini so responses can be more relevant to the user’s background, location, skills, goals, and resources.

The chat request includes a natural-language onboarding summary such as:

- user skills
- business interests
- goals
- location (village, district, state)
- land and capital context
- income targets

This is sent before the live conversation so Gemini can tailor business suggestions without repeatedly asking for data already collected.

## API

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register` with `{ "name", "email", "password", "villageId" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/auth/me` with `Authorization: Bearer <token>`

### Locations

- `GET /api/locations/states`
- `GET /api/locations/districts?stateId=<state-id>`
- `GET /api/locations/villages?districtId=<district-id>`

### Onboarding

- `GET /api/onboarding/me` with `Authorization: Bearer <token>`
- `PUT /api/onboarding/me` with `Authorization: Bearer <token>`

### Chat

- `GET /api/chat/recommendations` with `Authorization: Bearer <token>`
- `POST /api/chat/send` with `Authorization: Bearer <token>` and body like:

```json
{
  "message": "Which business should I start?",
  "history": []
}
```

The chat service sends the onboarding profile and recent chat history to Gemini together, and returns the AI response plus the active model name.

## Architecture

Shared infrastructure lives under `src/common`: database configuration, JWT utilities, authentication middleware, and application error handling.

Feature-specific logic lives under `src/modules` and follows the pattern:

- route
- controller
- service
- repository
- PostgreSQL

Controllers handle HTTP request/response concerns, services contain business logic, and repositories encapsulate database queries.

## Notes

The frontend loads dependent state, district, and village selectors during onboarding. Registration creates the account first; the selected village is then stored in the onboarding profile and linked to the location tables.

For a production deployment, replace the sample dummy locations with a verified local dataset before using live business recommendations.