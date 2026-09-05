# AI Business Consulting Backend

A Node.js Express backend for a business advisory platform that combines onboarding data with AI-powered chat recommendations. Chat uses Groq as the primary provider and falls back to Google Gemini when Groq has a temporary failure.

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Create a `.env` file with:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret key for auth tokens
- `GROQ_API_KEY` - Groq API key for the primary chat provider
- `GEMINI_API_KEY` - Google Gemini API key used as the fallback provider
- `GEMINI_MODEL` - optional Gemini fallback model; default is `gemini-3.6-flash`
- `PORT` - optional server port; default is `5000`
- `JWT_EXPIRES_IN` - optional JWT lifetime; default is `7d`
- `LOG_LEVEL` - optional logging level

For a new database, run the complete setup script:

```bash
psql "$DATABASE_URL" -f database/full_setup.sql
```

For an existing database, run the SQL scripts in this order:

1. `database/migrations/001_initial_schema.sql` - base schema, location tables, and sample Indian locations
2. `database/migrations/002_add_onboarding_profiles.sql` - onboarding profile tables
3. `database/migrations/003_add_village_cluster_data.sql` - nearby-village and shared-business data
4. `database/migrations/004_add_gis_market_data.sql` - GIS market-data tables and indexes
5. `database/migrations/005_retire_legacy_village_market_arrays.sql` - remove obsolete village arrays after the GIS-backed backend is deployed
6. `database/seed/gis_market_data.sql` - optional repeatable GIS demonstration data

Do not run both setup paths unnecessarily. `database/full_setup.sql` includes the final schema, base location data, onboarding, and GIS market-data tables.

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

The chat module uses the onboarding profile and nearby-business data as context so responses can be more relevant to the user’s background, location, skills, goals, and resources. Requests are sent to Groq first and retried for temporary failures. Gemini is used as a fallback when Groq remains temporarily unavailable.

The chat request includes a natural-language onboarding summary such as:

- user skills
- business interests
- goals
- location (village, district, state)
- land and capital context
- income targets
- resources such as electricity, internet, water, storage, transport, and equipment
- popular businesses within 10 km

This context is sent before the live conversation so the AI can tailor business suggestions without repeatedly asking for data already collected. The nearby-business query requires PostGIS and uses a 10 km radius.

## API

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register` with `{ "name", "email", "password" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/auth/me` with `Authorization: Bearer <token>`

Registration creates the account first. The selected village is saved later through onboarding.

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

The response includes the AI reply, provider, active model name, and whether the Gemini fallback was used.

The public browser chat page is available at `GET /chat` after login.

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

The frontend loads dependent state, district, and village selectors during onboarding. The form supports partial saves; completing onboarding requires a village and preferred language.

For a production deployment, replace the sample dummy locations with a verified local dataset before using live business recommendations. The nearby-business feature requires PostGIS.
