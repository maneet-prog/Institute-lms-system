# LMS Frontend

Next.js frontend for the Institute LMS platform.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- Zustand

## Local Setup

```bash
cd frontend
npm install
copy .env.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Run locally:

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```

## Deployment Notes

- `NEXT_PUBLIC_API_BASE_URL` must point to the deployed backend.
- The backend must allow the frontend domain in `CORS_ORIGINS`.
- This app is configured for standalone output to make container hosting easier.

## Docker

Build:

```bash
docker build -t institute-lms-frontend ./frontend
```

Run:

```bash
docker run -e NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com -p 3000:3000 institute-lms-frontend
```
