#!/usr/bin/env node

/**
 * FlouAppNew Production Server
 * Lance l'application Expo en mode serveur avec gestion des redémarrages automatiques
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'server.log');
const PID_FILE = path.join(LOG_DIR, 'server.pid');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logger les messages
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Sauvegarder le PID
function savePID() {
  fs.writeFileSync(PID_FILE, process.pid.toString());
}

// Nettoyage à l'arrêt
function cleanup() {
  log('🛑 Arrêt du serveur...');
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
  process.exit(0);
}

// Signaux d'arrêt
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Lancer le serveur Expo
function startServer() {
  log('🚀 Démarrage de FlouAppNew sur le serveur...');
  
  const server = spawn('npm', ['start'], {
    cwd: __dirname,
    stdio: 'pipe',
    detached: false
  });

  let restartCount = 0;
  const MAX_RESTARTS = 5;
  const RESTART_WINDOW = 60000; // 1 minute

  server.stdout.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`📤 ${message}`);
    }
  });

  server.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (message) {
      log(`❌ ${message}`);
    }
  });

  server.on('close', (code) => {
    log(`⚠️  Processus terminé avec le code ${code}`);
    
    // Gestion des redémarrages automatiques
    if (code !== 0) {
      restartCount++;
      if (restartCount <= MAX_RESTARTS) {
        log(`🔄 Redémarrage automatique (tentative ${restartCount}/${MAX_RESTARTS})...`);
        setTimeout(() => {
          startServer();
        }, 5000); // Attendre 5 secondes avant redémarrage
      } else {
        log('❌ Nombre maximum de redémarrages atteint. Arrêt du serveur.');
        cleanup();
      }
    }
  });

  server.on('error', (err) => {
    log(`❌ Erreur du serveur: ${err.message}`);
  });

  savePID();
}

// Démarrage
log('═'.repeat(60));
log('FlouAppNew Production Server - Démarrage');
log('═'.repeat(60));
log(`📍 Répertoire: ${__dirname}`);
log(`📝 Logs: ${LOG_FILE}`);
log(`🆔 PID: ${process.pid}`);
log('═'.repeat(60));

startServer();
