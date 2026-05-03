# Clause AI — Contract Intelligence Platform DevKnight

AI-powered contract analysis, loophole detection, fairness assessment, and legal drafting platform.

Built with Next.js, TypeScript, Prisma, OpenAI, and TailwindCSS.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Complete Setup Guide](#complete-setup-guide)
  - [Section 1 — Local Development](#section-1--local-development-setup)
  - [Section 2 — Environment Variables](#section-2--environment-variables)
  - [Section 3 — Neon Database](#section-3--neon-database-setup)
  - [Section 4 — OpenAI API](#section-4--openai-api-setup)
  - [Section 5 — File Storage](#section-5--file-storage-setup)
  - [Section 6 — GitHub Repository](#section-6--github-repository-setup)
  - [Section 7 — CI/CD Pipeline](#section-7--github-actions-cicd)
  - [Section 8 — Vercel Deployment](#section-8--vercel-deployment)
  - [Section 9 — Domain & CDN](#section-9--domain--cdn)
  - [Section 10 — Production Migrations](#section-10--production-database-migrations)
  - [Section 11 — Admin User Creation](#section-11--admin-user-creation)
  - [Section 12 — Document Parsing](#section-12--document-parsing-setup)
  - [Section 13 — Testing the System](#section-13--testing-the-system)
  - [Section 14 — Production Security](#section-14--production-security)
  - [Section 15 — Project Structure](#section-15--project-folder-structure)
  - [Section 16 — Troubleshooting](#section-16--troubleshooting)
- [Default Credentials](#default-credentials)
- [License](#license)

---

## Features

- **Contract Analysis** — Upload PDF, DOCX, TXT, RTF, or Markdown contracts for AI-powered analysis
- **Loophole Detection** — Find exploitable language, missing clauses, and one-sided obligations
- **Fairness Assessment** — Evaluate contract balance with bias detection and reciprocity analysis
- **Adversarial Stress Testing** — "Break My Clause" simulates opposing lawyers attacking your clauses
- **Clause Benchmarking** — ClauseScore™ rates each clause against industry standards
- **Legal Style Transfer** — Rewrite clauses in Corporate, Startup, Assertive, or Plain Language styles
- **Ethics & Bias Scanner** — Detect gender, racial, geographic bias and power imbalances
- **Smart Templates** — Generate contracts from templates with form fields
- **Multi-Jurisdiction** — Support for US, India, and UK legal systems
- **Stakeholder Views** — CXO, Legal, and Client views for different audiences
- **Clause Evolution Timeline** — Version history tracking for every clause change
- **Semantic Search** — Search across all contracts using AI embeddings
- **Analytics Dashboard** — Risk heatmaps, trend charts, and clause distribution analysis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | TailwindCSS, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes (Route Handlers) |
| Database | Neon Postgres (Free Tier) |
| ORM | Prisma |
| Authentication | NextAuth.js (Credentials) |
| AI | OpenAI API (GPT-4o-mini) |
| File Parsing | pdf-parse, mammoth |
| Charts | Recharts |
| Deployment | Vercel (Free Tier) |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/clause-ai.git
cd clause-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values (see Section 2 below)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with default users and templates
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Complete Setup Guide

This guide covers every step from zero to production. It assumes you have:
- A Windows computer
- Node.js 18+ installed ([download](https://nodejs.org))
- A GitHub account
- A Vercel account
- An OpenAI API key

---

### Section 1 — Local Development Setup

#### 1.1 Install Node.js

Download and install Node.js LTS from [nodejs.org](https://nodejs.org). Verify installation:

```bash
node --version    # Should show v18.x or v20.x
npm --version     # Should show 9.x or 10.x
```

#### 1.2 Clone the Repository

```bash
git clone https://github.com/your-username/clause-ai.git
cd clause-ai
```

#### 1.3 Install Dependencies

```bash
npm install
```

This installs all required packages:
- **next** — React framework with server-side rendering
- **prisma** — Database ORM for type-safe queries
- **next-auth** — Authentication library
- **openai** — OpenAI API client
- **pdf-parse** — PDF text extraction
- **mammoth** — DOCX text extraction
- **recharts** — Chart library for analytics
- **tailwindcss** — Utility-first CSS framework
- **shadcn/ui components** — Pre-built UI components

#### 1.4 Set Up Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials (see Section 2).

#### 1.5 Set Up Prisma

```bash
# Generate the Prisma client (TypeScript types for your database)
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

**What these commands do:**
- `prisma generate` creates TypeScript types that match your database schema
- `prisma migrate dev` creates the database tables defined in `prisma/schema.prisma`

#### 1.6 Seed the Database

```bash
npm run db:seed
```

This creates:
- Default admin user (admin@clauseai.com / admin123)
- Default demo user (user@clauseai.com / password)
- Sample contract templates (NDA, Service Agreement, Employment Contract)

#### 1.7 Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Clause AI landing page.

---

### Section 2 — Environment Variables

Create a `.env` file in the project root with these variables:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/clauseai?sslmode=require"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-key-here"
```

#### Where to Get Each Value

| Variable | Source | How to Get It |
|----------|--------|---------------|
| `DATABASE_URL` | [Neon.tech](https://neon.tech) | See Section 3 |
| `NEXTAUTH_SECRET` | Generate locally | Run: `openssl rand -base64 32` or use any random 32+ character string |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` for dev, your domain for production |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) | See Section 4 |

#### Generating a Secure Secret

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

On macOS/Linux:
```bash
openssl rand -base64 32
```

#### Security Notes
- Never commit `.env` to Git (it's in `.gitignore`)
- Use different secrets for development and production
- Rotate secrets periodically
- In production, set environment variables through Vercel's dashboard

---

### Section 3 — Neon Database Setup

[Neon](https://neon.tech) provides free serverless Postgres databases.

#### Step 1: Create Account
1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" and create an account (GitHub login works)

#### Step 2: Create Project
1. Click "New Project"
2. Name: `clause-ai`
3. Region: Choose the closest to your users
4. Postgres Version: Latest (16+)
5. Click "Create Project"

#### Step 3: Get Connection String
1. After creation, you'll see your connection string
2. It looks like: `postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. Copy this string

#### Step 4: Add to .env
```env
DATABASE_URL="postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

#### Connection String Format
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```
- **user** — Your Neon username (auto-generated)
- **password** — Your Neon password (auto-generated)
- **host** — Neon endpoint (e.g., ep-cool-name-123456.us-east-2.aws.neon.tech)
- **database** — Database name (default: neondb)
- **sslmode=require** — Required for secure connections

#### Free Tier Limits
- 512 MB storage
- 1 project
- 10 branches
- 3 GB data transfer per month

---

### Section 4 — OpenAI API Setup

#### Step 1: Create Account
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in

#### Step 2: Generate API Key
1. Go to [API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Name it "Clause AI"
4. Copy the key immediately (it won't be shown again)

#### Step 3: Add to .env
```env
OPENAI_API_KEY="sk-your-api-key-here"
```

#### Step 4: Add Credits
1. Go to [Billing](https://platform.openai.com/account/billing)
2. Add a payment method
3. Add credits ($5-10 is plenty for testing)

#### Cost Estimation
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- A typical contract analysis uses ~2,000-5,000 tokens
- Estimated cost: ~$0.001-0.003 per contract analysis

#### Testing the API
You can verify your key works with this curl command:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Say hello"}]}'
```

---

### Section 5 — File Storage Setup

For file uploads, you can use **Vercel Blob** (simplest with Vercel deployment).

#### Option A: Vercel Blob (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to Storage → Create → Blob
3. Name your store: `clause-ai-uploads`
4. Copy the `BLOB_READ_WRITE_TOKEN`
5. Add to environment variables:
```env
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxx"
```

#### Option B: Local Storage (Development)

For development, files are processed in-memory and the extracted text is stored in the database. No external storage is required for basic functionality.

---

### Section 6 — GitHub Repository Setup

#### Step 1: Create Repository
1. Go to [github.com/new](https://github.com/new)
2. Name: `clause-ai`
3. Set to Private
4. Don't initialize with README (we already have one)
5. Click "Create repository"

#### Step 2: Initialize Git Locally
```bash
cd clause-ai
git init
git add .
git commit -m "Initial commit: Clause AI contract intelligence platform"
```

#### Step 3: Link to GitHub
```bash
git remote add origin https://github.com/your-username/clause-ai.git
```

#### Step 4: Push Code
```bash
git branch -M main
git push -u origin main
```

---

### Section 7 — GitHub Actions CI/CD

The project includes a CI/CD pipeline at `.github/workflows/deploy.yml`.

#### What It Does

On every push to `main` and every pull request:

1. **Lint & Type Check** — Runs ESLint and TypeScript compiler
2. **Build** — Builds the Next.js application
3. **Migrate** — Runs database migrations (only on push to main)

#### Setting Up Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `DATABASE_URL` — Your Neon connection string
   - `NEXTAUTH_SECRET` — Your NextAuth secret
   - `OPENAI_API_KEY` — Your OpenAI API key

#### How CI Works

When you push code:
1. GitHub detects the push and triggers the workflow
2. It spins up a Ubuntu container
3. Installs Node.js and your dependencies
4. Runs lint checks (`npm run lint`)
5. Runs TypeScript type checking (`npx tsc --noEmit`)
6. Builds the project (`npm run build`)
7. If on main branch, runs database migrations

If any step fails, the pipeline stops and you get a notification.

---

### Section 8 — Vercel Deployment

#### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account

#### Step 2: Import Project
1. Click "New Project"
2. Import your `clause-ai` GitHub repository
3. Vercel auto-detects it as a Next.js project

#### Step 3: Configure Environment Variables
In the Vercel project settings, add:
- `DATABASE_URL` — Your Neon connection string
- `NEXTAUTH_SECRET` — Your NextAuth secret (use a different one from dev)
- `NEXTAUTH_URL` — Your Vercel URL (e.g., `https://clause-ai.vercel.app`)
- `OPENAI_API_KEY` — Your OpenAI API key

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for the build to complete (2-3 minutes)
3. Your app is live at `https://your-project.vercel.app`

#### Automatic Deployments
After initial setup, every push to `main` automatically triggers a new deployment. Pull requests get preview deployments with unique URLs.

#### Build Settings (Auto-detected)
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

---

### Section 9 — Domain & CDN

#### Custom Domain on Vercel
1. Go to your Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

#### Cloudflare CDN (Optional)

For additional performance and security:

1. **Create Cloudflare Account** at [cloudflare.com](https://cloudflare.com)
2. **Add Your Domain** — Enter your domain and select the Free plan
3. **Update Nameservers** — Change your domain's nameservers to Cloudflare's
4. **Configure DNS** — Add a CNAME record pointing to your Vercel deployment
5. **Enable Features:**
   - SSL/TLS → Full (strict)
   - Caching → Standard
   - Auto Minify → Enable for JavaScript, CSS, HTML
   - Brotli → Enable

#### SSL Configuration
- Vercel provides free SSL certificates automatically
- With Cloudflare, use "Full (strict)" SSL mode

---

### Section 10 — Production Database Migrations

#### Running Migrations

In production, use `migrate deploy` (not `migrate dev`):

```bash
npx prisma migrate deploy
```

**Difference between commands:**
- `migrate dev` — For development. Creates migration files, resets data if needed
- `migrate deploy` — For production. Only applies pending migrations, never resets data

#### Safe Migration Practices

1. **Always backup** before running migrations
2. **Test migrations** in a staging environment first
3. **Never delete** migration files from the `prisma/migrations` folder
4. **Review SQL** in each migration file before deploying
5. **Use Neon branching** to test migrations on a copy of your database

#### Running Migrations on Vercel

Add a build command in `package.json`:
```json
"build": "prisma migrate deploy && next build"
```

Or set in Vercel project settings → Build Command:
```
npx prisma migrate deploy && npx next build
```

---

### Section 11 — Admin User Creation

#### Option A: Using the Seed Script

The seed script creates default users:

```bash
npm run db:seed
```

Default accounts:
- **Admin:** admin@clauseai.com / admin123
- **User:** user@clauseai.com / password

**Important:** Change these passwords in production!

#### Option B: Using users.json

Edit `config/users.json` to add users:

```json
{
  "users": [
    {
      "email": "admin@yourcompany.com",
      "password": "hashed-password-here",
      "name": "Admin Name",
      "role": "admin"
    }
  ]
}
```

Generate a password hash:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 12).then(h => console.log(h))"
```

#### Option C: Using the Admin Panel

1. Sign in as admin
2. Go to Settings → Admin tab
3. Add users through the interface

---

### Section 12 — Document Parsing Setup

The application uses these libraries for document parsing:

| Format | Library | Notes |
|--------|---------|-------|
| PDF | pdf-parse | Extracts text from PDF files |
| DOCX | mammoth | Extracts text from Word documents |
| TXT | Built-in | Direct text reading |
| RTF | Built-in | Regex-based RTF stripping |
| Markdown | Built-in | Direct text reading |

All libraries are installed automatically via `npm install`.

#### How Parsing Works

1. **Upload** — File is received as a Buffer
2. **Extract** — Raw text is extracted using the appropriate library
3. **Clean** — Text is cleaned (whitespace, headers, page numbers removed)
4. **Split** — Text is split into individual clauses (by section numbers, headings)
5. **Categorize** — Each clause is auto-categorized (Payment, Termination, etc.)
6. **Store** — Clause objects are saved to the database

#### OCR Fallback

For scanned PDFs, the system falls back to raw text extraction. For production OCR, you can add tesseract.js:

```bash
npm install tesseract.js
```

---

### Section 13 — Testing the System

After deployment, verify these features:

#### Checklist

- [ ] **Landing Page** — Loads at root URL with features and CTA
- [ ] **Login** — Sign in with default credentials
- [ ] **Dashboard** — Shows overview cards and charts
- [ ] **Upload Contract** — Upload a PDF/DOCX file
- [ ] **Clause Extraction** — Verify clauses are split correctly
- [ ] **Risk Scoring** — Run analysis and check risk scores
- [ ] **Loophole Detection** — Check for identified loopholes
- [ ] **Adversarial Test** — Run "Break My Clause" stress test
- [ ] **AI Rewrite** — Rewrite a clause in different styles
- [ ] **Templates** — Generate contract from template
- [ ] **Analytics** — View charts and statistics
- [ ] **Settings** — Update profile and preferences
- [ ] **Admin Panel** — Add/remove users (admin only)

#### Sample Test Contract

Upload any contract PDF or create a test file with:

```
SERVICE AGREEMENT

1. SERVICES
The Provider shall deliver consulting services as described in Exhibit A.

2. PAYMENT
Client shall pay all invoices within 30 days. Late payments shall incur a 5% penalty.

3. TERMINATION
Provider may terminate at any time without cause. Client must provide 90 days notice.

4. LIABILITY
Provider's liability is limited to fees paid in the last 12 months.

5. CONFIDENTIALITY
Both parties agree to maintain confidentiality. This obligation survives termination.
```

This sample has intentional issues (one-sided termination, penalty imbalance) that the AI should detect.

---

### Section 14 — Production Security

#### Rate Limiting

Add rate limiting to API routes to prevent abuse. The architecture supports middleware-based rate limiting:

```typescript
// Example: Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
```

#### Secure Headers

Next.js provides security headers. Add to `next.config.js`:

```javascript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
    ],
  }];
}
```

#### File Upload Limits

- Maximum file size: 10MB (enforced in API routes)
- Allowed types: PDF, DOCX, DOC, TXT, RTF, MD
- Files are processed in-memory and text is stored in the database

#### OpenAI Cost Control

- Use GPT-4o-mini (cheapest model with good quality)
- Set max_tokens limits on API calls
- Monitor usage at platform.openai.com/usage
- Set spending limits in OpenAI dashboard

---

### Section 15 — Project Folder Structure

```
clause-ai/
├── app/                    # Next.js App Router pages and API routes
│   ├── (dashboard)/        # Authenticated dashboard routes
│   │   ├── dashboard/      # Main dashboard page
│   │   ├── contracts/      # Contract management
│   │   ├── analysis/       # Analysis hub
│   │   ├── drafting/       # AI drafting interface
│   │   ├── templates/      # Template management
│   │   ├── analytics/      # Charts and reports
│   │   └── settings/       # User settings
│   ├── api/                # API route handlers
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── contracts/      # Contract CRUD + analysis
│   │   ├── clauses/        # Clause operations
│   │   ├── analysis/       # Ethics scanner
│   │   ├── templates/      # Template CRUD + generation
│   │   ├── upload/         # File upload handler
│   │   ├── search/         # Semantic search
│   │   └── dashboard/      # Dashboard statistics
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   └── layout/             # Layout components (sidebar, header)
├── lib/                    # Core utilities
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client singleton
│   ├── openai.ts           # OpenAI client singleton
│   ├── parsing.ts          # Document parsing pipeline
│   └── utils.ts            # Shared utilities
├── ai/                     # AI layer
│   ├── prompts.ts          # OpenAI prompt templates
│   ├── analysis.ts         # AI analysis functions
│   └── embeddings.ts       # Semantic search embeddings
├── config/                 # Configuration
│   ├── users.json          # User accounts (admin managed)
│   └── jurisdictions.ts    # Legal jurisdiction config
├── prisma/                 # Database
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data script
├── types/                  # TypeScript declarations
│   └── next-auth.d.ts      # NextAuth type extensions
├── .github/workflows/      # CI/CD
│   └── deploy.yml          # GitHub Actions pipeline
├── .env.example            # Environment variable template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── next.config.js          # Next.js config
└── README.md               # This file
```

---

### Section 16 — Troubleshooting

#### Prisma Connection Errors

**Error:** `Can't reach database server`
- Verify your `DATABASE_URL` in `.env`
- Check that `?sslmode=require` is at the end
- Ensure your Neon project is active (free tier pauses after 5 min inactivity)
- Try connecting from Neon's SQL Editor to verify credentials

**Error:** `Migration failed`
- Run `npx prisma migrate reset` to reset (WARNING: deletes all data)
- Check for syntax errors in `schema.prisma`
- Ensure your database user has CREATE TABLE permissions

#### OpenAI API Failures

**Error:** `401 Unauthorized`
- Verify your API key is correct in `.env`
- Check that the key hasn't been revoked
- Ensure you have credits on your OpenAI account

**Error:** `429 Rate limit exceeded`
- You're sending too many requests
- Add delays between API calls
- Upgrade your OpenAI plan if needed

**Error:** `Model not found`
- Check the `AI_MODEL` variable
- Default is `gpt-4o-mini` — ensure your account has access

#### Vercel Deployment Issues

**Build fails with "Module not found"**
- Run `npm install` locally and commit `package-lock.json`
- Check import paths use `@/` prefix correctly

**Environment variable not found**
- Add all variables in Vercel dashboard → Settings → Environment Variables
- Redeploy after adding variables

**Prisma client not generated**
- Ensure `"postinstall": "prisma generate"` is in `package.json`

#### File Upload Failures

**Error:** `File too large`
- Maximum file size is 10MB
- Compress the file or split into smaller documents

**Error:** `Unsupported file type`
- Supported: PDF, DOCX, DOC, TXT, RTF, MD
- Ensure file extension matches the actual format

**PDF text extraction returns empty**
- The PDF may be scanned/image-based
- Try OCR or convert to a text-based PDF

#### General Issues

**Blank page after login**
- Clear browser cache and cookies
- Check browser console for JavaScript errors
- Verify `NEXTAUTH_URL` matches your actual URL

**Styles not loading**
- Run `npm run dev` and check for PostCSS errors
- Verify `tailwind.config.ts` content paths include your files

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clauseai.com | admin123 |
| User | user@clauseai.com | password |

**Change these immediately in production!**

---

## Database Schema

### Core Models

- **User** — Application users with roles (admin/user)
- **Contract** — Uploaded contracts with parsed text and scores
- **Clause** — Individual clauses extracted from contracts
- **ClauseVersion** — Version history for clause changes
- **AnalysisResult** — AI analysis results (loophole, fairness, ethics, etc.)
- **StressTest** — Adversarial stress test results
- **Template** — Contract templates with form fields
- **RiskProfile** — User-specific risk preferences
- **Webhook** — Integration webhook configurations

### ClauseGraph (Future)

The schema is designed to support a future knowledge graph connecting:
- Contracts ↔ Clauses (one-to-many)
- Clauses ↔ ClauseVersions (one-to-many)
- Clauses ↔ StressTests (one-to-many)
- Users ↔ Contracts (one-to-many)
- Users ↔ RiskProfiles (one-to-one)

---

## License

Proprietary. All rights reserved.
