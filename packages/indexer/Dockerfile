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

# Expose port
EXPOSE 42069

# Run ponder with explicit port binding
CMD ["npm", "start"]
