# Code-Unifier

A Duolingo-style language-learning app with Clerk authentication, XP/streak/hearts mechanics, leaderboards, achievements, and a gem shop. Built with React + Vite frontend and Express backend.

## Project Structure

```
Code-Unifier/
├── Frontend/              # Frontend applications
│   ├── linguaplay/       # Main React app (Vite + Tailwind + shadcn/ui)
│   ├── mockup-sandbox/   # Mockup preview tool
│   └── api-client-react/ # React Query API client library
├── Backend/              # Backend applications
│   ├── api-server/       # Express API server
│   └── db/               # Database schema (Drizzle ORM + PostgreSQL)
├── Shared/               # Shared libraries
│   ├── api-spec/         # OpenAPI specification (source of truth)
│   └── api-zod/          # Generated Zod validators
└── scripts/              # Build and utility scripts
```

## Prerequisites

- **Node.js** 24 or higher
- **pnpm** package manager (required for workspace management)
- **PostgreSQL** database

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Code-Unifier
```

2. Install dependencies:
```bash
pnpm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# API (optional, defaults to http://localhost:5050)
VITE_API_URL=http://localhost:5050
```

## Database Setup

1. Create a PostgreSQL database
2. Set the `DATABASE_URL` in your `.env` file
3. Push the database schema:
```bash
pnpm --filter @workspace/db run push
```

## Running the Application

### Start Backend (API Server)

```bash
pnpm --filter @workspace/api-server run dev
```

The API server will run on port 8080 (or the PORT specified in your environment).

### Start Frontend (LinguaPlay)

```bash
pnpm --filter @workspace/linguaplay run dev
```

The frontend will run on port 5173 (or the PORT specified in your environment).

### Start Both (Full Stack)

You can run both servers in separate terminals, or use the VS Code launch configuration "Full Stack" to start both simultaneously.

## Development Commands

### Type Checking

Check types across all packages:
```bash
pnpm run typecheck
```

Check types for libraries only:
```bash
pnpm run typecheck:libs
```

### Building

Build all packages:
```bash
pnpm run build
```

### API Code Generation

After modifying the OpenAPI spec, regenerate the API client and Zod schemas:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## Tech Stack

- **Package Manager**: pnpm workspaces
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Wouter routing
- **Backend**: Express 5 + OpenAPI-first codegen (Orval)
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Clerk (`@clerk/react`, `@clerk/express`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Architecture Notes

- **OpenAPI-First**: The `Shared/api-spec/openapi.yaml` is the source of truth for the API contract
- **Code Generation**: API hooks and Zod schemas are auto-generated from the OpenAPI spec
- **Clerk Auth**: Authentication is managed by Clerk, with auto-provisioned keys in development
- **Type Safety**: TypeScript project references ensure type safety across workspace packages

## Troubleshooting

### "Cannot find module @workspace/*" errors

Run `pnpm install` to regenerate workspace links after moving packages or changing the workspace structure.

### TypeScript errors after reorganization

If you see TypeScript errors referencing old paths (e.g., `artifacts/`, `lib/`), restart your TypeScript server in your IDE.

### Database connection issues

Ensure your PostgreSQL database is running and the `DATABASE_URL` in your `.env` file is correct.

## VS Code Launch Configurations

The project includes VS Code launch configurations for convenient debugging:

- **API Server**: Runs the backend on port 8080
- **Frontend (Vite)**: Runs the frontend on port 5173
- **Full Stack**: Runs both servers simultaneously

Use these configurations from the VS Code Run and Debug panel.
