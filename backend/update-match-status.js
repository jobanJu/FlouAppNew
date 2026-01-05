// Migrated from supabase edge function update-match-status
// Node/Express handler equivalent. Place under backend/ and run the backend server.

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const J2_MIN_MESSAGES = 3;
const J3_MIN_MESSAGES = 6;

router.post('/api/update-match-status', async (req, res) => {
  try {
    const matchId = req.body?.record?.match_id;
    if (!matchId) return res.status(400).send('Missing match_id');

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, status, user_1, user_2, day2_unlocked_at, day3_unlocked_at')
      .eq('id', matchId)
      .single();

    if (matchError || !match) return res.status(404).send('Match not found');

    if (match.status === 'day3') return res.json({ status: 'day3' });

    // Compter côté serveur par sécurité (évite les subtilités de groupby)
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('match_id', matchId);

    if (messagesError || !messagesData) return res.status(500).send('Error fetching messages');

    const countsMap = {};
    for (const m of messagesData) {
      const sid = m.sender_id;
      countsMap[sid] = (countsMap[sid] ?? 0) + 1;
    }
    const user1Count = countsMap[match.user_1] ?? 0;
    const user2Count = countsMap[match.user_2] ?? 0;

    let newStatus = match.status;

    if (match.status === 'day1' && user1Count >= J2_MIN_MESSAGES && user2Count >= J2_MIN_MESSAGES) {
      newStatus = 'day2';
    }

    if (match.status === 'day2' && user1Count >= J3_MIN_MESSAGES && user2Count >= J3_MIN_MESSAGES) {
      newStatus = 'day3';
    }

    if (newStatus !== match.status) {
      const updateData = { status: newStatus };
      if (newStatus === 'day2') updateData.day2_unlocked_at = new Date().toISOString();
      if (newStatus === 'day3') updateData.day3_unlocked_at = new Date().toISOString();

      const { error: updateError } = await supabase.from('matches').update(updateData).eq('id', matchId);
      if (updateError) return res.status(500).send('Error updating match');
    }

    if (newStatus === 'day3') {
      const { data: existingRequests } = await supabase
        .from('match_social_requests')
        .select('id')
        .eq('match_id', matchId);
      if (!existingRequests || existingRequests.length < 2) {
        const requests = [
          { match_id: matchId, owner_user_id: match.user_1, target_user_id: match.user_2, social_type: 'instagram', social_value: '', consent: null },
          { match_id: matchId, owner_user_id: match.user_2, target_user_id: match.user_1, social_type: 'instagram', social_value: '', consent: null },
        ];
        const { error: requestError } = await supabase.from('match_social_requests').insert(requests);
        if (requestError) console.error('Error creating social requests', requestError);
      }
    }

    return res.json({ success: true, matchId, status: newStatus, messages: { user1: user1Count, user2: user2Count } });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
