# Multi-stage build pour FlouAppNew
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Stage de production
FROM node:20-alpine

WORKDIR /app

# Installer les dépendances de runtime
RUN apk add --no-cache \
    curl \
    git \
    bash \
    python3 \
    make \
    g++

# Copier depuis le stage de build
COPY --from=builder /app .

# Créer le répertoire des logs
RUN mkdir -p logs

# Exposer les ports
EXPOSE 8081 19000 19001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8081 || exit 1

# Commande de démarrage
CMD ["npm", "start"]
