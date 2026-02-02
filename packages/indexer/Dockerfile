# Ponder indexer Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Expose ponder default port
EXPOSE 42069

# Run ponder
CMD ["npm", "start"]
