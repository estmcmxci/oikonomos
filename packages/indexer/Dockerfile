# Ponder indexer Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Copy package.json only (no lock file to avoid version mismatch)
COPY package.json ./

# Install dependencies fresh
RUN npm install --no-package-lock

# Copy source code
COPY . .

# Railway sets PORT dynamically, Ponder uses it automatically
ENV PORT=42069

# Database schema for production mode (required by ponder start)
# Bumped to v3 for OIK-46: added `score` field to strategyMetrics
ENV DATABASE_SCHEMA=oikonomos_v3

# Expose port
EXPOSE 42069

# Run ponder with explicit port binding
CMD ["npm", "start"]
