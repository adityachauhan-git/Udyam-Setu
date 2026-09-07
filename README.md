# Udyam Setu — AI-Driven Hyper-Local Business Advisory

Udyam Setu is an AI-powered business advisory and financial-structuring platform for rural and semi-urban micro-entrepreneurs. It is designed for Problem Statement 26091: **AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs**.

The platform combines a guided entrepreneur profile, PostGIS-powered local market signals, an AI business advisor, a structured feasibility report, a competition map, and a deterministic government-loan eligibility calculator.

## 1. Problem statement context

Government concessional-credit schemes help marginalized communities start income-generating businesses. Under the model described in the challenge, the beneficiary contributes approximately 10% of the total project cost as margin money and the State Channelizing Agency (SCA) provides the remaining 90% as a concessional loan.

For example:

- Beneficiary margin: ₹1,00,000
- Total project cost: ₹10,00,000
- Potential loan portion: ₹9,00,000

The challenge defines two financing tiers:

### Micro Finance Scheme

- Project cost up to ₹1.40 lakh
- Agency funding up to 90%, with a maximum of ₹1.25 lakh
- Beneficiary interest rate: 6.5% per year
- Repayment period: 3 years
- Moratorium: 3 months

### Term Loan Scheme

- Project cost above ₹1.40 lakh and up to ₹50.00 lakh
- Agency funding up to 90%, with a maximum of ₹45 lakh
- Beneficiary interest rate: 8% per year
- Repayment period: 7 years
- Moratorium: 6 months

Many first-time rural entrepreneurs still experience business stagnation or failure because they choose activities based on anecdotal success, do not understand local demand or competition, and struggle to calculate project cost, margin money, loan eligibility, pricing, and repayment obligations.

An entrepreneur in a particular village or Gram Panchayat needs practical answers about local demand within 5–10 km, unserved niches, similar businesses, risks, pricing, project cost, loan eligibility, scheme selection, and repayment obligations.

## 2. Proposed solution

Udyam Setu turns a small amount of user input into a localized decision-support workspace. The user creates an account, completes an onboarding profile, selects a village, and receives advice based on:

- Village, district, state, and preferred language
- Age group, skills, interests, goals, capital range, and desired monthly income
- Land access, area, unit, irrigation, and land type
- Electricity, internet, water, storage, transport, and equipment availability
- Nearby businesses, products, prices, market observations, risks, and distribution channels

The solution has four user-facing capabilities:

1. **AI Business Advisor** — conversational, profile-aware business guidance.
2. **Hyper-Local Feasibility Report** — structured analysis for a selected business category.
3. **Smart Scheme Calculator** — project-cost, loan, scheme, installment, and quarterly repayment calculations.
4. **Competition Map** — a 10 km map of similar nearby businesses.

## 3. Module 1 — Hyper-Local Business Feasibility Report

The user enters a proposed business category such as dairy, retail, textiles, food, services, or another category. Completed onboarding with a selected village is required. The system loads factual local records within a fixed 10 km radius and asks the AI to interpret the evidence.

The report covers all six areas required by the challenge:

### 3.1 Market reach

The report explains the local reach supported by the available evidence and lists nearby distribution channels. Local observations and channels are returned as evidence. Population or consumer-base numbers are not invented when absent from the database.

### 3.2 Opportunity analysis

The AI identifies potential opportunities and market gaps for the selected category, while stating when the local dataset is insufficient.

### 3.3 General business analysis / SWOT

The report provides category- and profile-aware strengths, weaknesses, opportunities, and threats using the user’s budget range, resources, skills, land, goals, and income target where available.

### 3.4 Threat identification

Database-recorded local risks are preserved with severity and description, and the AI adds mitigation recommendations. This can cover supply bottlenecks, seasonal demand, or buyer dependency when those risks exist in local data.

### 3.5 Competitor mapping

The report counts and lists matching businesses within 10 km, including name, business type, and distance. The AI adds a competition-level interpretation, but the list and count come from the database.

### 3.6 Product market value and pricing

The report displays observed products, prices, units, business names, and distances for matching businesses. The AI provides pricing interpretation while the factual product-price records remain database-grounded.

### Factual-data protection

The AI is instructed not to invent businesses, prices, population figures, competitors, risks, or numerical facts. The response must be JSON with exactly these top-level keys:

```text
marketReach
opportunityAnalysis
swot
threats
competitorMapping
productPricing
```

The backend parses and validates the JSON, applies safe defaults, and replaces AI-supplied competitor, pricing, threat, and distribution records with the original database records.

## 4. Module 2 — Smart Financial Calculator and Scheme Router

The financial engine is deterministic and independent of the AI provider.

Given margin capital `M`:

```text
Beneficiary margin rate = 10%
Project cost = M / 0.10
Maximum loan at 90% = Project cost × 0.90
```

For ₹1,00,000 margin, the result is ₹10,00,000 project cost and ₹9,00,000 maximum loan.

### Scheme selection

```text
Project cost ≤ ₹1,40,000
  → Micro Finance Scheme

₹1,40,000 < project cost ≤ ₹50,00,000
  → Term Loan Scheme

Project cost > ₹50,00,000
  → Not eligible under the configured schemes
```

The response includes margin, margin rate, project cost, maximum loan, eligibility, scheme name, interest rate, tenure, moratorium, and maximum agency-funding metadata.

### Quarterly installment and schedule

Annual interest is converted to a quarterly rate and a fixed installment is calculated over quarters after the moratorium:

```text
quarterly rate = annual rate / 4
repayment quarters = tenure years × 4 − moratorium quarters
EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
```

Each schedule row contains quarter number, `Moratorium` or `Repayment` status, installment amount, and remaining balance. The 3-year scheme produces 12 quarters with one moratorium quarter; the 7-year scheme produces 28 quarters with two moratorium quarters.

### Current financial boundaries

- Onboarding stores capital bands (`0-25k`, `25k-1L`, `1-5L`, `5L+`), while the calculator accepts exact `marginCapital`.
- Calculations are in memory and are not stored.
- Operating costs and working-capital requirements are not currently generated by the financial service.
- Scheme funding caps are stored in scheme metadata, but the current calculation derives the loan as 90% of project cost; production should explicitly clamp the result to the relevant maximum funding cap.
- The schedule shows zero installments and an unchanged balance during moratorium; interest capitalization or accrued-interest treatment is not modeled.

## 5. AI Business Advisor

The chat assistant receives the onboarding profile and local market context before the live conversation. It avoids asking for information already supplied and prioritizes practical opportunities near the user’s location.

Context includes age, language, location, land, capital, income target, skills, interests, goals, nearby businesses, products and prices, market observations, risks, distribution channels, and available infrastructure/resources.

Recommended questions adapt to skills, interests, starting a business, land access, capital range, and income target, while retaining default questions about business fit, challenges, growth, and fastest income.

### AI provider strategy

- Primary: Groq, model `openai/gpt-oss-120b`
- Groq timeout: 8 seconds; temporary failures retry up to three times with short backoff.
- Fallback: Google Gemini; default model `gemini-3.6-flash`, configurable through `GEMINI_MODEL`.
- If both providers are unavailable, the API returns service unavailable.
- Responses report provider, model, and whether fallback was used.

## 6. User journey and frontend pages

1. Register or sign in.
2. Complete or partially save the four-step onboarding flow.
3. Select state, district, and village through dependent selectors.
4. Record resources, skills, interests, goals, capital band, language, and income preference.
5. Use AI Chat for ideas, strategy, and next actions.
6. Use Finances to enter exact margin and view the loan roadmap.
7. Use Feasibility to enter a category and receive the report.
8. Use Competition Map to view and filter nearby businesses.

Pages: `/` authentication/onboarding, `/chat` advisor, `/finances` calculator, `/feasibility` report, and `/competition-map` Leaflet/OpenStreetMap map.

## 7. Backend architecture

The application is Node.js + Express with ES modules. Shared infrastructure is under `src/common`; feature logic is under `src/modules`.

```text
route → controller → service → repository → PostgreSQL/PostGIS
```

Modules are `auth`, `onboarding`, `locations`, `chat`, `report`, and `financial`. Routes define endpoints and authentication, controllers handle HTTP, services contain validation/business logic, and repositories encapsulate SQL.

## 8. API reference

Authenticated routes require `Authorization: Bearer <jwt-token>`.

```text
GET  /api/health

POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me

GET  /api/locations/states
GET  /api/locations/districts?stateId=<id>
GET  /api/locations/villages?districtId=<id>
GET  /api/locations/competition-map?businessCategory=<category>

GET  /api/onboarding/me
PUT  /api/onboarding/me

GET  /api/chat/recommendations
POST /api/chat/send       { message, history }

POST /api/schemes/eligibility { marginCapital }
POST /api/reports/feasibility { businessCategory }
```

Registration requires name, email, and an eight-character minimum password. Onboarding supports partial saves; completion requires village and preferred language. Feasibility requires completed onboarding and a selected village and always uses 10 km.

## 9. Database and local-market data

PostgreSQL and PostGIS store:

- `states`, `districts`, `villages` — geographic hierarchy and coordinates.
- `users` — accounts, password hashes, and onboarding status.
- `onboarding_profiles` — entrepreneur context and preferences.
- `businesses` — geolocated businesses.
- `business_products` — observed products, units, and prices.
- `market_observations` — numerical observations with source and date.
- `local_risks` — geolocated risks and severity.
- `distribution_channels` — local sales/distribution channels.

Nearby queries use `ST_DWithin` and distance calculations from the selected village. Spatial indexes support villages, businesses, observations, risks, and channels.

Setup and data files:

- `database/full_setup.sql` — clean self-contained setup.
- `database/migrations/001...005` — ordered existing-database migrations.
- `database/seed/gis_market_data.sql` — repeatable GIS demo data.
- `database/seed/uttarakhand_market_data.sql` — larger Uttarakhand hackathon dataset.

These are observed/demo records, not automatically verified real-world data. No AI-generated reports are stored.

## 10. Setup

Requirements: Node.js, PostgreSQL with PostGIS, a Groq API key, and a Gemini API key for fallback.

```bash
npm install
```

Create `.env`:

```text
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3.6-flash
PORT=5000
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
```

For a new database:

```bash
psql "$DATABASE_URL" -f database/full_setup.sql
```

For an existing database, apply `001_initial_schema.sql`, `002_add_onboarding_profiles.sql`, `003_add_village_cluster_data.sql`, `004_add_gis_market_data.sql`, and `005_retire_legacy_village_market_arrays.sql` in order, then optionally apply a GIS seed. Do not run both setup paths unnecessarily.

Start the server with `npm run dev` or `npm start`; the default port is 5000.

## 11. Testing

```bash
npm test
```

Tests cover both scheme repayment schedules, PostGIS radius queries, factual-data preservation in reports, category validation, onboarding/village requirements, insufficient-data defaults, fixed 10 km behavior, and competition-map filtering.

## 12. Impact goals

- Reduce failure and stagnation among newly funded micro-enterprises.
- Help beneficiaries choose locally relevant businesses using demand, opportunity, competition, threat, channel, and pricing signals.
- Explain the 10% beneficiary margin, 90% loan structure, scheme selection, and repayment obligations.
- Provide accessible multilingual, profile-aware guidance.
- Empower marginalized youth to make data-backed and financially sound enterprise decisions.

## 13. Production considerations

Before live deployment, replace demo data with verified local datasets; add authoritative population/demographic data if consumer estimates are required; store exact capital, project, operating-cost, and working-capital assumptions for deeper financial planning; enforce scheme caps and define moratorium-interest treatment; and add rate limiting, production CORS, secret management, audit logging, and monitoring. The assistant is decision support, not guaranteed loan approval, and official SCA verification remains necessary.
