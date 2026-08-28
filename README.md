# AI Business Consulting Backend

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Set `DATABASE_URL` to the PostgreSQL connection string from Supabase and set a strong `JWT_SECRET` in `.env`. Run `database.sql` in the Supabase SQL editor before using authentication. The script enables PostGIS, creates the location tables, and inserts dummy Indian locations for the prototype.
Set `DATABASE_URL` to the PostgreSQL connection string from Supabase and set a strong `JWT_SECRET` in `.env`. Run `database.sql` in the Supabase SQL editor for the base schema, then run `onboarding_migration.sql` to add the onboarding table to an existing database. The base script enables PostGIS, creates the location tables, and inserts dummy Indian locations for the prototype.

## API

- `GET /api/health`
- `POST /api/auth/register` with `{ "name", "email", "password", "villageId" }`
- `POST /api/auth/login` with `{ "email", "password" }`
- `GET /api/auth/me` with `Authorization: Bearer <token>`
- `GET /api/locations/states`
- `GET /api/locations/districts?stateId=<state-id>`
- `GET /api/locations/villages?districtId=<district-id>`
- `GET /api/onboarding/me` with `Authorization: Bearer <token>`
- `PUT /api/onboarding/me` with `Authorization: Bearer <token>`

The frontend loads dependent State, District, and Village selectors from these APIs during onboarding. Registration creates the account first; the selected village is then stored in the onboarding profile and its sample PostGIS point is available through the village relation. Replace the dummy places and coordinates with an official dataset before production use.

Onboarding is saved separately from authentication. The update endpoint accepts partial progress. Village and preferred language are required only when `isComplete` is `true`; desired monthly income is optional. Supported languages are English, Hindi, Marathi, Kannada, Tamil, Telugu, Bengali, Gujarati, Punjabi, and Other.

## Architecture

Shared infrastructure lives under `src/common`: database configuration, JWT utilities, authentication and error middleware, and application errors. Feature-specific behavior lives under `src/modules`; the auth module follows `route -> controller -> service -> repository -> PostgreSQL`. Controllers handle HTTP, services handle business rules, and repositories contain only parameterized database queries.