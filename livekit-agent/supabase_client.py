"""
Supabase client for LiveKit Agent
Handles authentication, user tracking, conversation history
"""

import logging
from datetime import datetime
from supabase import create_client, Client
from config import Config

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Supabase database client"""

    def __init__(self):
        self.client: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

    async def get_or_create_user(self, user_id: str, identity: str, name: str = None) -> dict:
        """Get or create a user in Supabase"""
        try:
            # Try to get existing user
            response = self.client.table("users").select("*").eq("user_id", user_id).execute()

            if response.data:
                logger.info(f"User found: {user_id}")
                return response.data[0]

            # Create new user
            new_user = {
                "user_id": user_id,
                "identity": identity,
                "name": name or identity,
                "created_at": datetime.utcnow().isoformat(),
                "last_seen": datetime.utcnow().isoformat(),
            }
            response = self.client.table("users").insert(new_user).execute()
            logger.info(f"User created: {user_id}")
            return response.data[0] if response.data else new_user

        except Exception as e:
            logger.error(f"Error managing user: {e}")
            return None

    async def save_message(self, room_id: str, user_id: str, message: str, is_agent: bool = False) -> dict:
        """Save message to conversation history"""
        try:
            message_obj = {
                "room_id": room_id,
                "user_id": user_id,
                "message": message,
                "is_agent": is_agent,
                "created_at": datetime.utcnow().isoformat(),
            }
            response = self.client.table("messages").insert(message_obj).execute()
            logger.info(f"Message saved: {user_id} in {room_id}")
            return response.data[0] if response.data else message_obj

        except Exception as e:
            logger.error(f"Error saving message: {e}")
            return None

    async def get_conversation_history(self, room_id: str, limit: int = 20) -> list:
        """Get recent conversation history for a room"""
        try:
            response = (
                self.client.table("messages")
                .select("*")
                .eq("room_id", room_id)
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )
            logger.info(f"Retrieved {len(response.data)} messages from {room_id}")
            return response.data or []

        except Exception as e:
            logger.error(f"Error retrieving conversation history: {e}")
            return []

    async def update_user_last_seen(self, user_id: str) -> bool:
        """Update user's last_seen timestamp"""
        try:
            self.client.table("users").update({"last_seen": datetime.utcnow().isoformat()}).eq(
                "user_id", user_id
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating last_seen: {e}")
            return False

    async def create_room(self, room_id: str, room_name: str) -> dict:
        """Create or update a room"""
        try:
            # Try to get existing room
            response = self.client.table("rooms").select("*").eq("room_id", room_id).execute()

            if response.data:
                logger.info(f"Room found: {room_id}")
                return response.data[0]

            # Create new room
            room_obj = {
                "room_id": room_id,
                "name": room_name,
                "created_at": datetime.utcnow().isoformat(),
                "participant_count": 0,
            }
            response = self.client.table("rooms").insert(room_obj).execute()
            logger.info(f"Room created: {room_id}")
            return response.data[0] if response.data else room_obj

        except Exception as e:
            logger.error(f"Error managing room: {e}")
            return None

    async def update_room_participants(self, room_id: str, count: int) -> bool:
        """Update participant count for a room"""
        try:
            self.client.table("rooms").update({"participant_count": count}).eq("room_id", room_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating room participants: {e}")
            return False
