const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { AccessToken, VideoGrant } = require('livekit-server-sdk');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const livekitUrl = process.env.LIVEKIT_URL || 'https://flouapp-mejnaydh.livekit.cloud';
const livekitKey = process.env.LIVEKIT_API_KEY;
const livekitSecret = process.env.LIVEKIT_API_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
}

if (!livekitKey || !livekitSecret) {
  console.warn('Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET in env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// POST /api/livekit/token
// Body: { roomName?: string, userName?: string, canPublish?: boolean, canPublishData?: boolean }
router.post('/api/livekit/token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.body?.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Missing access token' });
    }

    // Validate session / get user from Supabase
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

    // Build LiveKit AccessToken
    const at = new AccessToken(livekitKey, livekitSecret, { identity: userId, name: userName });
    const grant = new VideoGrant({ room: roomName });
    at.addGrant(grant);

    const jwt = at.toJwt();

    return res.json({ token: jwt, url: livekitUrl, roomName, userName });
  } catch (err) {
    console.error('Error generating LiveKit token:', err);
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
