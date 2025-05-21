FROM node:20-alpine

# Install build dependencies and SSL support (needed for Supabase)
RUN apk add --no-cache --virtual .build-deps python3 make g++ ca-certificates curl

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm install

# Remove build dependencies to reduce image size
RUN apk del .build-deps

COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads/videos

# The .env file will be created from environment variables at runtime
ENV PORT=3000
ENV DATABASE_URL=postgres://postgres:carshopdatabase@db.rjlewidauwbneruxdspn.supabase.co:5432/postgres
ENV NODE_ENV=production
# Force IPv4
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV UV_THREADPOOL_SIZE=16

# Add a health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Use JSON format for CMD to handle signals properly
CMD ["node", "index.js"]
