#!/usr/bin/env python3
"""
Setup script for Supabase tables required by the LiveKit Agent
Run this once to create the necessary tables in your Supabase database.
"""

from supabase import create_client
from config import Config
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def create_tables():
    """Create required tables in Supabase"""
    
    client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY or Config.SUPABASE_KEY)
    
    # SQL to create tables
    sql_commands = """
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        identity TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create rooms table
    CREATE TABLE IF NOT EXISTS rooms (
        id BIGSERIAL PRIMARY KEY,
        room_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        participant_count INTEGER DEFAULT 0
    );
    
    -- Create messages table (conversation history)
    CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message TEXT NOT NULL,
        is_agent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
    CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id);
    CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    """
    
    logger.info("Tables setup instructions:")
    logger.info("=" * 60)
    logger.info("1. Go to Supabase Dashboard → SQL Editor")
    logger.info("2. Create a new query and run this SQL:")
    logger.info("=" * 60)
    logger.info(sql_commands)
    logger.info("=" * 60)
    logger.info("Or use the Supabase CLI:")
    logger.info("  supabase db push")
    logger.info("=" * 60)


if __name__ == "__main__":
    create_tables()
