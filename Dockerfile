FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies only
RUN cd backend && npm ci && cd ..

# Copy backend source code
COPY backend ./backend

# Expose port for backend
EXPOSE 3001

# Start backend only
CMD ["node", "backend/index.js"]
