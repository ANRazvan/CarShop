# Build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Build with configurable API URL
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve app with nginx
FROM nginx:alpine

# Install additional utilities for troubleshooting
RUN apk add --no-cache curl iputils bash

# Copy built assets from the builder stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Create a health check endpoint
RUN mkdir -p /usr/share/nginx/html/health && \
    echo "OK" > /usr/share/nginx/html/health/index.html

# Copy nginx config
COPY nginx.conf.new /etc/nginx/conf.d/default.conf

# Add a healthcheck to make sure container is healthy
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -s http://localhost:80/health || exit 1

# Add startup script - Write each line separately to avoid newline issues
RUN echo '#!/bin/bash' > /docker-entrypoint.sh && \
    echo 'echo "Starting Nginx..."' >> /docker-entrypoint.sh && \
    echo 'echo "Content of /etc/nginx/conf.d/default.conf:"' >> /docker-entrypoint.sh && \
    echo 'cat /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'nginx -t' >> /docker-entrypoint.sh && \
    echo 'if [ $? -ne 0 ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Nginx configuration test failed!"' >> /docker-entrypoint.sh && \
    echo '  exit 1' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
