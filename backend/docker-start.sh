#!/bin/sh
set -e

echo "== Starting backend container =="
echo "User: $(id -u -n) UID=$(id -u) GID=$(id -g)"
echo "CWD: $(pwd)"
echo "Node version: $(node -v || true)"
echo "NPM version: $(npm -v || true)"
echo "PM2 version: $(pm2 -v || true)"

echo "Listing /app/backend permissions:"
ls -la /app || true
ls -la /app/backend || true

echo "Starting pm2-runtime with ecosystem.config.js"
pm2-runtime ecosystem.config.js
