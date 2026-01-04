import { createClient } from '@supabase/supabase-js';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const livekitUrl = process.env.LIVEKIT_URL || 'https://flouapp-mejnaydh.livekit.cloud';
const livekitKey = process.env.LIVEKIT_API_KEY;
const livekitSecret = process.env.LIVEKIT_API_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const grant = new VideoGrant({ room: roomName, canPublish, canPublishData });
    at.addGrant(grant);

    const jwt = at.toJwt();

    return res.json({ token: jwt, url: livekitUrl, roomName, userName });
  } catch (err) {
    console.error('Error generating LiveKit token:', err);
    return res.status(500).json({ error: String(err) });
  }
};
