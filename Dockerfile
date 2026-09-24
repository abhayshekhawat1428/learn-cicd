FROM node:18-alpine

WORKDIR /app

# Copy package files first (layer caching — deps don't change often)
COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy application code
COPY server.js ./

# Non-root user (security best practice)
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -D appuser
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/dd/api/v1/health/liveness || exit 1

CMD ["node", "server.js"]
