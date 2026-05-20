# LinguaPlay - Complete Setup and Run Guide

This document provides step-by-step instructions to set up and run the entire LinguaPlay application (full stack: backend API + frontend).

## Prerequisites

- **Node.js** 24 or higher
- **pnpm** package manager
- **PostgreSQL** database running locally

## Step-by-Step Instructions

### 1. Navigate to the project root directory

```bash
cd /Users/zulaa/Downloads/Code-Unifier
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all dependencies for the workspace (backend, frontend, and shared packages).

### 3. Configure environment variables

Ensure the `.env` file in the root directory contains:

```env
DATABASE_URL=postgresql://zulaa@localhost:5432/linguaplay
CLERK_PUBLISHABLE_KEY=pk_test_cXVpY2stbXVsZS05LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_2DXocILB0vumYFckX68sZJBrhdY6jLcUje7HYxvESJ
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cXVpY2stbXVsZS05LmNsZXJrLmFjY291bnRzLmRldiQ
VITE_API_URL=http://localhost:5050
SESSION_SECRET=change-me-to-a-long-random-string
```

### 4. Set up the database schema

```bash
pnpm --filter @workspace/db run push
```

This pushes the Drizzle ORM schema to your PostgreSQL database.

### 5. Import seed data

```bash
node import_data.js
```

This imports:

- Courses (7 languages)
- Units
- Lessons
- Shop items
- Exercises
- Achievements

Expected output:

```
Connected to database. Starting import...
✅ Courses imported.
✅ Units imported.
✅ Lessons imported.
✅ Shop items imported.
✅ Exercises imported.
✅ Achievements imported.
Done!
```

### 6. Start the backend API server

Open a new terminal window and run:

```bash
cd /Users/zulaa/Downloads/Code-Unifier
pnpm --filter @workspace/api-server run dev
```

The backend will start on `http://localhost:5050`

Expected output:

```
🚀 API Server running on http://localhost:5050
```

### 7. Start the frontend (LinguaPlay)

Open another new terminal window and run:

```bash
cd /Users/zulaa/Downloads/Code-Unifier
pnpm --filter @workspace/linguaplay run dev
```

The frontend will start on `http://localhost:5173` (or another available port)

Expected output:

```
VITE v7.3.2  ready in 297 ms
➜  Local:   http://localhost:5173/
```

## Quick Start (All in One)

If you want to run everything quickly:

```bash
# Terminal 1 - Backend
cd /Users/zulaa/Downloads/Code-Unifier
pnpm --filter @workspace/api-server run dev

# Terminal 2 - Frontend
cd /Users/zulaa/Downloads/Code-Unifier
pnpm --filter @workspace/linguaplay run dev
```

## Accessing the Application

- **Frontend**: Open http://localhost:5173 in your browser
- **Backend API**: http://localhost:5050
- **API Health Check**: http://localhost:5050/api/healthz

## Troubleshooting

### "Cannot find module @workspace/\*" errors

Run:

```bash
pnpm install
```

### Database connection errors

- Ensure PostgreSQL is running
- Verify the database `linguaplay` exists
- Check your `.env` file has the correct `DATABASE_URL`

### Port already in use

If port 5050 or 5173 is already in use, the servers will automatically try the next available port.

### TypeScript errors

Restart your TypeScript server in your IDE after running `pnpm install`.

## Development Commands

### Type checking

```bash
pnpm run typecheck
```

### Building all packages

```bash
pnpm run build
```

### Regenerating API client (after modifying OpenAPI spec)

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Project Structure

```
Code-Unifier/
├── Frontend/
│   ├── linguaplay/       # Main React app
│   ├── api-client-react/ # API client library
│   └── mockup-sandbox/   # Mockup tool
├── Backend/
│   ├── api-server/       # Express API server
│   └── db/               # Database schema
├── Shared/
│   ├── api-spec/         # OpenAPI specification
│   └── api-zod/          # Generated Zod validators
└── scripts/              # Utility scripts
```
