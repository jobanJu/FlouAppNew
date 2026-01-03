import { supabase } from './supabase';

// Get user stats
export const getUserStats = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// Update user points
export const addPoints = async (userId: string, points: number, reason: string) => {
  const stats = await getUserStats(userId);
  const newTotal = (stats?.total_points || 0) + points;

  // Check for badge unlocks
  const badges: string[] = stats?.badges || [];

  if (newTotal >= 500 && !badges.includes('power_user')) {
    badges.push('power_user');
  }
  if (newTotal >= 5000 && !badges.includes('legend')) {
    badges.push('legend');
  }

  const { error } = await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      total_points: newTotal,
      badges,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  // Log activity
  await supabase.from('user_activities').insert([
    {
      user_id: userId,
      action: reason,
      points_gained: points,
      created_at: new Date().toISOString(),
    },
  ]);
};

// Get leaderboard
export const getLeaderboard = async (limit: number = 20) => {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// Check and award badges
export const checkBadges = async (userId: string) => {
  const stats = await getUserStats(userId);
  if (!stats) return;

  const badges = [...(stats.badges || [])];

  // First match badge
  if (stats.matches_count >= 1 && !badges.includes('first_match')) {
    badges.push('first_match');
  }

  // Chatter badge
  if (stats.messages_sent >= 50 && !badges.includes('chatter')) {
    badges.push('chatter');
  }

  // Content creator badge
  if (stats.posts_count >= 10 && !badges.includes('content_creator')) {
    badges.push('content_creator');
  }

  // Social butterfly badge
  if (stats.matches_count >= 20 && !badges.includes('social_butterfly')) {
    badges.push('social_butterfly');
  }

  // Session organizer badge
  if (stats.sessions_created >= 5 && !badges.includes('session_organizer')) {
    badges.push('session_organizer');
  }

  // Update if badges changed
  if (badges.length > (stats.badges?.length || 0)) {
    await supabase
      .from('user_stats')
      .update({ badges })
      .eq('user_id', userId);
  }
};
