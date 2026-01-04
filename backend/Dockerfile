# Backend Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy backend code
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

CMD ["npm", "start"]
