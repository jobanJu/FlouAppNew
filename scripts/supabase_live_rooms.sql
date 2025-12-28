-- Table: live_rooms
CREATE TABLE IF NOT EXISTS live_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Exemple d’insertion
-- INSERT INTO live_rooms (name, creator_id) VALUES ('main', 'user-uuid');
