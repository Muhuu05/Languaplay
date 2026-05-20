# LinguaPlay

A language learning application built with React, Express, and TypeScript.

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install
```

### Running the Application

#### Backend Server (Port 5050)

The backend server serves the API and handles all data requests.

**Option 1: Using the startup script (Recommended)**

```bash
# Start the backend server using the startup script
./start-server.sh
```

This script automatically:

- Checks if port 5050 is in use
- Kills any existing process on port 5050
- Installs dependencies if needed
- Starts the linguaplay server

**Option 2: Using npm script**

```bash
# Start the backend server
pnpm run server
```

The server will start on `http://localhost:5050` with the following features:

- CORS enabled for `http://localhost:3002`
- JSON database loaded from root directory files
- API endpoints for users, courses, lessons, exercises, etc.

#### Frontend Development Server (Port 3002)

The frontend is a React application built with Vite.

```bash
# Start the frontend development server
pnpm run dev
```

The frontend will start on `http://localhost:3002`

### Important Notes

**Server Configuration:**

- The backend server (`server.ts`) runs on port 5050
- The frontend development server runs on port 3002
- CORS is configured to allow requests from `http://localhost:3002` with credentials

**Database:**

- The application uses JSON files for data storage
- Database files are located in the project root directory:
  - `users.json`
  - `courses.json`
  - `units.json`
  - `lessons.json`
  - `exercises.json`
  - `achievements.json`
  - `shop_items.json`
  - `leaderboard_users.json`
  - `lesson_runs.json`
  - `user_lesson_progress.json`

**Common Issues:**

1. **CORS Errors**: If you see CORS errors in the browser console, ensure:
   - The backend server is running on port 5050
   - The CORS configuration in `server.ts` includes the correct origin

2. **Port Conflicts**: If port 5050 is already in use:

   ```bash
   # Find and kill the process using port 5050
   lsof -ti :5050 | xargs kill -9
   ```

3. **Wrong Server Running**: Ensure you're running the linguaplay server (`server.ts`), not the api-server from the artifacts/api-server directory.

### Available Scripts

- `pnpm run dev` - Start frontend development server
- `pnpm run server` - Start backend server
- `pnpm run build` - Build for production
- `pnpm run serve` - Preview production build
- `pnpm run typecheck` - Run TypeScript type checking

### API Endpoints

The backend server provides the following endpoints:

- `GET /api/me` - Get current user
- `GET /api/me/daily-goal` - Get daily goal
- `GET /api/me/stats` - Get user statistics
- `GET /api/me/streak` - Get streak data
- `PUT /api/me/active-course` - Set active course
- `GET /api/courses` - Get all courses
- `GET /api/courses/:courseId` - Get course details
- `GET /api/lessons/:lessonId` - Get lesson details
- `POST /api/exercises/:exerciseId/answer` - Submit exercise answer
- `POST /api/lessons/:lessonId/complete` - Complete lesson
- `GET /api/achievements` - Get achievements
- `GET /api/shop` - Get shop items
- `GET /api/shop/items` - Get shop items with ownership
- `POST /api/shop/purchase` - Purchase shop item
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/ai/progress` - Get AI progress analysis
- `GET /api/ai/recommend-lesson` - Get AI lesson recommendation
- `GET /healthz` - Health check

### Environment Variables

Create a `.env` file in the linguaplay directory:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
VITE_API_URL=http://localhost:5050
PORT=3002
BASE_PATH=/
VITE_BASE_PATH=/
```

### Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Radix UI
- **Backend**: Express, TypeScript, CORS
- **Authentication**: Clerk
- **State Management**: React Query
- **Routing**: Wouter
