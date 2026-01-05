#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { AccessToken, VideoGrant } = require('livekit-server-sdk');

const app = express();
app.use(cors());
app.use(express.json());

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const livekitUrl = process.env.LIVEKIT_URL || 'https://flouapp-mejnaydh.livekit.cloud';
const livekitKey = process.env.LIVEKIT_API_KEY;
const livekitSecret = process.env.LIVEKIT_API_SECRET;
const PORT = process.env.PORT || 3001;

console.log('Starting FlouApp Backend...');
console.log('Supabase URL:', supabaseUrl ? '✓ configured' : '✗ MISSING');
console.log('Supabase Key:', supabaseKey ? '✓ configured' : '✗ MISSING');
console.log('LiveKit URL:', livekitUrl);
console.log('LiveKit Key:', livekitKey ? '✓ configured' : '✗ MISSING');
console.log('PORT:', PORT);

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API hello
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from FlouApp backend!' });
});

// Users endpoint
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
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.body?.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    // Validate session
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

    // Create token
    const at = new AccessToken(livekitKey, livekitSecret, { identity: userId, name: userName });
    const grant = new VideoGrant({ room: roomName, canPublish, canPublishData });
    at.addGrant(grant);

    const jwt = at.toJwt();
    return res.json({ token: jwt, url: livekitUrl, roomName, userName });
  } catch (err) {
    console.error('LiveKit token error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FlouApp Backend running on port ${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/health`);
});
