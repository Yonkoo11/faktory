# Faktory Agent Service - Production Dockerfile

FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

# Expose WebSocket port
EXPOSE 8080

# Run the agent service
CMD ["node", "dist/index.js"]
