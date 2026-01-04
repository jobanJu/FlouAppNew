require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Changed to SERVICE_ROLE
const supabase = createClient(supabaseUrl, supabaseKey);

// Exemple de route pour lire la table users
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Health
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from your server!' });
});

// Mount migrated update-match-status handler
const updateMatchRouter = require('./update-match-status');
app.use(updateMatchRouter);

// LiveKit token endpoint
try {
  const livekitRouter = require('./livekit-token');
  app.use(livekitRouter);
} catch (err) {
  console.warn('LiveKit token route not available:', err.message);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
