FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY ../../package.json ../../pnpm-lock.yaml ../../

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 10000

# Start the application
CMD ["pnpm", "run", "start"]
