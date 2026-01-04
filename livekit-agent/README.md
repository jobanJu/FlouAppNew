# LiveKit Agent Starter + Supabase Integration

Production-ready Python agent for the Flou App using LiveKit for real-time communication and Supabase for user tracking & conversation history.

## Features

✅ LiveKit room connectivity  
✅ OpenAI GPT-4o-mini conversational AI  
✅ Supabase integration (users, conversations, rooms)  
✅ Per-user conversation history  
✅ Participant tracking (join/leave)  
✅ Message persistence & logging  
✅ Environment-based configuration  

## Setup

### 1. Prerequisites

- Python 3.10+
- LiveKit server (or use LiveKit Cloud)
- Supabase account (free tier OK)
- OpenAI API key

### 2. Install Dependencies

```bash
cd livekit-agent
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure Supabase

First, set up your Supabase database tables:

```bash
# View the SQL setup script
python setup_supabase.py
```

Then run the SQL in your Supabase dashboard (SQL Editor):
1. Go to https://supabase.com/dashboard
2. Select your project → SQL Editor
3. Create a new query and paste the SQL from `setup_supabase.py` output
4. Run it

**Or use Supabase CLI:**
```bash
supabase link --project-ref your-project-id
supabase db push
```

### 4. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# LiveKit (get from https://cloud.livekit.io or local server)
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=xxxxx

# Generate token (or use existing):
LIVEKIT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase (get from https://supabase.com/dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (get from https://platform.openai.com)
OPENAI_API_KEY=sk-...

# Optional
ROOM_NAME=flou-main
AGENT_NAME=flou-assistant
DEBUG=false
```

### 5. Generate LiveKit Token

If you don't have a token, generate one:

```bash
python3 << EOF
from livekit import api
import os

token = api.AccessToken(
    api_key=os.getenv("LIVEKIT_API_KEY"),
    api_secret=os.getenv("LIVEKIT_API_SECRET"),
    identity="agent",
    grant=api.TokenGrant(
        can_publish=True,
        can_publish_data=True,
        can_subscribe=True,
        room="flou-main",
        room_join=True,
    ),
)
print(token.to_jwt())
EOF
```

Copy the output and paste into `.env` as `LIVEKIT_TOKEN`.

### 6. Run the Agent

```bash
python main.py
```

You should see:
```
2026-01-03 12:00:00 - __main__ - INFO - Starting agent: flou-assistant in room: flou-main
2026-01-03 12:00:01 - __main__ - INFO - Connected to room: flou-main
```

## Architecture

```
main.py                  # Agent logic + OpenAI integration
supabase_client.py       # Supabase database interface
config.py               # Configuration management
setup_supabase.py       # Database schema setup
requirements.txt        # Dependencies
```

## Database Schema

**users table:**
- `user_id` (TEXT, unique) - Participant ID
- `identity` (TEXT) - LiveKit identity
- `name` (TEXT) - Display name
- `created_at` (TIMESTAMP)
- `last_seen` (TIMESTAMP)

**rooms table:**
- `room_id` (TEXT, unique) - LiveKit room ID
- `name` (TEXT) - Room display name
- `participant_count` (INT) - Active participants
- `created_at` (TIMESTAMP)

**messages table:**
- `room_id` (TEXT) - FK to rooms
- `user_id` (TEXT) - FK to users
- `message` (TEXT) - Message content
- `is_agent` (BOOLEAN) - True if agent-sent
- `created_at` (TIMESTAMP)

## API Usage Examples

### Send Message to Agent

```javascript
// From your app (React/Web)
const message = {
  from_identity: "user123",
  message: "Hello agent"
};
// Sent via LiveKit data channel
room.local_participant.publishData(
  JSON.stringify(message),
  { reliable: true }
);
```

### Retrieve Conversation History

```javascript
// From Supabase
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('room_id', 'flou-main')
  .order('created_at', { ascending: true });
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

Build & run:
```bash
docker build -t flou-agent .
docker run --env-file .env flou-agent
```

### Systemd Service (Linux)

```ini
[Unit]
Description=Flou LiveKit Agent
After=network.target

[Service]
Type=simple
User=flou
WorkingDirectory=/home/flou/livekit-agent
Environment="PYTHONUNBUFFERED=1"
EnvironmentFile=/home/flou/livekit-agent/.env
ExecStart=/home/flou/livekit-agent/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable flou-agent
sudo systemctl start flou-agent
```

## Troubleshooting

### "Missing configuration: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY"
→ Check `.env` file, ensure all required variables are set.

### "Repository not found" (GitHub error)
→ Check your LiveKit connection, API key, and token validity.

### "FATAL: connection refused" (Supabase)
→ Verify `SUPABASE_URL` and credentials are correct.

### "Agent not responding"
→ Check logs: `DEBUG=true python main.py`

## References

- [LiveKit Docs](https://docs.livekit.io)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Flou App](https://github.com/jobanJu/FlouAppNew)
