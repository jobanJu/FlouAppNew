FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY ecosystem.config.js ./

# Install all dependencies
RUN npm ci && cd backend && npm ci && cd ..

# Copy source code
COPY . .

# Expose ports
EXPOSE 3001 8081

# Install PM2 globally
RUN npm install -g pm2

# Start services
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
