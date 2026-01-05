FROM node:22-alpine

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend .

# Set PORT environment variable for Railway
ENV PORT=8080

# Expose port for backend (Railway uses 8080)
EXPOSE 8080

# Install PM2 to keep the process alive and auto-restart on crash
RUN npm install -g pm2@5

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use pm2-runtime to run the app in a production-friendly supervisor
CMD ["pm2-runtime", "npm", "--", "start"]
