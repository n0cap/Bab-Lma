# Staging Smoke-Test Runbook

> Quick verification that a fresh Railway staging deploy is alive and wired
> to Postgres. Run after every deploy or infra change.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| `curl` | any | pre-installed on macOS / Linux |
| `jq` | 1.6+ | `brew install jq` / `apt install jq` |
| Railway CLI | latest | `npm i -g @railway/cli && railway login` |

Set the staging API base URL (replace with your actual Railway domain):

```bash
API="https://babloo-api-staging.up.railway.app"
```

---

## 0. Apply Database Schema

The Dockerfile CMD runs `prisma migrate deploy` automatically on container
start. If deploying for the first time or after a schema change, verify
migrations applied cleanly:

```bash
railway logs | grep -i "prisma\|migrate"
```

**Expected:** Log line showing migrations applied or "database is up to date".

If migrations fail (e.g., connection refused), check that `DATABASE_URL` is
set in the Railway service variables and that the Postgres add-on is linked.

For manual apply:

```bash
railway run pnpm --filter @babloo/api db:migrate:deploy
```

> **Note:** The project currently uses `prisma db push` for development. If
> no migrations directory exists yet, the Dockerfile CMD will fail. In that
> case, generate the initial migration locally first:
> `pnpm --filter @babloo/api exec prisma migrate dev --name init`

---

## 1. Health Check

```bash
curl -sf "$API/v1/health" | jq .
```

**Expected:**

```json
{ "status": "ok", "timestamp": "2026-…" }
```

If this fails, check Railway deploy logs (`railway logs`) and verify
`DATABASE_URL` is set in the Railway service variables.

---

## 2. Signup + Login Round-Trip

```bash
# Create a test user
SIGNUP=$(curl -sf -X POST "$API/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.local","password":"Test1234!","fullName":"Smoke Test"}')
echo "$SIGNUP" | jq .

ACCESS=$(echo "$SIGNUP" | jq -r '.accessToken')
REFRESH=$(echo "$SIGNUP" | jq -r '.refreshToken')
```

**Expected:** 201 with `accessToken` and `refreshToken` in response body.

---

## 3. Authenticated Endpoint — GET /me

```bash
curl -sf "$API/v1/users/me" \
  -H "Authorization: Bearer $ACCESS" | jq .
```

**Expected:** 200 with user object containing `id`, `email`, `fullName`, `role`.

---

## 4. Token Refresh

```bash
curl -sf -X POST "$API/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH\"}" | jq .
```

**Expected:** 200 with new `accessToken` and `refreshToken`.

---

## 5. Pricing Estimate (No Auth Required)

```bash
curl -sf -X POST "$API/v1/pricing/estimate" \
  -H "Content-Type: application/json" \
  -d '{"serviceType":"menage","surfaceM2":80,"cleanType":"standard"}' | jq .
```

**Expected:** 200 with `floorPrice`, `ceilingPrice`, `currency: "MAD"`.

---

## 6. Database Connectivity (via Order Creation)

```bash
ORDER=$(curl -sf -X POST "$API/v1/orders" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: smoke-$(date +%s)" \
  -d '{
    "serviceType": "menage",
    "surfaceM2": 80,
    "cleanType": "standard",
    "location": {"address": "1 Rue Smoke, Casablanca", "lat": 33.57, "lng": -7.59}
  }')
echo "$ORDER" | jq .
ORDER_ID=$(echo "$ORDER" | jq -r '.id')
```

**Expected:** 201 with order in `submitted` status and computed `floorPrice`.

---

## 7. WebSocket Connectivity

```bash
# Quick test: connect and expect a successful upgrade.
# Requires wscat: npm i -g wscat
wscat -c "wss://$(echo $API | sed 's|https://||')/socket.io/?EIO=4&transport=websocket" \
  --header "Authorization: Bearer $ACCESS" \
  --execute '0' \
  --wait 3
```

**Expected:** Receives a `0{...}` (open) packet, then `40` (connect).
If this times out, verify CORS_ORIGINS includes the staging domain and
that WebSocket transport is not blocked by the Railway proxy.

---

## 8. Cleanup

Delete the smoke test user from the staging database:

```bash
# Via Railway CLI psql or Prisma Studio
railway run npx prisma studio
# Delete user with email "smoke@test.local" and cascade
```

Or via SQL if you have direct DB access:

```sql
DELETE FROM "User" WHERE email = 'smoke@test.local';
```

---

## Pass / Fail Matrix

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | Health | `{"status":"ok"}` |
| 2 | Signup | 201 + tokens |
| 3 | GET /me | 200 + user obj |
| 4 | Refresh | 200 + new tokens |
| 5 | Pricing | 200 + MAD prices |
| 6 | Create order | 201 + submitted |
| 7 | WebSocket | Open + connect packets |

**All 7 must pass** for the staging deploy to be considered healthy.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Health returns 502/503 | Container not started | Check `railway logs`, verify Dockerfile CMD |
| Health ok, signup 500 | Missing `DATABASE_URL` | Add var in Railway dashboard |
| Signup ok, /me 401 | Wrong `JWT_SECRET` between deploys | Ensure same secret across redeploys |
| Pricing returns 400 | Shared package not built | Rebuild: `pnpm --filter @babloo/shared build` |
| WebSocket timeout | CORS or proxy issue | Set `CORS_ORIGINS` to include staging domain |
| Order 500 | Migrations not applied | Run `railway run pnpm --filter @babloo/api db:migrate:deploy` |
