# GenWorkAI — Deep Project Analysis: Scope, Readiness & issues

> Generated 2026-06-20. Static analysis only — nothing was executed. Evidence cited as `file:line`.
> Codebase root: `apps/web` (Next.js 16 / TypeScript / Drizzle / Supabase / Postgres+pgvector).

---

## 0. Executive Summary

The pivot to **Intelligence-as-a-Service** ("Firebase/Stripe for knowledge + data intelligence") is **substantially built on the data-plane**, but **not production-safe and not monetization-ready**.

- ✅ **Engines real**: ingestion/embeddings/pgvector, hybrid RAG search (RRF), multi-DB NL→SQL with AST validation, AES-256-GCM secret encryption, API-key auth with operation **and** resource scopes, atomic usage metering, SSRF URL validator.
- ✅ **Platform skin built since last session**: versioned `/v1` API (6 endpoints), scoped+hashed `api_keys` table, `api_usage_counters` + `api_usage_logs` metering, OpenAPI 3.1 spec, BYOK, dev-portal pages (keys, usage, byok, playground).
- ❌ **Blocking gaps**: **Critical cross-tenant IDOR on every `/v1` endpoint**, an **unauthenticated route leaking all tenants' private GitHub repos**, **admin ticket routes not admin-gated**, a **hardcoded fallback encryption key**, **no rate-limiting on `/v1`**, **no billing**, and **no working key create/revoke** (dead buttons; keys only insertable by hand).

**Overall platform completeness ≈ 60–65%.** **Production-readiness for an external public API ≈ 35%** — gated entirely by the security holes below. **Do not expose `/v1` publicly until the Critical/High items are fixed.**

---

## 1. Project Scope (what exists)

### 1.1 Monorepo layout
- Turborepo. `apps/web` (the product), `apps/extension`. Packages: `ai`, `mcp-client`, `ui`, `eslint-config`, `typescript-config`.
- Stack: Next.js 16, React 19, Drizzle ORM, Supabase auth, Postgres + pgvector, Upstash rate-limit, Inngest (jobs), Playwright/Cheerio (ingest), `node-sql-parser` (SQL safety), AES-256-GCM crypto.

### 1.2 Product modules (21+ app pages under `app/(app)/`)
Research Studio, File Studio, Knowledge Base (+ architecture view), AI Workspace, Chat, Databases (+ SQL Studio), Automation Studio, MCP Builder, Marketplace, Media Intelligence, Admin, Billing (UI shell), Team/Team-Workspace, Developer portal (keys / usage / byok / playground), Profile, Settings, Projects, Templates, Saved Reports, Trash, Integrations, API-Integrations.

### 1.3 The IaaS platform surface (the pivot)

**Public versioned API — `app/api/v1/` (6 endpoints, all auth+meter via `ApiAuthService`):**
| Endpoint | Purpose |
|---|---|
| `POST /v1/kb/{kbId}/search` | Hybrid vector + BM25 (RRF) search |
| `POST /v1/kb/{kbId}/ask` | RAG answer w/ citations + confidence (JSON) |
| `POST /v1/kb/{kbId}/generate` | Typed artifact: summary / flashcards / report |
| `GET  /v1/db/{dbId}/schema` | Cached extracted DB schema |
| `POST /v1/db/{dbId}/ask` | Text-to-SQL, optional read-only execute |
| `GET  /v1/db/{dbId}/documentation` | AI-generated schema docs |

**Data model (`db/schema.ts`, 30 tables, migrations 0000–0007 + RLS):**
- Keys: `api_keys` (`scopes` jsonb, `resourceScopes` jsonb, `keyHash` sha256, `keyPrefix`, `expiresAt`) `:242`; legacy `mcp_api_keys` `:231`.
- Metering: `api_usage_counters` (period YYYY-MM; requests/llmTokens/dbQueries/vectorSearches/generatedArtifacts) `:337`; `api_usage_logs` (per-call history) `:256`.
- Knowledge: `knowledge_bases`, `documents`, `document_chunks` (`vector(1024)`), `knowledge_sources`, `source_snapshots`, `sync_jobs`.
- DB intel: `connected_databases` (encrypted `connectionString`/`password`, `accessMode`), `database_schemas`, `database_query_logs`.
- BYOK: `user_llm_keys` (encrypted), `ai_profiles` (per-domain model routing).
- Ops: `audit_logs`, `automation_tasks`/`automation_logs`, `workspace_*`, `profiles` (`tier`, `is_admin`).

---

## 2. Readiness Scorecard (platform primitives)

| Primitive | Status | Evidence / Note |
|---|---|---|
| Ingest / embed / pgvector | ✅ EXISTS | `documents`, `document_chunks vector(1024)`, `lib/knowledge-pipeline.ts` |
| Vector + hybrid RAG | ✅ EXISTS | RRF SQL in `v1/kb/[kbId]/ask/route.ts:47-84` |
| Multi-DB connect + NL→SQL + safety | ✅ EXISTS | `lib/database/DatabaseService.ts`, AST validate `lib/database/validation.ts` |
| API-key auth (hash + expiry + status) | ✅ EXISTS | `lib/auth/ApiAuthService.ts:17-50` |
| Operation scopes (`kb:read`, `db:query`, `*`) | ✅ EXISTS | `ApiAuthService.ts:52-56` |
| Resource scopes (key→specific KB/DB ids) | ⚠️ PARTIAL | schema present `:249`; **enforcement opt-in / skipped when null** — see V1 |
| Usage metering (counters + logs) | ✅ EXISTS | `ApiAuthService.logUsage:96-150` (atomic upsert) |
| Quota enforcement | ⚠️ PARTIAL | hardcoded tier limits `:73-84`; TOCTOU race; token = `len/4` estimate |
| Rate limit on `/v1` | ❌ ABSENT | `RateLimitService` exists but **never imported under `app/api/v1`** |
| Secret encryption (DB creds) | ✅ EXISTS | AES-256-GCM `lib/security/encryption.ts` (throws if key missing) |
| Secret encryption (BYOK) | ⚠️ WEAK | `lib/utils/encryption.ts:6` **hardcoded fallback key** — see V4 |
| SSRF protection (URL ingest) | ✅ EXISTS | `lib/security/url-validator.ts` (bypassable — see V6) |
| SSRF protection (DB connect) | ❌ ABSENT | host/port unchecked — see V5 |
| Versioned `/v1` surface | ✅ EXISTS | 6 endpoints |
| OpenAPI spec | ✅ EXISTS | `app/api/openapi.json/route.ts` (3.1.0, all 6 paths; server URL aspirational) |
| Key create / revoke lifecycle | ❌ ABSENT | **no route inserts `api_keys`**; portal buttons are static (`developer/keys/page.tsx:24,69`) |
| Dev portal — usage dashboard | ✅ EXISTS | `developer/usage/page.tsx` (reads `api_usage_logs`) |
| Dev portal — key mgmt | ⚠️ UI-ONLY | non-functional buttons |
| Billing (Stripe/usage-based) | ❌ ABSENT | no payment dep; "billing" page is a shell; tier is a bare varchar |
| SDK (`@genworkai/sdk`) | ❌ ABSENT | REST only |

**Completeness:** read-path ≈ 80%, commercial/lifecycle path ≈ 20%, **net ≈ 60–65%**.

---

## 3. issues

Severity: **Critical** = exploitable cross-tenant data loss / unauth exposure. **High** = privilege/abuse with auth. **Medium/Low** = hardening.

### 🔴 CRITICAL

#### V1 — Cross-tenant IDOR on every `/v1` endpoint (broken object-level authorization)
**`lib/auth/ApiAuthService.ts:59-65`** — resource-scope check is skipped when `resourceScopes` is null:
```ts
const resourceScopes = keyRecord.resourceScopes as Record<string, number[]> | null;
if (resourceScopes) {            // ← entire ownership check skipped when null
  const allowedIds = resourceScopes[resourceType];
  if (!allowedIds || ...) return { isValid: false, ... };
}
```
`resourceScopes` is **nullable with no default** (`db/schema.ts:249`). The `/v1` routes then load resources **by path param only — no `user_id` filter**:
- `v1/db/[dbId]/ask/route.ts:46` `...where(eq(connectedDatabases.id, dbId))`
- `v1/db/[dbId]/schema/route.ts:27`, `documentation/route.ts:28` — same
- `v1/kb/.../*` filter raw SQL by `d.kb_id = ${kbId}` only — never by owner (`ask:53`, `search:53`).

**Impact:** any holder of *any* valid key (different tenant) can pass an arbitrary `kbId`/`dbId` and read another tenant's KB chunks, dump another tenant's DB schema, and **run text-to-SQL against another tenant's live, credentialed DB connection** (`ask:111-125`). Confirmed independently by two separate audits.
**Fix:** make resource scoping mandatory **and** filter every `/v1` query by `authResult.userId`. Default `resourceScopes` to `[]`/deny.

#### V2 — Unauthenticated route leaks all tenants' GitHub installations + private repos
**`app/api/knowledge/sources/github/installations/route.ts:6`** — `GET()` has **no `requireUser()`**. Returns every GitHub App installation and all accessible repos including `private: repo.private`, `full_name`, `html_url` (`:44`) across all customers. Internet-exposed, unauthenticated → treat as **top remediation**.
**Fix:** add `requireUser()` and filter installations to the caller's linked account.

### 🟠 HIGH

#### V3 — `github/create` has no auth and no ownership check (cross-tenant KB write)
**`app/api/knowledge/sources/github/create/route.ts:5`** — `POST({kbId, repo})` inserts a `knowledgeSources` row against any `kbId` with no `requireUser()`/`requireOwnership()`. Any caller attaches sources to any tenant's KB.
**Fix:** `requireUser()` + `requireOwnership('knowledge_base', kbId, user.id)`.

#### V4 — Admin ticket routes not admin-gated
**`app/api/admin/tickets/route.ts:10-12`** checks only `if (!user)` — **no `isAdmin`** (every other admin route checks `profiles.is_admin`). Any logged-in user reads **all customers' tickets** (subjects/messages/emails) and `tickets/[id]/convert/route.ts:11` lets them convert/mutate any ticket.
**Fix:** add the `is_admin` gate used by `admin/config|users|stats`.

#### V5 — BYOK hardcoded fallback encryption key
**`lib/utils/encryption.ts:6,15`** — `ENCRYPTION_KEY || '0123...cdef'` (committed constant), and `getKey()` silently falls back to it. If env var missing/misformatted, **every BYOK LLM key is encrypted with a public, source-committed key = trivially decryptable**. (Note: the *DB-credential* crypto `lib/security/encryption.ts:7` correctly throws if missing — the two utils are inconsistent; the BYOK one is dangerous.)
**Fix:** throw on missing/invalid key; delete the fallback; rotate any keys already stored under it.

#### V6 — No rate limiting on `/v1` (cost-amplification / DoS)
`RateLimitService` (`lib/security/rate-limit.ts`, Upstash) exists and guards ~15 internal routes but is **never imported under `app/api/v1`**. Only throttle is the monthly quota — a single key can burst unlimited concurrent expensive LLM + live-DB calls within the cap.
**Fix:** apply per-key per-minute sliding-window limit on all `/v1` routes.

#### V7 — SSRF via DB registration (internal port scan)
**`app/api/knowledge/sources/database/route.ts:35-43`** builds a connection from user-supplied `host`/`port`/`connectionString` and immediately calls `testConnection()`/`extractSchema()` with **no internal-IP denylist** (`127.0.0.1`, `169.254.169.254`, RFC1918, `[::1]`). Authenticated SSRF / internal recon (Critical in a cloud with reachable metadata endpoint). The HTTP `validateUrl` guard does not cover raw DB sockets.
**Fix:** reuse/extend `url-validator` IP denylist for DB host resolution before connecting.

### 🟡 MEDIUM

- **V8 — MySQL stacked queries.** `DatabaseService.ts:218` sets `multipleStatements: true`; `validation.ts:101` only enforces LIMIT for single statements → multi-statement `SELECT;SELECT` bypasses row cap. **Fix:** drop `multipleStatements`, reject statement arrays for a read-only feature.
- **V9 — Row-limit is regex-based.** `validation.ts:104-109` string-replaces first `LIMIT \d+`; subquery LIMIT / `OFFSET` / `FETCH FIRST` evade it. Payload cap (5MB) is **post-fetch** (rows already in memory). **Fix:** rebuild query from AST; stream + cap.
- **V10 — SSRF redirect / DNS-rebinding bypass.** `url-validator.ts` resolves DNS then `fetch` re-resolves and follows redirects unvalidated (`website/route.ts:41`). **Fix:** pin resolved IP, `redirect: 'manual'`, re-validate each hop.
- **V11 — `decryptSecret` silent plaintext fallback.** `lib/security/encryption.ts:84-87` returns raw value if not JSON → anyone able to write a row stores unencrypted creds. **Fix:** remove fallback after migration; fail closed.
- **V12 — v1 `db/ask` error/SQL disclosure.** `v1/db/[dbId]/ask/route.ts:127-129,176` plumbs raw driver `e.message` into logs/response paths; generated SQL always returned. Postgres errors echo table/column names → schema disclosure (compounds V1).
- **V13 — No per-file upload size cap.** `upload/route.ts:33` `await file.arrayBuffer()` buffers whole file pre-check; same `folder/route.ts:69`, `github/route.ts:134` → memory-exhaustion DoS. **Fix:** stream + per-file byte cap before buffering.
- **V14 — Metering not cost-safe.** `logUsage` is fire-and-forget with swallowed errors (`ApiAuthService.ts:147`); quota check is TOCTOU (`:79-84`) → concurrent over-spend; `llm_tokens` = `len/4` estimate, not provider usage. **Fix:** atomic check-and-increment; real token counts.

### 🟢 LOW
- **V15** MSSQL `trustServerCertificate: true` (`DatabaseService.ts:230`) → TLS MITM.
- **V16** BYOK/tickets use `getSession()` not `getUser()` (`byok/route.ts:11`) — JWT not re-verified; standardize on `getUser()`.
- **V17** `knowledge/list/route.ts:20` `select().from(documents)` reads **all tenants' documents** then filters in JS — perf/DoS (no data leak).
- **V18** No upload file-type allowlist; zip entry names stored unsanitized (`github/route.ts:157`) — no FS write so no zip-slip, but stored XSS vector downstream.
- **V19** v1 routes pass **encrypted** creds into `DatabaseService` without `decryptSecret` (`v1/db/[dbId]/ask:115-120`) → connect fails for encrypted rows; consistency bug that pressures plaintext storage.
- **V20** Middleware only guards `/dashboard` + `/workspace` prefixes (`middleware.ts:35`) — all other protection is per-route (mostly present, but fragile; V2/V3/V4 are exactly the routes that slipped).
- **V21** Prompt-injection inherent to KB ask/generate (user text → LLM system prompt). Unmitigated by design.
- **V22** `lastUsedAt` UPDATE on every auth (`ApiAuthService.ts:87`) — write on hot path; non-constant-time key lookup (high-entropy key makes timing impractical).

---

## 4. What's Solid (don't re-do)
- Session routes consistently use `requireUser()` + `requireOwnership()` (`lib/auth/index.ts:46,123`) — the correct pattern; the holes are routes that *skipped* it.
- AES-256-GCM with versioned payload + key-rotation hook (`lib/security/encryption.ts`).
- AST-based read-only SQL allowlist (`node-sql-parser`), statement timeout, MongoDB rejected from SQL path.
- Atomic metering upsert (`ON CONFLICT DO UPDATE`).
- Admin role via `profiles.is_admin` (not hardcoded email) — except the two ticket routes (V4).
- `.env.local` not git-tracked; no live secrets found in source (except the hardcoded fallback key V5).

---

## 5. Prioritized Remediation (before any public launch)

**P0 — block exposure (do first):**
1. V2 — auth `github/installations` (unauth private-repo leak).
2. V1 — mandatory resource scoping + `user_id` filter on all `/v1` queries.
3. V4 — admin-gate ticket routes.
4. V5 — remove hardcoded encryption fallback; rotate affected BYOK keys.
5. V3 — auth + ownership on `github/create`.

**P1 — pre-public-API hardening:**
6. V6 rate-limit `/v1` · 7. V7 DB-connect SSRF denylist · 8. V8/V9 SQL multi-statement + AST row-cap · 9. V14 atomic quota.

**P2 — correctness/hardening:** V10–V13, V15–V22.

**P3 — commercialization (post-security):** key create/revoke route + wire portal buttons · Stripe usage-based billing + quota tiers · SDK · OpenAPI polish (429, real server URL).

---

## 6. Bottom Line
Engines are real and reusable; the platform skin (keys, scopes, metering, `/v1`, OpenAPI, BYOK, portal) is **built but unfinished**. **The single root cause gating launch is authorization** — the `/v1` IDOR (V1) plus three unguarded routes (V2/V3/V4) and the key fallback (V5). Fix the P0 list and you have a defensible private beta; add rate-limit + billing + key lifecycle for public GA. **Current safe status: internal/design-partner only — not public.**
