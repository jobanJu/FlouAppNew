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

# Start backend
CMD ["node", "index.js"]
