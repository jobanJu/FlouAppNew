#!/usr/bin/env node

console.log('🚀 Démarrage du backend FlouApp...');

// Charger .env si présent (production fallback) puis .env.local en dev
require('dotenv').config({ path: '.env' });
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

console.log('Variables d\'environnement chargées:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗',
  LIVEKIT_URL: process.env.LIVEKIT_URL ? '✓' : '✗',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? '✓' : '✗',
  PORT: process.env.PORT || 3001
});

try {
  const express = require('express');
  const cors = require('cors');
  const { createClient } = require('@supabase/supabase-js');
  const { AccessToken, VideoGrant } = require('livekit-server-sdk');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Variables d'environnement
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const livekitUrl = process.env.LIVEKIT_URL || 'https://flouapp-mejnaydh.livekit.cloud';
  const livekitKey = process.env.LIVEKIT_API_KEY;
  const livekitSecret = process.env.LIVEKIT_API_SECRET;
  const PORT = process.env.PORT || 3001;

  console.log(`🔌 Port: ${PORT}`);

  // Validation des variables critiques — ne PAS quitter le process pour éviter des restarts en boucle
  let supabase = null;
  let ready = true;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL ou clé manquante — démarrage en mode dégradé (routes dépendantes de Supabase renverront 503)');
    ready = false;
  } else {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase configuré');
  }

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({ 
      message: 'FlouApp Backend',
      status: 'running',
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/debug', (req, res) => {
    res.json({
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
        LIVEKIT_URL: process.env.LIVEKIT_URL ? 'SET' : 'MISSING',
        LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? 'SET' : 'MISSING',
        LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 3001
      }
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', ready, timestamp: new Date().toISOString() });
  });

  app.get('/api/hello', (req, res) => {
    res.json({ message: 'Bonjour de FlouApp Backend!' });
  });

  app.get('/api/users', async (req, res) => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // LiveKit token endpoint
  app.post('/api/livekit/token', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    try {
      if (!supabase) {
        return res.status(503).json({ error: 'Service unavailable: Supabase not configured' });
      }

      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '') || req.body?.accessToken;

      if (!token) {
        return res.status(401).json({ error: 'Missing access token' });
      }

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      const user = userData.user;
      const userId = user.id;
      const userName = req.body.userName || user.email || `user-${userId}`;
      const roomName = req.body.roomName || `live-${userId}-${Date.now()}`;
      const canPublish = req.body.canPublish !== undefined ? !!req.body.canPublish : true;
      const canPublishData = req.body.canPublishData !== undefined ? !!req.body.canPublishData : true;

      if (!livekitKey || !livekitSecret) {
        return res.status(503).json({ error: 'Service unavailable: LiveKit keys not configured' });
      }

      const at = new AccessToken(livekitKey, livekitSecret, { identity: userId, name: userName });
      const grant = new VideoGrant({ room: roomName, canPublish, canPublishData });
      at.addGrant(grant);

      const jwt = at.toJwt();
      return res.json({ token: jwt, url: livekitUrl, roomName, userName });
    } catch (err) {
      console.error('❌ Erreur LiveKit:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Démarrer le serveur
  app.listen(PORT, () => {
    console.log(`✅ Backend FlouApp lancé sur le port ${PORT}`);
    console.log(`   http://0.0.0.0:${PORT}/health`);
    console.log(`   API prêt à recevoir les requêtes`);
  });

  // Attendre un peu puis afficher un message de confirmation
  setTimeout(() => {
    console.log(`⏰ Backend actif après 2 secondes de démarrage`);
  }, 2000);

  // Gestion des erreurs non capturées
  process.on('uncaughtException', (err) => {
    console.error('❌ Erreur non capturée:', err);
    process.exit(1);
  });

} catch (err) {
  console.error('❌ Erreur au démarrage:', err.message);
  console.error(err.stack);
  process.exit(1);
}
