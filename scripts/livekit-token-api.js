// Backend API pour générer un token LiveKit
// Installe d'abord : npm install express cors livekit-server-sdk dotenv

const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

const app = express();
app.use(cors());

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APIJZ8kdXvHxS4j';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'YOUR_API_SECRET';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://flouapp-mejnaydh.livekit.cloud';

app.get('/api/livekit-token', (req, res) => {
  const { room, user } = req.query;
  if (!room || !user) {
    return res.status(400).json({ error: 'room and user are required' });
  }
  try {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: user,
    });
    at.addGrant({ roomJoin: true, room });
    const token = at.toJwt();
    if (typeof token !== 'string' || !token || token === '[object Object]') {
      console.error('Token generation failed:', token);
      return res.status(500).json({ error: 'Token generation failed', debug: token });
    }
    res.json({ token });
  } catch (e) {
    console.error('Error generating token:', e);
    res.status(500).json({ error: 'Internal server error', details: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`LiveKit token API running on port ${PORT}`);
});
