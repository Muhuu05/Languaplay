# Environment Variables

This document lists all environment variables needed for deployment.

## Clerk Authentication

Get your keys from [Clerk Dashboard](https://dashboard.clerk.com)

### Frontend (Vercel)
- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `VITE_API_URL`: Your backend URL (e.g., https://linguaplay-api.onrender.com)

### Backend (Render)
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key

## Database

### Backend (Render)
- `DATABASE_URL`: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Get from Neon Console → Project → Connection Details

## Server Configuration

### Backend (Render)
- `NODE_ENV`: Set to `production`
- `PORT`: Set to `10000` (Render's default)

## Getting Your Keys

### Clerk Keys
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create or select your application
3. Go to "API Keys" section
4. Copy Publishable Key and Secret Key

### Neon Connection String
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Open "Connection Details"
4. Copy the pooled PostgreSQL connection string
5. Use it as `DATABASE_URL` for the backend and database tooling

## Example .env Files

### Development (.env)
```env
DATABASE_URL=postgresql://zulaa@localhost:5432/linguaplay
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5050
PORT=5050
NODE_ENV=development
```

### Production Backend (Render)
```
DATABASE_URL=postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NODE_ENV=production
PORT=10000
```

### Production Frontend (Vercel)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://linguaplay-api.onrender.com
```

## Security Notes

- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate secret keys regularly
- Keep Clerk Secret Key private (backend only)
- Clerk Publishable Key can be public (frontend)
