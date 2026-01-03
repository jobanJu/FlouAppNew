import { supabase } from './supabase';

// Get all sessions
export const getSessions = async (limit: number = 100) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      creator_id,
      title,
      description,
      scheduled_at,
      location,
      lat,
      lng,
      max_participants,
      level,
      conditions,
      participants_count,
      creator:profiles(first_name, avatar_url)
    `)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Create session
export const createSession = async (
  creatorId: string,
  title: string,
  description: string,
  scheduledAt: string,
  location: string,
  lat: number,
  lng: number,
  maxParticipants: number,
  level: string,
  conditions: string
) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        creator_id: creatorId,
        title,
        description,
        scheduled_at: scheduledAt,
        location,
        lat,
        lng,
        max_participants: maxParticipants,
        level,
        conditions,
        participants_count: 1,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Join session
export const joinSession = async (sessionId: string, userId: string) => {
  const { data: existingParticipant } = await supabase
    .from('session_participants')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (existingParticipant) {
    throw new Error('Already a participant');
  }

  const { error: insertError } = await supabase
    .from('session_participants')
    .insert([
      {
        session_id: sessionId,
        user_id: userId,
        joined_at: new Date().toISOString(),
      },
    ]);

  if (insertError) throw insertError;

  // Increment participants count
  const { data: session } = await supabase
    .from('sessions')
    .select('participants_count')
    .eq('id', sessionId)
    .single();

  await supabase
    .from('sessions')
    .update({ participants_count: (session?.participants_count || 0) + 1 })
    .eq('id', sessionId);
};

// Leave session
export const leaveSession = async (sessionId: string, userId: string) => {
  const { error } = await supabase
    .from('session_participants')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) throw error;

  // Decrement participants count
  const { data: session } = await supabase
    .from('sessions')
    .select('participants_count')
    .eq('id', sessionId)
    .single();

  await supabase
    .from('sessions')
    .update({
      participants_count: Math.max(0, (session?.participants_count || 1) - 1),
    })
    .eq('id', sessionId);
};

// Get session details
export const getSessionDetails = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      creator_id,
      title,
      description,
      scheduled_at,
      location,
      lat,
      lng,
      max_participants,
      level,
      conditions,
      participants_count,
      creator:profiles(first_name, avatar_url),
      participants:session_participants(user_id)
    `)
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
};

// Get user sessions
export const getUserSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('session_participants')
    .select(`
      session_id,
      session:sessions(
        id,
        creator_id,
        title,
        description,
        scheduled_at,
        location,
        level,
        participants_count,
        max_participants
      )
    `)
    .eq('user_id', userId)
    .order('session(scheduled_at)', { ascending: true });

  if (error) throw error;
  return data?.map((item: any) => item.session) || [];
};
