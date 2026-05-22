# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run lint          # ESLint (flat config) on all JS/MJS/CJS files
npm run test:unit     # Vitest (no config file needed — zero-config mode)
npm test              # Lint + unit tests
```

There is no build step. Vercel deploys `public/` as the static root and `api/` as serverless functions.

## Architecture

SurveyKit is a multi-user survey SaaS platform (Chinese-language). It has **two modes**:

1. **Multi-user mode** (primary): Users register/login via JWT, create/import surveys in the hub, collect responses in Vercel KV (Redis), and view/export results. Survey owners get a share link + QR code. AI-powered MBTI personality analysis via Volcano Ark (Doubao model).

2. **Static single-survey mode** (legacy): The file `public/questions.json` drives `public/survey.html` directly. No auth, no KV — responses are saved via `api/save.mjs` and stored by survey ID in KV. Results are retrieved via access token.

**Frontend**: Vanilla JS (ESM, no framework), TailwindCSS via CDN, Font Awesome. Each page is a standalone HTML/CSS/JS trio. The hub (`public/hub/`) contains the multi-user dashboard, login, survey management, toolchain (editor, validator, theme customizer), answer pages, and results viewer.

**Backend**: Vercel Serverless Functions in `api/*.mjs`. Each file exports a default `handler(req, res)`. Common patterns across all API files:
- Zod for request validation (`safeParse`)
- `@vercel/kv` for Redis operations
- `@upstash/ratelimit` for rate limiting (sliding window)
- JWT-based auth via `jsonwebtoken` (read `JWT_SECRET` from env, verify `Bearer` tokens)
- Route by `req.method` (GET/POST/DELETE), set `Allow` header on 405

**Database (Vercel KV / Redis)** key patterns:
| Pattern | Type | Purpose |
|---|---|---|
| `user:{username}` | String (JSON) | User record with `passwordHash` |
| `user:{username}:surveys` | Set | IDs of surveys owned by user |
| `survey:{id}` | Hash | Survey data (`data`, `token`, `userEmail`) or String (JSON) for multi-user mode |
| `submission:{id}` | String (JSON) | Individual submission with `answers`, `submittedAt` |
| `survey:{surveyId}:submissions` | Set | Submission IDs for a survey |
| `email_to_survey_ids:{email}` | List | Survey IDs linked to an email (last 5) |

The project has **two different storage schemas** that evolved separately:
- Multi-user surveys: stored as plain JSON objects at key `surveyId` (with `id`, `title`, `questions`, `owner`, `createdAt`, `submissionCount`)
- Static-survey mode: stored as Hash at key `survey:{id}` (with `data` as JSON-stringified answers, `token`, `userEmail`)

Some APIs check if the survey has an `owner` field to determine which schema applies (see `get-results.mjs`).

**Flow for multi-user mode**: User registers/logs in → `api/auth.mjs` → JWT token stored in localStorage → Hub dashboard loads surveys via `api/surveys.mjs` → Create via `api/upload-survey.mjs` → Share link + QR code → Respondents fill at `/hub/answer/` → Submit via `api/submissions.mjs` → Owner views results via `api/get-results.mjs`.

**Flow for static mode**: `survey.html` reads `questions.json` → user fills → submits to `api/save.mjs` → gets back `id` + `token` → views results at `result.html?id=...&token=...`. MBTI analysis via `api/analyze-mbti.mjs`.

### Environment variables

All config lives in Vercel environment variables: `JWT_SECRET`, `ARK_API_KEY`, `RESEND_API_KEY`, `SENDER_EMAIL`, `ADMIN_TOKEN`, `TURNSTILE_SECRET_KEY`, and the KV connection vars (`KV_URL`, `KV_REST_API_URL`, etc.).

### Key dependencies

- `zod` — all API input validation
- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT sign/verify (some APIs use `jose` alternatively)
- `@vercel/kv` — Redis client (also powers `@upstash/ratelimit`)
- `resend` — transactional email (survey recovery links)
- `openai` SDK — present as a dep but currently unused; AI calls go direct to Volcano Ark via `fetch`
- `docx` — Word document generation
- `html2canvas` — screenshot export of survey results
- `json5` — used in the toolchain JSON validator (`public/hub/toolchain/lib/json5.min.js`)

### Tests

Tests use Vitest and live in `utils/`. Currently only a skeleton `helpers.test.js` exists — test coverage is minimal.
