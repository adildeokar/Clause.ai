# Clause AI — Everything Document

The single reference for Clause AI: what every feature does, how it behaves, where it lives in the code, and what is still unfinished. Part 1 is written for anyone; later parts are for developers.

**Product:** Clause AI — Contract Intelligence Platform
**Stack:** Next.js 14 (App Router) · TypeScript · Prisma 6 · PostgreSQL (Neon) · NextAuth · OpenAI · Tailwind CSS
**Live data model, routes and limits below reflect the code on `main` as of 2026-10-11.**

### Feature status at a glance

| Area | Status |
|---|---|
| Login, route protection | ✅ Working |
| Upload (PDF, Word, ODT, RTF, TXT, MD, HTML, scans, photos) | ✅ Working |
| Clause extraction (English, French, Portuguese headings) | ✅ Working |
| Full contract analysis (risk, bias, strength, loopholes, fairness, summary) | ✅ Working |
| Clause tools: stress test, rewrite (with "Apply rewrite"), benchmark | ✅ Working |
| Break My Clause (two AI counsel debate a clause, a judge scores it) | ✅ Working |
| Ethics scan | ✅ Working (started from the Analysis page) |
| Jurisdictions: US, India, UK, **France, Brazil** | ✅ Working |
| Drafting (clause rewriter) | ✅ Working |
| Rule Book (generate contracts from templates, any jurisdiction, local language) | ✅ Working |
| Dashboard, Repository, Analysis pages | ✅ Working on real data |
| Settings → default jurisdiction | ✅ Saved |
| Settings → name, risk profile, preferences, team | ⚠️ Interface only, not saved yet |
| Analytics page | ⚠️ Shows sample data |
| Chat with Document | ✅ Working |

---

## Part 1 — For everyone

### 1.1 What Clause AI is

Clause AI reads contracts for you. You upload a document — an NDA, a service agreement, terms of service, an employment contract — and it:

1. extracts the text (even from scanned pages and photos),
2. splits it into clauses using the document's own headings,
3. scores every clause for **risk**, **one-sidedness (bias)** and **legal strength**,
4. looks across the whole contract for **loopholes** and judges whether it is **fair** to both sides,
5. writes a short **summary** of what the contract is,
6. lets you **stress-test**, **rewrite** or **benchmark** any clause, and run an **ethics/bias scan**.

It also **drafts**: rewrite a clause in a different style, or generate a full contract from a template — adapted to the law of the country you choose, optionally written in French or Portuguese.

Every AI answer takes the chosen **jurisdiction** into account: United States, India, United Kingdom, France or Brazil.

### 1.2 How to read the scores

All scores run from **0 to 100**.

| Score | 100 means | Colour bands |
|---|---|---|
| Risk | most dangerous | Low < 30 · Medium 30–49 · High 50–69 · Critical ≥ 70 |
| Bias | completely one-sided | same bands as risk |
| Strength | clear, complete, enforceable | High is good: ≥ 70 green · 50–69 yellow · 30–49 orange · < 30 red |
| Fairness / Ethics | perfectly balanced / fully inclusive | High is good |
| Confidence | the AI is confident in its review | shown as a percentage |

A contract's overall risk, bias and strength are the averages over clauses that contain real obligations. Titles, preambles, party details and signature blocks are deliberately **not scored**, so they don't make a contract look safer than it is.

A contract counts as a **High Risk** alert on the dashboard when its overall risk is 70 or more.

### 1.3 The typical journey

1. Sign in.
2. Pick your **working jurisdiction** in the top bar (it is remembered).
3. **Upload** a document → you land on the contract page and the **analysis starts automatically** (usually 5–15 seconds).
4. Read the scores, the clause-by-clause findings, the loopholes and the fairness verdict.
5. Open any clause to stress-test it, get a rewrite or benchmark it.
6. Use **Drafting** to polish wording, or the **Rule Book** to generate a new contract.

---

## Part 2 — Every screen and what it does

### 2.1 Landing page (`/`)

Public marketing page: headline, four feature cards (Contract Analysis, Loophole Detection, Fairness Assessment, Adversarial Stress Testing) and "Get Started" / "Sign In" buttons that go to `/login`.

### 2.2 Login (`/login`)

- Email + password form. Emails are matched case-insensitively.
- A wrong email and a wrong password show the **same** message ("Invalid email or password"), so the form can't be used to discover which accounts exist.
- On success: a short "Welcome!" state, then a full page load of `/dashboard`.
- Sessions last **30 days** (signed JWT cookie).

### 2.3 App shell (all signed-in pages)

**Top bar**
- "Clause.Ai" title (links to the dashboard).
- **Working jurisdiction selector** (shows the code, e.g. `FR`). Changing it saves to your profile immediately and becomes the default for uploads, drafting and template generation. The same setting appears in Settings.
- **Account menu**: name and email, Settings, Sign out.
- On phones: a **menu button** opens the navigation as a slide-in drawer.

**Sidebar** (desktop; collapsible with "Collapse Sidebar")
- Dashboard · Repository · Manage Team · Rule Book
- *Intelligence:* AI Drafting · Analysis · Analytics
- Settings (bottom)

**Route protection:** visiting any app page while signed out redirects to `/login`. After signing in you land on the dashboard (not the page you originally requested).

### 2.4 Dashboard (`/dashboard`)

- **Draft New Contract** — a scrollable carousel: a "Blank Contract" tile (opens Drafting) and up to 8 templates. Clicking a template opens it directly in the Rule Book's generate dialog.
- **Four stat cards** (your contracts only):
  - **Analyzed** — contracts with status *analyzed*
  - **High Risk** — overall risk ≥ 70
  - **Awaiting Analysis** — uploaded or currently analyzing
  - **Total** — all contracts
- **Recent Contracts** — your 10 newest contracts with a search box (filters by title) and "See all". Columns: name, status, uploaded date, region (jurisdiction), risk score, number of clauses, contract type.

### 2.5 Repository (`/contracts`)

- Every contract you uploaded or generated, newest first, **20 per page** with Previous/Next.
- **Search** (debounced) matches the title **and the full document text**.
- **Status filter**: All · Analyzed · Not analyzed · Analyzing · Failed.
- "Upload contract" / "Upload" buttons.

**Status labels**

| Internal status | Shown as | Meaning |
|---|---|---|
| `uploaded` | Not analyzed | Text extracted, no analysis yet |
| `parsing` | Analyzing | Analysis in progress (or was interrupted — you can re-run it) |
| `analyzed` | Analyzed | Scores and findings available |
| `error` | Failed | The last analysis failed — re-run it |

### 2.6 Upload (`/contracts/upload`)

- **Drag and drop** or browse for one file.
- **Accepted formats:** PDF · Word (`.docx` and legacy `.doc`) · OpenDocument (`.odt`) · RTF · TXT · Markdown · HTML/HTM · images (`.png`, `.jpg`, `.jpeg`, `.webp`).
- **Scanned PDFs and photos** are read with AI OCR (see 3.3). The page tells you this may take up to a minute.
- **Maximum size: 4.5 MB** (the largest request Vercel accepts). Oversized or unsupported files are rejected before upload with a clear message.
- **Title** (required; pre-filled from the file name).
- **Jurisdiction** (defaults to your working jurisdiction).
- **Contract type** (optional; 15 types such as Service Agreement, NDA, Employment Contract, Terms of Service, Privacy Policy).
- **Upload & Analyze** — uploads, then opens the contract page, which **starts the analysis automatically**.
- Clear errors for: corrupted or password-protected files, files with no text, scans over 30 pages, failed OCR.

### 2.7 Contract page (`/contracts/[id]`)

**Header**
- Title, an inline **jurisdiction dropdown** (change it and re-analyze to review the same contract under another country's law), contract type, status badge, upload date.
- **Analyze Contract / Re-analyze** button — shows "Analyzing N clauses…" while running. Always available, including for contracts stuck in *Analyzing*.
- Analysis failures appear as a red banner; the page stays usable.

**Score rings** — overall Risk, Bias and Strength (0–100, colour-coded).

**Tabs**

| Tab | Contents |
|---|---|
| **Overview** | AI summary of the contract (after analysis) · details (file name, type, jurisdiction, contract type, clause count, analyses run, created/updated) · **Clause Risk Distribution** bars, riskiest first |
| **Clauses** (default) | One expandable card per clause: number, title, category, risk/bias/strength badges. Expanded: full clause text, up to 3 issues with severity, a **suggested revision** (redrafted clause in the clause's own language, only for risk ≥ 40), a short explanation, and the three clause tools (below) |
| **Analysis** | The last 5 analysis results: type, date, risk, confidence; detected **loopholes** and the **fairness assessment**; per-clause risk/bias results; ethics and benchmark results |
| **Timeline** | Clauses that have saved versions, with version and stress-test counts |

**Clause tools** (on each expanded clause)
- **Stress Test** — simulates opposing lawyers, a regulator and an arbitrator attacking the clause: up to 3 attack scenarios with success probability, litigation risk, severity index, up to 2 ambiguous readings and 2 defensive redrafts. Saved to the clause's stress-test history.
- **Rewrite** — a plain-language redraft in the clause's own language, with a list of changes and enforceability notes. Nothing is saved until applied.
- **Benchmark** — compares the clause with market practice: quality score, percentile, how common it is, court reception, strengths, weaknesses, missing elements, improvement suggestions. Saved as a *benchmark* analysis.

> Clause tool results currently appear as raw structured data. There is no "apply rewrite" or "delete contract" button yet, although the APIs exist (Part 6).

### 2.8 Analysis (`/analysis`)

- All your analysis results (newest 100), as cards: contract, type, date, issues found, risk badge. Clicking opens the contract.
- **Stats:** total analyses, average risk, most common type by issues found.
- **Search** by contract name; **filter** by type: Full Analysis · Ethics Scan · Clause Benchmark.
- **New Analysis** dialog: choose a contract and **Full Analysis** (clause scoring + loopholes + fairness) or **Ethics Scan** (bias, discrimination, power imbalance, accessibility). Benchmarks are started per clause from the contract page.

### 2.9 Drafting (`/drafting`)

- Paste a clause (up to 5,000 characters, any language) or pick a sample (Liability Limitation, Termination, Indemnification, Confidentiality).
- **Style:** Corporate · Startup Friendly · Assertive · Plain Language.
- **Jurisdiction:** any of the five (defaults to your working jurisdiction).
- **Result:** original and rewrite side by side with changed words highlighted, a list of changes with reasons, and enforceability notes. The rewrite stays in the input's language.
- **Use This Version** puts the rewrite back into the editor for further iteration; **Regenerate** asks again; **Copy** buttons.
- **Session History** — your last 20 rewrites in this browser session (restore or copy). Not saved to the database.

### 2.10 Rule Book (`/templates`)

- Template cards with category, base jurisdiction and number of fields. Search, category filter, jurisdiction filter.
- Seeded templates: **Non-Disclosure Agreement**, **Service Agreement**, **Employment Contract**.
- **Generate dialog:**
  - template preview,
  - **Generate for** — any of the five jurisdictions (the AI adapts provisions that would be unenforceable there),
  - **Draft in French / Portuguese** switch (for France / Brazil),
  - the template's fields (blank fields become `[TO BE COMPLETED]`).
- **Result:** the generated contract, the AI's notes on assumptions/adaptations, **Copy**, **Edit Fields**, and **Open & Analyze** — the contract is already saved to your Repository as "*Template name* (CODE)" and opening it starts the analysis.
- Generation takes about 10–20 seconds.

### 2.11 Settings (`/settings`)

| Tab | What works |
|---|---|
| **Profile** | **Default Jurisdiction — saved automatically** (same setting as the top bar). Display name field, read-only email and role. ⚠️ "Save Changes" does not persist the name yet. |
| **Preferences** | ⚠️ Default view and notification switches are not connected to anything yet. |
| **Risk Profile** | ⚠️ Tolerance slider, focus areas and voice profile are not saved yet. The backend already supports them (`PATCH /api/profile`) and the analysis prompts already use the stored tolerance and focus areas. |
| **Integrations** | DocuSign, Google Drive, Notion, Slack, HubSpot — marked *Coming Soon*. |
| **Admin** (admins only) | ⚠️ The user list and "Add User" are placeholders, not connected to the database. |

The sidebar's "Manage Team" link opens Settings (it does not yet jump to the Admin tab).

### 2.12 Analytics (`/analytics`)

⚠️ Shows **sample data** (labelled as such): risk trend, clause category distribution, jurisdiction comparison, ethics distribution and top risky clauses. Not yet connected to your contracts.

### 2.13 Chat with Document

✅ A chat panel on the contract page ("Chat with document" button, or the floating "Ask this document" button). On desktop it docks beside the page and opens automatically after an upload; on a phone it is full screen.

- Answers come only from the contract's text and cite the clauses they rely on as **[Clause N]** chips. Clicking a chip opens and highlights that clause.
- Documents up to about 40,000 characters are sent to the model whole. Longer ones use retrieval: clause embeddings (`text-embedding-3-small`, 512 dimensions, computed on the first question and stored), boosted by keyword overlap and by explicit references such as "article 12"; the opening clause (the parties) is always included.
- Answers stream in, follow-up questions use the last 8 messages, and the reply is in the language of the question. If the answer is not in the document, it says so.
- The conversation is saved per user and contract (`chat_messages`) and can be cleared. Editing a clause deletes its stored embedding.
- Code: `ai/chat.ts`, `app/api/contracts/[id]/chat/route.ts`, `components/app/document-chat.tsx`.

### 2.14 Break My Clause

✅ Every expanded clause has a **Break My Clause** button. It opens a debate that streams in turn by turn:

1. A **Challenger** agent attacks the clause and a **Defender** agent defends it, for two rounds. Each sees the clause and everything said so far.
2. A **Judge** agent scores both sides (0–100 each), names the round winners, lists the vulnerabilities exposed and may recommend a redrafted clause.
3. The clause's **Resilience score** is computed from the two scores (`50 + (defender − challenger) / 2`); a gap under 5 points is a draw. It appears as a badge on the clause.

The judge's revision can be applied in one click (saved as a new clause version). Debates are stored in `clause_debates`; editing a clause deletes its debates because they no longer match the text. A debate is 5 short AI calls (about 12–17 seconds). Scores vary a little between runs.

Code: `ai/debate.ts`, `app/api/clauses/[id]/debate/route.ts`, `components/app/clause-debate-dialog.tsx`.

---

## Part 3 — How the processing works

### 3.1 Upload pipeline (`lib/ingest.ts`, `lib/parsing.ts`)

1. **Validate** — extension and size (4.5 MB), on both the page and the server (`lib/file-types.ts` is the shared list).
2. **Extract text locally (free)**:
   - PDF → `pdf-parse`
   - DOCX → `mammoth`
   - DOC → `word-extractor`
   - ODT → unzip `content.xml` with `jszip`
   - RTF → built-in reader that keeps visible text (including bold/italic runs and accented characters) and drops fonts, colours and metadata
   - HTML → tags, scripts and styles stripped, entities decoded
   - TXT/MD → UTF-8 (UTF-16 and BOMs handled)
3. **OCR when needed** — images always; PDFs when they have almost no text (under ~40 characters per page). See 3.3.
4. **Clean** — normalise spaces and invisible characters, drop page numbers ("Page 3 of 10", "Página 2 de 5", "- 4 -"), and re-join lines that a PDF wrapped mid-sentence.
5. **Split into clauses** (3.2), **categorise**, and save the contract with all clauses in one insert.

### 3.2 Clause splitting

The splitter follows the document's own structure, in this order of preference:

1. **Keyword headings** in English, French and Portuguese: *Article, Art., Artigo, Section, Seção, Clause, Cláusula, Chapitre, Chapter, Capítulo, Titre, Título, Schedule, Annex(e), Anexo, Exhibit, Appendix* followed by a number, roman numeral, letter or ordinal word (*premier, primeira, segunda, …*). Example: `ARTICLE 3 – RÉSILIATION`, `CLÁUSULA SEGUNDA – DO PAGAMENTO`.
2. **Numbered headings** `1.`, `2)`, `1.1`, `3º` followed by a capitalised word — top level first, and only if the numbers run in sequence (so numbered lists inside a clause aren't mistaken for clauses).
3. Two-level numbering (`1.1`, `1.2`, `2.1`) if there is no top level.
4. **Roman numerals** (`IV. Payment`).
5. **ALL-CAPS heading lines**.
6. If there is no structure at all: chunks of about 2,000 characters at line breaks.

Then:
- Text before the first heading becomes a **Preamble** clause (parties, recitals).
- Heading-only fragments (a title with no body) are folded into the next clause.
- Clauses over 5,000 characters are split into "(cont.)" parts.
- At most **150 clauses**; very long documents merge neighbours.
- **Titles** are cleaned: numbering and separators removed, ALL-CAPS converted to Title Case, "Payment. The client shall…" → "Payment".

**Categories** (keyword scoring in English, French and Portuguese, title weighted 3×): Definitions · Payment · Term & Termination · Liability · Indemnification · Confidentiality · Intellectual Property · Data Protection · Dispute Resolution · Governing Law · Force Majeure · Warranty · Non-Compete · Assignment · Notices · General.

### 3.3 OCR for scans and photos

- **Photos** (`.png/.jpg/.jpeg/.webp`) are sent to the model as a high-detail image.
- **Scanned PDFs** are split into single pages with `pdf-lib` and each page is read in parallel (6 at a time), so a 10-page scan takes roughly as long as 2 pages.
- Limit: **30 pages** per scanned PDF.
- The model is told to transcribe exactly, in the original language, with no commentary.

### 3.4 Full analysis (`POST /api/contracts/[id]/analyze`)

Two things run **at the same time**:

- **Clause review** — clauses are sent **in batches** (up to 6 clauses / 7,000 characters per request, 6 requests in parallel) instead of one request per clause. Each clause gets risk, bias, strength and confidence (0–100), up to 3 issues, an optional redraft and a short explanation. Clauses under 40 characters are skipped.
- **Whole-contract review** — one request returns the **summary**, up to 6 **loopholes** (title, type, severity, affected clause, description, fix) with an overall loophole risk, and the **fairness** assessment (score, which party is favoured, assessment, up to 3 unconscionability flags).

Then, in one database transaction: clause scores and findings are saved, the contract gets its averages, status *analyzed* and summary, and a *full* analysis record is stored. If every clause batch fails or the review fails, the status becomes *Failed* and you can re-run it. Typical time: **5–15 seconds**.

The reviewer's saved **risk tolerance** and **focus areas** (risk profile) are added to both prompts.

### 3.5 Other AI features

| Feature | Endpoint | Input | Stored as |
|---|---|---|---|
| Stress test | `POST /api/clauses/[id]/stress-test` | one clause | `StressTest` row |
| Clause rewrite (contract page) | `POST /api/clauses/[id]/rewrite` | one clause + style | nothing (suggestion only) |
| Drafting rewrite | `POST /api/clauses/rewrite` | free text ≤ 5,000 chars + style + jurisdiction | nothing |
| Benchmark | `POST /api/clauses/[id]/benchmark` | one clause + its category | `AnalysisResult` (*benchmark*), risk = 100 − quality score |
| Ethics scan | `POST /api/analysis/ethics` | whole contract | `AnalysisResult` (*ethics*), risk = 100 − ethics score |
| Template generation | `POST /api/templates/[id]/generate` | template + fields + jurisdiction + language | new `Contract` with clauses |

### 3.6 Jurisdictions (`config/jurisdictions.ts`)

The single source of truth for every dropdown, label, validation and prompt.

| Code | Country | Legal system | Language | Key law given to the AI |
|---|---|---|---|---|
| US | United States | Common law | English | UCC Art. 2, state contract law, unconscionability, FTC Act / state consumer law, state non-compete limits (e.g. Cal. B&P §16600) |
| IN | India | Common law (Contract Act 1872) | English | Contract Act s.27, s.73–74, s.124; Specific Relief Act; Arbitration Act 1996; Consumer Protection Act 2019; DPDP Act 2023; stamp duty |
| UK | United Kingdom | Common law (English law) | English | UCTA 1977; Consumer Rights Act 2015; UK GDPR / DPA 2018; Late Payment Act 1998; penalty doctrine; restraint of trade |
| **FR** | **France** | Civil law (Code civil, 2016 reform) | French | Code civil art. 1104 (good faith), 1171 (imbalance in adhesion contracts), 1195 (imprévision), 1231-5 (penalty clauses); Code de commerce L442-1; Code de la consommation L212-1; Code du travail (paid non-competes); GDPR / CNIL; Loi Toubon |
| **BR** | **Brazil** | Civil law (Código Civil 2002) | Portuguese | Código Civil art. 421, 422, 423–424, 412 (penalty cap); CDC art. 51 (abusive clauses); CLT; LGPD; Lei de Arbitragem |

Every prompt states the jurisdiction, its legal system and these laws, and tells the model that documents may be in English, French or Portuguese: explanations are written in English, while redrafts and rewrites stay in the document's language.

---

## Part 4 — Cost and speed

### 4.1 Models

| Use | Model | Price per 1M tokens (input / output) |
|---|---|---|
| All analysis, drafting, generation, OCR | `gpt-4o-mini` — the cheapest "mini" model | $0.15 / $0.60 |
| Chat retrieval for long documents | `text-embedding-3-small` | $0.02 |

The chat model can be overridden with the `AI_MODEL` environment variable; nothing else uses a more expensive model.

### 4.2 How cost is kept down

- **Local text extraction** for every text-based format — AI is only used for OCR when a file has no text.
- **Batched clause review** — the instructions are sent once per 6 clauses instead of once per clause.
- **One whole-contract call** for loopholes, fairness and summary (previously two calls, each sending the full text).
- **Hard caps on output** — limited list lengths and word counts on every field (output tokens cost 4× input), plus a `max_tokens` limit on every request.
- **Input caps** — 2,500 characters per clause, 48,000 characters per whole-contract review (very long documents keep the beginning and end, where parties, governing law and signatures usually are).
- **Boilerplate is not analysed** (clauses under 40 characters) and not scored.
- Static instructions come first in every prompt so OpenAI's automatic prompt caching can discount repeated prefixes.

### 4.3 Rough cost per action (estimates)

| Action | Typical cost |
|---|---|
| Upload of a text-based file | free (no AI) |
| Full analysis of a 10–20 page contract | about $0.005–0.015 |
| Stress test / rewrite / benchmark of one clause | under $0.001 each |
| Ethics scan | about $0.002–0.005 |
| Template generation | about $0.002 |
| OCR | about $0.004 per page or photo |

Measured on test documents: French 7-clause contract analysed in ~10 s; Brazilian contract ~7 s; template generation ~8 s; OCR of a photo or 2-page scan ~3 s.

---

## Part 5 — Data model (Prisma / PostgreSQL)

| Model (table) | Holds | Notes |
|---|---|---|
| `User` (`users`) | email, name, bcrypt password hash, role (`admin`/`user`), default jurisdiction | |
| `RiskProfile` (`risk_profiles`) | risk tolerance, preferred clauses (focus areas), voice profile, industry | one per user; used in analysis prompts |
| `Contract` (`contracts`) | title, file name/type, raw and cleaned text, status, jurisdiction, contract type, overall risk/bias/strength, summary | belongs to a user |
| `Clause` (`clauses`) | number, title, text, category, risk/bias/strength, analysis JSON | belongs to a contract |
| `ClauseVersion` (`clause_versions`) | earlier versions of a clause's text, reason, author | created when a clause is edited |
| `StressTest` (`stress_tests`) | attack scenarios, litigation risk, severity, weaknesses | per clause |
| `AnalysisResult` (`analysis_results`) | type (`full`/`ethics`/`benchmark`), result JSON, risk, confidence, jurisdiction | per contract and user |
| `Template` (`templates`) | name, description, category, base jurisdiction, content with `{{placeholders}}`, field definitions | |
| `ChatMessage` (`chat_messages`) | chat history per contract and user | Chat with Document |
| `ClauseEmbedding` (`clause_embeddings`) | embedding vector per clause | chat retrieval on long documents |
| `ClauseDebate` (`clause_debates`) | transcript, verdict, challenger/defender/resilience scores, winner | Break My Clause; per clause |
| `Webhook` (`webhooks`) | name, URL, events, secret | not used by the app |

Deleting a user deletes their contracts; deleting a contract deletes its clauses, analyses and chat; deleting a clause deletes its versions, stress tests, debates and embedding.

**Migrations** (`prisma/migrations`): `20260316202604_init`, `20261011000000_document_chat` (adds the two chat tables) and `20261116000000_clause_debates` (adds the debate table). The production database is baselined, so `prisma migrate deploy` applies new migrations normally.

---

## Part 6 — HTTP API

All endpoints require a signed-in session (401 otherwise) and only ever return the caller's own data. Errors are JSON: `{ "error": "message" }`.

| Method & path | Purpose |
|---|---|
| `GET /api/contracts?page&limit&search&status` | List contracts (max 50 per page) |
| `POST /api/contracts` (multipart: `file`, `title`, `jurisdiction?`, `contractType?`) | Upload and parse a document → `{ id, title, _count, usedOcr }` |
| `GET /api/contracts/[id]` | Contract with clauses and last 5 analyses (document text omitted) |
| `PATCH /api/contracts/[id]` | Update `title`, `contractType`, `jurisdiction` |
| `DELETE /api/contracts/[id]` | Delete a contract (no UI button yet) |
| `POST /api/contracts/[id]/analyze` | Run the full analysis |
| `GET /api/clauses/[id]` | Clause with versions and stress tests |
| `PATCH /api/clauses/[id]` (`clauseText`, `changeReason?`) | Replace a clause's text, record a version, clear stale scores (no UI yet) |
| `POST /api/clauses/[id]/rewrite` (`style?`) | Suggest a rewrite (default style `plain_language`) |
| `POST /api/clauses/[id]/stress-test` | Adversarial stress test |
| `POST /api/clauses/[id]/benchmark` | Benchmark against market practice |
| `POST /api/clauses/rewrite` (`text`, `style`, `jurisdiction`) | Free-text rewrite for Drafting |
| `POST /api/analysis/ethics` (`contractId`) | Ethics and bias scan |
| `GET /api/analyses` | Your last 100 analysis results with issue counts |
| `GET /api/dashboard/stats` | Dashboard counters and the 10 newest contracts |
| `GET /api/templates` | Active templates |
| `POST /api/templates` | Create a template (admin) |
| `GET / PUT / DELETE /api/templates/[id]` | Read / update / delete a template (write = admin) |
| `POST /api/templates/[id]/generate` (`fields`, `jurisdiction?`, `useLocalLanguage?`) | Generate a contract and save it |
| `GET / PATCH /api/profile` | Read / update name, default jurisdiction and risk profile |
| `/api/auth/*` | NextAuth (sign in, session, CSRF, sign out) |

Rewrite styles: `corporate`, `startup_friendly`, `assertive`, `plain_language`. Jurisdiction codes: `US`, `IN`, `UK`, `FR`, `BR`.

Long-running routes declare `maxDuration = 60` (the Vercel Hobby maximum): upload, analyze and template generation.

---

## Part 7 — Code map

| Path | Responsibility |
|---|---|
| `app/page.tsx` | Landing page |
| `app/login/page.tsx` | Login |
| `app/(dashboard)/*/page.tsx` | App pages (dashboard, contracts, upload, contract detail, analysis, analytics, drafting, templates, settings) |
| `app/api/**/route.ts` | API (Part 6) |
| `middleware.ts` | Redirects signed-out users from app pages to `/login` |
| `ai/prompts.ts` | All system prompts, rewrite styles, reviewer profile |
| `ai/analysis.ts` | AI calls, batching, output validation and result types |
| `config/jurisdictions.ts` | Jurisdictions, legal context, contract types |
| `lib/ingest.ts` | Upload pipeline and OCR |
| `lib/parsing.ts` | Text extraction, cleaning, clause splitting, categories |
| `lib/file-types.ts` | Supported formats and upload limit (shared by page and server) |
| `lib/api.ts` | Session helper and JSON error helpers for routes |
| `lib/auth.ts` | NextAuth configuration |
| `lib/openai.ts` | OpenAI client and model names |
| `lib/db.ts` | Prisma client |
| `lib/utils.ts` | Score levels, formatting, concurrency helper |
| `lib/design-tokens.ts` | Chart colours, status labels |
| `components/layout/*` | Header, sidebar, providers, working-jurisdiction context |
| `components/app/*` | Contracts table, jurisdiction dropdown, status badge, stat card, template carousel, page header |
| `components/ui/*` | Base UI components (Radix-based), including the mobile drawer (`sheet.tsx`) |
| `prisma/schema.prisma`, `prisma/migrations` | Database schema and migrations |
| `prisma/seed.ts` | Demo users, risk profiles and the three templates |

---

## Part 8 — Running, deploying, operating

### 8.1 Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection (Neon) |
| `NEXTAUTH_SECRET` | yes | Signs session tokens |
| `NEXTAUTH_URL` | yes in production | Site URL |
| `OPENAI_API_KEY` | yes for AI features | OpenAI access |
| `AI_MODEL` | no | Overrides `gpt-4o-mini` |

(`BLOB_READ_WRITE_TOKEN` in `.env.example` is not used — files are not stored, only their text.)

### 8.2 Commands

| Command | Does |
|---|---|
| `npm install` | Installs dependencies and generates the Prisma client |
| `npm run dev` | Local development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npx tsc --noEmit` | Lint · type check |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npm run db:seed` | Create demo users and templates (safe to re-run: only creates what is missing) |
| `npm run db:studio` | Browse the database |

### 8.3 CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) on pushes and pull requests to `main`: lint + type check → build → (on push to `main`) `prisma migrate deploy`. Vercel builds and deploys `main` automatically; a failed build leaves the previous deployment live.

### 8.4 Accounts

User accounts are created by `prisma/seed.ts` (a demo admin and a demo user) and by one-off scripts in `prisma/`. Passwords are stored only as bcrypt hashes. **Change all default and script-defined passwords** — the repository is public and those scripts and the README contain them in plain text.

---

## Part 9 — Security notes and known gaps

**Security**
- Every API route checks the session and scopes queries to the signed-in user.
- Login errors don't reveal whether an email exists.
- The public repo contains plaintext passwords for seeded/admin accounts (README, `prisma/add-users.ts`, git history) — rotate them.
- There is **no rate limiting**: a signed-in user could run many AI calls. Consider adding it before opening sign-ups.
- Never pass the production `DATABASE_URL` as Prisma's `--shadow-database-url` — Prisma resets the shadow database (this wiped production data on 2026-10-11).

**Known gaps** (also marked ⚠️/🚧 above)
1. Settings — name, preferences, risk profile and team management don't save; "Manage Team" doesn't open the Admin tab.
2. Analytics — sample data.
3. No "delete contract" or "edit clause" button (APIs exist).
4. No change-password feature.
5. Re-analysing does not clear scores of clauses that were skipped in the new run.
6. After signing in, users always land on the dashboard rather than the page they were redirected from.

---

## Part 10 — Glossary

| Term | Meaning |
|---|---|
| Clause | One numbered section of a contract, as split by Clause AI |
| Jurisdiction | The country whose law the AI applies |
| Working jurisdiction | Your default jurisdiction, chosen in the top bar |
| Loophole | A gap or ambiguity a party could exploit |
| Fairness score | How balanced the contract is between the parties (100 = balanced) |
| Stress test | Simulated legal attacks on a clause |
| Benchmark | Comparison of a clause with market-standard drafting |
| OCR | Reading text from images and scanned pages |
| Token | The unit OpenAI bills by (roughly ¾ of a word) |
| Embedding | A numeric fingerprint of text used to find relevant clauses (for chat) |
