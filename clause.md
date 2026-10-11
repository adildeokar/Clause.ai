# Clause AI — Repo Architecture, Features, and Flow

## Overview

`Clause` is an AI-driven contract intelligence platform built with Next.js and TypeScript. It allows users to upload contracts, extract and analyze clauses, benchmark legal language, run ethics scans, stress test clauses, and generate contracts from templates.

The repository uses the Next.js App Router with server and client components, Prisma for database access, and the OpenAI API for legal AI analysis.

---

## Tech Stack

- Frontend: `Next.js 14` (App Router), `React 18`, `TypeScript`
- Styling/UI: `TailwindCSS`, `shadcn/ui`, `Lucide React`, `Framer Motion`
- Backend: Next.js Route Handlers (`app/api/.../route.ts`)
- Database: PostgreSQL via `Prisma` (`prisma/schema.prisma`)
- Authentication: `next-auth` with `CredentialsProvider` (`lib/auth.ts`)
- AI: `openai` client (`lib/openai.ts`), custom AI prompt orchestration (`ai/analysis.ts`, `ai/prompts.ts`)
- File parsing: `pdf-parse`, `mammoth` plus custom parsers for `txt`, `rtf`, and `md` (`lib/parsing.ts`)
- Charts/UI: `recharts`, custom components from `components/ui`

---

## High-level Architecture

### App Structure

- `app/page.tsx`: Public landing page with product messaging and feature overview.
- `app/login/page.tsx`: Sign-in page using `next-auth` credentials.
- `app/(dashboard)/...`: Authenticated dashboard area containing contract repository, upload workflow, templates, analytics, and settings.
- `components/`: Reusable UI components and dashboard-specific widgets.
- `lib/`: Core backend helpers: authentication, database client, OpenAI client, and document parsing.
- `ai/`: AI orchestration, prompt templates, and analysis logic.
- `prisma/`: Database schema and migration/seed scripts.
- `app/api/`: Route handler endpoints for uploads, contracts, clauses, templates, search, and dashboard stats.

### UI and Client Flow

The frontend is split between static/public marketing content and authenticated app pages.

- Public landing page at `/` introduces features and redirects users to `/login`.
- Authenticated dashboard uses `next-auth` for session management and fetches data from internal API routes.
- Dashboard pages include:
  - `/contracts` — contract repository and search filters.
  - `/contracts/upload` — upload form with drag-and-drop and progress handling.
  - `/contracts/[id]` — contract detail page with clause list, risk/bias/strength scoring, and actions.
  - `/templates` — template browsing, filtering, and generation.

### Backend and API Architecture

The backend is built entirely on Next.js route handlers.

- `app/api/contracts/route.ts` — list contracts and create new contract uploads.
- `app/api/contracts/[id]/route.ts` — read, update, delete contract metadata.
- `app/api/contracts/[id]/analyze/route.ts` — run full contract analysis over each extracted clause.
- `app/api/clauses/[id]/benchmark/route.ts` — benchmark a single clause.
- `app/api/clauses/[id]/stress-test/route.ts` — adversarial stress testing on a single clause.
- `app/api/clauses/rewrite/route.ts` — rewrite a clause in a chosen style.
- `app/api/analysis/ethics/route.ts` — ethics and bias scan for a contract.
- `app/api/templates/route.ts` — list templates and create new templates (admin only).
- `app/api/templates/[id]/route.ts` — read/update/delete a specific template.
- `app/api/templates/[id]/generate/route.ts` — generate a new contract from a template.
- `app/api/dashboard/stats/route.ts` — dashboard analytics stats.
- `app/api/search/route.ts` — text-based search across contracts and clauses.

### Database Model

The Prisma schema defines the core domain models:

- `User`: authentication, jurisdiction, role, and relationships to contracts and analyses.
- `Contract`: uploaded or generated contracts, raw and cleaned text, metadata, scores, and status.
- `Clause`: extracted clause segments with risk/bias/strength scores and AI analysis payloads.
- `ClauseVersion`: revision history for clauses.
- `AnalysisResult`: saved analysis outputs for contracts and clause operations.
- `StressTest`: saved adversarial stress test results.
- `Template`: contract templates, fields, and jurisdiction metadata.
- `RiskProfile`: user risk preferences and clause patterns.
- `Webhook`: webhook configuration for future event integration.

### AI Pipeline

`ai/analysis.ts` defines the AI functions and response shapes. Each function uses the OpenAI chat completion API with a system instruction from `ai/prompts.ts` and expects strict JSON output.

Key AI functions:

- `analyzeClause()` — clause risk, bias, strength, and issue detection.
- `detectLoopholes()` — contract-level loophole and gap identification.
- `assessFairness()` — fairness scoring and imbalance analysis.
- `stressTestClause()` — adversarial attack simulation and litigation risk.
- `rewriteClause()` — style-based clause rewriting.
- `scanEthics()` — ethics/bias scan for contract language.
- `benchmarkClause()` — clause benchmarking and market alignment.
- `generateFromTemplate()` — template-driven contract generation.

Prompts are jurisdiction-aware and enforce JSON-only responses, which makes the pipeline deterministic for the backend.

### Document Parsing

`lib/parsing.ts` handles uploaded documents and text extraction.

- Supports file formats: `pdf`, `docx`, `txt`, `rtf`, `md`
- Uses `pdf-parse` for PDFs and `mammoth` for DOCX.
- Implements text cleaning, noise removal, section boundary detection, and clause splitting.
- Category detection is keyword-based for common contract topics like Payment, Termination, Liability, Confidentiality, IP, Dispute Resolution, and more.

### Authentication

`lib/auth.ts` configures `next-auth` with:

- `CredentialsProvider` (email/password)
- JWT session strategy
- Custom `authorize()` logic validating against `User` records
- Password hashing with `bcryptjs`
- Extended session payload including `user.id` and `user.role`

### OpenAI Client

`lib/openai.ts` creates a singleton OpenAI client and exports `AI_MODEL`.

- Model default: `gpt-4o-mini`
- API key loaded from `process.env.OPENAI_API_KEY`
- Singleton ensures a single client instance during development.

---

## Main Features

- Contract upload and multi-format parsing (PDF, DOCX, TXT, RTF, Markdown)
- Clause extraction and categorization
- Clause-by-clause AI risk, bias, and strength scoring
- Full contract analysis with loophole detection and fairness assessment
- Adversarial stress testing for clauses
- Clause benchmarking against industry standards
- Style transfer / clause rewriting in multiple legal tones
- Ethics and bias scanning for inclusive contract language
- Template browsing and AI generation of new contracts
- Contract repository, search, filtering, and analytics dashboard
- User roles and admin-only template management

---

## User Flow

### 1. Public landing and login

- The user arrives at `/` and sees a public marketing landing page (`app/page.tsx`).
- They click through to `/login` and authenticate via the credentials flow.
- Successful login gives access to the dashboard area under `app/(dashboard)`.

### 2. Dashboard overview

- `/dashboard` presents summary cards, recent contracts, and template quick actions.
- Dashboard stats are fetched from `GET /api/dashboard/stats`.
- The user can navigate to the contract repository, templates, or upload workflow.

### 3. Upload contract

- The user goes to `/contracts/upload`.
- They select or drag-and-drop a file.
- The upload action posts to `POST /api/contracts`.
- Server-side parsing extracts raw and cleaned text, clause segments, and saves the contract and clauses in the database.
- On completion, the user is redirected to `/contracts/[id]`.

### 4. Contract detail and analysis

- The user views `/contracts/[id]` for contract details.
- The page reads contract data from `GET /api/contracts/[id]`.
- If the contract is not analyzed, they click "Analyze Contract".
- This triggers `POST /api/contracts/[id]/analyze`.

Analysis flow inside `POST /api/contracts/[id]/analyze`:

1. Fetch contract and clauses.
2. Mark contract `status = parsing`.
3. For each clause, call `analyzeClause()`.
4. Store clause scores and analysis JSON.
5. Run contract-level `detectLoopholes()` and `assessFairness()`.
6. Update contract scores and status to `analyzed`.
7. Save a `AnalysisResult` record with aggregated outputs.

### 5. Clause operations

On the contract detail page, each clause may be expanded to reveal:

- Clause text and AI issues
- Risk / bias / strength badges
- Suggested revisions and explanation
- Action buttons for:
  - Stress testing: `POST /api/clauses/[id]/stress-test`
  - Benchmarking: `POST /api/clauses/[id]/benchmark`
  - Rewriting: `POST /api/clauses/rewrite`

### 6. Templates and generation

- `/templates` lists available templates and filters by category and jurisdiction.
- Template data is fetched from `GET /api/templates`.
- Selecting a template and providing fields triggers `POST /api/templates/[id]/generate`.
- The backend uses AI to generate a complete contract text, cleans it, splits into clauses, and stores it as a new `Contract`.

### 7. Search

- Search across contracts and clauses uses `POST /api/search`.
- It currently performs text matching on contract title, cleaned text, and clause text.
- Search results return both contract and clause matches.

---

## Repository Flow Details

### Upload Route Flow

`app/api/upload/route.ts` is a helper route that parses uploaded files and returns preview data, but contract creation is handled directly by `POST /api/contracts`.

- Validates auth session with `getServerSession(authOptions)`.
- Accepts form data file upload.
- Checks file size and supported extensions.
- Calls `parseDocument(buffer, fileExtension)`.
- Returns raw text, cleaned text, clause count, and preview.

### Contract Creation Flow

`app/api/contracts/route.ts`: `POST` receives uploaded file + metadata.

- Parses the uploaded file.
- Creates `Contract` plus nested `Clause` rows in the database.
- Uses `parsed.clauses` data from `lib/parsing.ts`.

### Contract Read/Update/Delete Flow

`app/api/contracts/[id]/route.ts` supports `GET`, `PATCH`, and `DELETE`.

- `GET` returns contract detail, clauses, and recent analyses.
- `PATCH` updates allowed contract fields: `title`, `jurisdiction`, `contractType`, `status`, `summary`.
- `DELETE` removes the contract and cascades relational records.

### Template CRUD and Generation Flow

- `app/api/templates/route.ts` lists templates and allows admin users to create new ones.
- `app/api/templates/[id]/route.ts` reads, updates, and deletes templates.
- `app/api/templates/[id]/generate/route.ts` generates a new contract from a template using AI, then stores it as a new `Contract` and clauses.

### Dashboard and Search Flow

- `GET /api/dashboard/stats` aggregates contract counts, risk distributions, and recent contract summaries.
- `POST /api/search` performs user-authenticated text search across contracts and clauses.

---

## Key Files and Their Roles

- `app/page.tsx` — public landing experience.
- `app/login/page.tsx` — sign-in page.
- `app/(dashboard)/dashboard/page.tsx` — logged-in dashboard overview.
- `app/(dashboard)/contracts/page.tsx` — contract repository list.
- `app/(dashboard)/contracts/upload/page.tsx` — upload workflow.
- `app/(dashboard)/contracts/[id]/page.tsx` — contract details, clause actions, and analysis.
- `app/(dashboard)/templates/page.tsx` — template browsing and generation.
- `app/api/.../route.ts` — all authenticated backend API entrypoints.
- `lib/auth.ts` — next-auth credentials provider configuration.
- `lib/db.ts` — Prisma database client.
- `lib/openai.ts` — OpenAI client singleton.
- `lib/parsing.ts` — document extraction and clause parsing.
- `ai/analysis.ts` — AI analysis, prompts, and result model contract.
- `ai/prompts.ts` — jurisdiction-specific system prompts.
- `prisma/schema.prisma` — data model definitions.

---

## Notes on Flow and Behavior

- Authentication is required on all API routes using `getServerSession(authOptions)`.
- Uploaded documents are parsed into text before AI analysis and DB storage.
- Clause extraction is performed by `lib/parsing.ts` before the contract analysis step.
- AI analysis uses JSON-only prompts to keep backend parsing stable.
- The contract detail page supports interactive clause actions without creating separate dedicated pages for each action.
- Template generation creates contracts directly in the user library.

---

## Deployment and Environment

The repository is configured for standard Next.js deployment.

Key project config:

- `package.json` scripts for `dev`, `build`, `start`, `lint`, `prisma generate`, and database commands.
- `next.config.js` enables server-side external packages for `pdf-parse` and `mammoth`.
- `tsconfig.json` includes TypeScript settings and path alias `@/*`.
- `prisma/schema.prisma` uses a PostgreSQL datasource and a Prisma client generator.

Typical environment variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`
- `AI_MODEL` (optional)

---

## Summary

This repo is a focused legal AI application with a clear flow:

1. Public landing page -> login
2. Dashboard overview -> contract repository
3. Upload or generate contract -> parse clauses
4. Run analysis -> clause scores, loopholes, fairness
5. Drill into clauses -> rewrite, benchmark, stress test
6. Save results to PostgreSQL via Prisma

The architecture is centered on Next.js route handlers and a strong AI prompt pipeline, supported by document ingestion and a data model designed for contracts, clauses, analyses, and templates.
