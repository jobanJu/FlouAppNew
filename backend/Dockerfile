# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app/backend

# Copy backend package files explicitly from subfolder
COPY backend/package*.json ./

# Install backend dependencies (tolerate lock mismatches)
RUN npm install --omit=dev --no-audit --no-fund

# Copy backend source explicitly from subfolder
COPY backend/ .

# Provide env file inside the container
COPY backend/.env.production .env

# Ensure start script is executable
RUN chmod +x docker-start.sh

# Set production env
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose port for Railway
EXPOSE 8080

# Install PM2 globally (optional, we also have local pm2)
RUN npm install -g pm2@5

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start via docker-start wrapper (runs pm2-runtime and prints diagnostics)
CMD ["./docker-start.sh"]
