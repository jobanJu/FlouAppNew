#!/usr/bin/env python3
"""
LiveKit Agent with OpenAI LLM + Supabase Integration
A fully functional agent that connects to LiveKit and integrates with Supabase for
authentication, user tracking, and conversation history.
"""

import asyncio
import logging
from openai import AsyncOpenAI
from livekit import agents, rtc
from config import Config
from supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=Config.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FloutAgent:
    """Flou App LiveKit Agent with OpenAI LLM + Supabase"""

    def __init__(self):
        self.room: rtc.Room | None = None
        self.supabase = SupabaseClient()
        self.openai = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)
        self.conversation_history = {}  # Per-user conversation tracking
        self.participant_count = 0

    async def get_llm_response(self, user_id: str, user_message: str) -> str:
        """Get response from OpenAI GPT with conversation history from Supabase"""
        try:
            # Initialize user conversation history if needed
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = []
            
            # Add user message
            self.conversation_history[user_id].append({
                "role": "user",
                "content": user_message
            })
            
            # Keep last 10 messages per user
            if len(self.conversation_history[user_id]) > 10:
                self.conversation_history[user_id] = self.conversation_history[user_id][-10:]
            
            # Call OpenAI API
            response = await self.openai.chat.completions.create(
                model=Config.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant for the Flou app, a social platform. Be friendly, concise, helpful, and encourage users to connect with others."
                    },
                    *self.conversation_history[user_id]
                ],
                max_tokens=150,
                temperature=0.7
            )
            
            # Extract response
            assistant_message = response.choices[0].message.content
            
            # Add to history
            self.conversation_history[user_id].append({
                "role": "assistant",
                "content": assistant_message
            })
            
            return assistant_message
            
        except Exception as e:
            logger.error(f"Error getting LLM response: {e}")
            return "Sorry, I encountered an error processing your message. Please try again."

    async def on_message(self, msg: rtc.ChatMessage) -> None:
        """Handle incoming chat messages with Supabase tracking"""
        logger.info(f"Message from {msg.from_identity}: {msg.message}")
        
        try:
            user_id = msg.from_identity
            
            # Save user message to Supabase
            await self.supabase.save_message(
                room_id=self.room.name if self.room else "unknown",
                user_id=user_id,
                message=msg.message,
                is_agent=False
            )
            
            # Get LLM response
            response = await self.get_llm_response(user_id, msg.message)
            
            # Save agent response to Supabase
            await self.supabase.save_message(
                room_id=self.room.name if self.room else "unknown",
                user_id=Config.AGENT_NAME,
                message=response,
                is_agent=True
            )
            
            # Publish response to room
            if self.room:
                await self.room.local_participant.publish_data(
                    data=response.encode(),
                    topic="agent_response"
                )
                logger.info(f"Response sent to {user_id}")
        
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)

    async def on_participant_joined(self, participant: rtc.RemoteParticipant) -> None:
        """Called when a participant joins the room"""
        logger.info(f"Participant joined: {participant.identity} ({participant.name})")
        
        try:
            # Create/update user in Supabase
            await self.supabase.get_or_create_user(
                user_id=participant.identity,
                identity=participant.identity,
                name=participant.name
            )
            
            # Update participant count
            self.participant_count += 1
            if self.room:
                await self.supabase.update_room_participants(
                    room_id=self.room.name,
                    count=self.participant_count
                )
        
        except Exception as e:
            logger.error(f"Error handling participant joined: {e}")

    async def on_participant_left(self, participant: rtc.RemoteParticipant) -> None:
        """Called when a participant leaves the room"""
        logger.info(f"Participant left: {participant.identity}")
        
        try:
            # Update participant count
            self.participant_count = max(0, self.participant_count - 1)
            if self.room:
                await self.supabase.update_room_participants(
                    room_id=self.room.name,
                    count=self.participant_count
                )
            
            # Clear conversation history for left user
            if participant.identity in self.conversation_history:
                del self.conversation_history[participant.identity]
        
        except Exception as e:
            logger.error(f"Error handling participant left: {e}")

    async def run(self, room_name: str, participant_name: str = "agent") -> None:
        """Main agent loop"""
        try:
            # Create room in Supabase
            await self.supabase.create_room(room_name, room_name)
            
            # Connect to LiveKit
            self.room = await agents.connect(
                url=Config.LIVEKIT_URL,
                token=Config.LIVEKIT_TOKEN,
                room_name=room_name,
                participant_name=participant_name,
            )
            
            logger.info(f"Connected to room: {room_name}")
            
            # Register event handlers
            self.room.on_message_received += self.on_message
            self.room.on_participant_joined += self.on_participant_joined
            self.room.on_participant_left += self.on_participant_left
            
            # Keep agent running
            await asyncio.Event().wait()
            
        except Exception as e:
            logger.error(f"Error running agent: {e}", exc_info=True)
        finally:
            if self.room:
                await self.room.aclose()


async def main():
    """Main entry point"""
    try:
        # Validate configuration
        Config.validate()
        
        logger.info(f"Starting agent: {Config.AGENT_NAME} in room: {Config.ROOM_NAME}")
        
        agent = FloutAgent()
        await agent.run(Config.ROOM_NAME, Config.AGENT_NAME)
    
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        exit(1)


if __name__ == "__main__":
    asyncio.run(main())
