FROM node:22-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm ci --only=production && \
    npm ci --save-dev

# Expose ports
EXPOSE 3001 8081

# Start both services with PM2
RUN npm install -g pm2

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
