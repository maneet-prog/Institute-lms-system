# Institute LMS System

This repository contains:

- [Backend](C:\Users\HP\Desktop\Project\Institute LMS system\backend\README.md): FastAPI + PostgreSQL API
- [Frontend](C:\Users\HP\Desktop\Project\Institute LMS system\frontend\README.md): Next.js application

## Quick Local Run

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

## Deployment Options

### Option 1: Deploy Separately

- Backend on Render / Railway / VPS
- Frontend on Vercel / Netlify / Docker host

### Option 2: Docker-Based Testing Deployment

Build backend:

```bash
docker build -t institute-lms-backend ./backend
```

Build frontend:

```bash
docker build -t institute-lms-frontend --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com ./frontend
```

Run backend:

```bash
docker run --env-file backend/.env -p 8000:8000 institute-lms-backend
```

Run frontend:

```bash
docker run -e NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com -p 3000:3000 institute-lms-frontend
```

## Minimum Production Checklist

1. Create a PostgreSQL database.
2. Set backend environment variables from [backend/.env.example](C:\Users\HP\Desktop\Project\Institute LMS system\backend\.env.example).
3. Run backend migration: `alembic upgrade head`
4. Deploy backend.
5. Set frontend `NEXT_PUBLIC_API_BASE_URL` to the backend URL.
6. Add the frontend domain to backend `CORS_ORIGINS`.
7. Deploy frontend.
8. Verify login, institute listing, course listing, and file/content workflows.
