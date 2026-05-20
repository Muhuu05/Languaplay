# Deployment Guide - Free Tier

This guide will help you deploy LinguaPlay to free tier hosting services.

## Prerequisites

- GitHub account
- Vercel account (free)
- Render account (free)
- Clerk account (free)

## Step 1: Set up Neon Database

1. Go to [Neon Console](https://console.neon.tech) and sign up
2. Create a new project called "linguaplay"
3. Wait for the project to be ready
4. Open "Connection Details"
5. Copy the pooled PostgreSQL connection string
6. Save it for later

## Step 2: Push Database Schema

1. Install dependencies:
```bash
cd Backend/db
pnpm install
```

2. Set up environment variable:
```bash
export DATABASE_URL="your_neon_connection_string"
```

3. Push the schema:
```bash
pnpm run push
```

4. Import seed data:
```bash
cd ../../
node import_data.js
```

## Step 3: Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: linguaplay-api
   - **Branch**: main
   - **Root Directory**: Backend/api-server
   - **Build Command**: pnpm install && pnpm run build
   - **Start Command**: pnpm run start
6. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `DATABASE_URL`: (your Neon connection string)
   - `CLERK_PUBLISHABLE_KEY`: (from Clerk dashboard)
   - `CLERK_SECRET_KEY`: (from Clerk dashboard)
7. Click "Deploy Web Service"
8. Wait for deployment to complete
9. Copy the deployed URL (e.g., https://linguaplay-api.onrender.com)

## Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: Frontend/linguaplay
   - **Build Command**: pnpm run build
   - **Output Directory**: dist/public
5. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`: (from Clerk dashboard)
   - `VITE_API_URL`: (your Render backend URL)
6. Click "Deploy"
7. Wait for deployment to complete
8. Copy the deployed URL

## Step 5: Update Clerk Allowed Origins

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to "Domains" or "Allowed Origins"
4. Add your Vercel URL
5. Add your Render backend URL
6. Save changes

## Step 6: Test the Deployment

1. Visit your Vercel URL
2. Test authentication
3. Test API calls
4. Verify all features work

## Environment Variables Reference

### Backend (Render)
- `NODE_ENV`: production
- `PORT`: 10000
- `DATABASE_URL`: Neon connection string
- `CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
- `CLERK_SECRET_KEY`: From Clerk dashboard

### Frontend (Vercel)
- `VITE_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard
- `VITE_API_URL`: Your Render backend URL

## Troubleshooting

### Backend deployment fails
- Check build logs in Render
- Ensure all dependencies are in package.json
- Verify DATABASE_URL is correct

### Frontend deployment fails
- Check build logs in Vercel
- Ensure build command outputs to dist/public
- Verify environment variables are set

### API calls fail
- Check CORS settings in backend
- Verify VITE_API_URL is correct
- Check Clerk authentication is working

### Database connection fails
- Verify Neon connection string
- Check Neon project and compute are active
- Ensure database schema was pushed

## Free Tier Limitations

- **Vercel**: 100GB bandwidth/month, 6GB build output
- **Render**: 750 hours/month, sleeps after 15min inactivity
- **Neon**: Free tier Serverless Postgres limits apply

## Next Steps

- Set up monitoring (optional)
- Configure custom domain (optional)
- Set up CI/CD pipeline (optional)
- Add error tracking (optional)
