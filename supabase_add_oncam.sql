-- Add on_cam column to live_participants table
-- Run this in Supabase SQL Editor

ALTER TABLE live_participants 
ADD COLUMN IF NOT EXISTS on_cam BOOLEAN DEFAULT false;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_live_participants_on_cam 
ON live_participants(live_id, on_cam);
