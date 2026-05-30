# Production deployment (Vercel + Render)

## Root cause

Vite bakes `import.meta.env.VITE_*` into the build at **build time**. If `VITE_API_URL` is missing on Vercel, the app fell back to `http://localhost:5000`, which fails in users' browsers.

## Vercel (frontend)

1. **Project → Settings → Environment Variables** — add for **Production** (and Preview if you use branch deploys):

| Name | Value |
|------|--------|
| `VITE_API_URL` | `https://survey-app-erzn.onrender.com` |
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

2. **Redeploy** after saving variables (Deployments → … → Redeploy). A new build is required; changing env vars alone does not update an old build.

3. **Build settings**
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`

## Render (backend)

1. **Environment variables**

| Name | Value |
|------|--------|
| `PORT` | (Render sets this automatically; optional) |
| `SUPABASE_URL` | your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key |
| `JWT_SECRET` | strong secret |
| `FRONTEND_URL` | `https://YOUR-VERCEL-APP.vercel.app` |

2. **Start command**: `npm start` (from `server` folder)

3. **Root directory**: `server`

CORS allows:
- Origins listed in `FRONTEND_URL` (comma-separated)
- Any `https://*.vercel.app` preview URL
- Local dev: `localhost:5173` / `5174`

## Verify

- API health: `https://survey-app-erzn.onrender.com/api`
- After redeploy, open the Vercel site → DevTools → Network. Requests should go to `survey-app-erzn.onrender.com`, not `localhost`.

## Local development

Copy `client/.env.example` to `client/.env`:

```
VITE_API_URL=http://localhost:5000
```

Run backend: `cd server && npm run dev`  
Run frontend: `cd client && npm run dev`
