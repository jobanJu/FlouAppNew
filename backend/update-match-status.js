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

    const { data: messageCounts, error: countError } = await supabase
      .from('messages')
      .select('sender_id, count:id', { group: 'sender_id' })
      .eq('match_id', matchId);

    if (countError || !messageCounts) return res.status(500).send('Error counting messages');

    const counts = messageCounts;
    const user1Count = counts.find((m) => m.sender_id === match.user_1)?.count ?? 0;
    const user2Count = counts.find((m) => m.sender_id === match.user_2)?.count ?? 0;

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
      const { data: existingRequests } = await supabase.from('match_social_requests').select('id').eq('match_id', matchId);
      if (!existingRequests || existingRequests.length === 0) {
        const requests = [
          { match_id: matchId, owner_user_id: match.user_1, social_type: 'instagram', social_value: '', consent: null },
          { match_id: matchId, owner_user_id: match.user_2, social_type: 'instagram', social_value: '', consent: null },
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
