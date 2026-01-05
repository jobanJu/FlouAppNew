FROM node:20-alpine

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend source code
COPY backend .

# If a production env file is provided in the repo, copy it to .env so the app can read it in production.
# NOTE: Using env vars in Railway dashboard is preferred; this is a fallback when .env.production exists in repo.
COPY backend/.env.production .env

# Set NODE_ENV and PORT environment variables for Railway
ENV NODE_ENV=production
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
