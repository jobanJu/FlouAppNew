FROM node:22-alpine

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend .

# Expose port for backend
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3001}/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start backend with npm start (which now runs server.js)
# Force rebuild: 2026-01-05 00:12 UTC
CMD ["npm", "start"]
