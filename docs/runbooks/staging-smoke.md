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

> The initial migration now lives in
> `apps/api/prisma/migrations/20260301_init`.

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

ACCESS=$(echo "$SIGNUP" | jq -r '.data.accessToken')
REFRESH=$(echo "$SIGNUP" | jq -r '.data.refreshToken')
```

**Expected:** 201 with `data.accessToken` and `data.refreshToken`.

---

## 3. Authenticated Endpoint — GET /me

```bash
curl -sf "$API/v1/users/me" \
  -H "Authorization: Bearer $ACCESS" | jq .
```

**Expected:** 200 with `data` user object containing `id`, `email`, `fullName`, `role`.

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
  -d '{"serviceType":"menage","surface":80,"cleanType":"simple","teamType":"solo"}' | jq .
```

**Expected:** 200 with `data.floorPrice`, `data.ceiling`, `data.durationMinutes`.

---

## 6. Database Connectivity (via Order Creation)

```bash
ORDER=$(curl -sf -X POST "$API/v1/orders" \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: smoke-$(date +%s)" \
  -d '{
    "serviceType": "menage",
    "location": "1 Rue Smoke, Casablanca",
    "detail": {
      "serviceType": "menage",
      "surface": 80,
      "cleanType": "simple",
      "teamType": "solo"
    }
  }')
echo "$ORDER" | jq .
ORDER_ID=$(echo "$ORDER" | jq -r '.data.id')
```

**Expected:** 201 with `data.status = submitted` and computed `data.floorPrice`.

---

## 7. WebSocket Connectivity

```bash
# Requires repository dependencies installed (socket.io-client available).
node - <<'EOF'
const { io } = require('socket.io-client');
const api = process.env.API;
const token = process.env.ACCESS;
const orderId = process.env.ORDER_ID;

const socket = io(api, {
  transports: ['websocket'],
  auth: { token },
  timeout: 8000,
});

socket.on('connect', () => {
  console.log('connected', socket.id);
  socket.emit('join:order', { orderId });
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('order:joined', (payload) => {
  console.log('order:joined', payload);
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
  process.exit(1);
});
EOF
```

**Expected:** console prints `connected <socketId>` and `order:joined`.
If this fails, verify `CORS_ORIGINS`, JWT secret, and Railway networking.

---

## 8. Cleanup

Delete the smoke test user from the staging database:

```bash
# Via Prisma Studio (delete order first, then user)
railway run npx prisma studio
```

---

## Pass / Fail Matrix

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | Health | `{"status":"ok"}` |
| 2 | Signup | 201 + tokens |
| 3 | GET /me | 200 + user obj |
| 4 | Refresh | 200 + new tokens |
| 5 | Pricing | 200 + `data.floorPrice` + `data.ceiling` |
| 6 | Create order | 201 + submitted |
| 7 | WebSocket | `connected` + `order:joined` printed |

**All 7 must pass** for the staging deploy to be considered healthy.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Health returns 502/503 | Container not started | Check `railway logs`, verify Dockerfile CMD |
| Health ok, signup 500 | Missing `DATABASE_URL` | Add var in Railway dashboard |
| Signup ok, /me 401 | Wrong `JWT_SECRET` between deploys | Ensure same secret across redeploys |
| Pricing returns 400 | Invalid request payload shape | Use schema-compatible payload from Step 5 |
| WebSocket timeout | CORS or proxy issue | Set `CORS_ORIGINS` to include staging domain |
| Order 500 | Migrations not applied | Run `railway run pnpm --filter @babloo/api db:migrate:deploy` |
