# Build stage
FROM oven/bun:1.0 as builder

WORKDIR /app

# Copy package.json and lockfile
COPY package.json bun.lockb ./

# Install all dependencies including dev dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1.0-slim as production

# Set NODE_ENV
ENV NODE_ENV=production

# Create a non-root user and group
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 bunjs \
    && mkdir -p /app/data /app/logs \
    && chown -R bunjs:nodejs /app

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder --chown=bunjs:nodejs /app/package.json /app/bun.lockb ./
COPY --from=builder --chown=bunjs:nodejs /app/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/init-scripts ./init-scripts

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Create necessary directories with proper permissions
RUN mkdir -p data logs \
    && chown -R bunjs:nodejs /app

# Switch to non-root user
USER bunjs

# Expose the port the app runs on
EXPOSE 3000

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Command to run the application
CMD ["bun", "run", "dist/server.js"]
