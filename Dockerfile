FROM oven/bun:1.0 as base

WORKDIR /app

# Copy package.json and lockfile
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Skip the build step for now as it's causing issues with Buffer import
# We'll use the source files directly

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application directly from source
CMD ["bun", "run", "src/server.ts"]
