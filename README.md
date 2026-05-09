# Institute LMS (TecOnline Campus)

Full-stack LMS platform with:
- **Backend**: Node.js + Express + MongoDB (multi-tenant via `Institute` + `SystemSetting`)
- **Frontend**: Next.js (React + TypeScript + Tailwind)

Repository layout:
- `backend/` – API server
- `frontend/` – web app
- `docker-compose.yml` – one-command local deployment

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- **MongoDB** (local or accessible remote instance)
- (Optional) **Cloudinary** credentials for media uploads
- (Optional) **Docker + Docker Compose**

---

## Local Development (without Docker)

### 1) Backend

```bash
cd backend
npm install
```

Create/prepare environment variables:
- Backend expects environment variables via `backend/.env`.
- Defaults exist in `backend/src/config/env.js`, but you should set at least the MongoDB and security values for real use.

Run backend:
```bash
npm run dev
```

Backend listens on:
- `PORT` (default **8000**) 

Healthcheck:
- `GET /health`

### 2) Frontend

```bash
cd frontend
npm install
```

Create env file:
```bash
copy .env.example .env.local
```

Set:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Run frontend:
```bash
npm run dev
```

Frontend listens on Next.js default port (typically **3000**).

---

## Docker (recommended for consistent local setup)

This repo includes `docker-compose.yml` which runs both services:
- Backend on **8000**
- Frontend on **3000**

Run:
```bash
docker compose up --build
```

Notes:
- `backend` uses `backend/.env` via `env_file`.
- `frontend` is built with `NEXT_PUBLIC_API_BASE_URL: http://localhost:8000`.

---

## Environment Variables

### Backend (`backend/.env`)

Key variables are defined in `backend/src/config/env.js`:
- `PORT` (default: `8000`)
- `MONGO_URI` (default: `mongodb://127.0.0.1:27017/lms_db`)
- `JWT_SECRET` (default: `change-me-in-production`)
- `JWT_EXPIRES_IN` (default: `1d`)
- `CORS_ORIGINS` (default: `http://localhost:3000`, comma-separated for multiple)
- Cloudinary (optional):
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `CLOUDINARY_FOLDER`
- Default bootstrap admin:
  - `DEFAULT_SUPER_ADMIN_EMAIL` 
  - `DEFAULT_SUPER_ADMIN_PASSWORD` 
  - `DEFAULT_SUPER_ADMIN_FIRST_NAME`
  - `DEFAULT_SUPER_ADMIN_LAST_NAME`
  - `DEFAULT_SUPER_ADMIN_MOB_NO`

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_API_BASE_URL` (default used in code: `http://127.0.0.1:8000`)

---

## Default Admin (Bootstrap)

On backend startup, the server runs `bootstrapDefaults()`.
If a default `SystemSetting` / `Institute` does not exist, it also creates a **super admin** user using the defaults from `backend/src/config/env.js`.

---

## API Notes

- Backend serves uploads from:
  - `GET /uploads/*` (backed by `backend/uploads/`)
- CORS is configured using `CORS_ORIGINS`.

---

## Quick Health/Verification

1. Start MongoDB.
2. Start backend.
   - Visit: `http://127.0.0.1:8000/health`
3. Start frontend.
4. Log in using the default admin credentials.

---

## Project Structure (high level)

### Backend
- `backend/src/app.js` – Express app boot
- `backend/src/config/env.js` – environment configuration
- `backend/src/config/db.js` – MongoDB connection
- `backend/src/services/bootstrapService.js` – default institute/settings/admin bootstrap
- `backend/src/routes/*` – route modules
- `backend/src/controllers/*` – request handlers
- `backend/src/models/*` – Mongoose models

### Frontend
- `frontend/app/*` – Next.js route segments
- `frontend/components/*` – UI components
- `frontend/services/*` – API/domain service helpers
- `frontend/hooks/*` – data fetching + mutations via react-query
- `frontend/store/*` – zustand state (auth + ui)

---

## Existing Frontend README

The frontend folder already contains its own README. This root README is intended to be the single entry point for **workflow + setup**.
- `frontend/README.md`

